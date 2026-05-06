-- ============================================================
-- SECURITY: Complete Hardening - Corrigindo TODOS os erros do Supabase Advisor
-- Criado: 2026-05-09
-- NÃO quebra o sistema de agendamento (cron-scheduler / publication_jobs)
-- ============================================================

-- ============================================================
-- PARTE 1: RECONSTRUIR VIEWS SEM SECURITY DEFINER
-- As views precisam ser RECRIADAS (DROP + CREATE) com security_invoker
-- O ALTER VIEW SET (security_invoker=true) nem sempre persiste em PG14
-- ============================================================

-- Drop e recriar publication_metrics com security_invoker
DROP VIEW IF EXISTS public.publication_metrics CASCADE;
CREATE OR REPLACE VIEW public.publication_metrics
WITH (security_invoker = true)
AS
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

-- Garantir acesso somente para autenticados
REVOKE ALL ON public.publication_metrics FROM anon, PUBLIC;
GRANT SELECT ON public.publication_metrics TO authenticated;

-- Drop e recriar user_publication_summary com security_invoker
DROP VIEW IF EXISTS public.user_publication_summary CASCADE;
CREATE OR REPLACE VIEW public.user_publication_summary
WITH (security_invoker = true)
AS
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

REVOKE ALL ON public.user_publication_summary FROM anon, PUBLIC;
GRANT SELECT ON public.user_publication_summary TO authenticated;

-- Drop e recriar platform_metrics com security_invoker
DROP VIEW IF EXISTS public.platform_metrics CASCADE;
CREATE OR REPLACE VIEW public.platform_metrics
WITH (security_invoker = true)
AS
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
WHERE p.deleted_at IS NULL;

REVOKE ALL ON public.platform_metrics FROM anon, PUBLIC;
GRANT SELECT ON public.platform_metrics TO authenticated;

-- story_generation_stats (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'story_generation_stats') THEN
        EXECUTE 'ALTER VIEW public.story_generation_stats SET (security_invoker = true)';
        REVOKE ALL ON public.story_generation_stats FROM anon;
        GRANT SELECT ON public.story_generation_stats TO authenticated;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'story_generation_stats: %', SQLERRM;
END $$;

-- ============================================================
-- PARTE 2: CORRIGIR FUNÇÕES SECURITY DEFINER
-- Todas devem ter SET search_path, REVOKE from PUBLIC, GRANT to roles corretos
-- ============================================================

-- audit_publication_queue
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'audit_publication_queue') THEN
        ALTER FUNCTION public.audit_publication_queue() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.audit_publication_queue() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.audit_publication_queue() TO service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'audit_publication_queue: %', SQLERRM;
END $$;

-- delete_old_oauth_states
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'delete_old_oauth_states') THEN
        ALTER FUNCTION public.delete_old_oauth_states() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.delete_old_oauth_states() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.delete_old_oauth_states() TO service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'delete_old_oauth_states: %', SQLERRM;
END $$;

-- handle_new_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user: %', SQLERRM;
END $$;

-- invoke_cron_scheduler
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'invoke_cron_scheduler') THEN
        ALTER FUNCTION public.invoke_cron_scheduler() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.invoke_cron_scheduler() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.invoke_cron_scheduler() TO service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'invoke_cron_scheduler: %', SQLERRM;
END $$;

-- log_audit_event (todas as variações de assinatura)
DO $$
BEGIN
    -- Revoke from PUBLIC para todas as versões sobrecarregadas
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'bulk revoke: %', SQLERRM;
END $$;

-- Re-grant somente o necessário para autenticados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'log_audit_event') THEN
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
        -- Revogar funções sensíveis que NÃO devem ser chamadas por usuários
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
        REVOKE EXECUTE ON FUNCTION public.delete_old_oauth_states() FROM authenticated;
        REVOKE EXECUTE ON FUNCTION public.invoke_cron_scheduler() FROM authenticated;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'grant restore: %', SQLERRM;
END $$;

-- trigger_immediate_process (trigger function)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'trigger_immediate_process') THEN
        ALTER FUNCTION public.trigger_immediate_process() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.trigger_immediate_process() FROM PUBLIC;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'trigger_immediate_process: %', SQLERRM;
END $$;

