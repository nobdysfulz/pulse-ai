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

    const { apiKey } = await req.json();

    if (!apiKey) {
      throw new Error('Lofty API key is required');
    }

    // Verify API key with Lofty
    const testResponse = await fetch('https://api.lofty.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      throw new Error('Invalid Lofty API key');
    }

    const loftyUserData = await testResponse.json();

    // Store connection in database
    const { data: existingConnection } = await supabaseClient
      .from('crm_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'lofty')
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabaseClient
        .from('crm_connections')
        .update({
          connection_status: 'connected',
          credentials: { api_key: apiKey },
          settings: { 
            account_name: loftyUserData.account?.name,
            user_email: loftyUserData.email 
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id);

      if (updateError) throw updateError;
    } else {
      // Create new connection
      const { error: insertError } = await supabaseClient
        .from('crm_connections')
        .insert({
          user_id: user.id,
          provider: 'lofty',
          connection_status: 'connected',
          credentials: { api_key: apiKey },
          settings: { 
            account_name: loftyUserData.account?.name,
            user_email: loftyUserData.email 
          }
        });

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lofty connected successfully',
        accountInfo: {
          name: loftyUserData.account?.name,
          email: loftyUserData.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in loftyAuth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
