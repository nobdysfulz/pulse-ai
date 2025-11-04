import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  corsHeaders,
  createSupabaseAdmin,
  minutesByPlan,
  planAgentTypeMap,
  PLAN_LABELS,
} from '../_shared/emailUtils.ts';

const SECRET_HEADER_KEYS = ['x-gohighlevel-secret', 'x-webhook-secret', 'x-api-key'];

const DEFAULT_PLAN = 'starter';

function resolveSecret(req: Request) {
  for (const header of SECRET_HEADER_KEYS) {
    const value = req.headers.get(header);
    if (value) return value;
  }
  return null;
}

function getPlanKey(planType?: string | null) {
  if (!planType) return DEFAULT_PLAN;
  const normalized = planType.toLowerCase();
  if (normalized in PLAN_LABELS) return normalized;
  if (normalized.includes('starter')) return 'starter';
  if (normalized.includes('pro')) return 'professional';
  if (normalized.includes('enterprise') || normalized.includes('team')) return 'enterprise';
  return DEFAULT_PLAN;
}

function computeBillingWindow(startDate: Date) {
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const receivedSecret = resolveSecret(req);
  const expectedSecret = Deno.env.get('GOHIGHLEVEL_WEBHOOK_SECRET');

  if (!expectedSecret || !receivedSecret || receivedSecret !== expectedSecret) {
    console.warn('GoHighLevel webhook rejected due to invalid secret.');
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabase = createSupabaseAdmin();
  const startTimer = performance.now();

  try {
    const payload = await req.json();
    const contactEmail: string | undefined = payload?.contact_email ?? payload?.contact?.email;
    const orderId: string | undefined = payload?.order_id ?? payload?.orderId ?? payload?.order?.id;
    const planType: string | undefined = payload?.plan_type ?? payload?.planType ?? payload?.subscription?.plan;
    const contactName: string | undefined = payload?.contact_name ?? payload?.contact?.name;

    if (!contactEmail) {
      return new Response(JSON.stringify({ error: 'contact_email missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const planKey = getPlanKey(planType);
    const planLabel = PLAN_LABELS[planKey];
    const minutesAllocated = minutesByPlan[planKey] ?? null;
    const agentType = planAgentTypeMap[planKey] ?? 'core';
    const now = new Date();
    const billing = computeBillingWindow(now);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', contactEmail.toLowerCase())
      .maybeSingle();

    let userId = existingProfile?.id as string | undefined;

    if (!userId) {
      const createResult = await supabase.auth.admin.createUser({
        email: contactEmail,
        email_confirm: true,
        user_metadata: {
          full_name: contactName ?? '',
          source: 'gohighlevel',
        },
      });

      if (createResult.error || !createResult.data?.user) {
        throw createResult.error ?? new Error('Failed to create Supabase user');
      }

      userId = createResult.data.user.id;
    }

    // Update subscription tier on profile
    await supabase
      .from('profiles')
      .update({
        subscription_tier: planLabel,
        subscription_status: 'active',
        full_name: contactName ?? undefined,
        email: contactEmail,
      })
      .eq('id', userId);

    // Upsert user agent subscription
    await supabase
      .from('user_agent_subscriptions')
      .upsert({
        user_id: userId,
        agent_type: agentType,
        subscription_tier: planLabel,
        plan_type: planLabel,
        minutes_allocated: minutesAllocated,
        billing_cycle_start: billing.start,
        billing_cycle_end: billing.end,
        gohighlevel_order_id: orderId ?? null,
        source_platform: 'gohighlevel',
        status: 'active',
        is_active: true,
      }, { onConflict: 'user_id,agent_type' });

    // Ensure onboarding record reflects webhook success
    await supabase
      .from('user_onboarding')
      .upsert({
        user_id: userId,
        highlevel_webhook_sent: true,
      }, { onConflict: 'user_id' });

    const responseTime = Math.round(performance.now() - startTimer);

    await supabase
      .from('integration_status')
      .upsert({
        service: 'gohighlevel',
        status: 'healthy',
        response_time_ms: responseTime,
        last_checked: new Date().toISOString(),
        error_message: null,
        metadata: {
          lastWebhookReceivedAt: new Date().toISOString(),
          lastOrderId: orderId ?? null,
          lastEmail: contactEmail,
          plan: planLabel,
        },
      }, { onConflict: 'service' });

    return new Response(
      JSON.stringify({ success: true, userId, plan: planLabel }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error handling GoHighLevel webhook:', error);

    await supabase
      .from('integration_status')
      .upsert({
        service: 'gohighlevel',
        status: 'error',
        response_time_ms: Math.round(performance.now() - startTimer),
        last_checked: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }, { onConflict: 'service' });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
