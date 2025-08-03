"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import AuthGuard from "@/components/auth-guard"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ShoppingCart, X, Phone, MapPin, User, Plus, Minus, Eye, AlertCircle, LogIn, Star, Heart, Filter, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { sanitizeInput, validateEmail, validatePhone, validateName, validateAddress, validateQuantity, checkRateLimit } from "@/lib/security"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading, { ProductSkeleton } from "@/components/ui/loading"

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
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
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, sortBy])

  const filterAndSortProducts = () => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = a.is_on_sale && a.sale_price ? a.sale_price : a.price
          const priceB = b.is_on_sale && b.sale_price ? b.sale_price : b.price
          return priceA - priceB
        })
        break
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = a.is_on_sale && a.sale_price ? a.sale_price : a.price
          const priceB = b.is_on_sale && b.sale_price ? b.sale_price : b.price
          return priceB - priceA
        })
        break
      case "sale":
        filtered.sort((a, b) => {
          if (a.is_on_sale && !b.is_on_sale) return -1
          if (!a.is_on_sale && b.is_on_sale) return 1
          return 0
        })
        break
      default: // newest
        break
    }

    setFilteredProducts(filtered)
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
    } else {
      newFavorites.add(productId)
    }
    setFavorites(newFavorites)
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      
      console.log('Fetched products:', data)
      data?.forEach(product => {
        console.log(`Product: ${product.name}, Image URL: ${product.image_url}`)
      })
      
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleOrderNow = (product: Product) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setSelectedProduct(product)
    setShowOrderModal(true)
  }

  const [orderError, setOrderError] = useState<string | null>(null)

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderError(null)
    
    if (!selectedProduct || !user) {
      setOrderError("Missing product or user information")
      return
    }

    try {
      // Rate limiting check
      if (!checkRateLimit(user.id, 5, 60000)) {
        setOrderError("Too many requests. Please wait a minute before trying again.")
        return
      }

      // Validate inputs
      const sanitizedName = sanitizeInput(orderForm.customer_name)
      const sanitizedAddress = sanitizeInput(orderForm.address)
      const sanitizedPhone = sanitizeInput(orderForm.phone)

      if (!validateName(sanitizedName)) {
        setOrderError("Please enter a valid name (2-50 characters, letters only)")
        return
      }

      if (!validateAddress(sanitizedAddress)) {
        setOrderError("Please enter a valid address (10-200 characters)")
        return
      }

      if (!validatePhone(sanitizedPhone)) {
        setOrderError("Please enter a valid phone number")
        return
      }

      if (!validateQuantity(orderForm.quantity)) {
        setOrderError("Please enter a valid quantity (1-100)")
        return
      }

      if (!validateEmail(user.email || '')) {
        setOrderError("Invalid user email. Please contact support.")
        return
      }

      setOrderLoading(true)
      const { data: orderData, error } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: selectedProduct.id,
        customer_name: sanitizedName,
        address: sanitizedAddress,
        phone: sanitizedPhone,
        quantity: orderForm.quantity,
        status: "pending",
      }).select().single()

      if (error) throw error

      // Send email notification to admin
      try {
        const totalAmount = (selectedProduct.is_on_sale && selectedProduct.sale_price 
          ? selectedProduct.sale_price 
          : selectedProduct.price) * orderForm.quantity

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
            productName: selectedProduct.name,
            productPrice: selectedProduct.is_on_sale && selectedProduct.sale_price 
              ? selectedProduct.sale_price 
              : selectedProduct.price,
            quantity: orderForm.quantity,
            totalAmount: totalAmount
          })
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Don't fail the order if email fails
      }

      setOrderSuccess(true)
      setTimeout(() => {
        setShowOrderModal(false)
        setOrderSuccess(false)
        setOrderForm({ customer_name: "", address: "", phone: "", quantity: 1 })
      }, 2000)
    } catch (error) {
      console.error("Error placing order:", error)
      setOrderError("Failed to place order. Please try again.")
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F9F9] via-white to-[#F0F8FF]">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-96 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mx-auto animate-pulse" />
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ProductSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#F9F9F9] via-white to-[#F0F8FF]">
        <Navigation />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-6xl font-playfair font-bold text-[#1B1B1B] mb-6"
            >
              Our <span className="bg-gradient-to-r from-[#1F8D9D] to-[#FDBA2D] bg-clip-text text-transparent">Premium</span> Collection
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
            >
              Discover our range of natural hair oils crafted for healthy, beautiful hair
            </motion.p>
            
            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    <label htmlFor="search-input" className="sr-only">Search products</label>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search products"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <label htmlFor="sort-select" className="sr-only">Sort products by</label>
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort products by"
                      className="appearance-none w-full sm:w-auto bg-white/50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 text-sm sm:text-base focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all duration-300"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="sale">On Sale</option>
                    </select>
                    <Filter className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${searchQuery}-${sortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 relative border border-white/20"
                >
                  {/* Sale Badge */}
                  {product.is_on_sale && product.sale_percentage && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: -12 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                      className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold z-20 shadow-lg"
                    >
                      -{product.sale_percentage}% OFF
                    </motion.div>
                  )}
                  
                  {/* Favorite Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300"
                  >
                    <Heart 
                      className={`w-5 h-5 transition-colors duration-300 ${
                        favorites.has(product.id) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-gray-400 hover:text-red-400'
                      }`} 
                    />
                  </motion.button>

                  {/* Product Image */}
                  <div className="aspect-square overflow-hidden relative">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      width={400}
                      height={400}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-6">
                    <div className="mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-[#1B1B1B] group-hover:text-[#1F8D9D] transition-colors duration-300">
                        {product.name}
                      </h3>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 line-clamp-2">{product.description}</p>
                    
                    {/* Price Section */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {product.is_on_sale && product.sale_price ? (
                          <>
                            <span className="text-sm sm:text-lg text-gray-400 line-through">PKR {product.price.toFixed(0)}</span>
                            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] bg-clip-text text-transparent">
                              PKR {product.sale_price.toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] bg-clip-text text-transparent">
                            PKR {product.price.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Link
                        href={`/products/${product.id}`}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-[#1F8D9D] rounded-xl transition-all duration-300 group/btn"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                        <span className="font-medium">View</span>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOrderNow(product)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] hover:from-[#186F7B] hover:to-[#1F8D9D] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group/btn"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform duration-300" />
                        <span className="font-medium">Order</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* No Products Message */}
          {filteredProducts.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-[#1F8D9D] to-[#FDBA2D] rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#1B1B1B] mb-2">No products found</h3>
              <p className="text-xl text-gray-600 mb-6">
                {searchQuery ? `No products match "${searchQuery}"` : "No products available at the moment."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] text-white rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Clear Search
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Enhanced Order Modal */}
        <AnimatePresence>
          {showOrderModal && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar"
            >
              <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full shadow-2xl border border-white/20 my-4 max-h-[90vh] flex flex-col"
                >
                  {/* Fixed Header */}
                  <div className="flex-shrink-0 p-4 sm:p-8 pb-0">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] bg-clip-text text-transparent">
                        Order {selectedProduct.name}
                      </h3>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowOrderModal(false)} 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300"
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 pb-4 sm:pb-8">

                {orderSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <h4 className="text-2xl font-bold text-[#1B1B1B] mb-3">Order Placed!</h4>
                    <p className="text-gray-600 text-lg">Your order has been submitted and is pending approval.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleOrderSubmit} className="space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-[#F9F9F9] to-[#F0F8FF] p-6 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-[#1B1B1B]">{selectedProduct.name}</span>
                        <div className="text-right">
                          {selectedProduct.is_on_sale && selectedProduct.sale_price ? (
                            <>
                              <span className="text-sm text-gray-500 line-through block">PKR {selectedProduct.price.toFixed(0)}</span>
                              <span className="text-[#1F8D9D] font-bold text-lg">PKR {selectedProduct.sale_price.toFixed(0)} each</span>
                            </>
                          ) : (
                            <span className="text-[#1F8D9D] font-bold text-lg">PKR {selectedProduct.price.toFixed(0)} each</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-[#1B1B1B]">Quantity:</span>
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, quantity: Math.max(1, orderForm.quantity - 1) })}
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 flex items-center justify-center transition-all duration-300 shadow-md"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="w-12 text-center font-bold text-lg">{orderForm.quantity}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, quantity: orderForm.quantity + 1 })}
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 flex items-center justify-center transition-all duration-300 shadow-md"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Total Price */}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] bg-clip-text text-transparent">
                          PKR {((selectedProduct.is_on_sale && selectedProduct.sale_price ? selectedProduct.sale_price : selectedProduct.price) * orderForm.quantity).toFixed(0)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center">💰 Cash on Delivery</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          value={orderForm.customer_name}
                          onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all duration-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                        <textarea
                          required
                          value={orderForm.address}
                          onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all duration-300"
                          placeholder="Enter your complete address"
                          rows={3}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          required
                          value={orderForm.phone}
                          onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent transition-all duration-300"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </motion.div>

                    {orderError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                          <p className="text-red-700 text-sm font-medium">{orderError}</p>
                        </div>
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={orderLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] hover:from-[#186F7B] hover:to-[#1F8D9D] text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-medium text-lg"
                    >
                      {orderLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Placing Order...</span>
                        </div>
                      ) : (
                        "Place Order (Cash on Delivery)"
                      )}
                    </motion.button>
                  </form>
                )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Authentication Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-white/20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-[#1F8D9D] to-[#FDBA2D] rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <AlertCircle className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-[#1B1B1B] mb-4"
                >
                  Authentication Required
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-8 text-lg"
                >
                  Please log in to your account to place an order and enjoy our premium hair oil products.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3"
                >
                  <Link
                    href="/login"
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Log In</span>
                  </Link>
                  
                  <Link
                    href="/signup"
                    className="px-6 py-3 bg-gradient-to-r from-[#FDBA2D] to-[#FFA500] text-[#1B1B1B] rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-center"
                  >
                    Sign Up
                  </Link>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAuthModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
}
