"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { validateEmail, validatePassword, sanitizeInput } from "@/lib/security"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim())

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || "Invalid password")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(sanitizedEmail, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Account created successfully! Please check your email to verify your account.")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
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
              <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-6">Registration</p>
              <h1 className="text-6xl md:text-7xl font-playfair font-black text-[#1B1B1B] leading-[0.9] tracking-tighter mb-8">
                Join<br />ZEENE.
              </h1>
              <div className="h-[2px] w-24 bg-[#1B1B1B] mb-6" />
              <p className="text-sm text-gray-500 font-light">Create your account and discover curated essentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border-l-2 border-red-500 px-6 py-4">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-2 border-green-500 px-6 py-4">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-green-600">{success}</p>
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
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1B1B1B] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-400 tracking-wider uppercase mt-2">
                    Minimum 8 characters, include uppercase, lowercase, and number
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              <div className="text-center pt-8 border-t border-gray-100">
                <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
