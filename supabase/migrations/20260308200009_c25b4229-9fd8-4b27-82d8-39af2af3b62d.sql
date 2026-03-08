
-- Add new columns to existing tables

-- uploads: add aspect_ratio
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS aspect_ratio text;

-- publications: add cta, thumbnail_path, overall_status, updated_at
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS cta text;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS thumbnail_path text;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS overall_status text DEFAULT 'rascunho';
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- publication_targets: add platform_specific_title, platform_specific_caption, privacy_status
ALTER TABLE public.publication_targets ADD COLUMN IF NOT EXISTS platform_specific_title text;
ALTER TABLE public.publication_targets ADD COLUMN IF NOT EXISTS platform_specific_caption text;
ALTER TABLE public.publication_targets ADD COLUMN IF NOT EXISTS privacy_status text DEFAULT 'public';

-- social_accounts: add updated_at
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create drafts table
CREATE TABLE IF NOT EXISTS public.drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  upload_id uuid REFERENCES public.uploads(id) ON DELETE SET NULL,
  title text,
  caption text,
  hashtags text,
  cta text,
  selected_platforms jsonb DEFAULT '[]'::jsonb,
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON public.drafts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON public.drafts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.drafts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.drafts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Users can upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own videos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public can view videos" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'videos');

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own thumbnails" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public can view thumbnails" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'thumbnails');

-- Add update policy for publications
CREATE POLICY "Users can update own publications" ON public.publications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add insert policy for publication_logs
CREATE POLICY "Users can insert own publication logs" ON public.publication_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM publication_targets pt
    JOIN publications p ON p.id = pt.publication_id
    WHERE pt.id = publication_logs.publication_target_id AND p.user_id = auth.uid()
  )
);
