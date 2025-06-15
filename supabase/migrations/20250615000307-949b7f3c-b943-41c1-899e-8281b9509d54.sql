
-- Grant INSERT access on storage.objects for authenticated users
CREATE POLICY "Authenticated users can insert objects"
ON storage.objects
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Grant SELECT access on storage.objects for authenticated users
CREATE POLICY "Authenticated users can select objects"
ON storage.objects
FOR SELECT
USING (auth.role() = 'authenticated');

-- Grant UPDATE access on storage.objects for authenticated users
CREATE POLICY "Authenticated users can update objects"
ON storage.objects
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Grant DELETE access on storage.objects for authenticated users
CREATE POLICY "Authenticated users can delete objects"
ON storage.objects
FOR DELETE
USING (auth.role() = 'authenticated');
