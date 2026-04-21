-- 1. Ativar RLS na tabela videos (estava completamente exposta)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages videos"
  ON public.videos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Remover policy permissiva demais em music_sync_jobs
DROP POLICY IF EXISTS "Service role can manage sync jobs" ON public.music_sync_jobs;

CREATE POLICY "Service role manages sync jobs"
  ON public.music_sync_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Corrigir search_path em funções vulneráveis
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;