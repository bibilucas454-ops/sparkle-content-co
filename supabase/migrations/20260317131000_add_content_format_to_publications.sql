-- 20260317131000_add_content_format_to_publications.sql
-- Add content_format column to publications table

-- 1. Add column with default 'reels' to maintain compatibility
ALTER TABLE public.publications 
ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'reels' 
CHECK (content_format IN ('reels', 'carrossel', 'story'));

-- 2. Comment for documentation
COMMENT ON COLUMN public.publications.content_format IS 'The format of the content: reels (default), carrossel, or story.';
