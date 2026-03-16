
-- 1. Fix trends table: drop unrestricted INSERT and DELETE policies
DROP POLICY IF EXISTS "Authenticated users can insert trends" ON public.trends;
DROP POLICY IF EXISTS "Authenticated users can delete trends" ON public.trends;

-- Add service_role-only INSERT policy
CREATE POLICY "Service role can insert trends"
ON public.trends FOR INSERT
TO service_role
WITH CHECK (true);

-- Add service_role-only DELETE policy  
CREATE POLICY "Service role can delete trends"
ON public.trends FOR DELETE
TO service_role
USING (true);

-- 2. Lock function search_path for all custom functions
ALTER FUNCTION public.delete_old_oauth_states() SET search_path = public;
ALTER FUNCTION public.invoke_cron_scheduler() SET search_path = public;
ALTER FUNCTION public.trigger_immediate_processing() SET search_path = public;
ALTER FUNCTION public.audit_publication_queue() SET search_path = public;
