-- Migration: Professional SaaS Evolution - Advanced Scheduling & Content
-- Goal: Improve job state granularity, content approval, and audit hooks.

-- 1. Add approval_status to publications
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'approved'));

-- 2. Expand status choices for publication_jobs
-- Note: We use a check constraint if it doesn't already have one, or just allow the text.
-- Current states: 'queued', 'processing', 'completed', 'failed'
-- New states: 'draft', 'ready', 'scheduled', 'queued', 'processing', 'published', 'failed', 'retrying', 'cancelled'
-- Since we already have a status column, we'll just update the application logic, 
-- but we can add a comment or constraint for documentation.
COMMENT ON COLUMN public.publication_jobs.status IS 'States: draft, ready, scheduled, queued, processing, published, failed, retrying, cancelled';

-- 3. Add correlation_id if not present (for cross-service tracing)
ALTER TABLE public.integration_events
ADD COLUMN IF NOT EXISTS correlation_id UUID;

-- 4. Create a function to easily log audit events from SQL if needed
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_provider TEXT DEFAULT NULL,
    p_publication_id UUID DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.integration_events (
        user_id, event_type, provider, publication_id, message, payload, error_code, correlation_id
    ) VALUES (
        p_user_id, p_event_type, p_provider, p_publication_id, p_message, p_payload, p_error_code, p_correlation_id
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure publication_jobs has idempotency_key UNIQUE constraint if not already present
-- (Previous migration might have added it without UNIQUE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'publication_jobs_idempotency_key_key'
    ) THEN
        ALTER TABLE public.publication_jobs ADD CONSTRAINT publication_jobs_idempotency_key_key UNIQUE (idempotency_key);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if column doesn't exist yet or other issues
END $$;
