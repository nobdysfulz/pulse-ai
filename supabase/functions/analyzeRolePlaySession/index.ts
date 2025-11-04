import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TranscriptEntry = string | {
  speaker?: string;
  role?: string;
  text?: string;
  content?: string;
};

type EvaluationResponse = {
  overall_score?: number;
  overall_result?: string;
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  criteria?: Record<string, { score?: number; feedback?: string }>;
  objections?: { given?: string[]; overcame?: string[] };
};

function formatTranscript(transcript: unknown): string {
  if (!Array.isArray(transcript)) {
    return String(transcript ?? '');
  }
  return transcript
    .map((entry: TranscriptEntry) => {
      if (typeof entry === 'string') return entry;
      const speaker = entry.speaker || entry.role || 'Agent';
      const text = entry.text || entry.content || '';
      return `${speaker}: ${text}`;
    })
    .join('\n');
}

function coerceEvaluation(raw: string): EvaluationResponse {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const subset = raw.slice(start, end + 1);
      try {
        return JSON.parse(subset);
      } catch (_) {
        console.error('[analyzeRolePlaySession] Failed to parse subset JSON');
      }
    }
    console.error('[analyzeRolePlaySession] Unable to parse evaluation JSON', error);
    return {};
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!serviceRoleKey) {
    return new Response('Service misconfigured', { status: 500 });
  }

  if (!lovableApiKey) {
    return new Response('LOVABLE_API_KEY not configured', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('role_play_session_logs')
      .select('id, user_id, scenario_id, transcript, metadata, session_duration_seconds')
      .eq('id', sessionId)
      .maybeSingle<{
        id: string;
        user_id: string;
        scenario_id: string | null;
        transcript: unknown;
        metadata: Record<string, unknown> | null;
        session_duration_seconds: number | null;
      }>();

    if (sessionError || !session) {
      throw new Error('Session log not found');
    }

    let scenarioName = 'Role-Play Scenario';
    let clientPersona = 'Client';
    let passingThreshold = 70;
    let successCriteria: string[] = [];

    if (session.scenario_id) {
      const { data: scenario, error: scenarioError } = await supabaseAdmin
        .from('role_play_scenarios')
        .select('name, client_persona, passing_threshold, success_criteria')
        .eq('id', session.scenario_id)
        .maybeSingle<{
          name?: string | null;
          client_persona?: string | null;
          passing_threshold?: number | null;
          success_criteria?: string[] | null;
        }>();

      if (scenarioError) {
        console.warn('[analyzeRolePlaySession] Unable to load scenario metadata', scenarioError);
      } else if (scenario) {
        scenarioName = scenario.name || scenarioName;
        clientPersona = scenario.client_persona || clientPersona;
        passingThreshold = scenario.passing_threshold ?? passingThreshold;
        successCriteria = scenario.success_criteria ?? [];
      }
    }

    const transcriptText = formatTranscript(session.transcript);
    const durationMinutes = session.session_duration_seconds
      ? Math.round(session.session_duration_seconds / 60)
      : undefined;

    const prompt = `You are an experienced real estate sales coach evaluating a training role-play session.
Respond ONLY with JSON following this schema:
{
  "overall_score": number (0-100),
  "overall_result": "PASS" | "FAIL",
  "summary": string,
  "strengths": string[],
  "areas_for_improvement": string[],
  "criteria": {
    "active_listening": { "score": number, "feedback": string },
    "validating_feelings": { "score": number, "feedback": string },
    "clarifying_questions": { "score": number, "feedback": string },
    "restating_objections": { "score": number, "feedback": string }
  },
  "objections": {
    "given": string[],
    "overcame": string[]
  }
}
Use the following transcript of a ${scenarioName} session with persona ${clientPersona}.
Focus feedback on practical, actionable coaching.
Transcript:\n${transcriptText}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a disciplined, structured real estate sales coach who evaluates role-play calls and delivers concise JSON feedback.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[analyzeRolePlaySession] AI gateway error', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid AI response payload');
    }

    const evaluation = coerceEvaluation(content);
    const overallScore = Math.max(0, Math.min(100, evaluation.overall_score ?? 0));
    const overallResult = evaluation.overall_result ?? (overallScore >= passingThreshold ? 'PASS' : 'FAIL');

    const reportInsert = {
      user_id: session.user_id,
      session_id: session.id,
      overall_score: overallScore,
      overall_result: overallResult,
      strengths: evaluation.strengths ?? [],
      areas_for_improvement: evaluation.areas_for_improvement ?? [],
      detailed_feedback: evaluation.summary ?? '',
      metrics: evaluation.criteria ?? {},
    };

    const { data: report } = await supabaseAdmin
      .from('role_play_analysis_reports')
      .insert(reportInsert)
      .select('*')
      .single();

    if (session.scenario_id) {
      const { data: progress } = await supabaseAdmin
        .from('role_play_user_progress')
        .select('id, attempts, best_score')
        .eq('user_id', session.user_id)
        .eq('scenario_id', session.scenario_id)
        .maybeSingle<{ id: string; attempts: number | null; best_score: number | null }>();

      if (progress) {
        await supabaseAdmin
          .from('role_play_user_progress')
          .update({
            attempts: (progress.attempts ?? 0) + 1,
            best_score: Math.max(progress.best_score ?? 0, overallScore),
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', progress.id);
      } else {
        await supabaseAdmin
          .from('role_play_user_progress')
          .insert({
            user_id: session.user_id,
            scenario_id: session.scenario_id,
            attempts: 1,
            best_score: overallScore,
            last_attempt_at: new Date().toISOString(),
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        report,
        durationMinutes,
        successCriteria,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[analyzeRolePlaySession] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
