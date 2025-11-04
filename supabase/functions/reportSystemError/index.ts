import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, createSupabaseAdmin, sendEmail, safeJson } from '../_shared/emailUtils.ts';

function normalizeMetadata(metadata: unknown) {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (_error) {
      return { raw: metadata };
    }
  }
  if (typeof metadata === 'object') return metadata as Record<string, unknown>;
  return { value: metadata };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    const {
      severity,
      functionName,
      message,
      stackTrace,
      userId,
      metadata,
    } = payload ?? {};

    if (!severity || !functionName || !message) {
      return new Response(
        JSON.stringify({ error: 'severity, functionName and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!['critical', 'warning', 'info'].includes(severity)) {
      return new Response(
        JSON.stringify({ error: 'Invalid severity level' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    const normalizedMetadata = normalizeMetadata(metadata);

    const { data: existing } = await supabase
      .from('system_errors')
      .select('*')
      .eq('function_name', functionName)
      .eq('message', message)
      .eq('severity', severity)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let record;

    if (existing) {
      const mergedMetadata = {
        ...(existing.metadata ?? {}),
        ...normalizedMetadata,
      };

      const { data, error } = await supabase
        .from('system_errors')
        .update({
          occurrence_count: (existing.occurrence_count ?? 1) + 1,
          last_occurrence_at: now,
          stack_trace: stackTrace ?? existing.stack_trace,
          metadata: mergedMetadata,
          user_id: userId ?? existing.user_id,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await supabase
        .from('system_errors')
        .insert({
          severity,
          function_name: functionName,
          message,
          stack_trace: stackTrace,
          user_id: userId ?? null,
          metadata: normalizedMetadata,
          last_occurrence_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      record = data;
    }

    if (severity === 'critical') {
      const adminEmail = Deno.env.get('ADMIN_ERROR_NOTIFICATION_EMAIL');
      if (adminEmail) {
        const subject = `[Pulse AI] Critical error in ${functionName}`;
        const metadataJson = safeJson(record.metadata ?? normalizedMetadata);
        const html = `
          <h2>Critical error reported</h2>
          <p><strong>Function:</strong> ${functionName}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Severity:</strong> ${severity}</p>
          <p><strong>Timestamp:</strong> ${now}</p>
          ${userId ? `<p><strong>User:</strong> ${userId}</p>` : ''}
          ${metadataJson ? `<pre>${metadataJson}</pre>` : ''}
          ${stackTrace ? `<pre>${stackTrace}</pre>` : ''}
        `;
        try {
          await sendEmail({
            to: adminEmail,
            subject,
            html,
            text: `Critical error in ${functionName}\nMessage: ${message}\nTimestamp: ${now}\n${stackTrace ?? ''}`,
          });
        } catch (emailError) {
          console.error('Failed to send critical error email:', emailError);
        }
      } else {
        console.warn('ADMIN_ERROR_NOTIFICATION_EMAIL not configured.');
      }
    }

    return new Response(
      JSON.stringify({ success: true, error: record }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in reportSystemError:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
