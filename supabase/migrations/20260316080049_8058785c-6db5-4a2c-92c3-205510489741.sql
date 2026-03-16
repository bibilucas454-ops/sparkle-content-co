
-- Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('videos', 'thumbnails', 'creator-media');

-- Drop overly permissive anon SELECT policies
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view public media" ON storage.objects;

-- Add authenticated-only SELECT policies scoped to user
CREATE POLICY "Authenticated users can view own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view own thumbnails"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view own creator-media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);
