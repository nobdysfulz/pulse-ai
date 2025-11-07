-- Create a stable mapping between Clerk user IDs (text) and internal UUIDs
CREATE TABLE IF NOT EXISTS public.user_identity_map (
  clerk_id text PRIMARY KEY,
  internal_user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_user_identity_map_updated_at ON public.user_identity_map;
CREATE TRIGGER update_user_identity_map_updated_at
BEFORE UPDATE ON public.user_identity_map
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS (service role will bypass)
ALTER TABLE public.user_identity_map ENABLE ROW LEVEL SECURITY;