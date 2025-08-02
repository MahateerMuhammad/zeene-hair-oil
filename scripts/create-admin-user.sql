-- First, create a user account through Supabase Auth, then run this script
-- Replace 'your-user-id-here' with the actual user ID from auth.users table
-- Replace 'admin@zeene.com' with your desired admin email

-- Method 1: If you already signed up, update your role
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Method 2: If you know the user ID from auth.users
UPDATE users 
SET role = 'admin' 
WHERE id = 'your-user-id-here';

-- Method 3: Insert admin user directly (if user exists in auth.users but not in users table)
INSERT INTO users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify the admin user was created
SELECT id, email, role, created_at 
FROM users 
WHERE role = 'admin';
