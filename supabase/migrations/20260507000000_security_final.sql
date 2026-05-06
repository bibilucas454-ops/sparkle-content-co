-- ============================================================
-- SECURITY: Migration final para views
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Aplicar security_invoker a TODAS as views públicas
-- Isso garante que as views respeitam RLS do usuário
DO $$ 
BEGIN
    -- user_publication_summary
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_publication_summary') THEN
        ALTER VIEW public.user_publication_summary SET (security_invoker = true);
    END IF;

    -- publication_metrics
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'publication_metrics') THEN
        ALTER VIEW public.publication_metrics SET (security_invoker = true);
    END IF;

    -- platform_metrics
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'platform_metrics') THEN
        ALTER VIEW public.platform_metrics SET (security_invoker = true);
    END IF;

    -- story_generation_stats
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'story_generation_stats') THEN
        ALTER VIEW public.story_generation_stats SET (security_invoker = true);
    END IF;
    
    RAISE NOTICE 'Security invoker aplicado a todas as views.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: security_invoker pode não ser suportado nesta versão. Verifique manualmente.';
END $$;

-- 2) Verificar se as policies de storage estão aplicadas
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