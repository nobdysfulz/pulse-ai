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

    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
    if (!clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY not configured');
    }

    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${clerkSecretKey}` },
    });

    if (!userResponse.ok) {
      throw new Error(`Clerk API error: ${userResponse.status}`);
    }

    const clerkUser = await userResponse.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: clerkUser.email_addresses?.[0]?.email_address,
        full_name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim(),
        avatar_url: clerkUser.image_url,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    await supabase
      .from('user_onboarding')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
      .then(() => {});

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in clerkSyncProfile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
