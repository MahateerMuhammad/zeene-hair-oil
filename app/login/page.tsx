"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

// Force dynamic rendering to avoid build-time prerendering
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) {
      setResetMessage("Please enter your email address")
      return
    }

    setResetLoading(true)
    setResetMessage("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setResetMessage(error.message)
      } else {
        setResetMessage("Password reset email sent! Check your inbox.")
        setTimeout(() => {
          setShowResetModal(false)
          setResetEmail("")
          setResetMessage("")
        }, 3000)
      }
    } catch (err) {
      setResetMessage("An unexpected error occurred")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-16">
              <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-6">Access Portal</p>
              <h1 className="text-6xl md:text-7xl font-playfair font-black text-[#1B1B1B] leading-[0.9] tracking-tighter mb-8">
                Welcome<br />Back.
              </h1>
              <div className="h-[2px] w-24 bg-[#1B1B1B] mb-6" />
              <p className="text-sm text-gray-500 font-light">Sign in to access your ZEENE account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border-l-2 border-red-500 px-6 py-4">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-200 py-3 pr-10 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1B1B1B] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-gray-400 hover:text-[#1B1B1B] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              <div className="text-center pt-8 border-t border-gray-100">
                <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                  New to ZEENE?{" "}
                  <Link href="/signup" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-md w-full p-12"
          >
            <h3 className="text-3xl font-playfair font-black text-[#1B1B1B] mb-4">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              {resetMessage && (
                <div className={`px-6 py-4 border-l-2 ${resetMessage.includes('sent')
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                  }`}>
                  <p className={`text-[10px] font-bold tracking-wider uppercase ${resetMessage.includes('sent') ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {resetMessage}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-4 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#1F8D9D] transition-colors disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetEmail("")
                    setResetMessage("")
                  }}
                  className="flex-1 py-4 bg-gray-100 text-[#1B1B1B] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
