-- Fix guest order insertion by creating a more permissive policy
-- This will allow both authenticated and guest users to insert orders

-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Allow order creation" ON orders;

-- Create a simple, permissive INSERT policy that allows all inserts
CREATE POLICY "Allow all order inserts" ON orders 
FOR INSERT 
WITH CHECK (true);

-- Alternative: If you want more security, use this policy instead:
-- CREATE POLICY "Allow order creation v2" ON orders 
-- FOR INSERT 
-- WITH CHECK (
--   -- Allow authenticated users to create orders with their user_id
--   (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
--   OR 
--   -- Allow anyone to create guest orders (user_id = NULL)
--   (user_id IS NULL)
-- );

-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;