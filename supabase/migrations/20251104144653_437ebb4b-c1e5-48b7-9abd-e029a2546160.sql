-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile avatar image stored in Supabase Storage';

-- Add license_state column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_state TEXT;

COMMENT ON COLUMN public.profiles.license_state IS 'US state where the agent is licensed';

-- Migrate existing data from specialization to license_state if it looks like a state
UPDATE public.profiles 
SET license_state = specialization 
WHERE specialization IS NOT NULL 
  AND length(specialization) <= 2;

-- Update RLS policy to allow users to update their own profile including avatar_url and license_state
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);