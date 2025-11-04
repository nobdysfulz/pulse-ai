import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  corsHeaders,
  createSupabaseAdmin,
  minutesByPlan,
  planAgentTypeMap,
  PLAN_LABELS,
} from '../_shared/emailUtils.ts';

const SKU_PLAN_MAP: Record<string, string> = {
  'PULSE-STARTER': 'starter',
  'PULSE-STARTER-ANNUAL': 'starter',
  'PULSE-PRO': 'professional',
  'PULSE-PRO-ANNUAL': 'professional',
  'PULSE-ENTERPRISE': 'enterprise',
  'PULSE-ENTERPRISE-ANNUAL': 'enterprise',
};

const DEFAULT_PLAN = 'starter';

const textEncoder = new TextEncoder();

async function verifyShopifySignature(req: Request, rawBody: string) {
  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
  const signature = req.headers.get('X-Shopify-Hmac-Sha256');

  if (!secret || !signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const digest = await crypto.subtle.sign('HMAC', key, textEncoder.encode(rawBody));
  const generated = btoa(String.fromCharCode(...new Uint8Array(digest)));

  if (generated.length !== signature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < generated.length; i++) {
    mismatch |= generated.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return mismatch === 0;
}

function determinePlan(lineItems: Array<Record<string, unknown>> | undefined) {
  if (!lineItems) return DEFAULT_PLAN;
  for (const item of lineItems) {
    const sku = typeof item?.sku === 'string' ? item.sku.toUpperCase() : undefined;
    if (sku && SKU_PLAN_MAP[sku]) {
      return SKU_PLAN_MAP[sku];
    }
  }
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

  const rawBody = await req.text();

  if (!(await verifyShopifySignature(req, rawBody))) {
    console.warn('Shopify webhook signature verification failed.');
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabase = createSupabaseAdmin();
  const startTimer = performance.now();

  try {
    const payload = JSON.parse(rawBody);
    const topic = req.headers.get('X-Shopify-Topic') ?? 'orders/create';
    const email: string | undefined = payload?.customer?.email;
    const orderId: string | undefined = payload?.id?.toString() ?? payload?.order_id?.toString();
    const lineItems = Array.isArray(payload?.line_items) ? payload.line_items : [];
    const planKey = determinePlan(lineItems);
    const planLabel = PLAN_LABELS[planKey];
    const agentType = planAgentTypeMap[planKey] ?? 'core';
    const minutesAllocated = minutesByPlan[planKey] ?? null;

    if (!email) {
      return new Response(JSON.stringify({ error: 'customer email missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    let userId = existingProfile?.id as string | undefined;

    if (!userId && topic !== 'orders/cancelled') {
      const createResult = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { source: 'shopify' },
      });

      if (createResult.error || !createResult.data?.user) {
        throw createResult.error ?? new Error('Failed to create Supabase user');
      }

      userId = createResult.data.user.id;
    }

    if (!userId) {
      console.warn('Unable to resolve user for Shopify cancellation webhook.');
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (topic === 'orders/cancelled') {
      await supabase
        .from('user_agent_subscriptions')
        .update({
          status: 'inactive',
          is_active: false,
          billing_cycle_end: new Date().toISOString(),
          shopify_order_id: orderId ?? null,
        })
        .eq('user_id', userId)
        .eq('agent_type', agentType);

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'Free', subscription_status: 'inactive' })
        .eq('id', userId);
    } else {
      const billing = computeBillingWindow(new Date());

      await supabase
        .from('profiles')
        .update({ subscription_tier: planLabel, subscription_status: 'active', email })
        .eq('id', userId);

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
          shopify_order_id: orderId ?? null,
          source_platform: 'shopify',
          status: 'active',
          is_active: true,
        }, { onConflict: 'user_id,agent_type' });
    }

    const responseTime = Math.round(performance.now() - startTimer);

    await supabase
      .from('integration_status')
      .upsert({
        service: 'shopify',
        status: 'healthy',
        response_time_ms: responseTime,
        last_checked: new Date().toISOString(),
        error_message: null,
        metadata: {
          lastWebhookReceivedAt: new Date().toISOString(),
          lastOrderId: orderId ?? null,
          lastEmail: email,
          lastTopic: topic,
          plan: planLabel,
        },
      }, { onConflict: 'service' });

    return new Response(
      JSON.stringify({ success: true, topic, userId, plan: planLabel }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error handling Shopify webhook:', error);

    await supabase
      .from('integration_status')
      .upsert({
        service: 'shopify',
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
