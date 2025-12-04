"use client"

import { useState, useCallback, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Menu, X, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CartIcon } from "./cart/cart-icon"

// Memoized navigation item component for better performance
const NavigationItem = memo(({ href, children, onClick }: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void
}) => (
  <Link
    href={href}
    className="text-[#1B1B1B] hover:text-[#1F8D9D] transition-all duration-300 text-sm md:text-base font-medium hover:scale-105 relative group"
    onClick={onClick}
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1F8D9D] transition-all duration-300 group-hover:w-full"></span>
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

  // Define proper types for auth items
  type AuthItem = {
    href?: string;
    label: string;
    action?: () => Promise<void>;
    icon?: React.ComponentType<{ size?: number }>;
    primary?: boolean;
  }

  const authItems = useMemo((): AuthItem[] => {
    if (user) {
      return [
        ...(userRole === "admin" ? [{ href: "/admin", label: "Admin" } as AuthItem] : []),
        { action: handleSignOut, label: "Sign Out", icon: LogOut } as AuthItem
      ]
    }
    return [
      { href: "/login", label: "Login" } as AuthItem,
      { href: "/signup", label: "Sign Up", primary: true } as AuthItem
    ]
  }, [user, userRole, handleSignOut])

  return (
    <motion.nav
      className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 lg:h-22">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center">
              <Image
                src="/zeene-new-logo.png"
                alt="ZEENE Logo"
                width={200}
                height={70}
                className="h-14 sm:h-16 md:h-18 lg:h-20 w-auto"
                priority
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {navigationItems.map((item) => (
              <NavigationItem key={item.href} href={item.href}>
                {item.label}
              </NavigationItem>
            ))}

            <div className="flex items-center space-x-4 lg:space-x-6">
              {authItems.map((item, index) => (
                item.action ? (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center space-x-1 text-[#1B1B1B] hover:text-[#1F8D9D] transition-all duration-300 text-sm md:text-base font-medium hover:scale-105"
                  >
                    {item.icon && <item.icon size={16} />}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={item.primary
                      ? "bg-gradient-to-r from-[#1F8D9D] to-[#1A7A87] hover:from-[#1A7A87] hover:to-[#1F8D9D] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm md:text-base"
                      : "text-[#1B1B1B] hover:text-[#1F8D9D] transition-all duration-300 text-sm md:text-base font-medium hover:scale-105 relative group"
                    }
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            <div className="ml-4 flex items-center">
              <CartIcon />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <CartIcon />
            <button
              onClick={toggleMenu}
              className="text-[#1B1B1B] hover:text-[#1F8D9D] p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110"
              aria-label="Toggle menu"
            >
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
              <div className="px-4 pt-3 pb-4 space-y-2 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
                {navigationItems.map((item) => (
                  <NavigationItem key={item.href} href={item.href} onClick={closeMenu}>
                    <span className="block px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-base font-medium">{item.label}</span>
                  </NavigationItem>
                ))}

                {authItems.map((item, index) => (
                  item.action ? (
                    <button
                      key={index}
                      onClick={item.action}
                      className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors text-base font-medium"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href!}
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors text-base font-medium"
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
