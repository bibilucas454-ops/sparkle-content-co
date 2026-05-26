
UPDATE public.social_tokens
SET next_refresh_attempt_at = now() + interval '24 hours'
WHERE status IN ('needs_reauth','reconnect_required','error','disabled')
  AND (next_refresh_attempt_at IS NULL OR next_refresh_attempt_at < now() + interval '1 hour');
