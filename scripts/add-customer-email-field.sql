-- Add customer_email field to orders table for guest email notifications
-- This allows both guest and authenticated users to receive order confirmation/rejection emails

-- Add customer_email column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Create index for better performance when querying by email
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Update existing orders to populate customer_email from users table where possible
UPDATE orders 
SET customer_email = users.email 
FROM users 
WHERE orders.user_id = users.id 
AND orders.customer_email IS NULL;

-- Verify the changes
SELECT 
  id,
  customer_name,
  customer_email,
  user_id,
  status,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;