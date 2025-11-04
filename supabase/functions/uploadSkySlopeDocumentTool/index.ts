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
    const { transactionId, documentUrl, documentName, documentType, userId } = await req.json();

    if (!userId || !transactionId || !documentUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId, transactionId, and documentUrl are required' }),
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

    // Upload document to SkySlope
    const documentData: any = {
      transactionId,
      documentUrl,
      documentName: documentName || 'Document',
      documentType: documentType || 'Other'
    };

    const response = await fetch(`${apiUrl}/transactions/${transactionId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[uploadSkySlopeDocumentTool] SkySlope API error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to upload document: ${error}`,
          suggestion: 'Please check your SkySlope connection'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('[uploadSkySlopeDocumentTool] Document uploaded:', data.documentId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          documentId: data.documentId,
          transactionId,
          message: 'Document uploaded to SkySlope successfully'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[uploadSkySlopeDocumentTool] Error:', error);
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
