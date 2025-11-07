-- Add frequency column to daily_actions table
ALTER TABLE public.daily_actions 
ADD COLUMN frequency text;

-- Add a comment to document the column
COMMENT ON COLUMN public.daily_actions.frequency IS 'Frequency of recurring tasks (e.g., daily, weekly, monthly)';