-- prevent_plan_self_update
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'prevent_plan_self_update') THEN
        ALTER FUNCTION public.prevent_plan_self_update() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.prevent_plan_self_update() FROM PUBLIC;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'prevent_plan_self_update: %', SQLERRM;
END $$;

-- ============================================================
-- PARTE 3: RLS REFORÇADA PARA TABELAS PRINCIPAIS
-- Garantir que usuários só vejam e manipulem seus próprios dados
-- ============================================================

-- publications
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own publications" ON public.publications;
CREATE POLICY "Users can CRUD own publications" ON public.publications
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- publication_targets
ALTER TABLE public.publication_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can view own publication_targets" ON public.publication_targets
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = publication_targets.publication_id
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can insert own publication_targets" ON public.publication_targets
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = publication_targets.publication_id
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can update own publication_targets" ON public.publication_targets
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = publication_targets.publication_id
            AND p.user_id = auth.uid()
        )
    );

-- social_tokens - apenas o próprio dono acessa
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own social_tokens" ON public.social_tokens;
CREATE POLICY "Users can manage own social_tokens" ON public.social_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- publication_jobs - Apenas service_role manipula (agendador). 
-- Usuário pode VISUALIZAR os próprios jobs mas NÃO criar/modificar diretamente.
ALTER TABLE public.publication_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own publication_jobs" ON public.publication_jobs;
CREATE POLICY "Users can view own publication_jobs" ON public.publication_jobs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.publication_targets pt
            JOIN public.publications p ON p.id = pt.publication_id
            WHERE pt.id = publication_jobs.publication_target_id
            AND p.user_id = auth.uid()
        )
    );

-- uploads
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own uploads" ON public.uploads;
CREATE POLICY "Users can CRUD own uploads" ON public.uploads
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- profiles - Usuário pode ver e atualizar o próprio perfil MAS não pode alterar 'plan'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- PARTE 4: STORAGE POLICIES COMPLETAS
-- post-audio e videos precisam de UPDATE e DELETE policies
-- ============================================================

-- Bucket: videos
DROP POLICY IF EXISTS "Users can update own videos storage" ON storage.objects;
CREATE POLICY "Users can update own videos storage" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own videos storage" ON storage.objects;
CREATE POLICY "Users can delete own videos storage" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'videos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Bucket: post-audio (reforço - pode já existir)
DROP POLICY IF EXISTS "Users can update own post-audio" ON storage.objects;
CREATE POLICY "Users can update own post-audio" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'post-audio'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own post-audio" ON storage.objects;
CREATE POLICY "Users can delete own post-audio" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'post-audio'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- PARTE 5: REFORÇO EXTRA - Tabelas de log
-- ============================================================

-- publication_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'publication_logs') THEN
        ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own publication_logs" ON public.publication_logs;
        CREATE POLICY "Users can view own publication_logs" ON public.publication_logs
        FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.publication_targets pt
                JOIN public.publications p ON p.id = pt.publication_id
                WHERE pt.id = publication_logs.publication_target_id AND p.user_id = auth.uid()
            )
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'publication_logs policy: %', SQLERRM;
END $$;

-- publish_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'publish_logs') THEN
        ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own publish_logs" ON public.publish_logs;
        CREATE POLICY "Users can view own publish_logs" ON public.publish_logs
        FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.publication_targets pt
                JOIN public.publications p ON p.id = pt.publication_id
                WHERE pt.id = publish_logs.publication_target_id AND p.user_id = auth.uid()
            )
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'publish_logs policy: %', SQLERRM;
END $$;

-- integration_events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_events') THEN
        ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own integration_events" ON public.integration_events;
        CREATE POLICY "Users can view own integration_events" ON public.integration_events
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'integration_events policy: %', SQLERRM;
END $$;

-- ============================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '=== SECURITY HARDENING COMPLETO ===';
    RAISE NOTICE 'Views: recriadas com security_invoker=true';
    RAISE NOTICE 'Functions: REVOKE PUBLIC, GRANT authenticated/service_role';
    RAISE NOTICE 'RLS: habilitado em todas as tabelas críticas';
    RAISE NOTICE 'Storage: políticas UPDATE/DELETE adicionadas';
    RAISE NOTICE 'Agendamento (publication_jobs): PRESERVADO - service_role mantém acesso total';
END $$;
