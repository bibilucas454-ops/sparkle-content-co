-- advanced_scheduling_engine.sql
-- Fase 2.1: Migrations for Multi-Media & Background Queues

-- 1. Relax upload_id constraint on publications to support carousel (N mídias)
ALTER TABLE public.publications
ALTER COLUMN upload_id DROP NOT NULL;

-- 2. Create post_media connection table
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
    upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    media_type TEXT NOT NULL DEFAULT 'video', -- 'video' | 'image'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast sort query
CREATE INDEX idx_post_media_publication_id ON public.post_media(publication_id);

-- 3. Create Fila Operacional (publication_jobs)
-- Estado possível: 'queued', 'processing', 'completed', 'failed'
CREATE TABLE IF NOT EXISTS public.publication_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_target_id UUID NOT NULL UNIQUE REFERENCES public.publication_targets(id) ON DELETE CASCADE,
    run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'queued',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    locked_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indices for queue sweeping
CREATE INDEX idx_publication_jobs_run_at ON public.publication_jobs(status, run_at);

-- 4. Create Histórico de Falhas/Tentativas (publication_attempts)
CREATE TABLE IF NOT EXISTS public.publication_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_job_id UUID NOT NULL REFERENCES public.publication_jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    error_message TEXT,
    http_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_publication_attempts_job_id ON public.publication_attempts(publication_job_id);

-- RLS: Apply security defaults
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_attempts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view/insert their own post_media via publications
CREATE POLICY "Users can manage their own post_media" 
    ON public.post_media
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = post_media.publication_id AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = post_media.publication_id AND p.user_id = auth.uid()
        )
    );

-- Users can view their own publication_jobs
CREATE POLICY "Users can view their own publication_jobs"
    ON public.publication_jobs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.publication_targets pt
            JOIN public.publications p ON pt.publication_id = p.id
            WHERE pt.id = publication_jobs.publication_target_id AND p.user_id = auth.uid()
        )
    );

-- Allow backend service role full access to jobs and attempts
-- Supabase default service_role bypasses RLS, but explicit is good.
