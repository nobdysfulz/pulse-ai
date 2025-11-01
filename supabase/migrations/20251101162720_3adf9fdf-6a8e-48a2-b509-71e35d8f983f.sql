-- Security Fix: Prevent privilege escalation on user_roles table
-- Add explicit DENY policies for INSERT, UPDATE, DELETE operations
-- Only allow role modifications through SECURITY DEFINER functions

-- Drop existing policies if any (besides SELECT)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Prevent user role modifications" ON public.user_roles;
  DROP POLICY IF EXISTS "Prevent unauthorized role inserts" ON public.user_roles;
  DROP POLICY IF EXISTS "Prevent unauthorized role updates" ON public.user_roles;
  DROP POLICY IF EXISTS "Prevent unauthorized role deletes" ON public.user_roles;
END $$;

-- Create explicit DENY policies for all modification operations
CREATE POLICY "Prevent unauthorized role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Prevent unauthorized role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Prevent unauthorized role deletes"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Create a SECURITY DEFINER function for admins to manage roles (to be called by service role only)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _target_user_id uuid,
  _role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can only be called by the service role (from backend/edge functions)
  -- Not directly accessible from client code
  
  -- Insert or update the user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
END;
$$;

-- Revoke execute from public, only service role can call this
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role FROM authenticated;

COMMENT ON FUNCTION public.admin_set_user_role IS 'Admin function to manage user roles. Can only be called by service role from backend.';
COMMENT ON POLICY "Prevent unauthorized role inserts" ON public.user_roles IS 'Prevents client-side privilege escalation by blocking direct inserts';
COMMENT ON POLICY "Prevent unauthorized role updates" ON public.user_roles IS 'Prevents client-side privilege escalation by blocking direct updates';
COMMENT ON POLICY "Prevent unauthorized role deletes" ON public.user_roles IS 'Prevents client-side privilege escalation by blocking direct deletes';