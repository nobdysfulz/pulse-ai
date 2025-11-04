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
    const { transactionId, userId } = await req.json();

    if (!userId || !transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and transactionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get SkySlope credentials
    const { data: connection } = await supabaseClient
      .from('external_service_connections')
      .select('credentials')
      .eq('user_id', userId)
      .eq('service_name', 'skyslope')
      .single();

    if (!connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SkySlope not connected',
          suggestion: 'Please connect your SkySlope account in Settings > Integrations'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = connection.credentials?.api_key;
    const apiUrl = 'https://api.skyslope.com/api/v1';

    const response = await fetch(`${apiUrl}/transactions/${transactionId}/checklist`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[getSkySlopeChecklistItemsTool] SkySlope API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch checklist: ${error}`,
          suggestion: 'Please check your SkySlope connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          checklistItems: data.items || [],
          transactionId,
          message: 'Checklist items retrieved successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[getSkySlopeChecklistItemsTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
