-- 1. Create Storage Bucket for Audio Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-audio', 'post-audio', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for post-audio (Hyphenated for clarity)
DO $$ 
BEGIN
    -- Policy: Allow users to upload their own audios to their own folder
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload audios' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can upload audios" ON storage.objects 
            FOR INSERT TO authenticated 
            WITH CHECK (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    -- Policy: Allow users to view their own audios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own audios' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can view own audios" ON storage.objects 
            FOR SELECT TO authenticated 
            USING (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

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
