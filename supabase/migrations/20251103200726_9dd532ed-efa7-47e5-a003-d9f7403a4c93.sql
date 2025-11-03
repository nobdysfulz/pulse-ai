-- PULSE GRAPH INTELLIGENCE CORE (PGIC) Database Schema

-- Table for Pulse Engine snapshots (measures execution & consistency)
CREATE TABLE IF NOT EXISTS public.pulse_engine_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pulse_snapshots_user_computed ON public.pulse_engine_snapshots(user_id, computed_at DESC);

-- Table for GANE Engine snapshots (measures intelligence & predictability)
CREATE TABLE IF NOT EXISTS public.gane_engine_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_gane_snapshots_user_computed ON public.gane_engine_snapshots(user_id, computed_at DESC);

-- Table for MORO Engine snapshots (measures market opportunity & resilience)
CREATE TABLE IF NOT EXISTS public.moro_engine_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_moro_snapshots_user_computed ON public.moro_engine_snapshots(user_id, computed_at DESC);

-- Table for caching built graph context (15min TTL)
CREATE TABLE IF NOT EXISTS public.graph_context_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  context JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_graph_context_user_expires ON public.graph_context_cache(user_id, expires_at);

-- Table for logging AI action executions
CREATE TABLE IF NOT EXISTS public.ai_actions_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  resource_url TEXT,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_actions_user_executed ON public.ai_actions_log(user_id, executed_at DESC);
CREATE INDEX idx_ai_actions_status ON public.ai_actions_log(status, executed_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.pulse_engine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gane_engine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moro_engine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_context_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pulse_engine_snapshots
CREATE POLICY "Users can view their own pulse snapshots"
  ON public.pulse_engine_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert pulse snapshots"
  ON public.pulse_engine_snapshots FOR INSERT
  WITH CHECK (true);

-- RLS Policies for gane_engine_snapshots
CREATE POLICY "Users can view their own gane snapshots"
  ON public.gane_engine_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert gane snapshots"
  ON public.gane_engine_snapshots FOR INSERT
  WITH CHECK (true);

-- RLS Policies for moro_engine_snapshots
CREATE POLICY "Users can view their own moro snapshots"
  ON public.moro_engine_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert moro snapshots"
  ON public.moro_engine_snapshots FOR INSERT
  WITH CHECK (true);

-- RLS Policies for graph_context_cache
CREATE POLICY "Users can view their own graph context"
  ON public.graph_context_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage graph context"
  ON public.graph_context_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_actions_log
CREATE POLICY "Users can view their own action logs"
  ON public.ai_actions_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert action logs"
  ON public.ai_actions_log FOR INSERT
  WITH CHECK (true);

-- Trigger for updating graph_context_cache.updated_at
CREATE TRIGGER update_graph_context_updated_at
  BEFORE UPDATE ON public.graph_context_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();