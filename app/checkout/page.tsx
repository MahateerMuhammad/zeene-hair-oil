"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle, AlertCircle, MapPin, Phone, User, Mail, ArrowRight, ShoppingBag, X, CreditCard, Banknote, Building2, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ReceiptUpload } from "@/components/receipt-upload"

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

    const bankDetails = {
        bankName: "Meezan Bank Ltd.",
        accountTitle: "ZEENE",
        accountNumber: "1234 5678 9012 3456",
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

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
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Valid email is required"
            isValid = false
        }
        if (!formData.address.trim()) {
            errors.address = "Address is required"
            isValid = false
        }
        if (!formData.phone.trim()) {
            errors.phone = "Phone is required"
            isValid = false
        }

        if (formData.payment_method === 'bank_transfer' && !formData.receipt_url) {
            setError("Please upload your payment receipt")
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
                toast.error("Invalid coupon code")
                return
            }

            let discount = 0
            if (data.discount_type === 'percentage') {
                discount = (cartTotal * data.discount_value) / 100
                if (data.max_discount && discount > data.max_discount) discount = data.max_discount
            } else {
                discount = data.discount_value
            }

            setAppliedCoupon(data)
            setDiscountAmount(discount)
            toast.success(`Discount applied!`)
        } catch (err) {
            console.error(err)
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        if (items.length === 0) return

        setLoading(true)
        try {
            const orderNumber = `ZEENE-${Date.now().toString().slice(-6)}`
            const finalTotal = cartTotal - discountAmount

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

            if (orderError) throw orderError

            const itemPromises = items.map(async (item) => {
                const { data, error } = await supabase.from("order_items").insert({
                    order_id: orderData.id,
                    product_id: item.productId,
                    variant_id: item.variantId || null,
                    product_name: item.variantName ? `${item.name} (${item.variantName})` : item.name,
                    product_price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                })
                if (error) {
                    console.error('Failed to insert order item:', error)
                    throw error
                }
                return data
            })
            await Promise.all(itemPromises)
            console.log('Order items inserted successfully for order:', orderData.id)

            // Send order confirmation email
            try {
                const firstItem = items[0]
                await fetch('/api/send-order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'new_order',
                        orderId: orderNumber,
                        customerName: formData.customer_name,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        customerAddress: formData.address,
                        productName: firstItem.variantName ? `${firstItem.name} (${firstItem.variantName})` : firstItem.name,
                        productPrice: firstItem.price,
                        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
                        totalAmount: finalTotal
                    })
                })
            } catch (emailError) {
                console.error('Failed to send order email:', emailError)
                // Don't fail the order if email fails
            }

            setSuccess(true)
            clearCart()
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white">
                <main className="container mx-auto px-4 py-32 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-lg space-y-8"
                    >
                        <div className="w-24 h-24 bg-[#F9F9F9] rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-[#1F8D9D]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-playfair font-black text-[#1B1B1B] tracking-tighter">Ordered Successfully.</h2>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
                                Your curation is being prepared. Order confirmed.
                            </p>
                        </div>
                        <Link href="/products" className="inline-block">
                            <button className="bg-[#1B1B1B] text-white px-12 py-5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors rounded-sm">
                                Continue Exploration
                            </button>
                        </Link>
                    </motion.div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <div className="container mx-auto px-4 lg:px-24 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <header className="mb-16 space-y-4">
                        <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#1F8D9D]">Checkout Flow</p>
                        <h1 className="text-6xl font-playfair font-black text-[#1B1B1B] tracking-tighter">Final Review.</h1>
                    </header>

                    {items.length === 0 ? (
                        <div className="bg-white p-24 text-center border border-gray-100 rounded-sm">
                            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-8" />
                            <h2 className="text-xl font-playfair font-black text-[#1B1B1B] mb-4">Your bag is empty.</h2>
                            <Link href="/products" className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1F8D9D] border-b-2 border-[#1F8D9D] pb-1">
                                Discover Essentials
                            </Link>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-12 gap-16">
                            {/* Form Column */}
                            <div className="lg:col-span-7 space-y-16">
                                {/* Section 1: Identity */}
                                <section className="space-y-8">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-playfair italic text-gray-300">01</span>
                                        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#1B1B1B]">Identity</h2>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                                                placeholder="e.g. Alexander Sterling"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                                                placeholder="alex@curated.com"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                                                placeholder="+92 300 1234567"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Destination */}
                                <section className="space-y-8">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-playfair italic text-gray-300">02</span>
                                        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#1B1B1B]">Destination</h2>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Shipping Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={2}
                                            className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium resize-none"
                                            placeholder="Street, Building, Apartment, City..."
                                        />
                                    </div>
                                </section>

                                {/* Section 3: Settlement */}
                                <section className="space-y-8">
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-playfair italic text-gray-300">03</span>
                                        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#1B1B1B]">Settlement</h2>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setFormData({ ...formData, payment_method: "cod" })}
                                            className={`p-6 border text-left transition-all rounded-sm ${formData.payment_method === "cod" ? 'border-[#1B1B1B] bg-white shadow-sm' : 'border-gray-100 bg-[#F9F9F9] opacity-60'}`}
                                        >
                                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B] mb-2">Cash on Delivery</p>
                                            <p className="text-[9px] text-gray-400 font-medium">Settle upon delivery receipt.</p>
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, payment_method: "bank_transfer" })}
                                            className={`p-6 border text-left transition-all rounded-sm ${formData.payment_method === "bank_transfer" ? 'border-[#1B1B1B] bg-white shadow-sm' : 'border-gray-100 bg-[#F9F9F9] opacity-60'}`}
                                        >
                                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B] mb-2">Bank Transfer</p>
                                            <p className="text-[9px] text-gray-400 font-medium">Secure online settlement.</p>
                                        </button>
                                    </div>

                                    {formData.payment_method === "bank_transfer" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-8 border border-gray-100 space-y-8"
                                        >
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">Bank</p>
                                                    <p className="text-[10px] font-bold text-[#1B1B1B] uppercase">{bankDetails.bankName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">Title</p>
                                                    <p className="text-[10px] font-bold text-[#1B1B1B] uppercase">{bankDetails.accountTitle}</p>
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">Account / IBAN</p>
                                                    <div className="flex items-center justify-between bg-[#F9F9F9] p-4 group">
                                                        <code className="text-xs font-bold text-[#1B1B1B] tracking-widest">{bankDetails.accountNumber}</code>
                                                        <button onClick={() => copyToClipboard(bankDetails.accountNumber)} className="text-[#1B1B1B]">
                                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Transfer Receipt</p>
                                                <ReceiptUpload onUploadComplete={(url) => setFormData({ ...formData, receipt_url: url })} />
                                            </div>
                                        </motion.div>
                                    )}
                                </section>
                            </div>

                            {/* Summary Column */}
                            <div className="lg:col-span-5">
                                <div className="lg:sticky lg:top-32 bg-white p-12 border border-gray-100 shadow-2xl relative">
                                    <h3 className="text-xs font-bold tracking-[0.4em] uppercase text-[#1B1B1B] mb-12">Manifest Summary</h3>

                                    <div className="space-y-8 mb-12 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex gap-6 group">
                                                <div className="relative h-20 w-20 bg-[#F9F9F9] flex-shrink-0">
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt={item.name} className="object-cover w-full h-full transition-all duration-700" />
                                                    )}
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#1B1B1B] text-white text-[10px] font-bold flex items-center justify-center">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#1B1B1B] line-clamp-1">{item.name}</h4>
                                                    <p className="text-[9px] text-gray-400 uppercase font-medium">{item.variantName || "Standard Edition"}</p>
                                                    <p className="text-xs font-playfair font-black text-[#1B1B1B]">₨ {(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="flex-1 bg-transparent border-b border-gray-200 py-2 text-[10px] font-bold tracking-widest outline-none focus:border-[#1B1B1B]"
                                                placeholder="ENTER CODE"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                className="text-[10px] font-black tracking-widest uppercase text-[#1F8D9D] hover:text-[#1B1B1B] transition-colors"
                                            >
                                                APPLY
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                <span>Subtotal</span>
                                                <span className="text-[#1B1B1B]">₨ {cartTotal.toLocaleString()}</span>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-[10px] font-bold tracking-widest text-[#1F8D9D] uppercase">
                                                    <span>Benefit</span>
                                                    <span>-₨ {discountAmount.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                                                <span>Logistics</span>
                                                <span className="text-[#1F8D9D]">COMPLIMENTARY</span>
                                            </div>
                                            <div className="flex justify-between text-2xl font-playfair font-black text-[#1B1B1B] pt-6 border-t border-gray-100">
                                                <span>Total</span>
                                                <span>₨ {(cartTotal - discountAmount).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="group w-full bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white py-6 text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-700 shadow-xl flex items-center justify-center space-x-3 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : (
                                                <>
                                                    <span>Authorize Order</span>
                                                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                                                </>
                                            )}
                                        </button>
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
