"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export interface CartItem {
    id: string
    productId: string
    name: string
    price: number
    image_url: string | null
    quantity: number
    maxQuantity?: number
    variantId?: string
    variantName?: string
}

interface CartContextType {
    items: CartItem[]
    addToCart: (product: any, quantity?: number, variant?: any) => void
    removeFromCart: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    cartTotal: number
    cartCount: number
    isCartOpen: boolean
    setIsCartOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("zeene-cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (error) {
                console.error("Failed to parse cart from local storage:", error)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save cart to local storage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("zeene-cart", JSON.stringify(items))
        }
    }, [items, isInitialized])

    const addToCart = useCallback((product: any, quantity: number = 1, variant?: any) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) =>
                variant
                    ? item.productId === product.id && item.variantId === variant.id
                    : item.productId === product.id && !item.variantId
            )

            const basePrice = product.is_on_sale && product.sale_price ? product.sale_price : product.price
            const finalPrice = variant?.price_override ? basePrice + parseFloat(variant.price_override) : basePrice

            if (existingItem) {
                toast.success(`Updated quantity for ${product.name}${variant ? ` (${variant.name})` : ""}`)
                return prevItems.map((item) =>
                    (variant
                        ? item.productId === product.id && item.variantId === variant.id
                        : item.productId === product.id && !item.variantId)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            }

            toast.success(`Added ${product.name}${variant ? ` (${variant.name})` : ""} to cart`)
            return [
                ...prevItems,
                {
                    id: variant ? `${product.id}-${variant.id}-${Date.now()}` : `${product.id}-${Date.now()}`,
                    productId: product.id,
                    name: product.name,
                    price: finalPrice,
                    image_url: product.image_url,
                    quantity: quantity,
                    maxQuantity: variant?.stock_quantity || product.stock_quantity || 100,
                    variantId: variant?.id,
                    variantName: variant?.name,
                },
            ]
        })
        setIsCartOpen(true)
    }, [])

    const removeFromCart = useCallback((itemId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
        toast.info("Item removed from cart")
    }, [])

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(itemId)
            return
        }

        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            )
        )
    }, [removeFromCart])

    const clearCart = useCallback(() => {
        setItems([])
        localStorage.removeItem("zeene-cart")
    }, [])

    const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
    const cartCount = items.reduce((count, item) => count + item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
