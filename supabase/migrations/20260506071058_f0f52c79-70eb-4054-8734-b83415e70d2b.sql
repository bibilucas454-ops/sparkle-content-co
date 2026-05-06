ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own publications" ON public.publications;
CREATE POLICY "Users can CRUD own publications" ON public.publications
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.publication_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can view own publication_targets" ON public.publication_targets
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_targets.publication_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can insert own publication_targets" ON public.publication_targets
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_targets.publication_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own publication_targets" ON public.publication_targets;
CREATE POLICY "Users can update own publication_targets" ON public.publication_targets
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.publications p WHERE p.id = publication_targets.publication_id AND p.user_id = auth.uid()));

ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own social_tokens" ON public.social_tokens;
CREATE POLICY "Users can manage own social_tokens" ON public.social_tokens
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.publication_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own publication_jobs" ON public.publication_jobs;
CREATE POLICY "Users can view own publication_jobs" ON public.publication_jobs
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.publication_targets pt JOIN public.publications p ON p.id = pt.publication_id WHERE pt.id = publication_jobs.publication_target_id AND p.user_id = auth.uid()));

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own uploads" ON public.uploads;
CREATE POLICY "Users can CRUD own uploads" ON public.uploads
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile safe columns" ON public.profiles;
CREATE POLICY "Users can update own profile safe columns" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND NOT (plan IS DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())));