
ALTER TABLE public.trends 
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS hashtags text,
  ADD COLUMN IF NOT EXISTS format text;

-- Allow authenticated users to insert trends (REDACTED FOR SECURITY)
CREATE POLICY "Authenticated users can insert trends"
  ON public.trends FOR INSERT TO authenticated
  WITH CHECK (false);

-- Allow authenticated users to delete trends (REDACTED FOR SECURITY)
CREATE POLICY "Authenticated users can delete trends"
  ON public.trends FOR DELETE TO authenticated
  USING (false);
