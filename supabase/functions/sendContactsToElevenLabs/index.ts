import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AgentConfig = {
  eleven_labs_agent_id?: string | null;
  eleven_labs_phone_number_id?: string | null;
  eleven_labs_voice_id?: string | null;
  settings?: { twilio_phone_number?: string | null } | null;
};

type Contact = Record<string, unknown> & {
  phone?: string;
  phone_number?: string;
  contact_phone?: string;
};

type AgentData = {
  agent_name?: string;
  agent_last_name?: string;
  agent_full_name?: string;
  brokerage?: string;
  area?: string;
  agent_phone?: string;
};

function normalizePhoneNumber(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

function pickContactName(contact: Contact): string {
  const first = (contact.firstName || contact.first_name || contact.first || contact.firstname) as string | undefined;
  const last = (contact.lastName || contact.last_name || contact.last || contact.lastname) as string | undefined;
  const full = (contact.fullName || contact.full_name || contact.name) as string | undefined;
  if (full && full.trim().length > 0) return full.trim();
  const parts = [first, last].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(' ').trim();
  return 'Prospect';
}

function buildDynamicVariables(
  contact: Contact,
  callType: string,
  agentData: AgentData,
  callLogId: string,
  user: { id: string; email?: string | null },
  campaignName?: string
) {
  const nowIso = new Date().toISOString();
  const common = {
    call_log_id: callLogId,
    user_id: user.id,
    user_email: user.email,
    agent_full_name: agentData.agent_full_name || `${agentData.agent_name ?? ''} ${agentData.agent_last_name ?? ''}`.trim() || undefined,
    agent_phone_number: agentData.agent_phone,
    brokerage: agentData.brokerage,
    primary_market: agentData.area,
    contact_name: pickContactName(contact),
    contact_phone: contact.phone || contact.phone_number || contact.contact_phone,
    call_type: callType,
    campaign_name: campaignName,
    triggered_at: nowIso,
    form_data: contact,
  };

  const enriched: Record<string, unknown> = { ...common };

  const address = (contact.address || contact.property_address || contact.propertyAddress) as string | undefined;
  const leadSource = (contact.lead_source || contact.source || contact.leadSource) as string | undefined;
  const meetingLocation = (contact.meeting_location || contact.meetingLocation) as string | undefined;

  if (address) {
    enriched.property_address = address;
  }
  if (leadSource) {
    enriched.lead_source = leadSource;
  }
  if (meetingLocation) {
    enriched.meeting_location = meetingLocation;
  }

  if (/seller/i.test(callType)) {
    enriched.call_focus = 'seller_lead';
  } else if (/buyer/i.test(callType)) {
    enriched.call_focus = 'buyer_lead';
  } else if (/expired/i.test(callType)) {
    enriched.call_focus = 'expired_listing';
  } else if (/fsbo/i.test(callType) || /for sale by owner/i.test(callType)) {
    enriched.call_focus = 'for_sale_by_owner';
  }

  return enriched;
}

function selectAgentId(callType: string, config: AgentConfig): string | null {
  if (/buyer/i.test(callType) && Deno.env.get('ELEVEN_LABS_BUYER_AGENT_ID')) {
    return Deno.env.get('ELEVEN_LABS_BUYER_AGENT_ID')!;
  }
  if (/seller/i.test(callType) && Deno.env.get('ELEVEN_LABS_SELLER_AGENT_ID')) {
    return Deno.env.get('ELEVEN_LABS_SELLER_AGENT_ID')!;
  }
  if (config.eleven_labs_agent_id) {
    return config.eleven_labs_agent_id;
  }
  return Deno.env.get('ELEVEN_LABS_DEFAULT_AGENT_ID') ?? null;
}

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

    const { contacts, callType, agentData = {}, campaignName } = await req.json() as {
      contacts: Contact[];
      callType: string;
      agentData?: AgentData;
      campaignName?: string;
    };

    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('Contacts array is required');
    }

    if (!callType) {
      throw new Error('callType is required');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    const { data: agentConfig, error: configError } = await supabaseClient
      .from('agent_config')
      .select('eleven_labs_agent_id, eleven_labs_phone_number_id, eleven_labs_voice_id, settings')
      .eq('user_id', user.id)
      .eq('agent_type', 'sales_agent')
      .maybeSingle<AgentConfig>();

    if (configError || !agentConfig || !agentConfig.eleven_labs_phone_number_id) {
      return new Response(
        JSON.stringify({
          success: false,
          requiresOnboarding: true,
          error: 'Please complete AI Sales Agent onboarding first',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agentId = selectAgentId(callType, agentConfig);
    if (!agentId) {
      throw new Error('No ElevenLabs agent configured for this call type');
    }

    const { data: campaignData, error: campaignError } = await supabaseClient
      .from('call_campaigns')
      .insert({
        user_id: user.id,
        campaign_name: campaignName,
        call_type: callType,
        total_contacts: contacts.length,
        status: 'active'
      })
      .select('id')
      .maybeSingle<{ id: string }>();

    if (campaignError) {
      console.warn('[sendContactsToElevenLabs] Failed to create campaign', campaignError);
    }

    const results = [] as { success: boolean; contact: string; error?: string }[];

    for (const contact of contacts) {
      const normalizedPhone = normalizePhoneNumber(contact.phone || contact.phone_number || contact.contact_phone);
      if (!normalizedPhone) {
        results.push({ success: false, contact: pickContactName(contact), error: 'Invalid phone number' });
        continue;
      }

      const dynamicVariables = buildDynamicVariables(contact, callType, agentData, 'pending', user, campaignName);

      const { data: callLog, error: callLogError } = await supabaseClient
        .from('call_logs')
        .insert({
          user_id: user.id,
          call_type: callType,
          contact_name: pickContactName(contact),
          phone_number: normalizedPhone,
          status: 'pending_initiation',
          form_data: contact,
          metadata: {
            campaign_id: campaignData?.id ?? null,
            campaign_name: campaignName,
            dynamic_variables: dynamicVariables,
          }
        })
        .select('id')
        .single<{ id: string }>();

      if (callLogError || !callLog) {
        results.push({ success: false, contact: pickContactName(contact), error: 'Failed to create call log' });
        continue;
      }

      dynamicVariables.call_log_id = callLog.id;
      dynamicVariables.contact_phone = normalizedPhone;

      const payload = {
        agent_phone_number_id: agentConfig.eleven_labs_phone_number_id,
        to_number: normalizedPhone,
        agent_id: agentId,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVariables,
          contextual_data: {
            voice_id: agentConfig.eleven_labs_voice_id ?? undefined,
            agent_phone_number: agentData.agent_phone || agentConfig.settings?.twilio_phone_number
          }
        }
      };

      try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[sendContactsToElevenLabs] ElevenLabs error', response.status, errorText);
          await supabaseClient
            .from('call_logs')
            .update({ status: 'failed', metadata: { error: errorText } })
            .eq('id', callLog.id);

          results.push({ success: false, contact: pickContactName(contact), error: 'ElevenLabs API error' });
          continue;
        }

        const data = await response.json();
        await supabaseClient
          .from('call_logs')
          .update({
            status: 'initiated',
            conversation_id: data.conversation_id ?? null,
            call_sid: data.callSid ?? null,
            metadata: {
              ...payload.conversation_initiation_client_data,
              campaign_id: campaignData?.id ?? null,
              campaign_name: campaignName
            }
          })
          .eq('id', callLog.id);

        results.push({ success: true, contact: pickContactName(contact) });
      } catch (error) {
        console.error('[sendContactsToElevenLabs] Error initiating call', error);
        await supabaseClient
          .from('call_logs')
          .update({ status: 'failed', metadata: { error: String(error) } })
          .eq('id', callLog.id);
        results.push({ success: false, contact: pickContactName(contact), error: 'Network error' });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaignData?.id ?? null,
        totalContacts: contacts.length,
        successCount,
        failureCount: contacts.length - successCount,
        results,
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
