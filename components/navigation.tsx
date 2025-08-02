"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Menu, X, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userRole, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <motion.nav 
      className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/zeene-logo.png" alt="ZEENE Logo" width={120} height={40} className="h-10 w-auto" />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
              Products
            </Link>
            <Link href="/contact" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
              Contact
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                {userRole === "admin" && (
                  <Link href="/admin" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#1F8D9D] hover:bg-[#1F8D9D]/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#1B1B1B] hover:text-[#1F8D9D]">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="/"
                className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              {user ? (
                <>
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}
