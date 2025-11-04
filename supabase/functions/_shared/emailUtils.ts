import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const DEFAULT_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Pulse AI <alerts@pulse.pwru.app>';

export const minutesByPlan: Record<string, number | null> = {
  starter: 100,
  professional: 300,
  enterprise: null,
};

export const planTierMap: Record<string, string> = {
  starter: 'Subscriber',
  professional: 'Subscriber',
  enterprise: 'Subscriber',
};

export const planAgentTypeMap: Record<string, string> = {
  starter: 'core',
  professional: 'core',
  enterprise: 'core',
};

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export type TemplateVariables = Record<string, string | number | null | undefined>;

export const createSupabaseAdmin = () =>
  createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

export const createSupabaseAuthedClient = (authHeader?: string | null) => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    anonKey,
    authHeader
      ? {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      : undefined
  );
};

export const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return undefined;
  }
};

export async function fetchEmailTemplate(templateKey: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .maybeSingle();
  return data ?? null;
}

export function renderTemplateBody(template: { body_html?: string; body_text?: string } | null, variables: TemplateVariables) {
  const replacements = Object.entries(variables).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value === null || value === undefined ? '' : String(value);
    return acc;
  }, {});

  const apply = (content?: string | null) => {
    if (!content) return undefined;
    return content.replace(/\{([^}]+)\}/g, (_match, key) => replacements[key] ?? '');
  };

  return {
    html: apply(template?.body_html),
    text: apply(template?.body_text),
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email send.');
    return { skipped: true };
  }

  const payload = {
    from: from ?? DEFAULT_FROM_EMAIL,
    to: [to],
    subject,
    html,
    text,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send Resend email:', response.status, errorText);
    throw new Error('Email send failed');
  }

  return response.json();
}

export async function logEmailDelivery({
  userId,
  emailType,
  templateKey,
  metadata,
}: {
  userId: string;
  emailType: string;
  templateKey?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from('email_delivery_logs').insert({
    user_id: userId,
    email_type: emailType,
    template_key: templateKey,
    metadata: metadata ? metadata : {},
  });
}
