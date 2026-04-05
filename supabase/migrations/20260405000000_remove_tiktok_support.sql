-- Remove TikTok specific index
DROP INDEX IF EXISTS idx_social_tokens_tiktok;

-- Delete any existing TikTok social tokens
DELETE FROM public.social_tokens WHERE platform = 'tiktok';
