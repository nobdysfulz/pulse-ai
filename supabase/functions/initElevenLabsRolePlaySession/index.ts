import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ScenarioRecord = {
  id: string;
  name: string;
  description?: string;
  client_persona?: string;
  initial_context?: string;
  first_message_override?: string | null;
  eleven_labs_agent_id?: string | null;
  eleven_labs_phone_number_id?: string | null;
  eleven_labs_voice_id?: string | null;
  average_duration_minutes?: number | null;
  metadata?: Record<string, unknown> | null;
};

type AgentConfigRecord = {
  eleven_labs_agent_id?: string | null;
  eleven_labs_phone_number_id?: string | null;
  eleven_labs_voice_id?: string | null;
  settings?: { twilio_phone_number?: string | null } | null;
};

function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

function filterUndefined<T extends Record<string, unknown>>(input: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as T;
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

    const { scenarioId } = await req.json();
    if (!scenarioId) {
      throw new Error('scenarioId is required');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY not configured');
    }

    const { data: scenario, error: scenarioError } = await supabaseClient
      .from('role_play_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .maybeSingle<ScenarioRecord>();

    if (scenarioError || !scenario) {
      throw new Error('Unable to load role-play scenario');
    }

    const { data: agentConfig } = await supabaseClient
      .from('agent_config')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_type', 'sales_agent')
      .maybeSingle<AgentConfigRecord>();

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle<{ full_name?: string | null; phone?: string | null }>();

    if (profileError) {
      throw new Error('Unable to load user profile');
    }

    const normalizedPhone = normalizePhoneNumber(profile?.phone ?? user.phone ?? user.user_metadata?.phone);
    if (!normalizedPhone) {
      throw new Error('Please add a valid phone number in your profile before starting a session.');
    }

    // Validate credits for free users
    const { data: creditRecord } = await supabaseClient
      .from('user_credits')
      .select('credits_available')
      .eq('user_id', user.id)
      .maybeSingle<{ credits_available?: number | null }>();

    if (creditRecord && typeof creditRecord.credits_available === 'number' && creditRecord.credits_available < 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient credits to start a session.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionInsert = {
      user_id: user.id,
      scenario_id: scenario.id,
      status: 'pending_initiation',
      metadata: filterUndefined({
        scenario_name: scenario.name,
        client_persona: scenario.client_persona,
        initial_context: scenario.initial_context,
      })
    };

    const { data: sessionLog, error: sessionError } = await supabaseClient
      .from('role_play_session_logs')
      .insert(sessionInsert)
      .select('*')
      .single();

    if (sessionError || !sessionLog) {
      throw new Error('Failed to create session log');
    }

    const agentPhoneNumberId = scenario.eleven_labs_phone_number_id || agentConfig?.eleven_labs_phone_number_id;
    if (!agentPhoneNumberId) {
      throw new Error('No ElevenLabs phone number configured for this scenario');
    }

    const agentId = scenario.eleven_labs_agent_id || agentConfig?.eleven_labs_agent_id || Deno.env.get('ELEVEN_LABS_DEFAULT_AGENT_ID');
    if (!agentId) {
      throw new Error('No ElevenLabs agent configured');
    }

    const voiceId = scenario.eleven_labs_voice_id || agentConfig?.eleven_labs_voice_id || Deno.env.get('ELEVEN_LABS_DEFAULT_VOICE_ID');

    const dynamicVariables = filterUndefined({
      user_id: user.id,
      user_email: user.email,
      session_id: sessionLog.id,
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      client_persona: scenario.client_persona,
      initial_context: scenario.initial_context,
      agent_full_name: profile?.full_name || user.user_metadata?.full_name,
      started_at: new Date().toISOString(),
    });

    const conversationOverride = {
      agent: filterUndefined({
        first_message: scenario.first_message_override ?? undefined,
        language: 'en'
      }),
      tts: filterUndefined({
        voice_id: voiceId ?? undefined
      })
    };

    const payload = {
      agent_phone_number_id: agentPhoneNumberId,
      to_number: normalizedPhone,
      agent_id: agentId,
      conversation_initiation_client_data: {
        dynamic_variables: dynamicVariables,
        conversation_config_override: conversationOverride
      }
    };

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
      console.error('[initElevenLabsRolePlaySession] ElevenLabs error:', response.status, errorText);
      await supabaseClient
        .from('role_play_session_logs')
        .update({ status: 'failed', metadata: { ...sessionLog.metadata, last_error: errorText } })
        .eq('id', sessionLog.id);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const updatedMetadata = {
      ...sessionLog.metadata,
      dynamic_variables: dynamicVariables,
      conversation_override: conversationOverride,
    };

    await supabaseClient
      .from('role_play_session_logs')
      .update({
        status: 'initiated',
        conversation_id: data.conversation_id ?? null,
        call_sid: data.callSid ?? null,
        metadata: updatedMetadata
      })
      .eq('id', sessionLog.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: sessionLog.id,
        conversationId: data.conversation_id ?? null,
        callSid: data.callSid ?? null,
        message: 'Role-play session initiated. Expect an incoming call shortly.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[initElevenLabsRolePlaySession] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
