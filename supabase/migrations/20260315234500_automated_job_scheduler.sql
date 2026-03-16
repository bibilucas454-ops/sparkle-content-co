
-- Migration: 20260315234500_automated_job_scheduler.sql
-- Goal: Automate the processing of the publication queue

-- 1. Enable pg_cron and pg_net extensions if available
-- Note: In Supabase, these are often pre-enabled or need a UI toggle, 
-- but doing it via SQL is safe if the user has permissions.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create a helper function to invoke the cron-scheduler Edge Function
-- This function uses pg_net to call the URL asynchronously
CREATE OR REPLACE FUNCTION public.invoke_cron_scheduler()
RETURNS void AS $$
BEGIN
  -- We use the SUPABASE_URL and SERVICE_ROLE_KEY which must be available in the environment
  -- Since we can't easily access env vars in pure SQL without vault/config, 
  -- we rely on the standard Supabase Edge Function URL format.
  PERFORM net.http_post(
    url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the worker to run every minute via pg_cron
-- We use a dummy check to see if pg_cron actually works in this env
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule the cron-scheduler function call
        -- Note: We assume the service_role_key is available in settings or hardcoded (not ideal)
        -- In Supabase, the best way to call an edge function via cron is often via the UI or a direct HTTP call if possible.
        PERFORM cron.schedule('process-publication-queue', '* * * * *', 'SELECT net.http_post(''https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler'', ''{}'', ''{}'', jsonb_build_object(''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true)))');
    END IF;
END $$;

-- 4. Immediate Processing Trigger
-- This ensures that when a job is inserted (e.g. "Publish Now"), the worker is called immediately
-- rather than waiting for the next minute's cron tick.
CREATE OR REPLACE FUNCTION public.trigger_immediate_processing()
RETURNS trigger AS $$
BEGIN
  -- Only trigger for jobs meant to run NOW or in the past
  IF NEW.status = 'queued' AND NEW.run_at <= NOW() THEN
    PERFORM net.http_post(
      url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_process_now ON public.publication_jobs;
CREATE TRIGGER trigger_process_now
  AFTER INSERT ON public.publication_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_immediate_processing();

-- 5. Fix possible RLS omission for service role on publication_targets
-- (Just in case the worker needs it)
ALTER TABLE public.publication_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role access all" ON public.publication_targets;
CREATE POLICY "Service role access all" ON public.publication_targets 
  TO service_role USING (true) WITH CHECK (true);
