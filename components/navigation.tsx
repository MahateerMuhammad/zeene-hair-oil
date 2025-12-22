"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Menu, X, LogOut, ShoppingBag, User as UserIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CartIcon } from "./cart/cart-icon"

// Memoized navigation item component with enhanced hover state
const NavigationItem = memo(({ href, children, onClick }: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void
}) => (
  <Link
    href={href}
    className="text-[#1B1B1B]/60 hover:text-[#1B1B1B] transition-all duration-500 text-[10px] font-bold tracking-[0.4em] uppercase relative group flex items-center"
    onClick={onClick}
  >
    <span className="relative z-10">{children}</span>
    <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#1F8D9D] transition-all duration-700 ease-[0.16,1,0.3,1] group-hover:w-full"></span>
  </Link>
))

NavigationItem.displayName = 'NavigationItem'

function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, userRole, signOut } = useAuth()

  // Handle scroll for glassmorphism intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const navigationItems = useMemo(() => [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/contact", label: "Contact" }
  ], [])

  type AuthItem = {
    href?: string;
    label: string;
    action?: () => Promise<void>;
    icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    primary?: boolean;
  }

  const authItems = useMemo((): AuthItem[] => {
    if (user) {
      return [
        { href: "/profile", label: "Account", icon: UserIcon } as AuthItem,
        ...(userRole === "admin" ? [{ href: "/admin", label: "Admin" } as AuthItem] : []),
        { action: handleSignOut, label: "Sign Out", icon: LogOut } as AuthItem
      ]
    }
    return [
      { href: "/login", label: "Login" } as AuthItem,
      { href: "/signup", label: "Join Now", primary: true } as AuthItem
    ]
  }, [user, userRole, handleSignOut])

  return (
    <motion.nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 will-change-transform ${scrolled
        ? "bg-white/70 backdrop-blur-xl border-b border-white/20 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
        : "bg-transparent py-6"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-playfair font-black tracking-tighter text-[#1B1B1B]">ZEENE.</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <NavigationItem key={item.href} href={item.href}>
                  {item.label}
                </NavigationItem>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-gray-200" />

            <div className="flex items-center space-x-6">
              {authItems.map((item, index) => (
                item.action ? (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center space-x-2 text-[#1B1B1B]/70 hover:text-[#1B1B1B] transition-all duration-300 text-[10px] font-bold tracking-[0.2em] uppercase"
                  >
                    {item.icon && <item.icon size={14} strokeWidth={2.5} />}
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={item.primary
                      ? "bg-[#1B1B1B] text-white px-6 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#1F8D9D] transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5"
                      : "text-[#1B1B1B]/70 hover:text-[#1B1B1B] transition-all duration-300 text-[10px] font-bold tracking-[0.2em] uppercase"
                    }
                  >
                    {item.label}
                  </Link>
                )
              ))}

              <div className="scale-110">
                <CartIcon />
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-6">
            <div className="scale-110">
              <CartIcon />
            </div>
            <button
              onClick={toggleMenu}
              className="text-[#1B1B1B] p-2 hover:bg-black/5 rounded-full transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <span className="text-2xl font-playfair font-black tracking-tighter">ZEENE.</span>
                <button onClick={closeMenu} className="p-2 bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 px-8 py-12 space-y-8 overflow-y-auto">
                <div className="space-y-6">
                  <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Navigation</p>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className="block text-4xl font-playfair font-black text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="h-[1px] w-full bg-gray-100" />

                <div className="space-y-6">
                  <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Account</p>
                  {authItems.map((item, index) => (
                    item.action ? (
                      <button
                        key={index}
                        onClick={item.action}
                        className="block text-2xl font-bold text-[#1B1B1B]/60"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href!}
                        onClick={closeMenu}
                        className="block text-2xl font-bold text-[#1B1B1B]/60"
                      >
                        {item.label}
                      </Link>
                    )
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-gray-100">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">&copy; 2024 ZEENE.STORE</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default memo(Navigation)
