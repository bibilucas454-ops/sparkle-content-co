
-- 1. Ensure oauth_states table exists
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Housekeeping function to automatically delete old states
CREATE OR REPLACE FUNCTION delete_old_oauth_states()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE created_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_delete_old_oauth_states ON public.oauth_states;
CREATE TRIGGER trigger_delete_old_oauth_states
  AFTER INSERT ON public.oauth_states
  EXECUTE FUNCTION delete_old_oauth_states();

-- RLS for oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own oauth states" ON public.oauth_states;
CREATE POLICY "Users can insert own oauth states" ON public.oauth_states
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own oauth states" ON public.oauth_states;
CREATE POLICY "Users can view own oauth states" ON public.oauth_states
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Fix publication_jobs RLS
ALTER TABLE public.publication_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own publication_jobs" ON public.publication_jobs;
CREATE POLICY "Users can insert own publication_jobs" ON public.publication_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.publication_targets pt
      JOIN public.publications p ON pt.publication_id = p.id
      WHERE pt.id = publication_jobs.publication_target_id AND p.user_id = auth.uid()
    )
  );

-- 3. Fix publication_logs RLS (Allow Insert)
ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own publication logs" ON public.publication_logs;
CREATE POLICY "Users can insert own publication logs" ON public.publication_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.publication_targets pt
    JOIN public.publications p ON p.id = pt.publication_id
    WHERE pt.id = publication_target_id AND p.user_id = auth.uid()
  ));

-- 4. Fix publication_attempts RLS (Allow Select)
ALTER TABLE public.publication_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own publication_attempts" ON public.publication_attempts;
CREATE POLICY "Users can view own publication_attempts" ON public.publication_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.publication_jobs pj
      JOIN public.publication_targets pt ON pj.publication_target_id = pt.id
      JOIN public.publications p ON pt.publication_id = p.id
      WHERE pj.id = publication_job_id AND p.user_id = auth.uid()
    )
  );
