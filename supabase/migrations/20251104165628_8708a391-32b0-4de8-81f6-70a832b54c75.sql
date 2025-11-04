-- Expand content_topics table to support full weekly content pack system
ALTER TABLE content_topics 
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS social_feed_graphic_url TEXT,
ADD COLUMN IF NOT EXISTS social_feed_caption TEXT,
ADD COLUMN IF NOT EXISTS social_hashtags TEXT,
ADD COLUMN IF NOT EXISTS outreach_email_subject TEXT,
ADD COLUMN IF NOT EXISTS outreach_email TEXT,
ADD COLUMN IF NOT EXISTS outreach_call_script TEXT,
ADD COLUMN IF NOT EXISTS outreach_dm_template TEXT;

-- Add topic_id to content_packs to link packs with topics
ALTER TABLE content_packs 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES content_topics(id) ON DELETE SET NULL;

-- Create content-topics storage bucket for social media graphics
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-topics', 'content-topics', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for content-topics bucket
CREATE POLICY "Admins can upload content topic images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-topics' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update content topic images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-topics' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'content-topics' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete content topic images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-topics' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view content topic images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-topics');