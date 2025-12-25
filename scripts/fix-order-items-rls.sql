-- Fix RLS policies for order_items table to allow admin access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow order item creation" ON public.order_items;
DROP POLICY IF EXISTS "Guest users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated users to read order items" ON public.order_items;

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert order items (for guest checkout)
CREATE POLICY "Allow order item creation" ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow all authenticated users to read order items (simplified for admin access)
CREATE POLICY "Allow authenticated users to read order items" ON public.order_items
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 3: Admins can update and delete order items
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items';
