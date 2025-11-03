import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MINUTES = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, fresh = false } = await req.json();
    console.log('Building graph context for user:', userId, 'fresh:', fresh);

    // Check cache first unless fresh is requested
    if (!fresh) {
      const { data: cached, error: cacheError } = await supabaseClient
        .from('graph_context_cache')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached && !cacheError) {
        console.log('Returning cached context');
        return new Response(
          JSON.stringify(cached.context),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Fetch latest engine scores
    const [pulseResult, ganeResult, moroResult] = await Promise.all([
      supabaseClient
        .from('pulse_engine_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseClient
        .from('gane_engine_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseClient
        .from('moro_engine_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // If any engine data is missing or stale (>24hrs), trigger recompute
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    let pulseScore = pulseResult.data?.score || 0;
    let ganeScore = ganeResult.data?.score || 0;
    let moroScore = moroResult.data?.score || 0;
    
    const pulseStale = !pulseResult.data || new Date(pulseResult.data.computed_at).getTime() < oneDayAgo;
    const ganeStale = !ganeResult.data || new Date(ganeResult.data.computed_at).getTime() < oneDayAgo;
    const moroStale = !moroResult.data || new Date(moroResult.data.computed_at).getTime() < oneDayAgo;

    if (pulseStale || ganeStale || moroStale) {
      console.log('Engine data stale, triggering recompute');
      // Trigger async recompute (don't await)
      const recomputePromises = [];
      if (pulseStale) recomputePromises.push(
        supabaseClient.functions.invoke('computePulse', { body: { userId } })
      );
      if (ganeStale) recomputePromises.push(
        supabaseClient.functions.invoke('computeGane', { body: { userId } })
      );
      if (moroStale) recomputePromises.push(
        supabaseClient.functions.invoke('computeMoro', { body: { userId } })
      );
      
      // Wait for recomputes
      const results = await Promise.all(recomputePromises);
      
      // Update scores with fresh data
      if (pulseStale && results[0]?.data) pulseScore = results[0].data.score;
      if (ganeStale && results[1]?.data) ganeScore = results[1].data.score;
      if (moroStale && results[2]?.data) moroScore = results[2].data.score;
    }

    // Correlate scores
    const overallScore = Math.round((pulseScore + ganeScore + moroScore) / 3);
    
    // Forecast growth potential
    const growthPotential = Math.round(
      (pulseScore * 0.4) + (ganeScore * 0.3) + (moroScore * 0.3)
    );

    // Generate insight using LLM
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = `Based on these scores for a real estate agent:
- PULSE Score (Execution): ${pulseScore}/100
- GANE Score (Intelligence): ${ganeScore}/100
- MORO Score (Market Opportunity): ${moroScore}/100

Provide a concise 2-sentence coaching insight and suggest 2-3 actionable next steps. Format as JSON: {"message": "...", "actions": [{"title": "...", "type": "create_task|send_email|schedule_call", "priority": "high|medium|low"}]}`;

    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a real estate business coach. Provide actionable, specific guidance.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const llmData = await llmResponse.json();
    let aiGuidance = { 
      message: 'Keep executing consistently and focusing on your systems.', 
      actions: [] 
    };
    
    if (llmData.choices?.[0]?.message?.content) {
      try {
        aiGuidance = JSON.parse(llmData.choices[0].message.content);
      } catch {
        aiGuidance.message = llmData.choices[0].message.content;
      }
    }

    // Build complete context
    const context = {
      timestamp: new Date().toISOString(),
      userId,
      scores: {
        pulse: pulseScore,
        gane: ganeScore,
        moro: moroScore,
        overall: overallScore,
      },
      forecast: {
        growthPotential,
      },
      insights: {
        message: aiGuidance.message,
        actions: aiGuidance.actions || [],
      },
      metrics: {
        pulse: pulseResult.data?.metrics || {},
        gane: ganeResult.data?.metrics || {},
        moro: moroResult.data?.metrics || {},
      },
    };

    // Cache the context
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    
    const { error: upsertError } = await supabaseClient
      .from('graph_context_cache')
      .upsert({
        user_id: userId,
        context,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) console.error('Error caching context:', upsertError);

    console.log('Graph context built successfully');

    return new Response(
      JSON.stringify(context),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error building graph context:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
