-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  action_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  trigger_type TEXT NOT NULL,
  trigger_value INTEGER,
  impact_area TEXT,
  display_category TEXT,
  priority_weight INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_play_scenarios table
CREATE TABLE IF NOT EXISTS role_play_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  initial_context TEXT NOT NULL,
  client_persona TEXT NOT NULL,
  eleven_labs_agent_id TEXT,
  eleven_labs_phone_number_id TEXT,
  eleven_labs_voice_id TEXT,
  first_message_override TEXT,
  avatar_image_url TEXT,
  passing_threshold INTEGER DEFAULT 70,
  learning_objectives TEXT[] DEFAULT '{}',
  average_duration_minutes INTEGER DEFAULT 10,
  success_criteria TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_personas table
CREATE TABLE IF NOT EXISTS client_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_key TEXT UNIQUE NOT NULL,
  persona_name TEXT NOT NULL,
  description TEXT,
  personality_traits TEXT[] DEFAULT '{}',
  communication_style TEXT,
  objection_patterns TEXT[] DEFAULT '{}',
  decision_making_style TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create objection_scripts table
CREATE TABLE IF NOT EXISTS objection_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  situation TEXT NOT NULL,
  response TEXT NOT NULL,
  tips TEXT[] DEFAULT '{}',
  is_free BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign_templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_play_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_templates
CREATE POLICY "Admins manage task templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active task templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for role_play_scenarios
CREATE POLICY "Admins manage scenarios"
  ON role_play_scenarios FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active scenarios"
  ON role_play_scenarios FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for client_personas
CREATE POLICY "Admins manage client personas"
  ON client_personas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active personas"
  ON client_personas FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for objection_scripts
CREATE POLICY "Admins manage objection scripts"
  ON objection_scripts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active scripts"
  ON objection_scripts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for campaign_templates
CREATE POLICY "Admins manage campaign templates"
  ON campaign_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active templates"
  ON campaign_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_play_scenarios_updated_at
  BEFORE UPDATE ON role_play_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_personas_updated_at
  BEFORE UPDATE ON client_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objection_scripts_updated_at
  BEFORE UPDATE ON objection_scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();