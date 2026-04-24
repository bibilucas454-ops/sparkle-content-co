-- Recriar views com security_invoker=on para respeitar RLS do usuário consultante
DROP VIEW IF EXISTS public.user_publication_summary CASCADE;
CREATE VIEW public.user_publication_summary
WITH (security_invoker=on) AS
SELECT p.user_id,
    count(DISTINCT p.id) AS total_publications,
    count(DISTINCT CASE WHEN p.overall_status = 'published' THEN p.id END) AS published_count,
    count(DISTINCT CASE WHEN p.overall_status = ANY (ARRAY['failed','erro']) THEN p.id END) AS failed_count,
    count(DISTINCT CASE WHEN p.overall_status = ANY (ARRAY['pendente','queued','scheduled','ready']) THEN p.id END) AS pending_count,
    count(DISTINCT pt.id) AS total_targets,
    count(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END) AS successful_posts,
    count(DISTINCT CASE WHEN pt.status = 'erro' THEN pt.id END) AS failed_posts,
    round(CASE WHEN count(DISTINCT pt.id) > 0
        THEN (count(DISTINCT CASE WHEN pt.status = 'publicado' THEN pt.id END)::numeric / count(DISTINCT pt.id)::numeric) * 100
        ELSE 0 END, 2) AS success_rate_percent
FROM publications p
LEFT JOIN publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL
GROUP BY p.user_id;

DROP VIEW IF EXISTS public.publication_metrics CASCADE;
CREATE VIEW public.publication_metrics
WITH (security_invoker=on) AS
SELECT p.user_id, p.id AS publication_id, p.title,
    p.created_at AS publication_created_at, p.scheduled_for, p.overall_status,
    pt.id AS target_id, pt.platform, pt.status AS target_status,
    pt.published_at, pt.platform_post_url, pt.error_message,
    COALESCE((SELECT count(*) FROM publication_attempts pa
        WHERE pa.publication_job_id = (SELECT id FROM publication_jobs
            WHERE publication_target_id = pt.id LIMIT 1)), 0) AS attempt_count
FROM publications p
LEFT JOIN publication_targets pt ON pt.publication_id = p.id
WHERE p.user_id IS NOT NULL;

DROP VIEW IF EXISTS public.platform_metrics CASCADE;
CREATE VIEW public.platform_metrics
WITH (security_invoker=on) AS
SELECT platform,
    count(DISTINCT id) AS total_attempts,
    count(DISTINCT CASE WHEN status = 'publicado' THEN id END) AS successful_posts,
    count(DISTINCT CASE WHEN status = 'erro' THEN id END) AS failed_posts,
    round(CASE WHEN count(DISTINCT id) > 0
        THEN (count(DISTINCT CASE WHEN status = 'publicado' THEN id END)::numeric / count(DISTINCT id)::numeric) * 100
        ELSE 0 END, 2) AS success_rate_percent,
    count(DISTINCT publication_id) AS unique_publications
FROM publication_targets
GROUP BY platform;

DROP VIEW IF EXISTS public.story_generation_stats CASCADE;
CREATE VIEW public.story_generation_stats
WITH (security_invoker=on) AS
SELECT user_id, nicho, tipo_sequence,
    count(*) AS total_generations,
    avg(score_diversidade)::numeric(5,4) AS avg_score,
    max(score_diversidade) AS max_score,
    min(score_diversidade) AS min_score,
    count(CASE WHEN status = 'pronto' THEN 1 END) AS successful_generations,
    count(CASE WHEN status = 'erro' THEN 1 END) AS failed_generations,
    avg(iteracoes)::numeric(3,1) AS avg_iterations,
    min(created_at) AS first_generation,
    max(created_at) AS last_generation
FROM story_generations
GROUP BY user_id, nicho, tipo_sequence;

-- Corrigir search_path nas funções restantes
CREATE OR REPLACE FUNCTION public.log_integration_event(p_user_id uuid, p_platform text, p_event_type text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID;
BEGIN
    INSERT INTO public.integration_events (user_id, platform, event_type, payload)
    VALUES (p_user_id, p_platform, p_event_type, p_payload)
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_immediate_processing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.status = 'queued' OR NEW.status = 'ready') AND NEW.run_at <= NOW() THEN
    PERFORM net.http_post(
      url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      body := '{}'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_user_id uuid, p_event_type text, p_provider text DEFAULT NULL, p_publication_id uuid DEFAULT NULL, p_message text DEFAULT NULL, p_payload jsonb DEFAULT NULL, p_error_code text DEFAULT NULL, p_correlation_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID;
BEGIN
    INSERT INTO public.integration_events (user_id, event_type, provider, publication_id, message, payload, error_code, correlation_id)
    VALUES (p_user_id, p_event_type, p_provider, p_publication_id, p_message, p_payload, p_error_code, p_correlation_id)
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
END;
$$;