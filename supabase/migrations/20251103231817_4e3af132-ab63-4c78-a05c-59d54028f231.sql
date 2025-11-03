-- Create ai_agent_conversations table
CREATE TABLE public.ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
ON public.ai_agent_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create external_service_connections table
CREATE TABLE public.external_service_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  connection_status TEXT DEFAULT 'disconnected',
  credentials JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, service_name)
);

ALTER TABLE public.external_service_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own service connections"
ON public.external_service_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('agent-voices', 'agent-voices', false),
  ('avatars', 'avatars', true),
  ('content-packs', 'content-packs', true),
  ('generated-content', 'generated-content', false),
  ('brand-assets', 'brand-assets', false),
  ('audio-recordings', 'audio-recordings', false),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agent-voices
CREATE POLICY "Users can upload their own agent voices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-voices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own agent voices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-voices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for avatars (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for content-packs (public read)
CREATE POLICY "Anyone can view content packs"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-packs');

CREATE POLICY "Admins can upload content packs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-packs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Storage policies for generated-content
CREATE POLICY "Users can manage their own generated content"
ON storage.objects FOR ALL
USING (
  bucket_id = 'generated-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'generated-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for brand-assets
CREATE POLICY "Users can manage their own brand assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for audio-recordings
CREATE POLICY "Users can manage their own audio recordings"
ON storage.objects FOR ALL
USING (
  bucket_id = 'audio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for documents
CREATE POLICY "Users can manage their own documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_ai_agent_conversations_updated_at
BEFORE UPDATE ON public.ai_agent_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_service_connections_updated_at
BEFORE UPDATE ON public.external_service_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();