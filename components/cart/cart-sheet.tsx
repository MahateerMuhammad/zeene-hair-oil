"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { CartItem } from "./cart-item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function CartSheet() {
    const { items, isCartOpen, setIsCartOpen, cartTotal } = useCart()

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col bg-white/80 backdrop-blur-2xl border-l border-white/20 shadow-2xl p-0">
                <SheetHeader className="p-8 border-b border-gray-100">
                    <SheetTitle className="flex items-center justify-between text-2xl font-playfair font-black tracking-tighter">
                        <div className="flex items-center space-x-3">
                            <span className="text-[#1B1B1B]">ZEENE.</span>
                            <span className="text-gray-300 font-light">|</span>
                            <span className="text-xs font-bold tracking-[0.4em] uppercase text-gray-400">Bag</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
                            <div className="w-20 h-20 bg-[#F9F9F9] rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-400 font-light" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#1B1B1B]">Your bag is empty</h3>
                                <p className="text-xs text-gray-400 font-medium">Selected essentials will appear here.</p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1B1B1B] border-b-2 border-[#1B1B1B] pb-1 hover:text-[#1F8D9D] hover:border-[#1F8D9D] transition-all"
                            >
                                Start Browsing
                            </button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="p-8 space-y-8">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {items.map((item) => (
                                        <motion.div
                                            key={`${item.id}-${item.variantId || 'default'}`}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                    <div className="p-8 bg-[#F9F9F9]/50 border-t border-gray-100 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">
                                <span>Subtotal</span>
                                <span className="text-[#1B1B1B]">₨ {cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-lg font-playfair font-black text-[#1B1B1B]">
                                <span>Total</span>
                                <span>₨ {cartTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="block">
                                <button className="group w-full bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 rounded-sm shadow-xl flex items-center justify-center space-x-3">
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                                </button>
                            </Link>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-full text-center py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-[#1B1B1B] transition-colors"
                            >
                                Continue Shopping
                            </button>
                        </div>

                        <p className="text-[9px] text-gray-400 text-center font-medium tracking-tight">
                            COMPLIMENTARY SHIPPING ON ALL CURATED ORDERS.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
