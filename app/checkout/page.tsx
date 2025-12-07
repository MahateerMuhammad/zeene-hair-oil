"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Navigation from "@/components/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle, AlertCircle, MapPin, Phone, User, Mail, ArrowRight, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface CheckoutForm {
    customer_name: string
    email: string
    address: string
    phone: string
}

interface FormErrors {
    customer_name?: string
    email?: string
    address?: string
    phone?: string
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<CheckoutForm>({
        customer_name: "",
        email: "",
        address: "",
        phone: ""
    })

    const [formErrors, setFormErrors] = useState<FormErrors>({})

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                // We could potentially fetch user profile here if we had one
            }))
        }
    }, [user])

    const validateForm = (): boolean => {
        const errors: FormErrors = {}
        let isValid = true

        if (!formData.customer_name.trim()) {
            errors.customer_name = "Name is required"
            isValid = false
        } else if (formData.customer_name.length < 2) {
            errors.customer_name = "Name must be at least 2 characters"
            isValid = false
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required"
            isValid = false
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address"
            isValid = false
        }

        if (!formData.address.trim()) {
            errors.address = "Address is required"
            isValid = false
        } else if (formData.address.length < 10) {
            errors.address = "Please provide a complete address"
            isValid = false
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required"
            isValid = false
        } else if (formData.phone.replace(/\D/g, '').length < 10) {
            errors.phone = "Please enter a valid phone number"
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!validateForm()) {
            return
        }

        if (items.length === 0) {
            setError("Your cart is empty")
            return
        }

        setLoading(true)

        try {
            // Create orders for each item in the cart
            // Note: In a real app, you might want to create a single 'Order' record with multiple 'OrderItems'
            // But based on the existing schema, we'll create individual order records or maybe we need to update schema?
            // The existing schema seems to support one product per order row:
            // user_id, product_id, quantity, customer_name, ...

            // We will loop through items and create an order for each
            // Ideally, we should wrap this in a transaction or have a better schema, but sticking to existing schema for now.

            const orderPromises = items.map(item => {
                return supabase.from("orders").insert({
                    user_id: user ? user.id : null,
                    product_id: item.id,
                    quantity: item.quantity,
                    customer_name: formData.customer_name,
                    customer_email: formData.email,
                    address: formData.address,
                    phone: formData.phone,
                    status: "pending"
                })
            })

            const results = await Promise.all(orderPromises)

            // Check for errors
            const hasError = results.some(result => result.error)
            if (hasError) {
                throw new Error("Failed to process some items in your order")
            }

            // Send email notification (optional, keeping existing logic pattern)
            try {
                await fetch('/api/send-order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'new_order_multi', // You might need to update the API to handle multiple items
                        customerName: formData.customer_name,
                        customerEmail: formData.email,
                        items: items,
                        totalAmount: cartTotal
                    })
                })
            } catch (emailError) {
                console.error("Failed to send email:", emailError)
            }

            setSuccess(true)
            clearCart()

        } catch (err) {
            console.error("Checkout error:", err)
            setError("Failed to place order. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F9F9F9] via-white to-[#F0F8FF]">
                <Navigation />
                <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed! 🎉</h2>
                        <p className="text-gray-600 mb-8">
                            Thank you for your order, {formData.customer_name}. We have received your request and will contact you shortly for confirmation.
                        </p>
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                        >
                            Continue Shopping
                        </Link>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F9F9F9] via-white to-[#F0F8FF]">
            <Navigation />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#1B1B1B] mb-8">Checkout</h1>

                    {items.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                            <p className="text-gray-500 mb-8">Looks like you haven't added any products yet.</p>
                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center px-8 py-3 bg-[#1F8D9D] text-white rounded-xl font-medium hover:bg-[#186F7B] transition-colors"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Checkout Form */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-[#1F8D9D]" />
                                        Contact Information
                                    </h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.customer_name}
                                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                    className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all ${formErrors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            {formErrors.customer_name && <p className="text-red-500 text-xs mt-1">{formErrors.customer_name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all ${formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all ${formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                    placeholder="03XX-XXXXXXX"
                                                />
                                            </div>
                                            {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <MapPin className="w-5 h-5 mr-2 text-[#1F8D9D]" />
                                        Shipping Address
                                    </h2>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={4}
                                            className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all resize-none ${formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                            placeholder="House #, Street, Area, City..."
                                        />
                                        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:sticky lg:top-24 h-fit">
                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {item.image_url ? (
                                                        <Image
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1F8D9D] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        PKR {item.price.toFixed(0)} x {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right font-medium text-gray-900">
                                                    PKR {(item.price * item.quantity).toFixed(0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 border-t border-gray-100 pt-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>PKR {cartTotal.toFixed(0)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span className="text-[#1F8D9D] font-medium">Free</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                                            <span>Total</span>
                                            <span>PKR {cartTotal.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-600">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full mt-8 py-4 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Place Order
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-gray-400 mt-4">
                                        By placing this order, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
