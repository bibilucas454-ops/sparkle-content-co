-- 1) Soft delete column
ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_publications_user_deleted
  ON public.publications (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_publications_overall_status
  ON public.publications (overall_status)
  WHERE deleted_at IS NULL;

-- 2) Recreate views to ignore soft-deleted rows and normalize status
DROP VIEW IF EXISTS public.user_publication_summary CASCADE;
DROP VIEW IF EXISTS public.platform_metrics CASCADE;
DROP VIEW IF EXISTS public.publication_metrics CASCADE;

CREATE OR REPLACE VIEW public.publication_metrics AS
SELECT
    p.user_id,
    p.id as publication_id,
    p.title,
    p.created_at as publication_created_at,
    p.scheduled_for,
    p.overall_status,
    pt.id as target_id,
    pt.platform,
    pt.status as target_status,
    pt.published_at,
    pt.platform_post_url,
    pt.error_message
FROM public.publications p
LEFT JOIN public.publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL
  AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.user_publication_summary AS
SELECT
    p.user_id,
    COUNT(DISTINCT p.id) as total_publications,
    COUNT(DISTINCT CASE
      WHEN LOWER(p.overall_status) IN ('published','publicado','publicada','success','sucesso')
      THEN p.id END) as published_count,
    COUNT(DISTINCT CASE
      WHEN LOWER(p.overall_status) IN ('failed','erro','error','falhou','falha')
      THEN p.id END) as failed_count,
    COUNT(DISTINCT CASE
      WHEN LOWER(p.overall_status) IN ('scheduled','processing','pendente','queued','ready','agendado','agendada','pending','enviando','processando')
      THEN p.id END) as pending_count,
    COUNT(DISTINCT pt.id) as total_targets,
    COUNT(DISTINCT CASE
      WHEN LOWER(pt.status) IN ('published','publicado','publicada','success')
      THEN pt.id END) as successful_posts,
    COUNT(DISTINCT CASE
      WHEN LOWER(pt.status) IN ('failed','erro','error')
      THEN pt.id END) as failed_posts,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT pt.id) > 0
            THEN (COUNT(DISTINCT CASE
              WHEN LOWER(pt.status) IN ('published','publicado','publicada','success')
              THEN pt.id END)::numeric / COUNT(DISTINCT pt.id)::numeric) * 100
            ELSE 0
        END, 2
    ) as success_rate_percent
FROM public.publications p
LEFT JOIN public.publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL
  AND p.deleted_at IS NULL
GROUP BY p.user_id;

CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT
    pt.platform,
    COUNT(DISTINCT pt.id) as total_attempts,
    COUNT(DISTINCT CASE
      WHEN LOWER(pt.status) IN ('published','publicado','publicada','success')
      THEN pt.id END) as successful_posts,
    COUNT(DISTINCT CASE
      WHEN LOWER(pt.status) IN ('failed','erro','error')
      THEN pt.id END) as failed_posts,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT pt.id) > 0
            THEN (COUNT(DISTINCT CASE
              WHEN LOWER(pt.status) IN ('published','publicado','publicada','success')
              THEN pt.id END)::numeric / COUNT(DISTINCT pt.id)::numeric) * 100
            ELSE 0
        END, 2
    ) as success_rate_percent,
    COUNT(DISTINCT pt.publication_id) as unique_publications
FROM public.publication_targets pt
JOIN public.publications p ON p.id = pt.publication_id
WHERE p.deleted_at IS NULL
GROUP BY pt.platform;