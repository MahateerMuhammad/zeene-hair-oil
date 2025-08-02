"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ShoppingCart, X, Phone, MapPin, User, Plus, Minus, ArrowLeft, Star, Shield, Leaf, Heart } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  is_on_sale: boolean | null
  sale_price: number | null
  sale_percentage: number | null
}

interface OrderFormData {
  customer_name: string
  address: string
  phone: string
  quantity: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    customer_name: "",
    address: "",
    phone: "",
    quantity: 1,
  })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error("Error fetching product:", error)
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  const handleOrderNow = () => {
    if (!user) {
      alert("Please login to place an order")
      return
    }
    setShowOrderModal(true)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !user) return

    setOrderLoading(true)
    try {
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: product.id,
        customer_name: orderForm.customer_name,
        address: orderForm.address,
        phone: orderForm.phone,
        quantity: orderForm.quantity,
        status: "pending",
      })

      if (error) throw error

      setOrderSuccess(true)
      setTimeout(() => {
        setShowOrderModal(false)
        setOrderSuccess(false)
        setOrderForm({ customer_name: "", address: "", phone: "", quantity: 1 })
      }, 2000)
    } catch (error) {
      console.error("Error placing order:", error)
      alert("Failed to place order. Please try again.")
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F8D9D]"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#1B1B1B] mb-4">Product not found</h1>
            <button
              onClick={() => router.push("/products")}
              className="text-[#1F8D9D] hover:underline"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: <Leaf className="w-6 h-6 text-[#3E7346]" />,
      title: "100% Natural",
      description: "Made with pure, natural ingredients",
    },
    {
      icon: <Shield className="w-6 h-6 text-[#1F8D9D]" />,
      title: "Chemical Free",
      description: "No harmful chemicals or sulfates",
    },
    {
      icon: <Heart className="w-6 h-6 text-[#FDBA2D]" />,
      title: "Nourishing",
      description: "Deep conditioning formula",
    },
    {
      icon: <Star className="w-6 h-6 text-[#3E7346]" />,
      title: "Premium Quality",
      description: "Carefully crafted ingredients",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.push("/products")}
          className="flex items-center space-x-2 text-[#1F8D9D] hover:text-[#186F7B] mb-8 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {product.is_on_sale && product.sale_percentage && (
              <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold z-10 shadow-lg">
                -{product.sale_percentage}% OFF
              </div>
            )}
            <div className="aspect-square overflow-hidden rounded-2xl bg-white shadow-2xl">
              <Image
                src={product.image_url || "/oil.png"}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#1F8D9D]/20 to-[#3E7346]/20 rounded-full blur-xl"></div>
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-[#FDBA2D]/20 to-[#1F8D9D]/20 rounded-full blur-xl"></div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-3">
                {product.is_on_sale && product.sale_price ? (
                  <>
                    <span className="text-2xl text-gray-500 line-through">PKR {product.price.toFixed(0)}</span>
                    <span className="text-3xl font-bold text-[#1F8D9D]">PKR {product.sale_price.toFixed(0)}</span>
                    {product.sale_percentage && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        -{product.sale_percentage}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold text-[#1F8D9D]">PKR {product.price.toFixed(0)}</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#FDBA2D] text-[#FDBA2D]" />
                ))}
                <span className="text-gray-600 ml-2">(4.9/5)</span>
              </div>
            </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <div className="bg-gradient-to-r from-[#F9F9F9] to-white p-6 rounded-xl border-l-4 border-[#1F8D9D]">
                <p className="text-lg text-gray-700 leading-relaxed mb-0">
                  {product.description || "Experience the power of nature with our premium hair oil. Specially formulated to nourish, strengthen, and transform your hair naturally."}
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3E7346]/10 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-[#3E7346]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1B1B1B]">Natural</h4>
                    <p className="text-sm text-gray-600">100% Pure</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#1F8D9D]/10 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#1F8D9D]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1B1B1B]">Safe</h4>
                    <p className="text-sm text-gray-600">Chemical Free</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-gradient-to-br from-white to-[#F9F9F9] p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold text-[#1B1B1B]">Select Quantity:</span>
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => setOrderForm({ ...orderForm, quantity: Math.max(1, orderForm.quantity - 1) })}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 flex items-center justify-center transition-all duration-200 shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </motion.button>
                  <div className="w-16 h-12 bg-[#1F8D9D] text-white rounded-lg flex items-center justify-center">
                    <span className="font-bold text-xl">{orderForm.quantity}</span>
                  </div>
                  <motion.button
                    onClick={() => setOrderForm({ ...orderForm, quantity: orderForm.quantity + 1 })}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 flex items-center justify-center transition-all duration-200 shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-5 h-5 text-gray-700" />
                  </motion.button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-[#1F8D9D]/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                  <div className="text-right">
                    {product.is_on_sale && product.sale_price ? (
                      <>
                        <div className="text-sm text-gray-500 line-through">
                          PKR {(product.price * orderForm.quantity).toFixed(0)}
                        </div>
                        <div className="text-2xl font-bold text-[#1F8D9D]">
                          PKR {(product.sale_price * orderForm.quantity).toFixed(0)}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          You save PKR {((product.price - product.sale_price) * orderForm.quantity).toFixed(0)}
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-[#1F8D9D]">
                        PKR {(product.price * orderForm.quantity).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Button */}
            <motion.button
              onClick={handleOrderNow}
              className="w-full bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] hover:from-[#186F7B] hover:to-[#2F5A35] text-white py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <ShoppingCart className="w-6 h-6 relative z-10" />
              <span className="relative z-10">Order Now - Cash on Delivery</span>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm opacity-75">
                💳
              </div>
            </motion.button>

            <div className="text-center text-sm text-gray-600">
              <p>✓ Cash on delivery available</p>
              <p>✓ 100% satisfaction guarantee</p>
              <p>✓ Premium natural ingredients</p>
            </div>
          </motion.div>
        </div>

        {/* Product Features */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-playfair font-bold text-[#1B1B1B] text-center mb-12">
            Why Choose <span className="text-gradient">ZEENE</span>?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#1B1B1B] text-center mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Order Modal */}
      {showOrderModal && product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-[#1B1B1B]">Order {product.name}</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-[#1B1B1B] mb-2">Order Placed!</h4>
                <p className="text-gray-600">Your order has been submitted and is pending approval.</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="bg-[#F9F9F9] p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{product.name}</span>
                    <div className="text-right">
                      {product.is_on_sale && product.sale_price ? (
                        <>
                          <span className="text-sm text-gray-500 line-through block">PKR {product.price.toFixed(0)}</span>
                          <span className="text-[#1F8D9D] font-bold">PKR {product.sale_price.toFixed(0)} each</span>
                        </>
                      ) : (
                        <span className="text-[#1F8D9D] font-bold">PKR {product.price.toFixed(0)} each</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#1B1B1B]">Quantity: {orderForm.quantity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="text-[#1F8D9D] font-bold text-lg">
                      PKR {((product.is_on_sale && product.sale_price ? product.sale_price : product.price) * orderForm.quantity).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Cash on Delivery</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={orderForm.customer_name}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      required
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                      placeholder="Enter your complete address"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderLoading}
                  className="w-full py-3 bg-[#1F8D9D] text-white rounded-full transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#186F7B]"
                >
                  {orderLoading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}