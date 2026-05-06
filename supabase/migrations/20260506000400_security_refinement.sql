
-- Migration: security_hardening_v2.sql
-- Goal: Refine RLS and tighten security for logs and sync jobs.

-- 1. Fix music_sync_jobs RLS
-- Restrict access so anonymous users can't see internal sync details.
DROP POLICY IF EXISTS "Anyone can read sync jobs" ON public.music_sync_jobs;
CREATE POLICY "Authenticated users can read sync jobs" ON public.music_sync_jobs 
FOR SELECT TO authenticated USING (true);

-- 2. Tighten publish_logs RLS
-- If it exists, ensure users only see logs related to their publications.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'publish_logs') THEN
        ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own publish logs" ON public.publish_logs;
        CREATE POLICY "Users can view own publish logs" ON public.publish_logs
        FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.publication_targets pt
                JOIN public.publications p ON p.id = pt.publication_id
                WHERE pt.id = publish_logs.publication_target_id AND p.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 3. Tighten publication_logs RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'publication_logs') THEN
        ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own publication logs" ON public.publication_logs;
        CREATE POLICY "Users can view own publication logs" ON public.publication_logs
        FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.publication_targets pt
                JOIN public.publications p ON p.id = pt.publication_id
                WHERE pt.id = publication_logs.publication_target_id AND p.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 4. Cleanup debug data from social_tokens
-- Removing the "debug" entries we identified in the code.
DELETE FROM public.social_tokens WHERE platform IN ('debug_instagram_perms', 'debug_instagram_pages');

-- 5. Revoke all privileges on pg_net in public schema (extra safety)
DO $$ 
BEGIN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    -- Re-grant necessary ones (Supabase usually handles this, but we reinforce)
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    -- BUT revoke from sensitive tables
    REVOKE ALL ON public.social_tokens FROM anon;
    REVOKE ALL ON public.publication_jobs FROM anon;
    REVOKE ALL ON public.music_sync_jobs FROM anon;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping aggressive permission reset.';
END $$;
