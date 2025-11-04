import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOAuthToken } from '../_shared/oauthUtils.ts';
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
    const { period, metrics, userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const accessToken = await getOAuthToken(userId, 'meta', supabaseUrl, supabaseKey);

    // Get Instagram Business Account ID
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('connection_metadata')
      .eq('user_id', userId)
      .eq('service_name', 'meta')
      .single();

    const instagramAccountId = connection?.connection_metadata?.instagram_business_account_id;

    if (!instagramAccountId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Instagram Business Account not connected',
          suggestion: 'Please connect your Instagram Business account in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define default metrics
    const defaultMetrics = [
      'follower_count',
      'impressions',
      'reach',
      'profile_views'
    ];

    const metricsToFetch = metrics ? metrics.split(',') : defaultMetrics;
    const periodValue = period || 'day';

    // Fetch insights from Instagram API
    const insightsUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=${metricsToFetch.join(',')}&period=${periodValue}&access_token=${accessToken}`;

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      const error = await response.text();
      console.error('[getInstagramInsightsTool] Instagram API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch insights: ${error}`,
          suggestion: 'Please check your Instagram Business account connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('[getInstagramInsightsTool] Instagram insights fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          insights: data.data,
          period: periodValue,
          message: 'Instagram insights retrieved successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[getInstagramInsightsTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your Instagram Business account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
