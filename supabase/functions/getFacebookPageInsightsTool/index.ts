import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOAuthToken } from '../_shared/oauthUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { period = 'week', userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get OAuth token and page ID
    const accessToken = await getOAuthToken(userId, 'facebook', supabaseUrl, supabaseKey);

    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('settings')
      .eq('user_id', userId)
      .eq('service_name', 'facebook')
      .single();

    const pageId = connection?.settings?.page_id;
    if (!pageId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No Facebook Page connected',
          suggestion: 'Please connect a Facebook Page in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map period to days
    const periodMapping: Record<string, number> = {
      day: 1,
      week: 7,
      month: 30
    };
    const days = periodMapping[period] || 7;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch page insights
    const metrics = [
      'page_impressions',
      'page_post_engagements',
      'page_fans',
      'page_views_total'
    ];

    const metricsParam = metrics.join(',');
    const since = Math.floor(startDate.getTime() / 1000);
    const until = Math.floor(endDate.getTime() / 1000);

    const insightsUrl = `https://graph.facebook.com/v18.0/${pageId}/insights?metric=${metricsParam}&period=day&since=${since}&until=${until}&access_token=${accessToken}`;

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      const error = await response.text();
      console.error('[getFacebookPageInsightsTool] Facebook API error:', response.status, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch insights: ${response.status}`,
          suggestion: 'Please check your Facebook connection in Settings > Integrations'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Process insights data
    const insightsData: any = {};
    if (data.data) {
      data.data.forEach((metric: any) => {
        const values = metric.values || [];
        const total = values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
        insightsData[metric.name] = {
          total: total,
          average: values.length > 0 ? total / values.length : 0
        };
      });
    }

    // Calculate engagement rate
    const impressions = insightsData.page_impressions?.total || 0;
    const engagements = insightsData.page_post_engagements?.total || 0;
    const engagementRate = impressions > 0 ? ((engagements / impressions) * 100).toFixed(2) : '0';

    console.log('[getFacebookPageInsightsTool] Insights retrieved for period:', period);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          period: period,
          days: days,
          metrics: {
            impressions: insightsData.page_impressions?.total || 0,
            engagements: insightsData.page_post_engagements?.total || 0,
            followers: insightsData.page_fans?.total || 0,
            pageViews: insightsData.page_views_total?.total || 0,
            engagementRate: `${engagementRate}%`
          },
          insights: `Your page reached ${insightsData.page_impressions?.total || 0} people with ${insightsData.page_post_engagements?.total || 0} engagements (${engagementRate}% engagement rate) over the past ${days} days.`,
          message: 'Insights retrieved successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[getFacebookPageInsightsTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: error instanceof Error && error.message.includes('not connected') 
          ? 'Please connect Facebook in Settings > Integrations'
          : 'An error occurred fetching insights'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
