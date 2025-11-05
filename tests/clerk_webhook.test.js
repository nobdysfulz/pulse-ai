import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClerkWebhookHandler, corsHeaders } from '../supabase/functions/clerkWebhook/handler.js';

const defaultEvent = {
  type: 'user.created',
  data: {
    id: 'user_123',
    first_name: 'Test',
    last_name: 'User',
    primary_email_address_id: 'email_1',
    email_addresses: [
      { id: 'email_1', email_address: 'user@example.com' },
      { id: 'email_2', email_address: 'alt@example.com' },
    ],
  },
};

function createLogger() {
  const entries = [];
  return {
    entries,
    log: (...args) => entries.push({ level: 'log', args }),
    error: (...args) => entries.push({ level: 'error', args }),
  };
}

function setupHandler(overrides = {}) {
  const defaultEnv = {
    CLERK_WEBHOOK_SECRET: 'secret',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  };

  const env = new Map(Object.entries(defaultEnv));
  if (overrides.env) {
    for (const [key, value] of Object.entries(overrides.env)) {
      if (value === undefined) {
        env.delete(key);
      } else {
        env.set(key, value);
      }
    }
  }

  const supabaseCalls = [];
  const supabaseClient = {
    from(table) {
      return {
        async upsert(values, options) {
          supabaseCalls.push({ table, values, options });
          if (overrides.upsertResult) {
            return overrides.upsertResult;
          }
          return { error: null };
        },
      };
    },
  };

  const supabaseFactoryCalls = [];
  const webhookSecretCalls = [];
  const verifyCalls = [];
  const logger = overrides.logger ?? createLogger();

  const deps = {
    getEnv: (key) => env.get(key),
    createSupabaseClient: (url, key) => {
      supabaseFactoryCalls.push({ url, key });
      if (overrides.supabaseFactory) {
        return overrides.supabaseFactory(url, key);
      }
      return supabaseClient;
    },
    createWebhook: (secret) => {
      webhookSecretCalls.push(secret);
      if (overrides.createWebhook) {
        return overrides.createWebhook(secret);
      }
      return {
        verify: (payload, headers) => {
          verifyCalls.push({ payload, headers });
          if (overrides.verify) {
            return overrides.verify(payload, headers);
          }
          return overrides.event ?? defaultEvent;
        },
      };
    },
    logger,
  };

  const handler = createClerkWebhookHandler(deps);

  return {
    handler,
    supabaseCalls,
    supabaseFactoryCalls,
    verifyCalls,
    webhookSecretCalls,
    logger,
  };
}

function buildRequest(eventPayload, headers = {}) {
  const baseHeaders = {
    'content-type': 'application/json',
    'svix-id': 'test-id',
    'svix-timestamp': '1234567890',
    'svix-signature': 'signature',
  };

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      delete baseHeaders[key];
    } else {
      baseHeaders[key] = value;
    }
  }

  return new Request('https://example.com/clerkWebhook', {
    method: 'POST',
    headers: baseHeaders,
    body: typeof eventPayload === 'string' ? eventPayload : JSON.stringify(eventPayload),
  });
}

describe('clerkWebhook handler', () => {
  it('upserts the profiles table when receiving a valid user event', async () => {
    const { handler, supabaseCalls, supabaseFactoryCalls, verifyCalls, webhookSecretCalls } = setupHandler();
    const payload = JSON.stringify(defaultEvent);
    const response = await handler(buildRequest(payload));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(supabaseFactoryCalls.length, 1);
    assert.equal(webhookSecretCalls[0], 'secret');
    assert.equal(verifyCalls.length, 1);
    assert.equal(verifyCalls[0].payload, payload);
    assert.deepEqual(verifyCalls[0].headers, {
      'svix-id': 'test-id',
      'svix-timestamp': '1234567890',
      'svix-signature': 'signature',
    });
    assert.equal(supabaseCalls.length, 1);
    const [{ table, values, options }] = supabaseCalls;
    assert.equal(table, 'profiles');
    assert.equal(values.id, defaultEvent.data.id);
    assert.equal(values.email, 'user@example.com');
    assert.equal(values.full_name, 'Test User');
    assert.ok(typeof values.updated_at === 'string');
    assert.deepEqual(options, { onConflict: 'id' });
  });

  it('returns a 400 error when svix headers are missing', async () => {
    const { handler, supabaseCalls } = setupHandler();
    const response = await handler(
      buildRequest(defaultEvent, { 'svix-id': undefined, 'svix-timestamp': undefined, 'svix-signature': undefined })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Missing svix headers' });
    assert.equal(supabaseCalls.length, 0);
  });

  it('rejects invalid signatures before touching Supabase', async () => {
    const { handler, supabaseCalls } = setupHandler({
      verify: () => {
        throw new Error('bad signature');
      },
    });

    const response = await handler(buildRequest(defaultEvent));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid signature' });
    assert.equal(supabaseCalls.length, 0);
  });

  it('propagates Supabase upsert errors as 500 responses', async () => {
    const { handler, logger } = setupHandler({
      upsertResult: { error: new Error('db failure') },
    });

    const response = await handler(buildRequest(defaultEvent));

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'db failure' });
    assert.ok(logger.entries.some((entry) => entry.level === 'error'));
  });

  it('fails fast when Supabase configuration is missing', async () => {
    const { handler } = setupHandler({
      env: { SUPABASE_URL: undefined },
    });

    const response = await handler(buildRequest(defaultEvent));

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Missing Supabase configuration' });
  });

  it('ignores non-user events but still responds successfully', async () => {
    const { handler, supabaseFactoryCalls } = setupHandler({
      event: { type: 'session.created', data: {} },
    });

    const response = await handler(buildRequest(defaultEvent));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(supabaseFactoryCalls.length, 0);
  });

  it('returns CORS headers on OPTIONS requests', async () => {
    const { handler } = setupHandler();
    const response = await handler(
      new Request('https://example.com/clerkWebhook', { method: 'OPTIONS' })
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), corsHeaders['Access-Control-Allow-Origin']);
  });
});
