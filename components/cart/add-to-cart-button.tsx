"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
    product: any
    quantity?: number
    selectedVariant?: any
    className?: string
}

export function AddToCartButton({
    product,
    quantity = 1,
    selectedVariant,
    className,
}: AddToCartButtonProps) {
    const { addToCart } = useCart()
    const [isAdded, setIsAdded] = useState(false)

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        addToCart(product, quantity, selectedVariant)
        setIsAdded(true)

        setTimeout(() => {
            setIsAdded(false)
        }, 2000)
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={isAdded}
            className={cn(
                "relative h-14 overflow-hidden rounded-sm text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 shadow-2xl disabled:cursor-default",
                isAdded
                    ? "bg-[#1F8D9D] text-white"
                    : "bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white",
                className
            )}
        >
            <AnimatePresence mode="wait">
                {isAdded ? (
                    <motion.div
                        key="added"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-2"
                    >
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="add"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
