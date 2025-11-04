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

    const { contacts, callType, agentData, campaignName } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('Contacts array is required');
    }

    // Check if agent is configured
    const { data: agentConfig, error: configError } = await supabaseClient
      .from('agent_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_type', 'sales_agent')
      .single();

    if (configError || !agentConfig || !agentConfig.eleven_labs_agent_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          requiresOnboarding: true,
          error: 'Please complete AI Sales Agent onboarding first'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    // Create campaign record
    const { data: campaignData, error: campaignError } = await supabaseClient
      .from('call_campaigns')
      .insert({
        user_id: user.id,
        campaign_name: campaignName,
        call_type: callType,
        total_contacts: contacts.length,
        status: 'active'
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Failed to create campaign:', campaignError);
    }

    // Queue calls with ElevenLabs
    const callPromises = contacts.map(async (contact: any) => {
      try {
        // Create call record
        await supabaseClient
          .from('call_logs')
          .insert({
            user_id: user.id,
            contact_name: contact.name,
            phone_number: contact.phone,
            call_type: callType,
            status: 'queued',
            metadata: {
              campaign_id: campaignData?.id,
              campaign_name: campaignName,
              email: contact.email,
              notes: contact.notes
            }
          });

        // Initiate call via ElevenLabs Conversational AI
        // Note: This requires ElevenLabs phone integration setup
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentConfig.eleven_labs_agent_id}/calls`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: contact.phone,
            from_number: agentData?.agent_phone || agentConfig.settings?.twilio_phone_number,
            metadata: {
              contact_name: contact.name,
              call_type: callType,
              user_id: user.id
            }
          })
        });

        if (!response.ok) {
          console.error(`Failed to initiate call for ${contact.name}:`, await response.text());
          return { success: false, contact: contact.name };
        }

        return { success: true, contact: contact.name };
      } catch (error) {
        console.error(`Error queuing call for ${contact.name}:`, error);
        return { success: false, contact: contact.name };
      }
    });

    const results = await Promise.all(callPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        campaignId: campaignData?.id,
        totalContacts: contacts.length,
        successCount,
        failureCount: contacts.length - successCount,
        message: `Campaign initiated: ${successCount}/${contacts.length} calls queued`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sendContactsToElevenLabs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
