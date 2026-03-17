-- 20260317131000_add_content_format_to_publications.sql
-- Add content_format column to publications table

-- 1. Add column with default 'reels' to maintain compatibility
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'reels';

-- 2. Add constraint for valid formats
-- Note: 'carousel' is used as the technical value as per user request.
ALTER TABLE public.publications
DROP CONSTRAINT IF EXISTS publications_content_format_check;

ALTER TABLE public.publications
ADD CONSTRAINT publications_content_format_check 
CHECK (content_format IN ('reels', 'carousel', 'story'));

-- 3. Comment for documentation
COMMENT ON COLUMN public.publications.content_format IS 'The format of the content: reels (default), carousel, or story.';
