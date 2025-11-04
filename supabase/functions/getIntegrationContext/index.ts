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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { userId } = await req.json();

    // Fetch all external service connections
    const { data: externalConnections, error: externalError } = await supabaseClient
      .from('external_service_connections')
      .select('*')
      .eq('user_id', userId || user.id);

    if (externalError) throw externalError;

    // Fetch all CRM connections
    const { data: crmConnections, error: crmError } = await supabaseClient
      .from('crm_connections')
      .select('*')
      .eq('user_id', userId || user.id);

    if (crmError) throw crmError;

    // Build integration context
    const integrationContext = {
      google_workspace: externalConnections?.find(c => c.service_name === 'google_workspace' && c.connection_status === 'connected') || null,
      zoom: externalConnections?.find(c => c.service_name === 'zoom' && c.connection_status === 'connected') || null,
      microsoft_365: externalConnections?.find(c => c.service_name === 'microsoft_365' && c.connection_status === 'connected') || null,
      facebook: externalConnections?.find(c => c.service_name === 'facebook' && c.connection_status === 'connected') || null,
      instagram: externalConnections?.find(c => c.service_name === 'instagram' && c.connection_status === 'connected') || null,
      linkedin: externalConnections?.find(c => c.service_name === 'linkedin' && c.connection_status === 'connected') || null,
      lofty: crmConnections?.find(c => c.provider === 'lofty' && c.connection_status === 'connected') || null,
      follow_up_boss: crmConnections?.find(c => c.provider === 'follow_up_boss' && c.connection_status === 'connected') || null,
    };

    return new Response(
      JSON.stringify(integrationContext),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getIntegrationContext:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
