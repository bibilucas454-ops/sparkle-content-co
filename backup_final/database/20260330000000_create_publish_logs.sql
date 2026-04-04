-- Tabela para logs detalhados de publicação Instagram (API responses)
CREATE TABLE IF NOT EXISTS public.publish_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_target_id uuid REFERENCES public.publication_targets(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content_type text NOT NULL, -- story, reel, post, carousel
  endpoint text NOT NULL, -- /media, /media_publish, etc
  method text NOT NULL, -- POST, GET
  request_body jsonb,
  response_body jsonb,
  response_status integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publish logs" ON public.publish_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.publication_targets pt
    JOIN public.publications p ON p.id = pt.publication_id
    WHERE pt.id = publication_target_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert publish logs" ON public.publish_logs
  FOR INSERT TO service_role USING (true);
