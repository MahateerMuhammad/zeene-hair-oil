"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Navigation from "@/components/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle, AlertCircle, MapPin, Phone, User, Mail, ArrowRight, ShoppingBag, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

import { ReceiptUpload } from "@/components/receipt-upload"
import { CreditCard, Banknote, Building2, Copy, Check } from "lucide-react"

interface CheckoutForm {
    customer_name: string
    email: string
    address: string
    phone: string
    payment_method: 'cod' | 'bank_transfer'
    receipt_url?: string
}

interface FormErrors {
    customer_name?: string
    email?: string
    address?: string
    phone?: string
    payment_method?: string
}

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [couponCode, setCouponCode] = useState("")
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [discountAmount, setDiscountAmount] = useState(0)

    const [formData, setFormData] = useState<CheckoutForm>({
        customer_name: "",
        email: "",
        address: "",
        phone: "",
        payment_method: "cod",
        receipt_url: ""
    })

    const [formErrors, setFormErrors] = useState<FormErrors>({})

    // Bank Details (Customizable)
    const bankDetails = {
        bankName: "Habib Bank Limited (HBL)",
        accountTitle: "ZEENE HAIRS",
        accountNumber: "1234 5678 9012 3456",
        jazzcash: "0300-1234567",
        easypaisa: "0300-1234567"
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
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

        if (formData.payment_method === 'bank_transfer' && !formData.receipt_url) {
            setError("Please upload your payment receipt screenshot")
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return

        setIsApplyingCoupon(true)
        try {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("code", couponCode.trim())
                .eq("is_active", true)
                .single()

            if (error || !data) {
                toast.error("The coupon code entered is invalid or expired.")
                return
            }

            // Check validity period
            const now = new Date()
            if (data.valid_until && new Date(data.valid_until) < now) {
                toast.error("This coupon code has expired.")
                return
            }

            if (data.valid_from && new Date(data.valid_from) > now) {
                toast.error("This coupon code is not yet active.")
                return
            }

            // Check min order amount
            if (data.min_order_amount && cartTotal < data.min_order_amount) {
                toast.error(`Minimum order amount for this coupon is PKR ${data.min_order_amount}.`)
                return
            }

            // Check usage limit
            if (data.usage_limit && data.usage_count >= data.usage_limit) {
                toast.error("This coupon has reached its maximum usage limit.")
                return
            }

            // Calculate discount
            let discount = 0
            if (data.discount_type === 'percentage') {
                discount = (cartTotal * data.discount_value) / 100
                if (data.max_discount && discount > data.max_discount) {
                    discount = data.max_discount
                }
            } else {
                discount = data.discount_value
            }

            setAppliedCoupon(data)
            setDiscountAmount(discount)
            toast.success(`Discount of PKR ${discount.toFixed(0)} applied!`)

        } catch (err) {
            console.error("Coupon error:", err)
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    const removeCoupon = () => {
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setCouponCode("")
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
            // Generate order number
            const orderNumber = `ORD-${Date.now()}`
            const finalTotal = cartTotal - discountAmount

            // 1. Create the main order
            const { data: orderData, error: orderError } = await supabase.from("orders").insert({
                user_id: user ? user.id : null,
                customer_name: formData.customer_name,
                customer_email: formData.email,
                address: formData.address,
                phone: formData.phone,
                status: "pending",
                payment_method: formData.payment_method,
                receipt_url: formData.receipt_url || null,
                order_number: orderNumber,
                total_amount: finalTotal,
                payment_status: 'pending',
                coupon_code: appliedCoupon?.code || null,
                discount_amount: discountAmount
            }).select().single()

            if (orderError) {
                console.error("Order insertion error:", orderError)
                throw new Error(orderError.message || "Failed to create order record")
            }

            if (!orderData) {
                throw new Error("Order creation succeeded but no data was returned")
            }

            const orderId = orderData.id

            // If coupon applied, increment usage count
            if (appliedCoupon) {
                const { error: rpcError } = await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id })
                if (rpcError) {
                    console.error("Coupon usage increment failed:", rpcError)
                    // We don't throw here to avoid blocking the order if just the coupon count failing
                }
            }

            // 2. Create order items and update stock
            const itemPromises = items.map(async (item) => {
                // Update stock
                try {
                    if (item.variantId) {
                        const { data: variant } = await supabase
                            .from("product_variants")
                            .select("stock_quantity")
                            .eq("id", item.variantId)
                            .single()

                        if (variant) {
                            await supabase
                                .from("product_variants")
                                .update({ stock_quantity: Math.max(0, (variant.stock_quantity || 0) - item.quantity) })
                                .eq("id", item.variantId)
                        }
                    } else {
                        const { data: product } = await supabase
                            .from("products")
                            .select("stock_quantity")
                            .eq("id", item.productId)
                            .single()

                        if (product && product.stock_quantity !== null) {
                            await supabase
                                .from("products")
                                .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
                                .eq("id", item.productId)
                        }
                    }
                } catch (stockError) {
                    console.error("Stock update error:", stockError)
                    // Continue anyway, don't block order
                }

                // Insert order item
                return supabase.from("order_items").insert({
                    order_id: orderId,
                    product_id: item.productId,
                    variant_id: item.variantId || null,
                    product_name: item.variantName ? `${item.name} (${item.variantName})` : item.name,
                    product_price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                })
            })

            const itemResults = await Promise.all(itemPromises)
            const itemErrors = itemResults.filter(r => r.error)

            if (itemErrors.length > 0) {
                console.error("Order items insertion errors:", itemErrors.map(e => e.error))
                const firstError = itemErrors[0].error
                throw new Error(`Failed to save ${itemErrors.length} order items: ${firstError?.message || 'Unknown error'}`)
            }

            try {
                await fetch('/api/send-order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'new_order_multi',
                        customerName: formData.customer_name,
                        customerEmail: formData.email,
                        items: items,
                        totalAmount: cartTotal,
                        orderNumber: orderNumber,
                        paymentMethod: formData.payment_method
                    })
                })
            } catch (emailError) {
                console.error("Failed to send email:", emailError)
            }

            setSuccess(true)
            clearCart()

        } catch (err: any) {
            console.error("Full checkout error details:", err)
            const errorMessage = err.message || "Failed to place order. Please try again."
            setError(errorMessage)
            toast.error(errorMessage)
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
                            Thank you for your order, {formData.customer_name}. {formData.payment_method === 'bank_transfer' ? 'We will verify your payment and process your order shortly.' : 'We will contact you shortly for confirmation.'}
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
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-[#1B1B1B]">Checkout</h1>
                        <Link href="/products" className="text-sm font-medium text-[#1F8D9D] hover:underline flex items-center">
                            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                            Back to Shop
                        </Link>
                    </div>

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
                        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                            {/* Left Column: Form & Payment (3/5) */}
                            <div className="lg:col-span-3 space-y-8">
                                {/* 1. Contact Information */}
                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-[#1F8D9D]" />
                                        Contact Information
                                    </h2>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] transition-all bg-gray-50/50 ${formErrors.customer_name ? 'border-red-300' : 'border-gray-200'}`}
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] transition-all bg-gray-50/50 ${formErrors.email ? 'border-red-300' : 'border-gray-200'}`}
                                                placeholder="email@example.com"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-sm font-medium text-gray-700">Phone Number (Verified)</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] transition-all bg-gray-50/50 ${formErrors.phone ? 'border-red-300' : 'border-gray-200'}`}
                                                    placeholder="03XX-XXXXXXX"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Shipping Address */}
                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <MapPin className="w-5 h-5 mr-2 text-[#1F8D9D]" />
                                        Shipping Address
                                    </h2>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Complete Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={3}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1F8D9D] transition-all bg-gray-50/50 resize-none ${formErrors.address ? 'border-red-300' : 'border-gray-200'}`}
                                            placeholder="House #, Street name, Area, City..."
                                        />
                                    </div>
                                </div>

                                {/* 3. Payment Method */}
                                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <Banknote className="w-5 h-5 mr-2 text-[#1F8D9D]" />
                                        Payment Method
                                    </h2>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, payment_method: "cod" })}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${formData.payment_method === "cod"
                                                ? "border-[#1F8D9D] bg-[#1F8D9D]/5"
                                                : "border-gray-100 hover:border-gray-200"
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.payment_method === "cod" ? 'bg-[#1F8D9D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Cash on Delivery</p>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Pay when you receive</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, payment_method: "bank_transfer" })}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${formData.payment_method === "bank_transfer"
                                                ? "border-[#1F8D9D] bg-[#1F8D9D]/5"
                                                : "border-gray-100 hover:border-gray-200"
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.payment_method === "bank_transfer" ? 'bg-[#1F8D9D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                                    <p className="font-bold text-gray-900 text-sm">Bank Transfer</p>
                                                    <span className="px-1.5 py-0.5 bg-[#1F8D9D]/10 text-[#1F8D9D] text-[8px] font-black rounded uppercase">Online</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Upload receipt & get faster shipping</p>
                                            </div>
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {formData.payment_method === "bank_transfer" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
                                            >
                                                <div className="bg-[#F0F8FF] rounded-2xl p-5 sm:p-6 border border-[#1F8D9D]/20 mb-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-6 h-6 bg-[#1F8D9D] text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                                                        <p className="text-sm font-bold text-gray-900">Transfer total amount to:</p>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Bank Name</p>
                                                            <p className="text-sm font-bold text-gray-900">Meezan Bank Ltd.</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Account Title</p>
                                                            <p className="text-sm font-bold text-gray-900">{bankDetails.accountTitle}</p>
                                                        </div>
                                                        <div className="sm:col-span-2 space-y-2">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Account Number / IBAN</p>
                                                            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 group ring-1 ring-[#1F8D9D]/10">
                                                                <code className="text-sm font-bold text-[#1F8D9D] tracking-wider select-all">
                                                                    {bankDetails.accountNumber}
                                                                </code>
                                                                <button
                                                                    onClick={() => copyToClipboard(bankDetails.accountNumber)}
                                                                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-[#1F8D9D]"
                                                                    title="Copy to clipboard"
                                                                >
                                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-6 h-6 bg-[#1F8D9D] text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                                                        <p className="text-sm font-bold text-gray-900">Upload Transaction Receipt:</p>
                                                    </div>

                                                    <ReceiptUpload
                                                        onUploadComplete={(url) => setFormData({ ...formData, receipt_url: url })}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Column: Order Summary (2/5) */}
                            <div className="lg:col-span-2">
                                <div className="lg:sticky lg:top-24 space-y-6">
                                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                                        {/* Decorative background element */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#1F8D9D]/10 to-transparent -mr-16 -mt-16 rounded-full blur-3xl" />

                                        <h2 className="text-xl font-bold text-gray-900 mb-6 relative z-10">Order Summary</h2>

                                        <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0 items-center">
                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                                                        {item.image_url ? (
                                                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="w-6 h-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#1F8D9D] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                            {item.quantity}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                                                        <p className="text-xs text-gray-500 font-medium">PKR {item.price.toFixed(0)}</p>
                                                    </div>
                                                    <div className="text-right font-bold text-gray-900 text-sm">
                                                        PKR {(item.price * item.quantity).toFixed(0)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3 border-t border-gray-100 pt-6 relative z-10">
                                            {/* Coupon Section */}
                                            {!appliedCoupon ? (
                                                <div className="pb-4 border-b border-gray-50 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                        placeholder="Coupon code"
                                                        className="flex-1 px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-[#1F8D9D] transition-all bg-gray-50/50 outline-none"
                                                    />
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={isApplyingCoupon || !couponCode.trim()}
                                                        className="px-4 py-2 bg-[#1F8D9D] text-white rounded-xl text-xs font-bold hover:bg-[#186F7B] transition-colors disabled:opacity-50"
                                                    >
                                                        {isApplyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="pb-4 border-b border-gray-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                                            {appliedCoupon.code}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">Coupon Applied</span>
                                                    </div>
                                                    <button
                                                        onClick={removeCoupon}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-sm text-gray-600 font-medium tracking-tight">
                                                <span>Subtotal</span>
                                                <span>PKR {cartTotal.toFixed(0)}</span>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-sm text-green-600 font-medium tracking-tight">
                                                    <span>Discount</span>
                                                    <span>- PKR {discountAmount.toFixed(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm text-gray-600 font-medium">
                                                <span>Shipping</span>
                                                <span className="text-[#1F8D9D]">Free</span>
                                            </div>
                                            <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t-2 border-gray-50 mt-2">
                                                <span>Total</span>
                                                <span>PKR {(cartTotal - discountAmount).toFixed(0)}</span>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 relative z-10">
                                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-700 font-medium">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="w-full mt-8 py-4 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-2xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10 group"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Place Order
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <div className="mt-6 pt-6 border-t border-gray-50 text-center relative z-10">
                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[250px] mx-auto">
                                                Secure 256-bit encrypted checkout. By placing this order, you agree to our Terms and Policies.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Security Badges */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Authentic Products</p>
                                        </div>
                                        <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 leading-tight">Physical Store PK</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
