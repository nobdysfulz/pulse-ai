export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

function createSupabaseClientFactory(deps) {
  let cachedClient;
  return () => {
    if (!cachedClient) {
      const supabaseUrl = deps.getEnv('SUPABASE_URL');
      const serviceRoleKey = deps.getEnv('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration');
      }

      cachedClient = deps.createSupabaseClient(supabaseUrl, serviceRoleKey);
    }

    return cachedClient;
  };
}

function getLogger(deps) {
  return deps.logger ?? console;
}

export function createClerkWebhookHandler(deps) {
  if (!deps || typeof deps.getEnv !== 'function' || typeof deps.createSupabaseClient !== 'function') {
    throw new Error('createClerkWebhookHandler requires getEnv and createSupabaseClient dependencies');
  }

  if (typeof deps.createWebhook !== 'function') {
    throw new Error('createClerkWebhookHandler requires a createWebhook dependency');
  }

  const logger = getLogger(deps);
  const buildSupabaseClient = createSupabaseClientFactory(deps);

  return async function handler(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const webhookSecret = deps.getEnv('CLERK_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Missing CLERK_WEBHOOK_SECRET');
      }

      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      const svixSignature = req.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response(
          JSON.stringify({ error: 'Missing svix headers' }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const payload = await req.text();
      let event;

      try {
        const webhook = deps.createWebhook(webhookSecret);
        event = webhook.verify(payload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (verificationError) {
        if (logger && typeof logger.error === 'function') {
          logger.error('Error verifying webhook:', verificationError);
        }

        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: jsonHeaders }
        );
      }

      if (event && (event.type === 'user.created' || event.type === 'user.updated')) {
        const supabaseClient = buildSupabaseClient();
        const data = event.data ?? {};
        const emailAddresses = Array.isArray(data.email_addresses) ? data.email_addresses : [];
        const primaryEmail = emailAddresses.find((entry) => entry && entry.id === data.primary_email_address_id);
        const email = primaryEmail ? primaryEmail.email_address : null;
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || null;

        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert(
            {
              id: data.id,
              email,
              full_name: fullName,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          if (logger && typeof logger.error === 'function') {
            logger.error('Error upserting profile:', profileError);
          }
          throw profileError;
        }

        // Create onboarding record for new users
        if (event.type === 'user.created') {
          const { error: onboardingError } = await supabaseClient
            .from('user_onboarding')
            .insert({
              user_id: data.id,
              onboarding_completed: false,
              agent_onboarding_completed: false,
              call_center_onboarding_completed: false,
            });

          if (onboardingError && onboardingError.code !== '23505') {
            if (logger && typeof logger.error === 'function') {
              logger.error('Error creating onboarding record:', onboardingError);
            }
          }
        }

        if (logger && typeof logger.log === 'function') {
          logger.log(`Successfully synced user ${data.id}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: jsonHeaders }
      );
    } catch (error) {
      if (logger && typeof logger.error === 'function') {
        logger.error('Error in clerkWebhook:', error);
      }
      const message = error && typeof error.message === 'string' ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: jsonHeaders }
      );
    }
  };
}
