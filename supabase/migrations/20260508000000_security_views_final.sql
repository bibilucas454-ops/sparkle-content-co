-- ============================================================
-- SECURITY: Migration final - Corrigir Security Definer Views
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Aplicar security_invoker a TODAS as views públicas
-- Views com security_invoker respeitam RLS do usuário consultante
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_publication_summary' AND table_schema = 'public') THEN
        ALTER VIEW public.user_publication_summary SET (security_invoker = true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'publication_metrics' AND table_schema = 'public') THEN
        ALTER VIEW public.publication_metrics SET (security_invoker = true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'platform_metrics' AND table_schema = 'public') THEN
        ALTER VIEW public.platform_metrics SET (security_invoker = true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'story_generation_stats' AND table_schema = 'public') THEN
        ALTER VIEW public.story_generation_stats SET (security_invoker = true);
    END IF;
    
    RAISE NOTICE 'Security invoker aplicado todas as views.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: security_invoker pode nao ser suportado nesta versao. Verifique manualmente.';
END $$;

-- 2) Verificar se as policies de storage estão aplicadas corretamente
SELECT 
    policyname,
    tablename
FROM pg_policies 
WHERE schemaname = 'storage'
AND policyname LIKE '%own%';

-- 3) Confirmar políticas de usuários nas tabelas principais
SELECT 
    policyname,
    tablename,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%own%'
ORDER BY tablename;

-- 4) Verificar security_invoker das views
SELECT 
    schemaname,
    viewname,
    security_definer,
    security_invoker
FROM pg_views 
WHERE schemaname = 'public'
AND viewname IN (
    'user_publication_summary',
    'publication_metrics',
    'platform_metrics',
    'story_generation_stats'
);