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
import Loading from "@/components/ui/loading"

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
  guest_email?: string
  address: string
  phone: string
  quantity: number
}

interface FormErrors {
  customer_name?: string
  guest_email?: string
  address?: string
  phone?: string
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
    guest_email: "",
    address: "",
    phone: "",
    quantity: 1,
  })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const { user } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, sortBy])

  // Auto-expand textarea when modal opens and reset form when modal closes
  useEffect(() => {
    if (showOrderModal) {
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="delivery address"]') as HTMLTextAreaElement
        if (textarea) {
          textarea.style.height = 'auto'
          textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px'
        }
      }, 100)
    } else {
      // Reset form when modal closes
      setOrderForm({ customer_name: "", guest_email: "", address: "", phone: "", quantity: 1 })
      setFormErrors({})
      setOrderError(null)
      setOrderSuccess(false)
    }
  }, [showOrderModal, orderForm.address])

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



  const handleOrderNow = (product: Product) => {
    setSelectedProduct(product)
    setShowOrderModal(true)
  }

  const [orderError, setOrderError] = useState<string | null>(null)

  // Simplified validation function
  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    if (!value || value.trim().length === 0) {
      switch (field) {
        case 'customer_name':
          return "Name is required"
        case 'guest_email':
          return "Email is required"
        case 'address':
          return "Address is required"
        case 'phone':
          return "Phone number is required"
      }
    }

    const trimmedValue = value.trim()
    
    switch (field) {
      case 'customer_name':
        if (trimmedValue.length < 2) {
          return "Name must be at least 2 characters"
        }
        break
        
      case 'guest_email':
        if (!validateEmail(trimmedValue)) {
          return "Please enter a valid email address"
        }
        break
        
      case 'address':
        if (trimmedValue.length < 5) {
          return "Address must be at least 5 characters"
        }
        break
        
      case 'phone':
        // Simple phone validation - just check for digits
        const digitsOnly = trimmedValue.replace(/\D/g, '')
        if (digitsOnly.length < 10) {
          return "Phone number must be at least 10 digits"
        }
        break
    }
    return undefined
  }

  // Handle form field changes without real-time validation
  const handleFieldChange = (field: keyof OrderFormData, value: string | number) => {
    setOrderForm(prev => ({ ...prev, [field]: value }))
    
    // Clear any existing error for this field when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderError(null)
    setFormErrors({})
    
    if (!selectedProduct) {
      setOrderError("Unable to process order. Please refresh the page and try again.")
      return
    }

    try {
      // Rate limiting check - use user ID if logged in, or IP-based for guests
      const rateLimitKey = user ? user.id : 'guest'
      if (!checkRateLimit(rateLimitKey, 5, 60000)) {
        setOrderError("Too many requests. Please wait a minute before trying again.")
        return
      }

      // Validate all inputs and collect errors
      const errors: FormErrors = {}

      // Validate each field
      const nameError = validateField('customer_name', orderForm.customer_name)
      const addressError = validateField('address', orderForm.address)
      const phoneError = validateField('phone', orderForm.phone)

      if (nameError) errors.customer_name = nameError
      if (addressError) errors.address = addressError
      if (phoneError) errors.phone = phoneError

      // Validate guest email if user is not logged in
      if (!user) {
        const emailError = validateField('guest_email', orderForm.guest_email || '')
        if (emailError) errors.guest_email = emailError
      }

      // Validate quantity
      if (!orderForm.quantity || orderForm.quantity < 1) {
        setOrderError("Please select at least 1 item")
        return
      }
      if (orderForm.quantity > 100) {
        setOrderError("Maximum quantity allowed is 100 items per order")
        return
      }

      // Validate email based on user status
      const emailToValidate = user ? user.email || '' : orderForm.guest_email || ''
      if (!validateEmail(emailToValidate)) {
        if (user) {
          setOrderError("Invalid user email. Please contact support.")
        } else {
          errors.guest_email = "Please enter a valid email address"
        }
      }

      // If there are validation errors, show them and stop
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setOrderError("Please fix the errors above before submitting your order.")
        return
      }

      // Sanitize inputs after validation
      const sanitizedName = sanitizeInput(orderForm.customer_name)
      const sanitizedAddress = sanitizeInput(orderForm.address)
      const sanitizedPhone = sanitizeInput(orderForm.phone)

      setOrderLoading(true)
      
      // Simple user ID assignment
      const userId = user ? user.id : null

      // Insert the order (user_id will be null for guest orders)
      const { data: orderData, error } = await supabase.from("orders").insert({
        user_id: userId,
        product_id: selectedProduct.id,
        customer_name: sanitizedName,
        customer_email: user ? user.email : orderForm.guest_email, // Store email for both guest and authenticated users
        address: sanitizedAddress,
        phone: sanitizedPhone,
        quantity: orderForm.quantity,
        status: "pending",
      }).select().single()

      if (error) {
        console.error("Database error:", error)
        throw new Error("Failed to place order. Please try again.")
      }

      // Send email notification to admin
      try {
        const totalAmount = (selectedProduct.is_on_sale && selectedProduct.sale_price 
          ? selectedProduct.sale_price 
          : selectedProduct.price) * orderForm.quantity

        // Use user email if logged in, otherwise use guest email
        const customerEmail = user ? user.email : orderForm.guest_email

        await fetch('/api/send-order-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'new_order',
            orderId: orderData.id,
            customerName: sanitizedName,
            customerEmail: customerEmail,
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
        setOrderForm({ customer_name: "", guest_email: "", address: "", phone: "", quantity: 1 })
        setFormErrors({})
        setOrderError(null)
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
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-4 animate-pulse" />
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2 animate-pulse" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4 mb-4 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
                </div>
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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
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
                  className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full shadow-2xl border border-white/20 my-4 max-h-[70vh] flex flex-col"
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
                        onClick={() => {
                          setShowOrderModal(false)
                          setFormErrors({})
                          setOrderError(null)
                        }} 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300"
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 force-scrollbar smooth-scroll scroll-container px-4 sm:px-8 pb-4 sm:pb-8" style={{ minHeight: '300px', maxHeight: '65vh' }}>

                {orderSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                      className="w-24 h-24 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    
                    <motion.h4 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-4"
                    >
                      Order Placed Successfully! 🎉
                    </motion.h4>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200"
                    >
                      <p className="text-green-800 text-lg mb-4 font-medium">
                        Thank you for your order! We've received your request and will process it shortly.
                      </p>
                      
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Order confirmation sent to your email</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>We'll contact you within 24 hours</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Payment on delivery (Cash on Delivery)</span>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-gray-600 text-base"
                    >
                      Order Status: <span className="font-semibold text-yellow-600">Pending Approval</span>
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
                            const fields = user ? ['customer_name', 'address', 'phone'] : ['customer_name', 'guest_email', 'address', 'phone']
                            const completed = fields.filter(field => {
                              const value = orderForm[field as keyof OrderFormData]
                              return value && 
                                typeof value === 'string' && 
                                value.trim().length > 0 &&
                                !formErrors[field as keyof FormErrors]
                            }).length
                            return `${completed}/${fields.length} fields completed`
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(() => {
                              const fields = user ? ['customer_name', 'address', 'phone'] : ['customer_name', 'guest_email', 'address', 'phone']
                              const completed = fields.filter(field => {
                                const value = orderForm[field as keyof OrderFormData]
                                return value && 
                                  typeof value === 'string' && 
                                  value.trim().length > 0 &&
                                  !formErrors[field as keyof FormErrors]
                              }).length
                              return (completed / fields.length) * 100
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
                            disabled={orderForm.quantity <= 1}
                            onClick={() => handleFieldChange('quantity', Math.max(1, orderForm.quantity - 1))}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                              orderForm.quantity <= 1 
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
                              value={orderForm.quantity}
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
                            disabled={orderForm.quantity >= 100}
                            onClick={() => handleFieldChange('quantity', Math.min(100, orderForm.quantity + 1))}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                              orderForm.quantity >= 100 
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
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-[#1B1B1B]">Full Name</label>
                        <span className={`text-xs ${
                          orderForm.customer_name.length > 50 ? 'text-red-500' : 
                          orderForm.customer_name.length > 40 ? 'text-yellow-500' : 'text-gray-400'
                        }`}>
                          {orderForm.customer_name.length}/50
                        </span>
                      </div>
                      <div className="relative">
                        <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 ${
                          formErrors.customer_name ? 'text-red-400' : 
                          orderForm.customer_name.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          required
                          maxLength={50}
                          disabled={orderLoading}
                          value={orderForm.customer_name}
                          onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#1F8D9D] hover:border-gray-400 transition-colors duration-200"
                          placeholder="Enter your full name (e.g., John Doe)"
                          style={{ 
                            boxShadow: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                          }}
                        />
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

                    {/* Guest Email Field - Only show for non-logged-in users */}
                    {!user && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-[#1B1B1B]">Email Address</label>
                          <span className="text-xs text-gray-400">For order updates</span>
                        </div>
                        <div className="relative">
                          <svg className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                            formErrors.guest_email ? 'text-red-400' : 
                            (orderForm.guest_email && orderForm.guest_email.length > 0) ? 'text-[#1F8D9D]' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <input
                            type="email"
                            required
                            disabled={orderLoading}
                            value={orderForm.guest_email || ''}
                            onChange={(e) => handleFieldChange('guest_email', e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-colors duration-200 ${
                              orderLoading 
                                ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                                : formErrors.guest_email 
                                ? 'border-red-400 bg-red-50' 
                                : (orderForm.guest_email && orderForm.guest_email.length > 0)
                                ? 'border-[#1F8D9D] bg-blue-50'
                                : 'border-gray-300 bg-white hover:border-gray-400 focus:border-[#1F8D9D]'
                            }`}
                            placeholder="Enter your email address (e.g., john@example.com)"
                          />
                          {orderForm.guest_email && orderForm.guest_email.length > 0 && !formErrors.guest_email && validateEmail(orderForm.guest_email) && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {formErrors.guest_email && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
                          >
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {formErrors.guest_email}
                          </motion.p>
                        )}
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: user ? 0.2 : 0.25 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-[#1B1B1B]">Delivery Address</label>
                        <span className={`text-xs ${
                          orderForm.address.length > 200 ? 'text-red-500' : 
                          orderForm.address.length > 180 ? 'text-yellow-500' : 'text-gray-400'
                        }`}>
                          {orderForm.address.length}/200
                        </span>
                      </div>
                      <div className="relative">
                        <MapPin className={`absolute left-4 top-4 w-5 h-5 z-10 transition-colors duration-300 ${
                          formErrors.address ? 'text-red-400' : 
                          orderForm.address.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                        }`} />
                        <textarea
                          required
                          maxLength={200}
                          disabled={orderLoading}
                          value={orderForm.address}
                          onChange={(e) => {
                            handleFieldChange('address', e.target.value)
                            // Auto-expand textarea
                            const target = e.target as HTMLTextAreaElement
                            target.style.height = 'auto'
                            target.style.height = Math.max(target.scrollHeight, 80) + 'px'
                          }}
                          className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-colors duration-200 resize-none overflow-hidden ${
                            orderLoading 
                              ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                              : formErrors.address 
                              ? 'border-red-400 bg-red-50' 
                              : orderForm.address.length > 0
                              ? 'border-[#1F8D9D] bg-blue-50'
                              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-[#1F8D9D]'
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
                        {orderForm.address.length >= 5 && !formErrors.address && (
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
                          className="mt-2 text-sm text-red-600 flex items-start bg-red-50 p-3 rounded-lg"
                        >
                          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{formErrors.address}</span>
                        </motion.p>
                      )}
                      <div className="mt-2 flex items-start space-x-2">
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Include house/building number, street name, area, city, and postal code for accurate delivery
                        </p>
                      </div>
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
                          orderForm.phone.length > 0 ? 'text-[#1F8D9D]' : 'text-gray-400'
                        }`} />
                        <input
                          type="tel"
                          required
                          disabled={orderLoading}
                          value={orderForm.phone}
                          onChange={(e) => {
                            // Format phone number as user types
                            let value = e.target.value.replace(/\D/g, '')
                            if (value.startsWith('92')) {
                              value = '+' + value
                            } else if (value.startsWith('0')) {
                              value = value
                            } else if (value.length > 0 && !value.startsWith('0') && !value.startsWith('+92')) {
                              value = '0' + value
                            }
                            handleFieldChange('phone', value)
                          }}
                          className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-colors duration-200 ${
                            orderLoading 
                              ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                              : formErrors.phone 
                              ? 'border-red-400 bg-red-50' 
                              : orderForm.phone.length > 0
                              ? 'border-[#1F8D9D] bg-blue-50'
                              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-[#1F8D9D]'
                          }`}
                          placeholder="03XX-XXXXXXX or +92-3XX-XXXXXXX"
                        />
                        {orderForm.phone.replace(/\D/g, '').length >= 10 && !formErrors.phone && (
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
                      <p className="mt-1 text-xs text-gray-500">
                        Enter your mobile number for order updates and delivery coordination
                      </p>
                    </motion.div>

                    {orderError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Order Submission Error</h4>
                            <p className="text-sm text-red-700">{orderError}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Form Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                    >
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Order Summary</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span>Product:</span>
                          <span className="font-medium">{selectedProduct.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-medium">{orderForm.quantity} item(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment:</span>
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                          <span className="font-semibold">Total Amount:</span>
                          <span className="font-bold text-lg">
                            PKR {((selectedProduct.is_on_sale && selectedProduct.sale_price ? selectedProduct.sale_price : selectedProduct.price) * orderForm.quantity).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: orderLoading ? 1 : 1.02 }}
                      whileTap={{ scale: orderLoading ? 1 : 0.98 }}
                      type="submit"
                      disabled={orderLoading || Object.keys(formErrors).length > 0}
                      className={`w-full py-4 rounded-xl transition-all duration-300 shadow-lg font-medium text-lg ${
                        orderLoading || Object.keys(formErrors).length > 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#1F8D9D] to-[#186F7B] hover:from-[#186F7B] hover:to-[#1F8D9D] text-white hover:shadow-xl'
                      }`}
                    >
                      {orderLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing Your Order...</span>
                        </div>
                      ) : Object.keys(formErrors).length > 0 ? (
                        <div className="flex items-center justify-center space-x-2">
                          <AlertCircle className="w-5 h-5" />
                          <span>Please Fix Errors Above</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <ShoppingCart className="w-5 h-5" />
                          <span>Place Order (Cash on Delivery)</span>
                        </div>
                      )}
                    </motion.button>
                    
                    {/* Extra padding to ensure scrollable content */}
                    <div className="h-20"></div>
                  </form>
                )}
                
                {/* Extra padding to ensure scrollable content */}
                <div className="h-16"></div>
                

                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </ErrorBoundary>
  )
}
