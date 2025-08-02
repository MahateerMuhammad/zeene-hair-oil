import { createClient } from "@supabase/supabase-js"

// Get environment variables directly from process.env to avoid validation issues during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'zeene-hair-oil@1.0.0',
    },
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: "user" | "admin"
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: "user" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: "user" | "admin"
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          description: string | null
          image_url: string | null
          image_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          description?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          description?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          product_id: string | null
          customer_name: string
          address: string
          phone: string
          status: "pending" | "approved" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          customer_name: string
          address: string
          phone: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          customer_name?: string
          address?: string
          phone?: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
