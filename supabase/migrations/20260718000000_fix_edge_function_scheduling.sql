-- Fix trigger_immediate_processing to also handle "scheduled" and "ready" jobs
-- Also triggers for "scheduled" jobs that are due NOW (past schedule)
CREATE OR REPLACE FUNCTION public.trigger_immediate_processing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only trigger for jobs meant to run NOW or in the past
  -- Covers: queued (immediate), ready (approved), scheduled (due now)
  IF NEW.run_at <= NOW() AND NEW.status IN ('queued', 'ready', 'scheduled') THEN
    PERFORM net.http_post(
      url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      body := '{}'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Also update the cron scheduler function to use the same improved logic
CREATE OR REPLACE FUNCTION public.invoke_cron_scheduler()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
    body := '{}'
  );
END;
$$;

-- Add index on locked_at for stuck processing detection  
CREATE INDEX IF NOT EXISTS idx_publication_jobs_locked_at ON public.publication_jobs(locked_at) WHERE status = 'processing';
