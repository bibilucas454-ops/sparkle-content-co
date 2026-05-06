
-- Migration: security_hardening_v3.sql
-- Goal: Fix Security Definer Views and reinforce function security.

-- 1. Re-apply security_invoker = true to all views
-- This ensures that views respect the RLS of the querying user.
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
    
    RAISE NOTICE 'Security invoker set to true for all public views.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set security_invoker. Ensure you are on Postgres 15+.';
END $$;

-- 2. Audit SECURITY DEFINER functions
-- Ensuring they have search_path set and are not publicly executable where sensitive.

-- log_integration_event
ALTER FUNCTION public.log_integration_event(uuid, text, text, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_integration_event(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_integration_event(uuid, text, text, jsonb) TO authenticated, service_role;

-- trigger_immediate_processing
ALTER FUNCTION public.trigger_immediate_processing() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.trigger_immediate_processing() FROM PUBLIC;
-- This is a trigger function, usually doesn't need direct GRANT but good for safety.

-- log_audit_event
ALTER FUNCTION public.log_audit_event(uuid, text, text, uuid, text, jsonb, text, uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, uuid, text, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, uuid, text, jsonb, text, uuid) TO authenticated, service_role;

-- 3. Additional RLS reinforcement for integration_events
-- Users should only see their own integration events.
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own integration events" ON public.integration_events;
CREATE POLICY "Users can view own integration events" ON public.integration_events
FOR SELECT TO authenticated USING (auth.uid() = user_id);
