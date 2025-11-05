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

    console.log('[fetchUserConnections] Fetching connections for user:', userId);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch all user connections in parallel
    const [crmResult, externalResult] = await Promise.all([
      supabase
        .from('crm_connections')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('external_service_connections')
        .select('*')
        .eq('user_id', userId),
    ]);

    if (crmResult.error) {
      console.warn('[fetchUserConnections] CRM connections error:', crmResult.error);
    }

    if (externalResult.error) {
      console.warn('[fetchUserConnections] External connections error:', externalResult.error);
    }

    const connections = {
      crm: crmResult.data || [],
      external: externalResult.data || [],
    };

    console.log('[fetchUserConnections] ✓ Connections fetched successfully');

    return new Response(
      JSON.stringify({ success: true, data: connections }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[fetchUserConnections] Error:', error);
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
