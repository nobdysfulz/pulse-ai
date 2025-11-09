-- Add completion date columns and completed_steps array to user_onboarding table
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS onboarding_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agent_onboarding_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS call_center_onboarding_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_steps TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.user_onboarding.onboarding_completion_date IS 'Date when core onboarding was completed';
COMMENT ON COLUMN public.user_onboarding.agent_onboarding_completion_date IS 'Date when AI agent onboarding was completed';
COMMENT ON COLUMN public.user_onboarding.call_center_onboarding_completion_date IS 'Date when call center onboarding was completed';
COMMENT ON COLUMN public.user_onboarding.completed_steps IS 'Array of completed onboarding step IDs';