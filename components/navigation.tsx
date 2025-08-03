"use client"

import { useState, useCallback, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Menu, X, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Memoized navigation item component for better performance
const NavigationItem = memo(({ href, children, onClick }: { 
  href: string; 
  children: React.ReactNode; 
  onClick?: () => void 
}) => (
  <Link 
    href={href} 
    className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
    onClick={onClick}
  >
    {children}
  </Link>
))

NavigationItem.displayName = 'NavigationItem'

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userRole, signOut } = useAuth()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [signOut])

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/contact", label: "Contact" }
  ], [])

  const authItems = useMemo(() => {
    if (user) {
      return [
        ...(userRole === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
        { action: handleSignOut, label: "Sign Out", icon: LogOut }
      ]
    }
    return [
      { href: "/login", label: "Login" },
      { href: "/signup", label: "Sign Up", primary: true }
    ]
  }, [user, userRole, handleSignOut])

  return (
    <motion.nav 
      className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/zeene-logo.png" alt="ZEENE Logo" width={220} height={80} className="h-20 w-auto" />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <NavigationItem key={item.href} href={item.href}>
                {item.label}
              </NavigationItem>
            ))}

            <div className="flex items-center space-x-4">
              {authItems.map((item, index) => (
                item.action ? (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center space-x-1 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                  >
                    {item.icon && <item.icon size={16} />}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={item.primary 
                      ? "bg-[#1F8D9D] hover:bg-[#1F8D9D]/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                      : "text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                    }
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-[#1B1B1B] hover:text-[#1F8D9D]">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                {navigationItems.map((item) => (
                  <NavigationItem key={item.href} href={item.href} onClick={closeMenu}>
                    <span className="block px-3 py-2">{item.label}</span>
                  </NavigationItem>
                ))}

                {authItems.map((item, index) => (
                  item.action ? (
                    <button
                      key={index}
                      onClick={item.action}
                      className="block w-full text-left px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href!}
                      className="block px-3 py-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

export default memo(Navigation)
