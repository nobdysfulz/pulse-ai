import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateClerkTokenWithJose } from '../_shared/clerkAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const userId: string = await validateClerkTokenWithJose(token);

    console.log('[getUserContext] Fetching context for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all user data in parallel using service role
    const [
      profileResult,
      onboardingResult,
      marketConfigResult,
      preferencesResult,
      actionsResult,
      agentConfigResult,
      userAgentSubResult,
      goalsResult,
      businessPlanResult,
      pulseScoresResult,
      pulseConfigResult,
      agentIntelligenceResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_onboarding').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('market_config').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('daily_actions').select('*').eq('user_id', userId).order('due_date', { ascending: false }).limit(50),
      supabase.from('agent_config').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_agent_subscription').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('business_plans').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('pulse_scores').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
      supabase.from('pulse_config').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('agent_intelligence_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    // Check for profile fetch error (critical)
    if (profileResult.error) {
      console.error('[getUserContext] Profile fetch error:', profileResult.error);
      throw new Error('Failed to fetch user profile');
    }

    // Log any non-critical errors but don't fail the request
    if (onboardingResult.error) console.warn('[getUserContext] Onboarding error:', onboardingResult.error);
    if (marketConfigResult.error) console.warn('[getUserContext] Market config error:', marketConfigResult.error);
    if (preferencesResult.error) console.warn('[getUserContext] Preferences error:', preferencesResult.error);
    if (actionsResult.error) console.warn('[getUserContext] Actions error:', actionsResult.error);
    if (agentConfigResult.error) console.warn('[getUserContext] Agent config error:', agentConfigResult.error);
    if (userAgentSubResult.error) console.warn('[getUserContext] User agent sub error:', userAgentSubResult.error);
    if (goalsResult.error) console.warn('[getUserContext] Goals error:', goalsResult.error);
    if (businessPlanResult.error) console.warn('[getUserContext] Business plan error:', businessPlanResult.error);
    if (pulseScoresResult.error) console.warn('[getUserContext] Pulse scores error:', pulseScoresResult.error);
    if (pulseConfigResult.error) console.warn('[getUserContext] Pulse config error:', pulseConfigResult.error);
    if (agentIntelligenceResult.error) console.warn('[getUserContext] Agent intelligence error:', agentIntelligenceResult.error);

    // Build complete user context
    const context = {
      user: profileResult.data,
      onboarding: onboardingResult.data || null,
      marketConfig: marketConfigResult.data || null,
      preferences: preferencesResult.data || null,
      actions: actionsResult.data || [],
      agentConfig: agentConfigResult.data || null,
      userAgentSubscription: userAgentSubResult.data || null,
      goals: goalsResult.data || [],
      businessPlan: businessPlanResult.data || null,
      pulseHistory: pulseScoresResult.data || [],
      pulseConfig: pulseConfigResult.data || null,
      agentProfile: agentIntelligenceResult.data || null,
    };

    console.log('[getUserContext] ✓ Context fetched successfully');

    return new Response(
      JSON.stringify(context),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[getUserContext] Error:', error);
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
