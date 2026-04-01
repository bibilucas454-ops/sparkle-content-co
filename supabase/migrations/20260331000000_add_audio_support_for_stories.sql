-- Migration: Add audio support for Story music
-- Date: 2026-03-31

-- 1. Add audio file path to post_media (for attaching audio to video)
ALTER TABLE public.post_media 
ADD COLUMN IF NOT EXISTS audio_upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL;

-- 2. Add music metadata columns to publications
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS music_volume NUMERIC(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS music_fade_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS music_fade_out INTEGER DEFAULT 0;

-- 3. Create audio merges table to track processed files
CREATE TABLE IF NOT EXISTS public.audio_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID REFERENCES public.publications(id) ON DELETE CASCADE,
    video_upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
    audio_upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
    merged_upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
    music_volume NUMERIC(3,2) DEFAULT 0.8,
    music_fade_in INTEGER DEFAULT 0,
    music_fade_out INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index for querying merges by publication
CREATE INDEX idx_audio_merges_publication_id ON public.audio_merges(publication_id);

-- RLS for audio_merges
ALTER TABLE public.audio_merges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audio_merges" 
    ON public.audio_merges
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.publications p
            WHERE p.id = audio_merges.publication_id AND p.user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.audio_merges IS 'Track audio merge operations for Story videos';
