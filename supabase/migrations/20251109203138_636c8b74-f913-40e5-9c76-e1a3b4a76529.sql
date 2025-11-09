
-- Add agent_intelligence_completed column to user_onboarding table
ALTER TABLE public.user_onboarding
ADD COLUMN agent_intelligence_completed boolean DEFAULT false;

COMMENT ON COLUMN public.user_onboarding.agent_intelligence_completed IS 'Tracks whether the user has completed the Agent Intelligence Survey';
