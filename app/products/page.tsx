"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { Search, Filter, Heart, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

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

      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
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
                      className={`w-5 h-5 transition-colors duration-300 ${favorites.has(product.id)
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
                      <AddToCartButton
                        product={product}
                        className="flex-1 rounded-xl shadow-lg hover:shadow-xl"
                      />
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
      </div>
    </ErrorBoundary>
  )
}
