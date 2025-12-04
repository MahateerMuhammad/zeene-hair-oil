"use client"

import { useCart } from "@/contexts/cart-context"
import { ShoppingBag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CartSheet } from "./cart-sheet"

export function CartIcon() {
    const { cartCount, setIsCartOpen } = useCart()

    return (
        <>
            <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#1B1B1B] hover:text-[#1F8D9D] transition-colors group"
                aria-label="Open cart"
            >
                <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <AnimatePresence>
                    {cartCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-[#1F8D9D] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                        >
                            {cartCount > 99 ? "99+" : cartCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
            <CartSheet />
        </>
    )
}
