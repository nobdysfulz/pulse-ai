
-- Enable RLS on user_onboarding if not already enabled
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users manage own onboarding" ON public.user_onboarding;

-- Create RLS policy for user_onboarding table
-- Users can view, insert, update their own onboarding record
CREATE POLICY "Users manage own onboarding"
ON public.user_onboarding
FOR ALL
TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);

COMMENT ON POLICY "Users manage own onboarding" ON public.user_onboarding IS 'Users can only access their own onboarding records';
