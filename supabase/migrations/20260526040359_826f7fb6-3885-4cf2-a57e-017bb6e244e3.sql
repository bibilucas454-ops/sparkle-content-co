
ALTER TABLE public.social_tokens
  ADD COLUMN IF NOT EXISTS refresh_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refresh_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_refresh_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_social_tokens_status_next_attempt
  ON public.social_tokens(status, next_refresh_attempt_at);
