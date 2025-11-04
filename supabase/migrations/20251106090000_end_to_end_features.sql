
-- Ensure helper exists to keep updated_at columns current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure subscription metadata lives on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Track GoHighLevel onboarding automation
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS highlevel_webhook_sent BOOLEAN DEFAULT false;

-- Expand subscription tracking for external commerce platforms
ALTER TABLE public.user_agent_subscriptions
  ADD COLUMN IF NOT EXISTS plan_type TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gohighlevel_order_id TEXT,
  ADD COLUMN IF NOT EXISTS shopify_order_id TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'app',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.user_agent_subscriptions
  ALTER COLUMN source_platform SET DEFAULT 'app',
  ALTER COLUMN status SET DEFAULT 'active';

-- System-wide error log used by admin dashboards and notifications
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  function_name TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurrence_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_occurrence_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage system errors"
  ON public.system_errors
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS system_errors_function_idx
  ON public.system_errors (function_name, severity);

-- Persist integration check results and last webhook timestamps
CREATE TABLE IF NOT EXISTS public.integration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  last_checked TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins view integration status"
  ON public.integration_status
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins manage integration status"
  ON public.integration_status
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Centralised email delivery logging for automated campaigns
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  template_key TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users view own email logs"
  ON public.email_delivery_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins manage email logs"
  ON public.email_delivery_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Store cached market data snapshots from RapidAPI
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  geography_type TEXT,
  geography_id TEXT,
  geography_name TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, geography_id)
);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own market data"
  ON public.market_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_market_data_updated_at
  BEFORE UPDATE ON public.market_data
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
