import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from "https://esm.sh/svix@1.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    // Get webhook headers
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(
        JSON.stringify({ error: 'Missing svix headers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.text();
    const body = JSON.parse(payload);

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt;
    
    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventType = evt.type;
    console.log(`Webhook event type: ${eventType}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      
      const primaryEmail = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id);
      const email = primaryEmail?.email_address;

      // Upsert profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          id,
          email,
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          avatar_url: image_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
        throw profileError;
      }

      // Initialize user_onboarding record if new user
      if (eventType === 'user.created') {
        const { error: onboardingError } = await supabaseClient
          .from('user_onboarding')
          .insert({
            user_id: id,
            onboarding_completed: false,
            agent_onboarding_completed: false,
            call_center_onboarding_completed: false,
          });

        if (onboardingError && onboardingError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating onboarding record:', onboardingError);
        }
      }

      console.log(`Successfully synced user ${id}`);
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      // Delete user data (cascading deletes will handle related records)
      const { error: deleteError } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted user ${id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in clerkWebhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
