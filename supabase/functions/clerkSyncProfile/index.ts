import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { createClerkClient } from 'https://esm.sh/@clerk/backend@1.15.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY')!;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Get Clerk token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    // Initialize Clerk client
    const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    // Verify token and get user ID
    let userId: string;
    try {
      const verifiedToken = await clerkClient.verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
      });
      userId = verifiedToken.sub;
    } catch (error) {
      console.error('[clerkSyncProfile] Token verification failed:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

    console.log('[clerkSyncProfile] Syncing user:', {
      userId,
      email,
      fullName,
    });

    // Create Supabase admin client (service role)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Upsert profile using service role (bypasses RLS)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          avatar_url: clerkUser.imageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[clerkSyncProfile] Profile upsert error:', profileError);
      throw profileError;
    }

    console.log('[clerkSyncProfile] ✓ Profile synced successfully');

    // Try to create onboarding record (only if user_onboarding.user_id is text)
    // Skip if it fails due to type mismatch (we'll handle this separately)
    try {
      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert(
          {
            user_id: userId,
            onboarding_completed: false,
            agent_onboarding_completed: false,
            call_center_onboarding_completed: false,
          },
          { onConflict: 'user_id' }
        );

      if (onboardingError && onboardingError.code !== '23505') {
        console.warn('[clerkSyncProfile] Onboarding upsert warning:', onboardingError);
      } else {
        console.log('[clerkSyncProfile] ✓ Onboarding record synced');
      }
    } catch (onboardingErr) {
      console.warn('[clerkSyncProfile] Onboarding sync skipped:', onboardingErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId,
        email,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[clerkSyncProfile] Error:', error);
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
