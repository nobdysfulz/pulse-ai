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
    const { propertyAddress, transactionType, clientName, expectedCloseDate, userId } = await req.json();

    if (!userId || !propertyAddress || !transactionType) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId, propertyAddress, and transactionType are required' }),
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

    // Create transaction in SkySlope
    const transactionData: any = {
      address: propertyAddress,
      transactionType: transactionType,
      clientName: clientName || '',
      expectedClosingDate: expectedCloseDate
    };

    const response = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[createSkySlopeTransactionTool] SkySlope API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create transaction: ${error}`,
          suggestion: 'Please check your SkySlope connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('[createSkySlopeTransactionTool] Transaction created:', data.transactionId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transactionId: data.transactionId,
          address: propertyAddress,
          message: 'SkySlope transaction created successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[createSkySlopeTransactionTool] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure your SkySlope account is connected'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
