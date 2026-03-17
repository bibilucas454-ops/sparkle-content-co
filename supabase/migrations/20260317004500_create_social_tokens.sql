-- Phase 2: Create social_tokens table and migrate data
CREATE TABLE IF NOT EXISTS public.social_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- youtube, instagram, tiktok
    account_name TEXT,
    account_id TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,
    last_refreshed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Migrate data from social_accounts to social_tokens
INSERT INTO public.social_tokens (
    user_id, 
    platform, 
    account_name, 
    account_id, 
    access_token_encrypted, 
    refresh_token_encrypted, 
    expires_at, 
    created_at, 
    updated_at
)
SELECT 
    user_id, 
    platform, 
    account_name, 
    account_id, 
    access_token_encrypted, 
    refresh_token_encrypted, 
    token_expires_at, 
    created_at, 
    COALESCE(updated_at, created_at)
FROM public.social_accounts
ON CONFLICT (user_id, platform) DO UPDATE SET
    account_name = EXCLUDED.account_name,
    account_id = EXCLUDED.account_id,
    access_token_encrypted = EXCLUDED.access_token_encrypted,
    refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

-- RLS for social_tokens
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own social tokens" ON public.social_tokens;
CREATE POLICY "Users can view own social tokens" ON public.social_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own social tokens" ON public.social_tokens;
CREATE POLICY "Users can insert own social tokens" ON public.social_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own social tokens" ON public.social_tokens;
CREATE POLICY "Users can update own social tokens" ON public.social_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own social tokens" ON public.social_tokens;
CREATE POLICY "Users can delete own social tokens" ON public.social_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
