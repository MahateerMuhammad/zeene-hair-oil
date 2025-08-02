"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, LogIn } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  requireAdmin = false,
  fallback 
}: AuthGuardProps) {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      setShowError(true)
      return
    }

    if (requireAdmin && userRole !== "admin") {
      setShowError(true)
      return
    }

    setShowError(false)
  }, [user, userRole, loading, requireAuth, requireAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F8D9D]"></div>
      </div>
    )
  }

  if (showError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-2xl font-semibold text-[#1B1B1B] mb-4">
            {requireAdmin ? "Access Denied" : "Authentication Required"}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {requireAdmin 
              ? "You don't have permission to access this page. Admin privileges are required."
              : "Please log in to your account to continue with this action."
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {!requireAdmin && (
              <Link
                href="/login"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#1F8D9D] text-white rounded-lg hover:bg-[#186F7B] transition-colors duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
            )}
            
            <button
              onClick={() => {
                setShowError(false)
                router.back()
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return <>{children}</>
}