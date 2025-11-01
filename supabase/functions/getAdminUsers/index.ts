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

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Client bound to the caller (to read their own roles under RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });

  // Admin client to fetch all users (bypass RLS safely after authz check)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1) Authenticate caller
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = userResp.user.id;

    // 2) Authorization: must be admin
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);
    if (rolesErr) {
      console.error('getAdminUsers rolesErr', rolesErr);
      return new Response(JSON.stringify({ error: 'Unable to verify role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const isAdmin = Array.isArray(roles) && roles.some((r) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3) Fetch data using service role
    const { data: profiles, error: profilesErr } = await admin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false });
    if (profilesErr) {
      console.error('getAdminUsers profilesErr', profilesErr);
      return new Response(JSON.stringify({ error: 'Failed to load users' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: onboarding, error: onboardingErr } = await admin
      .from('user_onboarding')
      .select('user_id, agent_onboarding_completed, onboarding_completion_date');
    if (onboardingErr) {
      console.error('getAdminUsers onboardingErr', onboardingErr);
    }
    const onboardingMap = new Map(
      (onboarding ?? []).map((o) => [o.user_id, o])
    );

    const users = (profiles ?? []).map((p) => {
      const [firstName = '', ...rest] = (p.full_name || '').split(' ');
      const lastName = rest.join(' ');
      const ob = onboardingMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        firstName,
        lastName,
        avatar: null,
        subscriptionTier: 'Free',
        subscriptionStatus: 'active',
        created_date: p.created_at,
        onboarding: {
          onboardingCompleted: !!ob?.onboarding_completion_date,
          agentOnboardingCompleted: !!ob?.agent_onboarding_completed,
          callCenterOnboardingCompleted: false,
        },
        userAgentSubscription: null,
        role: 'user',
      } as Record<string, unknown>;
    });

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('getAdminUsers error', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});