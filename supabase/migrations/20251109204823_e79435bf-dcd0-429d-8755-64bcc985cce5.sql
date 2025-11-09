-- Add years_experience column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

COMMENT ON COLUMN public.profiles.years_experience IS 'Number of years of real estate experience';