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
    console.log('Computing Pulse score for user:', userId);

    // Fetch user's daily actions
    const { data: actions, error: actionsError } = await supabaseClient
      .from('daily_actions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (actionsError) throw actionsError;

    // Fetch user's goals
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (goalsError) throw goalsError;

    // Calculate metrics
    const totalActions = actions?.length || 0;
    const completedActions = actions?.filter(a => a.status === 'completed').length || 0;
    const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    
    // Consistency: actions completed in last 7 days
    const last7Days = actions?.filter(a => 
      new Date(a.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length || 0;
    
    // Activity volume score (0-40 points)
    const volumeScore = Math.min(40, (totalActions / 30) * 40);
    
    // Completion rate score (0-40 points)
    const completionScore = (completionRate / 100) * 40;
    
    // Consistency score (0-20 points)
    const consistencyScore = Math.min(20, (last7Days / 7) * 20);
    
    const pulseScore = Math.round(volumeScore + completionScore + consistencyScore);

    const metrics = {
      totalActions,
      completedActions,
      completionRate: Math.round(completionRate),
      last7DaysActions: last7Days,
      volumeScore: Math.round(volumeScore),
      completionScore: Math.round(completionScore),
      consistencyScore: Math.round(consistencyScore),
      activeGoals: goals?.length || 0,
    };

    // Store snapshot
    const { error: insertError } = await supabaseClient
      .from('pulse_engine_snapshots')
      .insert({
        user_id: userId,
        score: pulseScore,
        metrics,
        computed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    console.log('Pulse score computed:', pulseScore);

    return new Response(
      JSON.stringify({ score: pulseScore, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error computing Pulse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: 'Failed to compute PULSE score',
        // Return partial result if possible
        score: 0,
        metrics: {
          totalActions: 0,
          completedActions: 0,
          completionRate: 0,
          last7DaysActions: 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
