-- Drop foreign key constraint on daily_actions.user_id that points to "users"
ALTER TABLE public.daily_actions
DROP CONSTRAINT IF EXISTS daily_actions_user_id_fkey;

-- Optional: add an index for faster lookups by user_id (keeps RLS performant)
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_id ON public.daily_actions(user_id);

-- Document why we avoid FK to auth.users
COMMENT ON TABLE public.daily_actions IS 'Stores per-user daily actions. user_id is not FK constrained to auth.users to avoid cross-schema coupling; access controlled via RLS (auth.uid() = user_id).';