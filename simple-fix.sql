-- SIMPLE FIX: Disable RLS temporarily for testing
-- Run this in your Supabase SQL Editor

-- This will allow image uploads to work immediately
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Check if bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';