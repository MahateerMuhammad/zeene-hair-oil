-- TEMPORARY: Disable RLS for testing (NOT for production)
-- Run this in your Supabase SQL Editor

-- Disable RLS on storage.objects (TEMPORARY ONLY)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- NOTE: This makes your storage bucket accessible to everyone
-- Only use this for testing, then re-enable RLS with proper policies

-- To re-enable RLS later, run:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;