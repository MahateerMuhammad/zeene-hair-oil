"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Check, XCircle } from "lucide-react"
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
    
    // Treat as out of stock if stock_quantity is strictly <= 0
    const isOutOfStock = product?.stock_quantity !== undefined && product.stock_quantity <= 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isOutOfStock) return;

        addToCart(product, quantity, selectedVariant)
        setIsAdded(true)

        setTimeout(() => {
            setIsAdded(false)
        }, 2000)
    }

    return (
        <motion.button
            whileHover={!isOutOfStock && !isAdded ? { scale: 1.02 } : {}}
            whileTap={!isOutOfStock && !isAdded ? { scale: 0.98 } : {}}
            onClick={handleAddToCart}
            disabled={isAdded || isOutOfStock}
            className={cn(
                "relative h-14 overflow-hidden rounded-sm text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 shadow-2xl disabled:cursor-default",
                isOutOfStock
                    ? "bg-gray-300 text-gray-500"
                    : isAdded
                        ? "bg-[#1F8D9D] text-white"
                        : "bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white",
                className
            )}
        >
            <AnimatePresence mode="wait">
                {isOutOfStock ? (
                    <motion.div
                        key="sold-out"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-2"
                    >
                        <XCircle className="w-4 h-4" />
                        <span>Sold Out</span>
                    </motion.div>
                ) : isAdded ? (
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

