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

    // Get total users
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers } = await supabaseClient
      .from('profiles')
      .select('id')
      .gte('updated_at', thirtyDaysAgo.toISOString());

    // Get total goals
    const { count: totalGoals } = await supabaseClient
      .from('goals')
      .select('*', { count: 'exact', head: true });

    // Get total actions
    const { count: totalActions } = await supabaseClient
      .from('daily_actions')
      .select('*', { count: 'exact', head: true });

    // Get completed actions
    const { count: completedActions } = await supabaseClient
      .from('daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get total transactions
    const { count: totalTransactions } = await supabaseClient
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    // Get average pulse score
    const { data: recentPulse } = await supabaseClient
      .from('pulse_engine_snapshots')
      .select('score')
      .order('created_at', { ascending: false })
      .limit(100);

    const avgPulse = recentPulse && recentPulse.length > 0
      ? recentPulse.reduce((sum, s) => sum + Number(s.score), 0) / recentPulse.length
      : 0;

    const totalActionsCount = totalActions || 0;
    const completedActionsCount = completedActions || 0;

    const metrics = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers?.length || 0,
      totalGoals: totalGoals || 0,
      totalActions: totalActionsCount,
      completedActions: completedActionsCount,
      completionRate: totalActionsCount > 0 ? (completedActionsCount / totalActionsCount) * 100 : 0,
      totalTransactions: totalTransactions || 0,
      averagePulseScore: Math.round(avgPulse)
    };

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getPlatformMetrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
