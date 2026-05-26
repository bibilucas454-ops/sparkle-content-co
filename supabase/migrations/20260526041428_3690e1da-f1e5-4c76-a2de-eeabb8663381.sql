-- DELETE policy for post-audio
CREATE POLICY "Users can delete own audios"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE policies per bucket (owner folder scoped)
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own creator-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own audios"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'post-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
