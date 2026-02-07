-- Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('meter-photos', 'task-attachments', 'handover-files');

-- Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Anyone can view meter photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view handover files" ON storage.objects;

-- Create authenticated-only SELECT policies
CREATE POLICY "Authenticated users can view meter photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'meter-photos');

CREATE POLICY "Authenticated users can view task attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated users can view handover files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'handover-files');
