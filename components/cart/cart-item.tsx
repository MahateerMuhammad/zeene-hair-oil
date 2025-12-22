"use client"

import { useCart, type CartItem as CartItemType } from "@/contexts/cart-context"
import { Minus, Plus, X } from "lucide-react"
import Image from "next/image"

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeFromCart } = useCart()

    return (
        <div className="flex gap-6 group py-4 items-center">
            {/* Image Container */}
            <div className="relative aspect-square h-24 w-24 min-w-[6rem] overflow-hidden bg-[#F9F9F9] rounded-sm">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="object-cover w-full h-full transition-all duration-700"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                        No Image
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex flex-1 flex-col justify-between self-stretch">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B] leading-tight">
                            {item.name}
                        </h3>
                        {item.variantName && (
                            <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-gray-400">
                                {item.variantName}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-gray-100 rounded-sm">
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-2 hover:bg-gray-50 transition-colors"
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="w-2 h-2" />
                            </button>
                            <span className="w-8 text-center text-[10px] font-bold">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-2 hover:bg-gray-50 transition-colors"
                                disabled={item.quantity >= (item.maxQuantity || 100)}
                            >
                                <Plus className="w-2 h-2" />
                            </button>
                        </div>

                        <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300 hover:text-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-xs font-playfair font-black text-[#1B1B1B]">
                            ₨ {(item.price * item.quantity).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
