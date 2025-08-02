-- Add quantity field to orders table
-- Run this script in your Supabase SQL Editor

-- Add quantity column if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);

-- Update existing orders to have quantity = 1 if null
UPDATE public.orders SET quantity = 1 WHERE quantity IS NULL;

-- Make quantity NOT NULL
ALTER TABLE public.orders ALTER COLUMN quantity SET NOT NULL;