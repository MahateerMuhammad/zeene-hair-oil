"use client"

import { useCart, type CartItem as CartItemType } from "@/contexts/cart-context"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeFromCart } = useCart()

    return (
        <div className="flex gap-4 py-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="relative aspect-square h-20 w-20 min-w-[5rem] overflow-hidden rounded-lg bg-gray-100">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{item.name}</h3>
                        {item.variantName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Variant: <span className="text-[#1F8D9D] font-medium">{item.variantName}</span>
                            </p>
                        )}
                        <p className="text-[#1F8D9D] font-bold mt-1">
                            PKR {item.price.toFixed(0)}
                        </p>
                    </div>
                    <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-lg bg-gray-50">
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors"
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors"
                            disabled={item.quantity >= (item.maxQuantity || 100)}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                        Total: PKR {(item.price * item.quantity).toFixed(0)}
                    </div>
                </div>
            </div>
        </div>
    )
}
