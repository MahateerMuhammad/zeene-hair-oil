import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://swwwdbtudbbijdwasfpp.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key-here"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log("Setting up database tables...")

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (usersError) {
      console.error("Error creating users table:", usersError)
    } else {
      console.log("✅ Users table created successfully")
    }

    // Create products table
    const { error: productsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (productsError) {
      console.error("Error creating products table:", productsError)
    } else {
      console.log("✅ Products table created successfully")
    }

    // Create orders table
    const { error: ordersError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (ordersError) {
      console.error("Error creating orders table:", ordersError)
    } else {
      console.log("✅ Orders table created successfully")
    }

    console.log("Database setup completed!")
  } catch (error) {
    console.error("Error setting up database:", error)
  }
}

setupDatabase()
