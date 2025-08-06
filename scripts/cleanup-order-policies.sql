-- Clean up conflicting order policies
-- This script removes all existing order policies and creates clean, non-conflicting ones

-- First, drop ALL existing order policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Guest users can insert orders" ON orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create clean, non-conflicting policies

-- 1. INSERT policies - Allow both authenticated and guest users to create orders
CREATE POLICY "Allow order creation" ON orders 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and creating their own order
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Allow if it's a guest order (user_id is NULL)
  (auth.uid() IS NULL AND user_id IS NULL)
  OR
  -- Allow if user is authenticated but creating a guest order
  (auth.uid() IS NOT NULL AND user_id IS NULL)
);

-- 2. SELECT policies - Users can view their own orders, admins can view all
CREATE POLICY "View own orders" ON orders 
FOR SELECT 
USING (
  -- Users can view their own orders
  (auth.uid() = user_id)
  OR
  -- Admins can view all orders
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 3. UPDATE policies - Only admins can update orders
CREATE POLICY "Admin update orders" ON orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. DELETE policies - Only admins can delete orders
CREATE POLICY "Admin delete orders" ON orders 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;