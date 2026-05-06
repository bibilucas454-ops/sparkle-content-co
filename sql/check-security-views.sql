-- ============================================================
-- SECURITY: Verificar e corrigir views com SECURITY DEFINER
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Verificar views existentes
SELECT 
  table_name as view_name,
  (SELECT pg_get_viewdef(table_name::regclass, true)) as definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN (
  'user_publication_summary',
  'publication_metrics', 
  'platform_metrics',
  'story_generation_stats'
);

-- 2) Listar todas as views com DEFINER (se houver)
SELECT 
  routine_name as function_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- 3) Verificar security_invoker de todas as views
-- Se a view não tiver security_invoker=true, ela usa DEFINER por padrão
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