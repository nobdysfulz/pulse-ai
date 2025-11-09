-- Add missing column for agent intelligence completion timestamp
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS agent_intelligence_completion_date TIMESTAMPTZ;

COMMENT ON COLUMN public.user_onboarding.agent_intelligence_completion_date IS 'Timestamp when the Agent Intelligence Survey was completed';