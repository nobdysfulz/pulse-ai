-- Add generated column to daily_actions table
ALTER TABLE public.daily_actions 
ADD COLUMN generated boolean DEFAULT false;