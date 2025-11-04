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

    const { action = 'connect', apiKey } = await req.json();

    const { data: existingConnection } = await supabaseClient
      .from('crm_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'follow_up_boss')
      .maybeSingle();

    if (action === 'disconnect') {
      if (existingConnection) {
        const { error: updateError } = await supabaseClient
          .from('crm_connections')
          .update({
            connection_status: 'disconnected',
            credentials: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConnection.id);

        if (updateError) throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Follow Up Boss disconnected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Follow Up Boss API key is required');
    }

    const encodedKey = btoa(`${apiKey}:`);
    const verificationResponse = await fetch('https://api.followupboss.com/v1/me', {
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Accept': 'application/json',
      }
    });

    if (!verificationResponse.ok) {
      throw new Error('Invalid Follow Up Boss API key');
    }

    const profile = await verificationResponse.json();

    if (existingConnection) {
      const { error: updateError } = await supabaseClient
        .from('crm_connections')
        .update({
          connection_status: 'connected',
          credentials: { api_key: apiKey },
          settings: {
            account_name: profile?.name,
            user_email: profile?.email,
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('crm_connections')
        .insert({
          user_id: user.id,
          provider: 'follow_up_boss',
          connection_status: 'connected',
          credentials: { api_key: apiKey },
          settings: {
            account_name: profile?.name,
            user_email: profile?.email,
          }
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Follow Up Boss connected',
        accountInfo: {
          name: profile?.name,
          email: profile?.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in followUpBossAuth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
