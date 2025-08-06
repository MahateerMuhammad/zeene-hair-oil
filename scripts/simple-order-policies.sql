-- Simple order policies that should work for both guest and authenticated users
-- This approach temporarily disables RLS for orders to allow all operations

-- Disable RLS on orders table to allow guest orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these simple policies instead:
-- 
-- -- Drop all existing policies first
-- DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
-- DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
-- DROP POLICY IF EXISTS "Authenticated users can insert their own orders" ON orders;
-- DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON orders;
-- DROP POLICY IF EXISTS "Guest users can insert orders" ON orders;
-- DROP POLICY IF EXISTS "Only admins can delete orders" ON orders;
-- DROP POLICY IF EXISTS "Only admins can update orders" ON orders;
-- DROP POLICY IF EXISTS "Users can insert orders" ON orders;
-- DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
-- 
-- -- Create simple policies
-- CREATE POLICY "Allow all inserts" ON orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow own selects" ON orders FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
-- CREATE POLICY "Admin updates" ON orders FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
-- CREATE POLICY "Admin deletes" ON orders FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));