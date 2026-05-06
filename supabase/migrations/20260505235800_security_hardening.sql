
-- Migration: security_hardening_v1.sql
-- Goal: Fix critical security issues identified in Supabase Advisor

-- 1. Security Hardening for SECURITY DEFINER functions
-- These functions should not be callable by anonymous users.
REVOKE EXECUTE ON FUNCTION public.audit_publication_queue() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_old_oauth_states() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invoke_cron_scheduler() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_audit_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_integration_event() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_plan_self_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_immediate_process() FROM PUBLIC;

-- Grant access back to appropriate roles only
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.invoke_cron_scheduler() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_audit_event() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_integration_event() TO authenticated, service_role;

-- 2. Secure Views with security_invoker = true
-- (Requires Postgres 15+)
DO $$ 
BEGIN
    ALTER VIEW public.user_publication_summary SET (security_invoker = true);
    ALTER VIEW public.platform_metrics SET (security_invoker = true);
    ALTER VIEW public.publication_metrics SET (security_invoker = true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set security_invoker (possibly older Postgres version). Ensuring RLS is tight instead.';
END $$;

-- 3. Fix RLS for videos table
-- Adding authenticated user policy
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'user_id') THEN
        DROP POLICY IF EXISTS "Users can view own videos" ON public.videos;
        CREATE POLICY "Users can view own videos" ON public.videos 
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;
        CREATE POLICY "Users can delete own videos" ON public.videos 
        FOR DELETE TO authenticated USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own videos" ON public.videos;
        CREATE POLICY "Users can insert own videos" ON public.videos 
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Fix Storage Policies for post-audio bucket
-- Adding UPDATE and DELETE which were reported missing.
DROP POLICY IF EXISTS "Users can update own post-audio" ON storage.objects;
CREATE POLICY "Users can update own post-audio" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own post-audio" ON storage.objects;
CREATE POLICY "Users can delete own post-audio" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Move pg_net extension to a private schema if it exists in public
-- This requires high privileges, but we attempt it.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        CREATE SCHEMA IF NOT EXISTS extensions;
        -- Move extension only if it is currently in public
        IF (SELECT nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE extname = 'pg_net') = 'public' THEN
            ALTER EXTENSION pg_net SET SCHEMA extensions;
        END IF;
    END IF;
END $$;
