-- Fix order permissions for regular users
-- This script addresses the privilege access problem where regular users can't place orders

-- First, let's ensure all authenticated users are in the users table
-- Create a function to automatically insert users when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add users to users table when they sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert any existing auth users who might not be in the users table
INSERT INTO public.users (id, email, role)
SELECT 
  au.id, 
  au.email, 
  'user' as role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Recreate policies with better logic
-- Users table policies
CREATE POLICY "Users can view their own data" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Products table policies
CREATE POLICY "Products are viewable by everyone" ON products 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Orders table policies
CREATE POLICY "Users can insert orders" ON orders 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can view their own orders" ON orders 
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all orders" ON orders 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own orders" ON orders 
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.orders TO authenticated;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add some debugging info
-- You can run this to check if users exist:
-- SELECT au.id, au.email, pu.role 
-- FROM auth.users au 
-- LEFT JOIN public.users pu ON au.id = pu.id;