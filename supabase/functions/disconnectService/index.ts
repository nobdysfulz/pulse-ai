import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;

    const { serviceName } = await req.json();

    if (!serviceName) {
      return new Response(
        JSON.stringify({ error: 'Service name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[disconnectService] Disconnecting service:', serviceName, 'for user:', userId);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find the connection
    const { data: connections, error: fetchError } = await supabase
      .from('external_service_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('service_name', serviceName);

    if (fetchError) {
      console.error('[disconnectService] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update connection status to disconnected
    const { error: updateError } = await supabase
      .from('external_service_connections')
      .update({ connection_status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('id', connections[0].id);

    if (updateError) {
      console.error('[disconnectService] Update error:', updateError);
      throw updateError;
    }

    console.log('[disconnectService] ✓ Service disconnected successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Service disconnected successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[disconnectService] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
