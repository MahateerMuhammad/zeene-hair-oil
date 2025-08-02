-- Check if the bucket is public
-- Run this in Supabase SQL Editor

SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'product-images';

-- If public = false, run this to make it public:
-- UPDATE storage.buckets SET public = true WHERE id = 'product-images';