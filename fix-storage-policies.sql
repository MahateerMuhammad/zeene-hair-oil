-- Fix Supabase Storage RLS Policies for ZEENE Hair Oil
-- Run this in your Supabase SQL Editor

-- First, check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'product-images';

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET1
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;

-- Create policy for authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-images');

-- Create policy for public read access to images
CREATE POLICY "Allow public read access to product images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'product-images');

-- Create policy for authenticated users to update images
CREATE POLICY "Allow authenticated users to update product images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'product-images');

-- Create policy for authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete product images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-images');

-- Verify everything was created correctly
SELECT 'Buckets:' as type, id as name, public, file_size_limit FROM storage.buckets WHERE id = 'product-images'
UNION ALL
SELECT 'Policies:' as type, policyname as name, cmd::text as public, null as file_size_limit 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%product-images%';