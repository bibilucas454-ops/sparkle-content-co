-- 1. Restrict music_sync_jobs read access to authenticated users only
DROP POLICY IF EXISTS "Anyone can read sync jobs" ON public.music_sync_jobs;

CREATE POLICY "Authenticated users can read sync jobs"
ON public.music_sync_jobs FOR SELECT
TO authenticated
USING (true);

-- 2. Harden profiles plan protection: ensure clients can never update the plan column
REVOKE UPDATE (plan) ON public.profiles FROM authenticated;
REVOKE UPDATE (plan) ON public.profiles FROM anon;