"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { CartItem } from "./cart-item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function CartSheet() {
    const { items, isCartOpen, setIsCartOpen, cartTotal } = useCart()

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col bg-white/95 backdrop-blur-sm">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center space-x-2 text-xl font-playfair">
                        <ShoppingBag className="w-5 h-5" />
                        <span>Your Shopping Cart</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative mt-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                                <p className="text-sm text-gray-500 mt-1">Looks like you haven't added anything yet.</p>
                            </div>
                            <Button
                                onClick={() => setIsCartOpen(false)}
                                className="bg-[#1F8D9D] hover:bg-[#186F7B] text-white"
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 pb-4">
                                <AnimatePresence initial={false}>
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                        >
                                            <CartItem item={item} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="border-t pt-4 sm:justify-center">
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between text-base font-medium text-gray-900">
                                <span>Subtotal</span>
                                <span className="text-xl text-[#1F8D9D]">PKR {cartTotal.toFixed(0)}</span>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <div className="grid gap-2">
                                <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                                    <Button className="w-full bg-[#1F8D9D] hover:bg-[#186F7B] text-white h-12 text-lg shadow-lg hover:shadow-xl transition-all">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
