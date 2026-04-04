
-- Social accounts table
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  account_name text,
  account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social accounts" ON public.social_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own social accounts" ON public.social_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own social accounts" ON public.social_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own social accounts" ON public.social_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Uploads table
CREATE TABLE public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  duration_seconds integer,
  thumbnail_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads" ON public.uploads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON public.uploads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own uploads" ON public.uploads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Publications table
CREATE TABLE public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  upload_id uuid REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  caption text,
  hashtags text,
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publications" ON public.publications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own publications" ON public.publications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own publications" ON public.publications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Publication targets table
CREATE TABLE public.publication_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid REFERENCES public.publications(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  platform_post_id text,
  platform_post_url text,
  error_message text,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.publication_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publication targets" ON public.publication_targets
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert own publication targets" ON public.publication_targets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update own publication targets" ON public.publication_targets
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_id AND p.user_id = auth.uid()));

-- Publication logs table
CREATE TABLE public.publication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_target_id uuid REFERENCES public.publication_targets(id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publication logs" ON public.publication_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.publication_targets pt
    JOIN public.publications p ON p.id = pt.publication_id
    WHERE pt.id = publication_target_id AND p.user_id = auth.uid()
  ));

-- Storage bucket for creator media
INSERT INTO storage.buckets (id, name, public) VALUES ('creator-media', 'creator-media', true);

CREATE POLICY "Users can upload own media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view public media" ON storage.objects
  FOR SELECT USING (bucket_id = 'creator-media');
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);
