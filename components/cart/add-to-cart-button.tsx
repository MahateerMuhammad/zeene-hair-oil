"use client"

import { useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
    product: any
    quantity?: number
    selectedVariant?: any
    className?: string
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
}

export function AddToCartButton({
    product,
    quantity = 1,
    selectedVariant,
    className,
    variant = "default",
    size = "default"
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
        <Button
            onClick={handleAddToCart}
            variant={variant}
            size={size}
            className={cn(
                "transition-all duration-300",
                isAdded && "bg-green-600 hover:bg-green-700 text-white border-green-600",
                className
            )}
        >
            {isAdded ? (
                <>
                    <Check className="w-4 h-4 mr-2" />
                    Added
                </>
            ) : (
                <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                </>
            )}
        </Button>
    )
}
