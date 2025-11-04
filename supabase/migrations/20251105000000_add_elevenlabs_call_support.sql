-- Add extended metadata columns for ElevenLabs integrations
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS call_sid TEXT,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.call_logs
  ALTER COLUMN status SET DEFAULT 'pending_initiation',
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS call_logs_conversation_id_idx
  ON public.call_logs (conversation_id);

ALTER TABLE public.role_play_session_logs
  ADD COLUMN IF NOT EXISTS conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS call_sid TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

ALTER TABLE public.role_play_session_logs
  ALTER COLUMN status SET DEFAULT 'pending_initiation';

CREATE INDEX IF NOT EXISTS role_play_session_logs_conversation_id_idx
  ON public.role_play_session_logs (conversation_id);

ALTER TABLE public.role_play_analysis_reports
  ADD COLUMN IF NOT EXISTS overall_result TEXT;

ALTER TABLE public.user_agent_subscriptions
  ADD COLUMN IF NOT EXISTS minutes_allocated INTEGER,
  ADD COLUMN IF NOT EXISTS current_minutes_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overage_rate NUMERIC(6,2) DEFAULT 0;

-- Ensure defaults for existing numeric columns
ALTER TABLE public.user_agent_subscriptions
  ALTER COLUMN current_minutes_used SET DEFAULT 0,
  ALTER COLUMN overage_rate SET DEFAULT 0;

-- Ensure credit tracking uses non-null defaults
ALTER TABLE public.user_credits
  ALTER COLUMN credits_available SET DEFAULT 0,
  ALTER COLUMN credits_used SET DEFAULT 0;

-- Maintain metadata defaults for analysis tables
ALTER TABLE public.role_play_session_logs
  ALTER COLUMN transcript SET DEFAULT '[]'::jsonb;

-- Index to speed up lookups by session status
CREATE INDEX IF NOT EXISTS role_play_session_logs_status_idx
  ON public.role_play_session_logs (status);
