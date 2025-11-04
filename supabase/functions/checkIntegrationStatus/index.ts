import { corsHeaders, createSupabaseAdmin, createSupabaseAuthedClient } from '../_shared/emailUtils.ts';

type ServiceResult = {
  name: string;
  key: string;
  status: 'healthy' | 'degraded' | 'error';
  responseTime?: number;
  lastChecked: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

const nowIso = () => new Date().toISOString();

async function checkResend(): Promise<ServiceResult> {
  const name = 'Resend (Email)';
  const key = 'resend';
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return { name, key, status: 'error', lastChecked: nowIso(), errorMessage: 'API key not configured' };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://api.resend.com/accounts', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const responseTime = Math.round(performance.now() - start);

    if (!response.ok) {
      const text = await response.text();
      return {
        name,
        key,
        status: 'error',
        responseTime,
        lastChecked: nowIso(),
        errorMessage: `HTTP ${response.status}: ${text}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      name,
      key,
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      lastChecked: nowIso(),
      metadata: { accountId: data?.id ?? null },
    };
  } catch (error) {
    return {
      name,
      key,
      status: 'error',
      lastChecked: nowIso(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkElevenLabs(): Promise<ServiceResult> {
  const name = 'ElevenLabs (Voice)';
  const key = 'elevenlabs';
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    return { name, key, status: 'error', lastChecked: nowIso(), errorMessage: 'API key not configured' };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const responseTime = Math.round(performance.now() - start);

    if (!response.ok) {
      const text = await response.text();
      return {
        name,
        key,
        status: 'error',
        responseTime,
        lastChecked: nowIso(),
        errorMessage: `HTTP ${response.status}: ${text}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      name,
      key,
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      lastChecked: nowIso(),
      metadata: { voices: Array.isArray(data?.voices) ? data.voices.length : null },
    };
  } catch (error) {
    return {
      name,
      key,
      status: 'error',
      lastChecked: nowIso(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkTwilio(): ServiceResult {
  const name = 'Twilio (Phone)';
  const key = 'twilio';
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!sid || !token) {
    return { name, key, status: 'error', lastChecked: nowIso(), errorMessage: 'Credentials not configured' };
  }

  return {
    name,
    key,
    status: 'degraded',
    lastChecked: nowIso(),
    errorMessage: 'Connectivity check skipped in limited environment',
  };
}

async function checkOpenAI(): Promise<ServiceResult> {
  const name = 'OpenAI (LLM)';
  const key = 'openai';
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return { name, key, status: 'error', lastChecked: nowIso(), errorMessage: 'API key not configured' };
  }

  const start = performance.now();
  try {
    const response = await fetch('https://api.openai.com/v1/models?limit=1', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const responseTime = Math.round(performance.now() - start);

    if (!response.ok) {
      const text = await response.text();
      return {
        name,
        key,
        status: 'error',
        responseTime,
        lastChecked: nowIso(),
        errorMessage: `HTTP ${response.status}: ${text}`,
      };
    }

    return {
      name,
      key,
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      lastChecked: nowIso(),
    };
  } catch (error) {
    return {
      name,
      key,
      status: 'error',
      lastChecked: nowIso(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkRapidApi(): ServiceResult {
  const name = 'RapidAPI (Market Data)';
  const key = 'rapidapi';
  const apiKey = Deno.env.get('RAPIDAPI_MARKET_METRICS_API_KEY');
  if (!apiKey) {
    return { name, key, status: 'error', lastChecked: nowIso(), errorMessage: 'API key not configured' };
  }

  return {
    name,
    key,
    status: 'degraded',
    lastChecked: nowIso(),
    errorMessage: 'Live connectivity checks are disabled by default',
  };
}

function summariseConnections(connections: Array<{ service_name: string; connection_status: string }> | null, serviceNames: string[]) {
  if (!connections) return 0;
  return connections.filter((connection) => serviceNames.includes(connection.service_name) && connection.connection_status === 'connected').length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuthed = createSupabaseAuthedClient(authHeader);
    const supabaseAdmin = createSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAuthed.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id);

    const isAdmin = roles?.some((role) => role.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const services: ServiceResult[] = [];

    services.push(await checkResend());
    services.push(await checkElevenLabs());
    services.push(checkTwilio());
    services.push(await checkOpenAI());
    services.push(checkRapidApi());

    const { data: integrationStates } = await supabaseAdmin
      .from('integration_status')
      .select('*');

    const shopifyStatus = integrationStates?.find((item) => item.service === 'shopify');
    const gohighlevelStatus = integrationStates?.find((item) => item.service === 'gohighlevel');

    const attachStatus = (serviceKey: string, name: string, fallback: ServiceResult['status']) => {
      const record = serviceKey === 'shopify' ? shopifyStatus : gohighlevelStatus;
      if (record) {
        services.push({
          name,
          key: serviceKey,
          status: record.status as ServiceResult['status'],
          responseTime: record.response_time_ms ?? undefined,
          lastChecked: record.last_checked ?? nowIso(),
          errorMessage: record.error_message,
          metadata: record.metadata ?? undefined,
        });
      } else {
        services.push({ name, key: serviceKey, status: fallback, lastChecked: nowIso(), errorMessage: 'No webhooks received yet' });
      }
    };

    attachStatus('shopify', 'Shopify (Orders)', 'degraded');
    attachStatus('gohighlevel', 'GoHighLevel (Subscriptions)', 'degraded');

    const { data: connections } = await supabaseAdmin
      .from('external_service_connections')
      .select('service_name, connection_status');

    const googleConnections = summariseConnections(connections, ['google_workspace', 'google']);
    const microsoftConnections = summariseConnections(connections, ['microsoft_365', 'office365']);
    const metaConnections = summariseConnections(connections, ['facebook', 'instagram', 'meta']);

    services.push({
      name: 'Google Workspace',
      key: 'google_workspace',
      status: googleConnections > 0 ? 'healthy' : 'degraded',
      lastChecked: nowIso(),
      metadata: { activeConnections: googleConnections },
    });

    services.push({
      name: 'Microsoft 365',
      key: 'microsoft_365',
      status: microsoftConnections > 0 ? 'healthy' : 'degraded',
      lastChecked: nowIso(),
      metadata: { activeConnections: microsoftConnections },
    });

    services.push({
      name: 'Meta (Facebook/Instagram)',
      key: 'meta',
      status: metaConnections > 0 ? 'healthy' : 'degraded',
      lastChecked: nowIso(),
      metadata: { activeConnections: metaConnections },
    });

    const overallLastChecked = nowIso();

    await Promise.all(services.map((service) => supabaseAdmin
      .from('integration_status')
      .upsert({
        service: service.key,
        status: service.status,
        response_time_ms: service.responseTime ?? null,
        last_checked: service.lastChecked,
        error_message: service.errorMessage ?? null,
        metadata: service.metadata ?? {},
      }, { onConflict: 'service' })
    ));

    return new Response(
      JSON.stringify({
        lastChecked: overallLastChecked,
        integrations: services,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in checkIntegrationStatus:', error);
    return new Response(
      JSON.stringify({ integrations: [], error: 'Failed to check integration status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
