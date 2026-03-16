-- Add music_metadata column to publications table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publications' AND column_name = 'music_metadata') THEN
        ALTER TABLE public.publications ADD COLUMN music_metadata jsonb DEFAULT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.publications.music_metadata IS 'Metadata for audio/music attached to the post (title, artist, url, viral_id)';
