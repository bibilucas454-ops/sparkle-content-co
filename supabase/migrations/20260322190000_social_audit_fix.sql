-- Master Migration: Social Audit Fixes 2026-03-22
-- Standardizes social_tokens and ensures oauth_states is robust

-- 1. Ensure social_tokens has all requested columns
ALTER TABLE public.social_tokens 
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS token_type TEXT,
ADD COLUMN IF NOT EXISTS raw_response JSONB;

-- 2. Ensure RLS on social_tokens is comprehensive
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tokens" ON public.social_tokens;
CREATE POLICY "Users can manage own tokens" ON public.social_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Ensure oauth_states is secure and has housekeeping
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own states" ON public.oauth_states;
CREATE POLICY "Users can manage own states" ON public.oauth_states
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
