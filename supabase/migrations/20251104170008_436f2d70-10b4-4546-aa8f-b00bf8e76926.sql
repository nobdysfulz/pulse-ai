-- Fix RLS policies for platform-wide data imported from external database
-- These records are created by the system user during sync and should be viewable by all users

-- Drop existing restrictive policies and create new ones for task_templates
DROP POLICY IF EXISTS "Users view active task templates" ON task_templates;
DROP POLICY IF EXISTS "Admins manage task templates" ON task_templates;

CREATE POLICY "All authenticated users can view task templates"
ON task_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage task templates"
ON task_templates FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix client_personas policies
DROP POLICY IF EXISTS "Users view active personas" ON client_personas;
DROP POLICY IF EXISTS "Admins manage client personas" ON client_personas;

CREATE POLICY "All authenticated users can view client personas"
ON client_personas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage client personas"
ON client_personas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix featured_content_packs policies  
DROP POLICY IF EXISTS "Users view active featured packs" ON featured_content_packs;
DROP POLICY IF EXISTS "Admins manage featured content packs" ON featured_content_packs;

CREATE POLICY "All authenticated users can view featured content packs"
ON featured_content_packs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage featured content packs"
ON featured_content_packs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix agent_voices to be viewable by all (these are platform voice options, not user-specific)
DROP POLICY IF EXISTS "Users manage own agent voices" ON agent_voices;

CREATE POLICY "All authenticated users can view agent voices"
ON agent_voices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage agent voices"
ON agent_voices FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Keep call_logs user-specific but allow admins to see all
CREATE POLICY "Admins can view all call logs"
ON call_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));