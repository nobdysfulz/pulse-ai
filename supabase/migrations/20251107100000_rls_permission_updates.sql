-- Ensure user-owned records default to the requesting user
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach the helper trigger to every table that exposes a user_id column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'user_id'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_user_id_trigger ON public.%I;', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_user_id_trigger BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_user_id();',
      tbl
    );
  END LOOP;
END$$;

-- Drop any existing policies so we can replace them with the new baseline
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'agent_config',
    'agent_intelligence_profiles',
    'agent_voices',
    'ai_actions_log',
    'ai_agent_conversations',
    'ai_prompt_configs',
    'ai_tool_usage',
    'brand_color_palettes',
    'business_plans',
    'call_logs',
    'client_personas',
    'content_packs',
    'content_topics',
    'credit_transactions',
    'crm_connections',
    'daily_actions',
    'email_campaigns',
    'email_templates',
    'external_service_connections',
    'feature_flags',
    'featured_content_packs',
    'goals',
    'market_config',
    'market_intelligence',
    'generated_content',
    'objection_scripts',
    'role_play_scenarios',
    'role_play_session_logs',
    'role_play_user_progress',
    'profiles',
    'user_preferences',
    'user_agent_subscriptions',
    'user_credits',
    'user_guidelines',
    'user_onboarding',
    'transactions',
    'task_templates',
    'legal_documents',
    'campaign_templates'
  ])
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
      END LOOP;
      EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    END IF;
  END LOOP;
END$$;

-- Ensure content topics can store ownership metadata for drafts
ALTER TABLE IF EXISTS public.content_topics
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Tables that simply follow the admin + owner pattern
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'ai_prompt_configs',
    'ai_tool_usage',
    'brand_color_palettes',
    'business_plans',
    'call_logs',
    'credit_transactions',
    'crm_connections',
    'daily_actions',
    'email_campaigns',
    'email_templates',
    'external_service_connections',
    'goals',
    'market_config',
    'generated_content',
    'role_play_session_logs',
    'user_preferences',
    'user_agent_subscriptions',
    'user_credits',
    'user_guidelines',
    'user_onboarding',
    'transactions',
    'campaign_templates'
  ])
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL
        USING (has_role(auth.uid(), ''admin''::app_role))
        WITH CHECK (has_role(auth.uid(), ''admin''::app_role));', tbl, tbl);

      EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);', tbl, tbl);
    ELSE
      EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL
        USING (has_role(auth.uid(), ''admin''::app_role))
        WITH CHECK (has_role(auth.uid(), ''admin''::app_role));', tbl, tbl);
    END IF;
  END LOOP;
END$$;

CREATE POLICY "Users view active ai_prompt_configs"
ON public.ai_prompt_configs FOR SELECT
TO authenticated
USING (is_active = true);

-- Agent configuration
CREATE POLICY "Admins manage agent_config"
ON public.agent_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own agent_config"
ON public.agent_config FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agent intelligence profiles
CREATE POLICY "Admins manage agent_intelligence_profiles"
ON public.agent_intelligence_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own intelligence profile"
ON public.agent_intelligence_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- AI agent conversations
CREATE POLICY "Admins manage ai_agent_conversations"
ON public.ai_agent_conversations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own ai_agent_conversations"
ON public.ai_agent_conversations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agent voices are admin managed only
CREATE POLICY "Admins manage agent_voices"
ON public.agent_voices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- AI actions log retains granular policies
CREATE POLICY "Admins manage ai_actions_log"
ON public.ai_actions_log FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own ai_actions_log"
ON public.ai_actions_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert ai_actions_log"
ON public.ai_actions_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Content oriented access
CREATE POLICY "Admins manage content_packs"
ON public.content_packs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active content packs"
ON public.content_packs FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins manage content"
ON public.content_topics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert drafts"
ON public.content_topics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public view active topics"
ON public.content_topics FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Users view active email_templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage featured_content_packs"
ON public.featured_content_packs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active featured content packs"
ON public.featured_content_packs FOR SELECT
TO public
USING (is_active = true);

-- Client personas and objection scripts remain curated but publicly viewable when active
CREATE POLICY "Admins manage client_personas"
ON public.client_personas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active client_personas"
ON public.client_personas FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins manage objection_scripts"
ON public.objection_scripts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active objection_scripts"
ON public.objection_scripts FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins manage all training content"
ON public.role_play_scenarios FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active role_play_scenarios"
ON public.role_play_scenarios FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins manage role_play_user_progress"
ON public.role_play_user_progress FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users track their own progress"
ON public.role_play_user_progress FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Profiles rely on ID column for ownership checks
CREATE POLICY "Admins manage profiles"
ON public.profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin-only operational tables
CREATE POLICY "Admins manage feature_flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view feature_flags"
ON public.feature_flags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage market_intelligence"
ON public.market_intelligence FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage user_roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own referrals"
ON public.referrals FOR ALL
TO authenticated
USING (auth.uid() = referrer_user_id)
WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Admins manage legal_documents"
ON public.legal_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active legal_documents"
ON public.legal_documents FOR SELECT
TO public
USING (is_active = true);

-- Task templates remain globally readable
CREATE POLICY "Admins manage task_templates"
ON public.task_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view active task_templates"
ON public.task_templates FOR SELECT
TO public
USING (is_active = true);
