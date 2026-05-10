ALTER TABLE public.publication_targets
  ADD COLUMN IF NOT EXISTS auto_comment_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_comment_text text,
  ADD COLUMN IF NOT EXISTS auto_comment_delay_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_comment_status text NOT NULL DEFAULT 'disabled',
  ADD COLUMN IF NOT EXISTS auto_comment_platform_id text,
  ADD COLUMN IF NOT EXISTS auto_comment_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_comment_posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_comment_error text;

CREATE INDEX IF NOT EXISTS idx_pt_auto_comment_pending
  ON public.publication_targets (auto_comment_run_at)
  WHERE auto_comment_status = 'pending';