"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { handleAuthError } from "@/lib/auth-utils"

interface AuthContextType {
  user: User | null
  userRole: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Session error:', error)
      handleAuthError(error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh errors gracefully
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
      }
      
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.id)
      } else {
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("role").eq("id", userId).single()

      if (data) {
        setUserRole(data.role)
      } else if (error) {
        console.log('User role not found, creating entry:', error.message)
        // User not found in users table, creating entry
        await createUserEntry(userId)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      // Error fetching user role, defaulting to user
      setUserRole("user") // Default to user role
    }
  }

  const createUserEntry = async (userId: string) => {
    try {
      // Get user email from auth
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser.user) {
        const { error } = await supabase.from("users").insert({
          id: userId,
          email: authUser.user.email!,
          role: "user",
        })

        if (!error) {
          setUserRole("user")
        }
      }
    } catch (error) {
      // Error creating user entry, defaulting to user role
      setUserRole("user")
    }
  }

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (data.user && !error) {
      // The trigger should automatically create the user entry
      // But let's add a small delay and then fetch the role
      setTimeout(() => {
        if (data.user) {
          fetchUserRole(data.user.id)
        }
      }, 1000)
    }

    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
