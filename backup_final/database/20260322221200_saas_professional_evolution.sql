-- saas_professional_evolution.sql
-- Evolution of social integrations and publication pipeline to professional standards

-- 1. Enhance social_tokens with status and error tracking
ALTER TABLE public.social_tokens 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS last_error_code TEXT;

-- 2. Create integration_events for audit and observability
CREATE TABLE IF NOT EXISTS public.integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'auth_success', 'auth_failure', 'token_refresh', 'token_refresh_failure'
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_events_user_platform ON public.integration_events(user_id, platform);
CREATE INDEX idx_integration_events_created_at ON public.integration_events(created_at);

-- RLS for integration_events
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own integration events" ON public.integration_events
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Enhance publication_jobs with idempotency and exhaustive status
ALTER TABLE public.publication_jobs 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_publication_jobs_idempotency ON public.publication_jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4. Update publication_targets status check (if any)
-- Currently it's a TEXT column, we will standardise usage in code.

-- 5. Helper function to log integration events
CREATE OR REPLACE FUNCTION public.log_integration_event(
    p_user_id UUID,
    p_platform TEXT,
    p_event_type TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.integration_events (user_id, platform, event_type, payload)
    VALUES (p_user_id, p_platform, p_event_type, p_payload)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
