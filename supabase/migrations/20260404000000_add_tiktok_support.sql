-- TikTok Integration: Add refresh_expires_at column
ALTER TABLE public.social_tokens ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;

-- Create RLS policy for TikTok if not exists (should already exist from previous migrations)
-- TikTok specific indexes
CREATE INDEX IF NOT EXISTS idx_social_tokens_tiktok ON public.social_tokens(user_id, platform) 
WHERE platform = 'tiktok';

-- Log function for TikTok integration events (reuses existing function if exists)
-- This is already covered by the existing log_integration_event RPC
