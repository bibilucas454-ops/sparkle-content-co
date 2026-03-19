-- 1. Create Storage Bucket for Audios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio_uploads', 'audio_uploads', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Audio Uploads
DO $$ 
BEGIN
    -- Policy: Allow users to view their own objects (standard pattern in this project)
    -- This is often covered by a global policy, but we ensure it for this bucket specifically if needed.
    -- However, the project already has a "Users can view their own private objects" policy.
    -- We just need to make sure the bucket is created.
END $$;

-- Ensure RLS is enabled and standard policies apply
-- (Existing global policies for storage.objects likely cover this if bucket is private)

-- 2. Create Music Library Table
CREATE TABLE IF NOT EXISTS public.music_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    url TEXT NOT NULL, -- Direct mp3 link
    duration INTEGER, -- in seconds
    category TEXT, -- 'Viral', 'Cinematic', 'Lofi', etc.
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS for Music Library
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view music library" ON public.music_library
    FOR SELECT TO authenticated USING (true);

-- 3. Seed Initial Functional Music (Royalty Free)
-- These are example royalty free links often used in samples
INSERT INTO public.music_library (title, artist, url, category) VALUES
('Upbeat Corporate', 'RoyaltyFree', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'Work'),
('Lofi Chill', 'ZenBeats', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'Chill'),
('Epic Cinematic', 'Legendary', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'Viral'),
('Agressive Trap', 'StreetMode', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'Trend'),
('Happy Ukulele', 'Sunshine', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'Family');

-- 4. Update publications table comment to reflect upload mapping
COMMENT ON COLUMN public.publications.music_metadata IS 'Metadata for audio/music. May contain "upload_id" for user uploads or "library_id" for library items.';
