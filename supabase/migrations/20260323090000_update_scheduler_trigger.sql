
-- Migration: 20260323090000_update_scheduler_trigger.sql
-- Goal: Ensure 'ready' status also triggers immediate processing

CREATE OR REPLACE FUNCTION public.trigger_immediate_processing()
RETURNS trigger AS $$
BEGIN
  -- Only trigger for jobs meant to run NOW or in the past
  -- Now includes 'ready' and 'queued'
  IF (NEW.status = 'queued' OR NEW.status = 'ready') AND NEW.run_at <= NOW() THEN
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
