-- First, let's see what users exist in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Insert your auth user into the users table if not already there
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Alternative: If you know there's only one user (you), make the first user admin
UPDATE public.users 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Verify the admin user was created
SELECT u.id, u.email, u.role, u.created_at,
       au.email as auth_email, au.created_at as auth_created
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin';
