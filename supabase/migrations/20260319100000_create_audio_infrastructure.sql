-- 1. Create Storage Bucket for Audios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Audios
DO $$ 
BEGIN
    -- Policy: Allow public to view audios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'audios');
    END IF;

    -- Policy: Allow authenticated users to upload audios
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audios');
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
