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
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all relevant context for the agent
    const [profileData, goalsData, actionsData, graphData, marketData] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('goals').select('*').eq('user_id', user.id),
      supabaseClient.from('daily_actions').select('*').eq('user_id', user.id).order('due_date', { ascending: false }).limit(20),
      supabaseClient.from('graph_context_cache').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('market_config').select('*').eq('user_id', user.id).single()
    ]);

    const context = {
      profile: profileData.data || {},
      goals: goalsData.data || [],
      recentActions: actionsData.data || [],
      intelligence: graphData.data?.context || {},
      market: marketData.data || {},
      userId: user.id,
      email: user.email
    };

    return new Response(
      JSON.stringify(context),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getAgentContext:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
