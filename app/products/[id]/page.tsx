"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ShoppingCart, X, Phone, MapPin, User, Plus, Minus, ArrowLeft, Star, Shield, Leaf, Heart, AlertCircle, LogIn, Truck, Award, Clock, CheckCircle, Zap, Droplets, Sparkles, Package } from "lucide-react"
import Image from "next/image"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading from "@/components/ui/loading"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { sanitizeInput, validateEmail, validatePhone, validateName, validateAddress, validateQuantity, checkRateLimit } from "@/lib/security"
import { useIsMobile } from "@/hooks/use-mobile"

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
  const [customerName, setCustomerName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [activeTab, setActiveTab] = useState<'description'>('description')
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [orderError, setOrderError] = useState<string | null>(null)

  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Validation functions
  const validateField = (field: string, value: string | number): string | null => {
    switch (field) {
      case 'customer_name':
        if (typeof value !== 'string') return null
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 50) return 'Name must be less than 50 characters'
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Name can only contain letters and spaces'
        return null
      case 'address':
        if (typeof value !== 'string') return null
        if (value.trim().length < 10) return 'Address must be at least 10 characters'
        if (value.trim().length > 200) return 'Address must be less than 200 characters'
        return null
      case 'phone':
        if (typeof value !== 'string') return null
        const phoneRegex = /^(\+92|0)?[0-9]{10,11}$/
        if (!phoneRegex.test(value.replace(/\s+/g, ''))) return 'Please enter a valid Pakistani phone number'
        return null
      default:
        return null
    }
  }

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: string | number) => {
    if (field === 'customer_name' && typeof value === 'string') {
      setCustomerName(value)
      // Clear error when user starts typing
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else if (field === 'address' && typeof value === 'string') {
      setAddress(value)
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else if (field === 'phone' && typeof value === 'string') {
      setPhone(value)
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else if (field === 'quantity' && typeof value === 'number') {
      setQuantity(value)
    }
  }

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

  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleOrderNow = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setShowOrderModal(true)
  }

  // Reset form when modal closes
  const closeOrderModal = () => {
    setShowOrderModal(false)
    setFormErrors({})
    setOrderError(null)
    setOrderSuccess(false)
    setCustomerName("")
    setAddress("")
    setPhone("")
    setQuantity(1)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !user) return

    // Clear previous errors
    setFormErrors({})
    setOrderError(null)

    // Rate limiting check
    if (!checkRateLimit(user.id, 5, 60000)) {
      setOrderError("Too many requests. Please wait a minute before trying again.")
      return
    }

    // Validate all fields
    const errors: {[key: string]: string} = {}
    
    const nameError = validateField('customer_name', customerName)
    if (nameError) errors.customer_name = nameError

    const addressError = validateField('address', address)
    if (addressError) errors.address = addressError

    const phoneError = validateField('phone', phone)
    if (phoneError) errors.phone = phoneError

    if (quantity < 1 || quantity > 100) {
      errors.quantity = "Quantity must be between 1 and 100"
    }

    if (!validateEmail(user.email || '')) {
      setOrderError("Invalid user email. Please contact support.")
      return
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(customerName)
    const sanitizedAddress = sanitizeInput(address)
    const sanitizedPhone = sanitizeInput(phone)

    setOrderLoading(true)
    try {
      // First, ensure the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist in users table, create them
        const { error: insertUserError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            role: 'user'
          })

        if (insertUserError) {
          console.error("Error creating user record:", insertUserError)
          throw new Error("Failed to create user record. Please try again.")
        }
      } else if (userError) {
        console.error("Error checking user:", userError)
        throw new Error("User verification failed. Please try again.")
      }

      // Now insert the order
      const { data: orderData, error } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: product.id,
        customer_name: sanitizedName,
        address: sanitizedAddress,
        phone: sanitizedPhone,
        quantity: quantity,
        status: "pending",
      }).select().single()

      if (error) {
        console.error("Database error details:", error)
        throw error
      }

      // Send email notification to admin
      try {
        const totalAmount = (product.is_on_sale && product.sale_price 
          ? product.sale_price 
          : product.price) * quantity

        await fetch('/api/send-order-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'new_order',
            orderId: orderData.id,
            customerName: sanitizedName,
            customerEmail: user.email,
            customerPhone: sanitizedPhone,
            customerAddress: sanitizedAddress,
            productName: product.name,
            productPrice: product.is_on_sale && product.sale_price 
              ? product.sale_price 
              : product.price,
            quantity: quantity,
            totalAmount: totalAmount
          })
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Don't fail the order if email fails
      }

      setOrderSuccess(true)
      setTimeout(() => {
        closeOrderModal()
      }, 3000)
    } catch (error) {
      console.error("Error placing order:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to place order. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("user record")) {
          errorMessage = "Account setup issue. Please log out and log back in, then try again."
        } else if (error.message.includes("verification failed")) {
          errorMessage = "Account verification failed. Please contact support."
        } else if (error.message.includes("permission")) {
          errorMessage = "Permission denied. Please ensure you're logged in properly."
        }
      }
      
      setOrderError(errorMessage)
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />
        <Loading size="lg" text="Loading product details..." fullScreen={false} />
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
      icon: <Leaf className="w-7 h-7 text-[#3E7346]" />,
      title: "100% Natural",
      description: "Made with pure, natural ingredients sourced from organic farms",
      gradient: "from-[#3E7346]/10 to-[#3E7346]/5"
    },
    {
      icon: <Shield className="w-7 h-7 text-[#1F8D9D]" />,
      title: "Chemical Free",
      description: "No harmful chemicals, sulfates, or artificial preservatives",
      gradient: "from-[#1F8D9D]/10 to-[#1F8D9D]/5"
    },
    {
      icon: <Sparkles className="w-7 h-7 text-[#FDBA2D]" />,
      title: "Deep Nourishing",
      description: "Penetrates deep into hair follicles for lasting nourishment",
      gradient: "from-[#FDBA2D]/10 to-[#FDBA2D]/5"
    },
    {
      icon: <Award className="w-7 h-7 text-[#8B5CF6]" />,
      title: "Premium Quality",
      description: "Carefully crafted with the finest ingredients and traditional methods",
      gradient: "from-[#8B5CF6]/10 to-[#8B5CF6]/5"
    },
  ]

  const trustBadges = [
    {
      icon: <Truck className="w-5 h-5 text-[#1F8D9D]" />,
      title: "Free Delivery",
      description: "On orders above PKR 1000"
    },
    {
      icon: <Clock className="w-5 h-5 text-[#3E7346]" />,
      title: "Fast Shipping",
      description: "5-7 days"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-[#FDBA2D]" />,
      title: "Quality Guarantee",
      description: "100% satisfaction"
    },
    {
      icon: <Package className="w-5 h-5 text-[#8B5CF6]" />,
      title: "Secure Packaging",
      description: "Safe & hygienic"
    }
  ]

  const ingredients = [
    "Coconut Oil - Deep moisturizing and strengthening",
    "Argan Oil - Rich in vitamins and antioxidants",
    "Jojoba Oil - Balances scalp oil production",
    "Rosemary Extract - Stimulates hair growth",
    "Vitamin E - Protects against damage",
    "Aloe Vera - Soothes and conditions scalp"
  ]

  const usageInstructions = [
    "Apply 2-3 drops to damp or dry hair",
    "Gently massage into scalp and hair roots",
    "Leave for 30 minutes or overnight for deep treatment",
    "Wash with mild shampoo and lukewarm water",
    "Use 2-3 times per week for best results"
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.push("/products")}
          className="flex items-center space-x-2 text-[#1F8D9D] hover:text-[#186F7B] mb-4 sm:mb-8 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Back to Products</span>
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Enhanced Product Image Section */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Sale Badge */}
            {product.is_on_sale && product.sale_percentage && (
              <motion.div
                className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-full text-sm sm:text-base lg:text-lg font-bold z-20 shadow-xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: isMobile ? 1 : 1.05 }}
              >
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>-{product.sale_percentage}% OFF</span>
                </div>
              </motion.div>
            )}

            {/* Main Product Image */}
            <motion.div
              className="relative aspect-square overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-xl sm:shadow-2xl cursor-pointer group"
              onClick={() => setImageZoomed(!imageZoomed)}
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 z-10"></div>
              <ProductImage
                src={product.image_url}
                alt={product.name}
                width={600}
                height={600}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  imageZoomed ? 'scale-150' : 'group-hover:scale-110'
                }`}
                priority={true}
              />
              
              {/* Zoom Indicator */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/20 backdrop-blur-sm text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                {isMobile ? 'Tap to zoom' : 'Click to zoom'}
              </div>
            </motion.div>

            {/* Enhanced Decorative Elements - Hidden on mobile for better performance */}
            {!isMobile && (
              <>
                <motion.div
                  className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#1F8D9D]/30 to-[#3E7346]/30 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                ></motion.div>
                <motion.div
                  className="absolute -top-6 -left-6 w-40 h-40 bg-gradient-to-br from-[#FDBA2D]/30 to-[#1F8D9D]/30 rounded-full blur-2xl"
                  animate={{
                    scale: [1.1, 1, 1.1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                ></motion.div>
                <motion.div
                  className="absolute top-1/2 -right-8 w-20 h-20 bg-gradient-to-br from-[#8B5CF6]/20 to-[#FDBA2D]/20 rounded-full blur-xl"
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                ></motion.div>
              </>
            )}

            {/* Product Quality Indicators */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6 flex space-x-1.5 sm:space-x-2 z-20">
              <motion.div
                className="bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-full shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-[#3E7346]" />
                  <span className="text-xs sm:text-sm font-medium text-[#1B1B1B]">Natural</span>
                </div>
              </motion.div>
              <motion.div
                className="bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-full shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#1F8D9D]" />
                  <span className="text-xs sm:text-sm font-medium text-[#1B1B1B]">Safe</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Product Details */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Product Title and Price */}
            <div className="space-y-4 sm:space-y-6">
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-playfair font-bold text-[#1B1B1B] leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {product.name}
              </motion.h1>
              
              <motion.div
                className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {product.is_on_sale && product.sale_price ? (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-lg sm:text-xl md:text-2xl text-gray-500 line-through font-medium">
                      PKR {product.price.toFixed(0)}
                    </span>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F8D9D]">
                      PKR {product.sale_price.toFixed(0)}
                    </span>
                    {product.sale_percentage && (
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg w-fit">
                        SAVE {product.sale_percentage}%
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F8D9D]">
                    PKR {product.price.toFixed(0)}
                  </span>
                )}
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {trustBadges.map((badge, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div className="scale-75 sm:scale-100">
                        {badge.icon}
                      </div>
                      <span className="text-xs font-semibold text-[#1B1B1B] leading-tight">{badge.title}</span>
                      <span className="text-xs text-gray-600 leading-tight">{badge.description}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Product Information Tabs */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'description', label: 'Description', icon: <Heart className="w-4 h-4" /> }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all duration-300 ${
                      activeTab === tab.key
                        ? 'bg-[#1F8D9D] text-white shadow-lg'
                        : 'text-gray-600 hover:text-[#1F8D9D] hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'description' && (
                    <motion.div
                      key="description"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="prose prose-gray max-w-none">
                        <p className="text-lg text-gray-700 leading-relaxed">
                          {product.description || "Experience the power of nature with our premium hair oil. Specially formulated to nourish, strengthen, and transform your hair naturally. Our unique blend combines traditional wisdom with modern science to deliver exceptional results for all hair types."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Enhanced Quantity Selector */}
            <motion.div
              className="bg-gradient-to-br from-white via-white to-[#F9F9F9] p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1F8D9D]/5 via-transparent to-[#3E7346]/5"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1F8D9D]/10 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F8D9D]" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-[#1B1B1B]">Select Quantity</span>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-end space-x-4 sm:space-x-6">
                    <motion.button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1F8D9D] to-[#186F7B] hover:from-[#186F7B] hover:to-[#1F8D9D] text-white flex items-center justify-center transition-colors duration-200 shadow-lg hover:shadow-xl"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                    
                    <div className="w-16 h-12 sm:w-20 sm:h-16 bg-gradient-to-br from-[#1F8D9D] to-[#3E7346] text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="font-bold text-xl sm:text-2xl">{quantity}</span>
                    </div>
                    
                    <motion.button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1F8D9D] to-[#186F7B] hover:from-[#186F7B] hover:to-[#1F8D9D] text-white flex items-center justify-center transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                  </div>
                </div>
                
                <motion.div
                  className="bg-gradient-to-r from-white to-[#F9F9F9] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#1F8D9D]/30 shadow-inner"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FDBA2D]/20 rounded-full flex items-center justify-center">
                        <span className="text-[#FDBA2D] font-bold text-sm sm:text-base">₨</span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-700">Total Amount</span>
                    </div>
                    <div className="text-left sm:text-right">
                      {product.is_on_sale && product.sale_price ? (
                        <>
                          <div className="text-sm text-gray-500 line-through font-medium">
                            PKR {(product.price * quantity).toFixed(0)}
                          </div>
                          <div className="text-2xl sm:text-3xl font-bold text-[#1F8D9D]">
                            PKR {(product.sale_price * quantity).toFixed(0)}
                          </div>
                          <motion.div
                            className="text-xs sm:text-sm text-green-600 font-bold bg-green-50 px-2 sm:px-3 py-1 rounded-full inline-block mt-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1, type: "spring" }}
                          >
                            💰 Save PKR {((product.price - product.sale_price) * quantity).toFixed(0)}
                          </motion.div>
                        </>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-bold text-[#1F8D9D]">
                          PKR {(product.price * quantity).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Order Button */}
            <motion.button
              onClick={handleOrderNow}
              className="w-full bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] hover:from-[#186F7B] hover:to-[#2F5A35] text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-xl hover:shadow-2xl relative overflow-hidden"
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
              <span className="relative z-10">Order Now - Cash on Delivery</span>
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-sm opacity-75">
                💳
              </div>
            </motion.button>

            <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1">
              <p>✓ Cash on delivery available</p>
              <p>✓ 100% satisfaction guarantee</p>
              <p>✓ Premium natural ingredients</p>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Product Features */}
        <motion.section
          className="mb-12 sm:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-[#1B1B1B] mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Why Choose <span className="bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] bg-clip-text text-transparent">ZEENE</span>?
            </motion.h2>
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Discover the natural power that transforms your hair with our premium, scientifically-formulated hair oil
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`relative bg-gradient-to-br ${feature.gradient} p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 backdrop-blur-sm group overflow-hidden`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ y: isMobile ? 0 : -10, scale: isMobile ? 1 : 1.02 }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                
                <div className="relative z-10">
                  <motion.div
                    className="flex justify-center mb-4 sm:mb-6"
                    whileHover={{ rotate: isMobile ? 0 : 360, scale: isMobile ? 1 : 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="scale-75 sm:scale-100">
                        {feature.icon}
                      </div>
                    </div>
                  </motion.div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-[#1B1B1B] text-center mb-3 sm:mb-4 group-hover:text-[#1F8D9D] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Decorative Line */}
                  <motion.div
                    className="w-8 sm:w-12 h-1 bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] rounded-full mx-auto mt-3 sm:mt-4 opacity-0 group-hover:opacity-100"
                    initial={{ width: 0 }}
                    whileInView={{ width: isMobile ? 32 : 48 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Trust Section */}
          <motion.div
            className="mt-8 sm:mt-12 lg:mt-16 bg-gradient-to-r from-[#1F8D9D]/5 via-white to-[#3E7346]/5 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1B1B1B] mb-4 sm:mb-6">Our Promise to You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#3E7346] flex-shrink-0" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">100% Natural Formula</span>
                </div>
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#1F8D9D] flex-shrink-0" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Dermatologically Tested</span>
                </div>
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#FDBA2D] flex-shrink-0" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Made with Love</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>

      {/* Enhanced Order Modal */}
      {showOrderModal && product && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-3xl relative overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1F8D9D]/5 via-transparent to-[#3E7346]/5"></div>
            
            {/* Fixed Header */}
            <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 lg:p-8 pb-0">
              <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1F8D9D] to-[#3E7346] rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1B1B1B] truncate">Complete Your Order</h3>
                    <p className="text-sm sm:text-base text-gray-600 truncate">{product.name}</p>
                  </div>
                </div>
                <motion.button
                  onClick={closeOrderModal}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                  whileHover={{ scale: isMobile ? 1 : 1.1, rotate: isMobile ? 0 : 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </motion.button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="relative z-10 flex-1 force-scrollbar smooth-scroll scroll-container px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8" style={{ minHeight: '300px', maxHeight: isMobile ? '70vh' : '65vh' }}>

              {orderSuccess ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  >
                    <motion.svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </motion.div>
                  <motion.h4
                    className="text-2xl font-bold text-[#1B1B1B] mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Order Placed Successfully! 🎉
                  </motion.h4>
                  <motion.p
                    className="text-gray-600 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Your order has been submitted and is pending approval. We'll contact you soon!
                  </motion.p>
                </motion.div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                  {/* Form Progress Indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Form Completion</span>
                      <span className="text-sm text-blue-600">
                        {(() => {
                          const fields = ['customer_name', 'address', 'phone']
                          const completed = fields.filter(field => {
                            const value = field === 'customer_name' ? customerName : field === 'address' ? address : phone
                            return value.trim().length > 0 && !formErrors[field]
                          }).length
                          return `${completed}/3 fields completed`
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(() => {
                            const fields = ['customer_name', 'address', 'phone']
                            const completed = fields.filter(field => {
                              const value = field === 'customer_name' ? customerName : field === 'address' ? address : phone
                              return value.trim().length > 0 && !formErrors[field]
                            }).length
                            return (completed / 3) * 100
                          })()}%`
                        }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                      />
                    </div>
                  </motion.div>

                  {/* Form Validation Summary */}
                  {Object.keys(formErrors).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Please fix the following errors:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {Object.entries(formErrors).map(([field, error]) => (
                              <li key={field} className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                <span className="capitalize">{field.replace('_', ' ')}: {error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Order Error */}
                  {orderError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-red-800 mb-1">Order Error</h4>
                          <p className="text-sm text-red-700">{orderError}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Order Summary */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#F9F9F9] to-[#F0F8FF] p-6 rounded-2xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-[#1B1B1B]">{product.name}</span>
                      <div className="text-right">
                        {product.is_on_sale && product.sale_price ? (
                          <>
                            <span className="text-sm text-gray-500 line-through block">PKR {product.price.toFixed(0)}</span>
                            <span className="text-[#1F8D9D] font-bold text-lg">PKR {product.sale_price.toFixed(0)} each</span>
                          </>
                        ) : (
                          <span className="text-[#1F8D9D] font-bold text-lg">PKR {product.price.toFixed(0)} each</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Quantity Selector */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm font-medium text-[#1B1B1B]">Quantity:</span>
                        <p className="text-xs text-gray-500 mt-1">Max 100 items per order</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          disabled={quantity <= 1}
                          onClick={() => handleFieldChange('quantity', Math.max(1, quantity - 1))}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                            quantity <= 1 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1
                              handleFieldChange('quantity', Math.min(100, Math.max(1, value)))
                            }}
                            className="w-16 text-center font-bold text-lg border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                            aria-label="Product quantity"
                            title="Select quantity (1-100 items)"
                            placeholder="1"
                          />
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          disabled={quantity >= 100}
                          onClick={() => handleFieldChange('quantity', Math.min(100, quantity + 1))}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                            quantity >= 100 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Total Price */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] bg-clip-text text-transparent">
                        PKR {((product.is_on_sale && product.sale_price ? product.sale_price : product.price) * quantity).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">💰 Cash on Delivery</p>
                  </motion.div>

                  {/* Enhanced Form Fields */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-[#1B1B1B]">Full Name</label>
                      <span className={`text-xs ${
                        customerName.length > 50 ? 'text-red-500' : 
                        customerName.length > 40 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {customerName.length}/50
                      </span>
                    </div>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                        formErrors.customer_name ? 'text-red-400' : 
                        customerName.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        required
                        maxLength={50}
                        disabled={orderLoading}
                        value={customerName}
                        onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                        onBlur={(e) => {
                          const error = validateField('customer_name', e.target.value)
                          if (error) {
                            setFormErrors(prev => ({ ...prev, customer_name: error }))
                          }
                        }}
                        className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 transition-all duration-300 ${
                          orderLoading 
                            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                            : formErrors.customer_name 
                            ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                            : customerName.length > 0
                            ? 'border-[#1F8D9D] bg-blue-50 focus:ring-[#1F8D9D] focus:border-transparent'
                            : 'border-gray-200 focus:ring-[#1F8D9D] focus:border-transparent'
                        }`}
                        placeholder="Enter your full name (e.g., John Doe)"
                      />
                      {customerName.length > 0 && !formErrors.customer_name && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {formErrors.customer_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {formErrors.customer_name}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-[#1B1B1B]">Delivery Address</label>
                      <span className={`text-xs ${
                        address.length > 200 ? 'text-red-500' : 
                        address.length > 180 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {address.length}/200
                      </span>
                    </div>
                    <div className="relative">
                      <MapPin className={`absolute left-4 top-4 w-5 h-5 z-10 transition-colors duration-300 ${
                        formErrors.address ? 'text-red-400' : 
                        address.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                      }`} />
                      <textarea
                        required
                        maxLength={200}
                        disabled={orderLoading}
                        value={address}
                        onChange={(e) => {
                          handleFieldChange('address', e.target.value)
                          // Auto-expand textarea
                          const target = e.target as HTMLTextAreaElement
                          target.style.height = 'auto'
                          target.style.height = Math.max(target.scrollHeight, 80) + 'px'
                        }}
                        onBlur={(e) => {
                          const error = validateField('address', e.target.value)
                          if (error) {
                            setFormErrors(prev => ({ ...prev, address: error }))
                          }
                        }}
                        className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 transition-all duration-300 resize-none overflow-hidden ${
                          orderLoading 
                            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                            : formErrors.address 
                            ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                            : address.length > 0
                            ? 'border-[#1F8D9D] bg-blue-50 focus:ring-[#1F8D9D] focus:border-transparent'
                            : 'border-gray-200 focus:ring-[#1F8D9D] focus:border-transparent'
                        }`}
                        placeholder="Enter your complete delivery address&#10;Example: House 123, Street 5, Block A&#10;DHA Phase 2, Lahore, Punjab 54000"
                        rows={3}
                        style={{ 
                          minHeight: '80px',
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}
                      />
                      {address.length >= 10 && !formErrors.address && (
                        <div className="absolute right-4 top-4">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {formErrors.address && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {formErrors.address}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-[#1B1B1B]">Phone Number</label>
                      <span className="text-xs text-gray-400">Pakistani format</span>
                    </div>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                        formErrors.phone ? 'text-red-400' : 
                        phone.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                      }`} />
                      <input
                        type="tel"
                        required
                        disabled={orderLoading}
                        value={phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={(e) => {
                          const error = validateField('phone', e.target.value)
                          if (error) {
                            setFormErrors(prev => ({ ...prev, phone: error }))
                          }
                        }}
                        className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 transition-all duration-300 ${
                          orderLoading 
                            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                            : formErrors.phone 
                            ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                            : phone.length > 0
                            ? 'border-[#1F8D9D] bg-blue-50 focus:ring-[#1F8D9D] focus:border-transparent'
                            : 'border-gray-200 focus:ring-[#1F8D9D] focus:border-transparent'
                        }`}
                        placeholder="Enter phone number (e.g., 03001234567)"
                      />
                      {phone.length > 0 && !formErrors.phone && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {formErrors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {formErrors.phone}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={orderLoading || Object.keys(formErrors).length > 0}
                    whileHover={{ scale: orderLoading ? 1 : 1.02 }}
                    whileTap={{ scale: orderLoading ? 1 : 0.98 }}
                    className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 mt-6 sm:mt-8 ${
                      orderLoading || Object.keys(formErrors).length > 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] hover:from-[#186F7B] hover:to-[#2F5A35] text-white'
                    }`}
                  >
                    {orderLoading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Place Order - Cash on Delivery</span>
                        <span className="text-lg sm:text-xl">💳</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
              
              {/* Extra padding to ensure scrollable content */}
              <div className="h-16"></div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-6 sm:p-8 text-center"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1F8D9D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#1F8D9D]" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1B1B1B] mb-3 sm:mb-4">
              Authentication Required
            </h3>
            
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Please log in to your account to place an order for this premium hair oil product.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#1F8D9D] text-white rounded-lg hover:bg-[#186F7B] transition-colors duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
              
              <Link
                href="/signup"
                className="px-6 py-3 bg-[#FDBA2D] text-[#1B1B1B] rounded-lg hover:bg-[#FDBA2D]/90 transition-colors duration-300"
              >
                Sign Up
              </Link>
              
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </ErrorBoundary>
  )
}