-- Phase 1: Create agent_intelligence_profiles table
CREATE TABLE public.agent_intelligence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_level text,
  work_commitment text,
  business_structure text,
  database_size text,
  sphere_warmth text,
  previous_year_transactions integer,
  previous_year_volume bigint,
  average_price_point text,
  business_consistency text,
  biggest_challenges text[],
  growth_timeline text,
  learning_preference text,
  survey_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.agent_intelligence_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own intelligence profile"
  ON public.agent_intelligence_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Phase 2: Add missing columns to user_onboarding
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS agent_intelligence_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agent_intelligence_completion_date timestamptz;