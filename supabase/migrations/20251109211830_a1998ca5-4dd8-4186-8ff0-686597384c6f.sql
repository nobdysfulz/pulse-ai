-- Align goals table with edge function expectations
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS trend text DEFAULT 'on-track',
  ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Optional index to speed up lookups used in activateProductionPlan
CREATE INDEX IF NOT EXISTS idx_goals_user_type_title ON public.goals(user_id, goal_type, title);