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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    // Purchase the phone number from Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
    
    const formData = new URLSearchParams();
    formData.append('PhoneNumber', phoneNumber);
    formData.append('VoiceUrl', `${Deno.env.get('SUPABASE_URL')}/functions/v1/handleTwilioCall`);
    formData.append('SmsUrl', `${Deno.env.get('SUPABASE_URL')}/functions/v1/handleTwilioSms`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', response.status, errorText);
      throw new Error(`Failed to purchase phone number: ${response.status}`);
    }

    const data = await response.json();

    // Store the phone number in agent_config
    const { error: updateError } = await supabaseClient
      .from('agent_config')
      .update({ 
        settings: { twilio_phone_number: data.phone_number, twilio_sid: data.sid }
      })
      .eq('user_id', user.id)
      .eq('agent_type', 'sales_agent');

    if (updateError) {
      console.error('Failed to save phone number to config:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        phoneNumber: data.phone_number,
        sid: data.sid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in purchaseTwilioNumber:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
