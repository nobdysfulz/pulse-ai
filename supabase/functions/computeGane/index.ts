import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();
    console.log('Computing GANE score for user:', userId);

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch user's agent config
    const { data: agentConfig, error: agentError } = await supabaseClient
      .from('agent_config')
      .select('*')
      .eq('user_id', userId);

    if (agentError) throw agentError;

    // Fetch user's guidelines
    const { data: guidelines, error: guidelinesError } = await supabaseClient
      .from('user_guidelines')
      .select('*')
      .eq('user_id', userId);

    if (guidelinesError) throw guidelinesError;

    // Fetch recent pulse scores to measure intelligence growth
    const { data: pulseHistory, error: pulseError } = await supabaseClient
      .from('pulse_engine_snapshots')
      .select('score, computed_at')
      .eq('user_id', userId)
      .order('computed_at', { ascending: false })
      .limit(30);

    if (pulseError) throw pulseError;

    // Calculate metrics
    const systemsEnabled = agentConfig?.filter(a => a.enabled).length || 0;
    const totalSystems = agentConfig?.length || 0;
    const systemsUtilization = totalSystems > 0 ? (systemsEnabled / totalSystems) * 100 : 0;
    
    const guidelinesCount = guidelines?.length || 0;
    const hasProfile = profile?.full_name ? 1 : 0;
    
    // Intelligence score based on system utilization (0-40 points)
    const utilizationScore = (systemsUtilization / 100) * 40;
    
    // Configuration completeness score (0-30 points)
    const configScore = Math.min(30, (guidelinesCount * 5) + (hasProfile * 10));
    
    // Learning/improvement trend (0-30 points)
    let trendScore = 0;
    if (pulseHistory && pulseHistory.length >= 2) {
      const recent = pulseHistory.slice(0, 7).map(p => p.score);
      const older = pulseHistory.slice(7, 14).map(p => p.score);
      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const improvement = recentAvg - olderAvg;
        trendScore = Math.max(0, Math.min(30, 15 + improvement));
      }
    }
    
    const ganeScore = Math.round(utilizationScore + configScore + trendScore);

    const metrics = {
      systemsEnabled,
      totalSystems,
      systemsUtilization: Math.round(systemsUtilization),
      guidelinesCount,
      utilizationScore: Math.round(utilizationScore),
      configScore: Math.round(configScore),
      trendScore: Math.round(trendScore),
      hasProfile: hasProfile === 1,
    };

    // Store snapshot
    const { error: insertError } = await supabaseClient
      .from('gane_engine_snapshots')
      .insert({
        user_id: userId,
        score: ganeScore,
        metrics,
        computed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    console.log('GANE score computed:', ganeScore);

    return new Response(
      JSON.stringify({ score: ganeScore, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error computing GANE:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
