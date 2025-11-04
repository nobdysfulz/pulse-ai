import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get referral
    const { data: referral, error: referralError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (referralError) throw referralError;

    // Check if referred user signed up
    if (referral.referred_user_id && !referral.reward_granted) {
      // Grant reward (5 credits per referral)
      const { data: credits } = await supabaseClient
        .from('user_credits')
        .select('credits_available')
        .eq('user_id', referral.referrer_user_id)
        .single();

      const newBalance = (credits?.credits_available || 0) + 5;

      await supabaseClient
        .from('user_credits')
        .update({ credits_available: newBalance })
        .eq('user_id', referral.referrer_user_id);

      // Log transaction
      await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: referral.referrer_user_id,
          amount: 5,
          transaction_type: 'earned',
          description: 'Referral reward',
          balance_after: newBalance,
          metadata: { referral_id: referralId }
        });

      // Update referral status
      await supabaseClient
        .from('referrals')
        .update({
          status: 'completed',
          reward_granted: true,
          credits_awarded: 5
        })
        .eq('id', referralId);

      return new Response(
        JSON.stringify({ success: true, creditsAwarded: 5 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, creditsAwarded: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in processReferral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
