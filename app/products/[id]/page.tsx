"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { ShoppingCart, ArrowLeft, Leaf, Shield, Zap, Plus, Minus, Heart } from "lucide-react"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading from "@/components/ui/loading"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"

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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [activeTab, setActiveTab] = useState<'description'>('description')
  const [quantity, setQuantity] = useState(1)

  const isMobile = useIsMobile()

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

  const trustBadges = [
    {
      icon: <Leaf className="w-5 h-5 text-[#3E7346]" />,
      title: "100% Natural",
      description: "Organic ingredients"
    },
    {
      icon: <Shield className="w-5 h-5 text-[#1F8D9D]" />,
      title: "Chemical Free",
      description: "No sulfates/parabens"
    },
    {
      icon: <Zap className="w-5 h-5 text-[#FDBA2D]" />,
      title: "Fast Results",
      description: "Visible in 2 weeks"
    },
    {
      icon: <Heart className="w-5 h-5 text-[#8B5CF6]" />,
      title: "Cruelty Free",
      description: "Not tested on animals"
    }
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
                  className={`w-full h-full object-cover transition-all duration-500 ${imageZoomed ? 'scale-150' : 'group-hover:scale-110'
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
                </>
              )}
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
                      className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all duration-300 ${activeTab === tab.key
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

              {/* Quantity Selector and Add to Cart */}
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
                    className="bg-gradient-to-r from-white to-[#F9F9F9] p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#1F8D9D]/30 shadow-inner mb-6"
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

                  {/* Add To Cart Button */}
                  <AddToCartButton
                    product={product}
                    quantity={quantity}
                    className="w-full py-4 sm:py-5 text-lg"
                  />

                  <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1 mt-4">
                    <p>✓ Cash on delivery available</p>
                    <p>✓ 100% satisfaction guarantee</p>
                    <p>✓ Premium natural ingredients</p>
                  </div>
                </div>
              </motion.div>
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
                We combine traditional wisdom with modern science to create the perfect hair care solution.
              </motion.p>
            </div>
          </motion.section>
        </div>
      </div>
    </ErrorBoundary>
  )
}