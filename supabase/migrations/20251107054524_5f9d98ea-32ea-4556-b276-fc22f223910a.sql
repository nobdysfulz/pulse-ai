-- Add action_type column to daily_actions table
ALTER TABLE public.daily_actions 
ADD COLUMN action_type text;

-- Add a comment to document the column
COMMENT ON COLUMN public.daily_actions.action_type IS 'Type of action (e.g., call, email, research, client_follow_up, etc.)';