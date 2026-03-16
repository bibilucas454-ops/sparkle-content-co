-- Fix B: OAuth States Table for secure callback verification
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Housekeeping function to automatically delete old states
CREATE OR REPLACE FUNCTION delete_old_oauth_states()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE created_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_old_oauth_states ON public.oauth_states;
CREATE TRIGGER trigger_delete_old_oauth_states
  AFTER INSERT ON public.oauth_states
  EXECUTE FUNCTION delete_old_oauth_states();

-- RLS for oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own oauth states" ON public.oauth_states
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own oauth states" ON public.oauth_states
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix C: Securing Storage Buckets
-- Set buckets to private
UPDATE storage.buckets SET public = false WHERE id IN ('videos', 'thumbnails', 'creator-media');

-- Ensure RLS is enabled on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own objects (based on bucket folder or matching owner)
-- We use a simple owner policy assuming files are uploaded via Supabase Storage standard API
DROP POLICY IF EXISTS "Users can view their own private objects" ON storage.objects;
CREATE POLICY "Users can view their own private objects" ON storage.objects
  FOR SELECT TO authenticated USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can insert their own private objects" ON storage.objects;
CREATE POLICY "Users can insert their own private objects" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update their own private objects" ON storage.objects;
CREATE POLICY "Users can update their own private objects" ON storage.objects
  FOR UPDATE TO authenticated USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own private objects" ON storage.objects;
CREATE POLICY "Users can delete their own private objects" ON storage.objects
  FOR DELETE TO authenticated USING (auth.uid() = owner);

-- Fix D: pgcrypto for Tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix E: Fix "Always True" Policies on trends table
DROP POLICY IF EXISTS "Authenticated users can insert trends" ON public.trends;
DROP POLICY IF EXISTS "Authenticated users can delete trends" ON public.trends;

-- Recreate with safe roles (e.g. only service_role can do this now)
CREATE POLICY "Only service_role can insert trends" ON public.trends
  FOR INSERT TO authenticated WITH CHECK (false); -- Effectively disables it for normal users

CREATE POLICY "Only service_role can delete trends" ON public.trends
  FOR DELETE TO authenticated USING (false);

