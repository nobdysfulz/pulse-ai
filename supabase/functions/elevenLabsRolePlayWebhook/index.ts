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
  metadata?: Record<string, unknown> & { call_duration_secs?: number };
  transcript?: unknown;
  full_audio?: string;
  data?: Record<string, unknown>;
};

type SessionLog = {
  id: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceRoleKey) {
    console.error('[elevenLabsRolePlayWebhook] Missing service role key');
    return new Response('Service misconfigured', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const payload = await req.json() as WebhookPayload;
    const eventType = payload.event_type || payload.type;
    const conversationId = payload.conversation_id || (payload.data?.conversation_id as string | undefined);
    const callSid = payload.call_sid || (payload.data?.callSid as string | undefined);

    console.log('[elevenLabsRolePlayWebhook] Incoming event', { eventType, conversationId, callSid });

    if (!eventType || !conversationId) {
      console.warn('[elevenLabsRolePlayWebhook] Missing event type or conversation id');
      return new Response(JSON.stringify({ success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: sessionLog } = await supabaseAdmin
      .from('role_play_session_logs')
      .select('id, user_id, metadata, status')
      .eq('conversation_id', conversationId)
      .maybeSingle<SessionLog & { status?: string | null }>();

    if (!sessionLog) {
      console.warn('[elevenLabsRolePlayWebhook] Session log not found for conversation', conversationId);
    }

    switch (eventType) {
      case 'conversation_initiation_metadata': {
        if (sessionLog) {
          await supabaseAdmin
            .from('role_play_session_logs')
            .update({
              metadata: mergeMetadata(sessionLog.metadata, { initiation: payload.data || payload.metadata || {} }),
              call_sid: callSid ?? sessionLog.metadata?.call_sid ?? null,
            })
            .eq('id', sessionLog.id);
        }
        break;
      }
      case 'post_call_transcription': {
        if (!sessionLog) break;

        const transcript = payload.transcript ?? (payload.data?.transcript as unknown) ?? [];
        const durationSeconds = payload.metadata?.call_duration_secs
          ?? (payload.data?.metadata as { call_duration_secs?: number } | undefined)?.call_duration_secs
          ?? 0;
        const durationMinutes = durationSeconds > 0 ? Math.max(1, Math.ceil(durationSeconds / 60)) : 0;

        await supabaseAdmin
          .from('role_play_session_logs')
          .update({
            status: 'completed',
            session_duration_seconds: durationSeconds,
            transcript,
            ended_at: new Date().toISOString(),
            metadata: mergeMetadata(sessionLog.metadata, {
              conversation_summary: payload.metadata || payload.data?.metadata || {},
            })
          })
          .eq('id', sessionLog.id);

        if (durationMinutes > 0) {
          const { data: credits } = await supabaseAdmin
            .from('user_credits')
            .select('id, credits_available, credits_used')
            .eq('user_id', sessionLog.user_id)
            .maybeSingle<{ id: string; credits_available: number | null; credits_used: number | null }>();

          if (credits) {
            const remaining = Math.max(0, (credits.credits_available ?? 0) - durationMinutes);
            const used = (credits.credits_used ?? 0) + durationMinutes;
            await supabaseAdmin
              .from('user_credits')
              .update({ credits_available: remaining, credits_used: used })
              .eq('id', credits.id);

            await supabaseAdmin
              .from('credit_transactions')
              .insert({
                user_id: sessionLog.user_id,
                transaction_type: 'debit',
                amount: durationMinutes,
                balance_after: remaining,
                description: `Role-play session ${sessionLog.id} (${durationMinutes} minutes)`,
                metadata: { conversation_id: conversationId }
              });
          }
        }

        try {
          await fetch(`${supabaseUrl}/functions/v1/analyzeRolePlaySession`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: sessionLog.id })
          });
        } catch (analysisError) {
          console.error('[elevenLabsRolePlayWebhook] Failed to trigger analysis', analysisError);
        }
        break;
      }
      case 'post_call_audio': {
        if (!sessionLog) break;
        const audioBase64 = payload.full_audio || (payload.data?.full_audio as string | undefined);
        if (!audioBase64) break;

        const audioBytes = base64ToUint8Array(audioBase64);
        const path = `${sessionLog.user_id}/role-play/${sessionLog.id}.mp3`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('audio-recordings')
          .upload(path, audioBytes, { contentType: 'audio/mpeg', upsert: true });

        if (uploadError) {
          console.error('[elevenLabsRolePlayWebhook] Failed to upload audio', uploadError);
        } else {
          await supabaseAdmin
            .from('role_play_session_logs')
            .update({ recording_url: path })
            .eq('id', sessionLog.id);
        }
        break;
      }
      default:
        console.log('[elevenLabsRolePlayWebhook] Unhandled event type', eventType);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[elevenLabsRolePlayWebhook] Error:', error);
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
