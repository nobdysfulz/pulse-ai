import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type WebhookPayload = {
  event_type?: string;
  type?: string;
  conversation_id?: string;
  call_sid?: string;
  metadata?: Record<string, unknown> & { call_duration_secs?: number; appointment_set?: boolean; analysis?: unknown; startTime?: string; address?: string };
  transcript?: unknown;
  full_audio?: string;
  data?: Record<string, unknown>;
};

type CallLogRecord = {
  id: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
  form_data: Record<string, unknown> | null;
  contact_name: string | null;
  phone_number: string | null;
};

function mergeMetadata(existing: Record<string, unknown> | null, updates: Record<string, unknown>) {
  return { ...(existing || {}), ...updates };
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function safeGet<T>(obj: Record<string, unknown> | null | undefined, key: string): T | undefined {
  if (!obj) return undefined;
  const value = obj[key];
  return value as T | undefined;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey) {
    return new Response('Service misconfigured', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const payload = await req.json() as WebhookPayload;
    const eventType = payload.event_type || payload.type;
    const conversationId = payload.conversation_id || (payload.data?.conversation_id as string | undefined);
    const callSid = payload.call_sid || (payload.data?.callSid as string | undefined);

    console.log('[elevenLabsWebhook] Received event', { eventType, conversationId, callSid });

    if (!eventType || !conversationId) {
      return new Response(JSON.stringify({ success: false, reason: 'Missing identifiers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: callLog } = await supabaseAdmin
      .from('call_logs')
      .select('id, user_id, metadata, form_data, contact_name, phone_number, status')
      .eq('conversation_id', conversationId)
      .maybeSingle<CallLogRecord & { status?: string | null }>();

    if (!callLog) {
      console.warn('[elevenLabsWebhook] Call log not found for conversation', conversationId);
    }

    switch (eventType) {
      case 'conversation_initiation_metadata': {
        if (callLog) {
          await supabaseAdmin
            .from('call_logs')
            .update({
              metadata: mergeMetadata(callLog.metadata, { initiation: payload.data || payload.metadata || {} }),
              call_sid: callSid ?? null,
              status: callLog.status && callLog.status !== 'pending_initiation' ? callLog.status : 'initiated',
            })
            .eq('id', callLog.id);
        }
        break;
      }
      case 'conversation_update': {
        if (callLog) {
          await supabaseAdmin
            .from('call_logs')
            .update({
              metadata: mergeMetadata(callLog.metadata, { updates: payload.data || payload.metadata || {} })
            })
            .eq('id', callLog.id);
        }
        break;
      }
      case 'post_call_transcription': {
        if (!callLog) break;

        const transcript = payload.transcript ?? (payload.data?.transcript as unknown) ?? [];
        const meta = payload.metadata || (payload.data?.metadata as Record<string, unknown> | undefined) || {};
        const durationSeconds = (meta.call_duration_secs as number | undefined) ?? 0;
        const durationMinutes = durationSeconds > 0 ? Math.max(1, Math.ceil(durationSeconds / 60)) : 0;
        const appointmentSet = meta.appointment_set === true;
        const analysis = meta.analysis ?? safeGet(callLog.metadata, 'analysis');

        const callUpdates = {
          status: appointmentSet ? 'appointment_set' : 'completed',
          transcript,
          duration_seconds: durationSeconds,
          ended_at: new Date().toISOString(),
          analysis,
          metadata: mergeMetadata(callLog.metadata, meta),
        };

        await supabaseAdmin
          .from('call_logs')
          .update(callUpdates)
          .eq('id', callLog.id);

        if (durationMinutes > 0) {
          const { data: subscription } = await supabaseAdmin
            .from('user_agent_subscriptions')
            .select('id, current_minutes_used')
            .eq('user_id', callLog.user_id)
            .eq('agent_type', 'sales_agent')
            .maybeSingle<{ id: string; current_minutes_used: number | null }>();

          if (subscription) {
            await supabaseAdmin
              .from('user_agent_subscriptions')
              .update({
                current_minutes_used: (subscription.current_minutes_used ?? 0) + durationMinutes,
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
          }
        }

        if (appointmentSet && callLog.form_data) {
          const startTime = (meta.startTime as string | undefined) || (meta.start_time as string | undefined);
          if (startTime) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/scheduleGoogleCalendarEventTool`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: callLog.user_id,
                  title: `Buyer Consultation with ${callLog.contact_name || safeGet<string>(callLog.form_data, 'full_name') || 'Prospect'}`,
                  description: 'Scheduled automatically from Phoenix AI calling agent.',
                  location: (meta.address as string | undefined) || safeGet<string>(callLog.form_data, 'address') || undefined,
                  startTime,
                  endTime: new Date(new Date(startTime).getTime() + 45 * 60000).toISOString(),
                  attendees: safeGet<string>(callLog.form_data, 'email') || undefined,
                })
              });
            } catch (calendarError) {
              console.error('[elevenLabsWebhook] Calendar scheduling failed', calendarError);
            }
          }
        }

        // CRM Sync
        try {
          const { data: connections } = await supabaseAdmin
            .from('crm_connections')
            .select('provider, credentials, sync_settings')
            .eq('user_id', callLog.user_id)
            .eq('connection_status', 'connected');

          if (connections && connections.length > 0) {
            for (const connection of connections) {
              const syncSettings = connection.sync_settings as { syncCallLogs?: boolean } | null;
              if (!syncSettings?.syncCallLogs) continue;

              const payloadBody = {
                contact_name: callLog.contact_name,
                phone_number: callLog.phone_number,
                status: callUpdates.status,
                duration_seconds: durationSeconds,
                transcript,
                appointment_set: appointmentSet,
                appointment_time: meta.startTime ?? meta.start_time ?? null,
                notes: meta.notes ?? null,
                metadata: meta,
              };

              try {
                if (connection.provider === 'lofty') {
                  const apiKey = connection.credentials?.api_key as string | undefined;
                  if (!apiKey) continue;
                  const crmResponse = await fetch('https://api.lofty.com/v1/calls', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payloadBody)
                  });
                  if (!crmResponse.ok) {
                    console.error('[elevenLabsWebhook] Lofty sync failed', crmResponse.status, await crmResponse.text());
                  }
                } else if (connection.provider === 'follow_up_boss') {
                  const apiKey = connection.credentials?.api_key as string | undefined;
                  if (!apiKey) continue;
                  const crmResponse = await fetch('https://api.followupboss.com/v1/events', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Basic ${btoa(`${apiKey}:x`)}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      type: 'call',
                      eventDate: new Date().toISOString(),
                      description: `Call with ${callLog.contact_name} (${callUpdates.status})`,
                      data: payloadBody
                    })
                  });
                  if (!crmResponse.ok) {
                    console.error('[elevenLabsWebhook] Follow Up Boss sync failed', crmResponse.status, await crmResponse.text());
                  }
                }
              } catch (crmError) {
                console.error('[elevenLabsWebhook] CRM sync error', crmError);
              }
            }
          }
        } catch (syncError) {
          console.error('[elevenLabsWebhook] Failed to process CRM sync', syncError);
        }

        break;
      }
      case 'post_call_audio': {
        if (!callLog) break;
        const audioBase64 = payload.full_audio || (payload.data?.full_audio as string | undefined);
        if (!audioBase64) break;

        const audioBytes = base64ToUint8Array(audioBase64);
        const path = `${callLog.user_id}/calls/${callLog.id}.mp3`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('audio-recordings')
          .upload(path, audioBytes, { contentType: 'audio/mpeg', upsert: true });

        if (uploadError) {
          console.error('[elevenLabsWebhook] Failed to upload call audio', uploadError);
        } else {
          await supabaseAdmin
            .from('call_logs')
            .update({ recording_url: path })
            .eq('id', callLog.id);
        }
        break;
      }
      default:
        console.log('[elevenLabsWebhook] Unhandled event type', eventType);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[elevenLabsWebhook] Error:', error);
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
