import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const startOfTodayIso = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const daysAgoIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const collectGrowthData = (timestamps: string[], totalDays = 30) => {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().split('T')[0];
    buckets[key] = 0;
  }

  timestamps.forEach((timestamp) => {
    const key = timestamp.split('T')[0];
    if (key in buckets) {
      buckets[key] += 1;
    }
  });

  return Object.entries(buckets).map(([date, users]) => ({ date, users }));
};

const aggregateSubscriptionData = (rows: Array<{ subscription_tier: string | null }>) => {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    const tier = row.subscription_tier ?? 'Free';
    counts[tier] = (counts[tier] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
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

    const last24h = daysAgoIso(1);
    const last7d = daysAgoIso(7);
    const last30d = daysAgoIso(30);

    const [{ count: totalUsers }, { count: newUsersToday }, { count: activeUsers7d }, { data: growthRaw }, { data: subscriptionRows } ] = await Promise.all([
      supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfTodayIso()),
      supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', last7d),
      supabaseClient.from('profiles').select('created_at').gte('created_at', last30d),
      supabaseClient.from('profiles').select('subscription_tier'),
    ]);

    const [{ count: apiCalls24h }, { data: errors24h }, { data: integrationStates }, { count: completedActions24h }, { count: goalsCreated24h }, { count: contentGenerations24h }, { count: rolePlaySessions24h }, { count: advisorQueries24h }] = await Promise.all([
      supabaseClient.from('ai_agent_conversations').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
      supabaseClient.from('system_errors').select('id,severity').gte('created_at', last24h),
      supabaseClient.from('integration_status').select('*'),
      supabaseClient.from('daily_actions').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', last24h),
      supabaseClient.from('goals').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
      supabaseClient.from('generated_content').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
      supabaseClient.from('role_play_session_logs').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
      supabaseClient.from('ai_agent_conversations').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    ]);

    const growthTimestamps = (growthRaw ?? []).map((row) => row.created_at as string);
    const userGrowthData = collectGrowthData(growthTimestamps);
    const subscriptionData = aggregateSubscriptionData(subscriptionRows ?? []);

    const avgResponseTime = (() => {
      if (!integrationStates || integrationStates.length === 0) return 0;
      const values = integrationStates
        .map((item) => item.response_time_ms)
        .filter((value) => typeof value === 'number' && !Number.isNaN(value));
      if (values.length === 0) return 0;
      return Math.round(values.reduce((acc, value) => acc + value, 0) / values.length);
    })();

    const servicesWithErrors = (integrationStates ?? []).filter((item) => item.status === 'error');
    const errorRate = integrationStates && integrationStates.length > 0
      ? Math.round((servicesWithErrors.length / integrationStates.length) * 100)
      : 0;

    const emailStatus = (integrationStates ?? []).find((item) => item.service === 'resend')?.status ?? 'healthy';
    const apiStatus = servicesWithErrors.length > 0 ? 'degraded' : 'healthy';

    const featureUsageData = [
      { name: 'Content Studio', value: contentGenerations24h ?? 0 },
      { name: 'Role Play', value: rolePlaySessions24h ?? 0 },
      { name: 'AI Advisor', value: advisorQueries24h ?? 0 },
      { name: 'Daily Actions', value: completedActions24h ?? 0 },
      { name: 'Goals Created', value: goalsCreated24h ?? 0 },
    ];

    const metrics = {
      totalUsers: totalUsers ?? 0,
      newUsersToday: newUsersToday ?? 0,
      activeUsers7d: activeUsers7d ?? 0,
      activeUserRate: totalUsers ? Number(((activeUsers7d ?? 0) / totalUsers * 100).toFixed(1)) : 0,
      apiCalls24h: apiCalls24h ?? 0,
      avgResponseTime,
      errorRate,
      totalErrors: errors24h?.length ?? 0,
      databaseStatus: 'healthy',
      apiStatus,
      storageStatus: 'healthy',
      emailStatus,
      userGrowthData,
      subscriptionData,
      featureUsageData,
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
