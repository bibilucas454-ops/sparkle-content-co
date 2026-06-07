CREATE POLICY "Users can update own publication_jobs"
ON public.publication_jobs
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.publication_targets pt
  JOIN public.publications p ON p.id = pt.publication_id
  WHERE pt.id = publication_jobs.publication_target_id
    AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.publication_targets pt
  JOIN public.publications p ON p.id = pt.publication_id
  WHERE pt.id = publication_jobs.publication_target_id
    AND p.user_id = auth.uid()
));