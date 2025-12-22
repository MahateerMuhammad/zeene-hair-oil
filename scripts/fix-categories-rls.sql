-- Fix RLS policies for categories table
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON categories;

-- Allow anyone to read categories
CREATE POLICY "Allow public read access to categories"
ON categories
FOR SELECT
TO public
USING (true);

-- Allow authenticated users (admins) to insert categories
CREATE POLICY "Allow authenticated users to insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users (admins) to update categories
CREATE POLICY "Allow authenticated users to update categories"
ON categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users (admins) to delete categories
CREATE POLICY "Allow authenticated users to delete categories"
ON categories
FOR DELETE
TO authenticated
USING (true);
