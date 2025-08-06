-- Enable guest orders by updating RLS policies
-- This script allows orders to be inserted and viewed even when user_id is NULL (guest orders)

-- Drop existing order policies
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Create new policies that support guest orders
-- Allow authenticated users to insert orders for themselves
CREATE POLICY "Authenticated users can insert their own orders" ON orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow guest users to insert orders (user_id will be NULL)
CREATE POLICY "Guest users can insert orders" ON orders 
FOR INSERT 
WITH CHECK (user_id IS NULL);

-- Allow authenticated users to view their own orders
CREATE POLICY "Authenticated users can view their own orders" ON orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Guest orders are not viewable by guests since they don't have accounts
-- Only admins can view guest orders through the existing admin policy

-- Keep the existing admin policy unchanged
-- "Admins can view all orders" policy already exists and covers all orders including guest orders