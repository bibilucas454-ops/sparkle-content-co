
-- Migration: 20260323090000_update_scheduler_trigger.sql
-- Goal: Ensure 'ready' status also triggers immediate processing

-- Note: Using environment variable directly is not possible in SQL
-- The trigger uses net.http_post which needs authentication
-- We'll use the anon key with service role bypass via function

-- Create a helper to call the scheduler - uses anon key (which has access)
-- This works because the cron-scheduler function has verify_jwt = false
CREATE OR REPLACE FUNCTION public.trigger_immediate_processing()
RETURNS trigger AS $$
BEGIN
  -- Only trigger for jobs meant to run NOW or in the past
  -- Now includes 'ready' and 'queued'
  IF (NEW.status = 'queued' OR NEW.status = 'ready') AND NEW.run_at <= NOW() THEN
    -- Use anon key - the function has verify_jwt = false
    PERFORM net.http_post(
      url := 'https://wjzxntgpuimiubrnqfnz.supabase.co/functions/v1/cron-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZnhudHBndWltcXVicm5xZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYyMDAwMDAwMH0.placeholder'
      ),
      body := '{}'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
