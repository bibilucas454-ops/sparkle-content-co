
ALTER TABLE public.trends 
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS hashtags text,
  ADD COLUMN IF NOT EXISTS format text;

-- Allow authenticated users to insert trends
CREATE POLICY "Authenticated users can insert trends"
  ON public.trends FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete trends
CREATE POLICY "Authenticated users can delete trends"
  ON public.trends FOR DELETE TO authenticated
  USING (true);
