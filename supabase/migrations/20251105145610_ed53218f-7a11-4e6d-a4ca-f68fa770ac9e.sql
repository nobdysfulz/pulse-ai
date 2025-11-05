-- Fix profiles table to accept Clerk user IDs (which are text, not UUID)
-- Drop existing table if it exists and recreate with correct types
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  license_number TEXT,
  license_state TEXT,
  brokerage TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- Create user_onboarding table with proper ID type
DROP TABLE IF EXISTS public.user_onboarding CASCADE;

CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  agent_onboarding_completed BOOLEAN DEFAULT FALSE,
  call_center_onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding"
  ON public.user_onboarding
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own onboarding"
  ON public.user_onboarding
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own onboarding"
  ON public.user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);