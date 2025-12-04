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
}

interface CartContextType {
    items: CartItem[]
    addToCart: (product: any, quantity?: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
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

    const addToCart = useCallback((product: any, quantity: number = 1) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.productId === product.id)

            const price = product.is_on_sale && product.sale_price ? product.sale_price : product.price

            if (existingItem) {
                toast.success(`Updated quantity for ${product.name}`)
                return prevItems.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            }

            toast.success(`Added ${product.name} to cart`)
            return [
                ...prevItems,
                {
                    id: `${product.id}-${Date.now()}`,
                    productId: product.id,
                    name: product.name,
                    price: price,
                    image_url: product.image_url,
                    quantity: quantity,
                    maxQuantity: 100, // Default max quantity
                },
            ]
        })
        setIsCartOpen(true)
    }, [])

    const removeFromCart = useCallback((productId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.productId !== productId))
        toast.info("Item removed from cart")
    }, [])

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId)
            return
        }

        setItems((prevItems) =>
            prevItems.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
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
