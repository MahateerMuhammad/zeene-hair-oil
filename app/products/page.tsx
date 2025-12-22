"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Search, Filter, Heart, Eye, Star, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ProductImage from "@/components/ui/product-image"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { CategoriesFilter } from "@/components/categories-filter"
import { WishlistButton } from "@/components/wishlist-button"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  is_on_sale: boolean | null
  sale_price: number | null
  sale_percentage: number | null
  rating: number | null
  review_count: number | null
  stock_quantity: number | null
  is_featured: boolean | null
  category_id: string | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(100000)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, sortBy, selectedCategory, minPrice, maxPrice])

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = !selectedCategory || product.category_id === selectedCategory

      const productPrice = product.is_on_sale && product.sale_price ? product.sale_price : product.price
      const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice

      return matchesSearch && matchesCategory && matchesPrice
    })

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
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "sale":
        filtered.sort((a, b) => {
          if (a.is_on_sale && !b.is_on_sale) return -1
          if (!a.is_on_sale && b.is_on_sale) return 1
          return 0
        })
        break
      default:
        break
    }

    setFilteredProducts(filtered)
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
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="space-y-12">
            <div className="h-20 bg-gray-50 rounded-sm w-full max-w-2xl animate-pulse" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-50 rounded-sm animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Editorial Header */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-7xl md:text-9xl font-playfair font-black text-[#1B1B1B] leading-[0.8] tracking-tighter mb-8">
                Curated<br />Essential.
              </h1>
              <div className="h-[2px] w-24 bg-[#1F8D9D] mb-8" />
              <p className="text-xs font-bold tracking-[0.4em] uppercase text-gray-400 max-w-md leading-relaxed">
                A study in timeless quality and modern utility. Discover pieces designed to elevate your daily routine.
              </p>
            </motion.div>
          </div>

          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-16 pb-8 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1B1B1B] transition-colors" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 py-2 bg-transparent border-none text-[10px] font-bold tracking-[0.2em] uppercase focus:outline-none focus:ring-0 placeholder:text-gray-300 min-w-[200px]"
                />
              </div>

              <div className="h-4 w-[1px] bg-gray-100 hidden sm:block" />

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold tracking-[0.2em] uppercase focus:outline-none focus:ring-0 cursor-pointer hover:text-[#1F8D9D] transition-colors"
                >
                  <option value="newest">Recent Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="sale">Promotions</option>
                </select>
              </div>
            </div>

            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
              Displaying {filteredProducts.length} Results
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16">
            {/* Minimal Filter Sidebar */}
            <div className="lg:col-span-3 space-y-12">
              <CategoriesFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  setMinPrice(min)
                  setMaxPrice(max)
                }}
              />

              <div className="p-8 bg-[#F9F9F9] rounded-sm">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1B1B1B] mb-4">Quality Oath</p>
                <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                  Every product in our catalog undergoes rigorous quality assessment. We prioritize sustainable sourcing and architectural design.
                </p>
              </div>
            </div>

            {/* Editorial Grid */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                {filteredProducts.length > 0 ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12"
                  >
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="group"
                      >
                        <Link href={`/products/${product.id}`} className="block space-y-6">
                          <div className="relative aspect-[3/4] bg-[#F9F9F9] rounded-sm overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-700">
                            <img
                              src={product.image_url || ''}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-105"
                            />

                            {/* Sophisticated Badge */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                              {product.is_on_sale && (
                                <div className="bg-[#1B1B1B] text-white text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm">
                                  Edition Price
                                </div>
                              )}
                              {product.stock_quantity !== null && product.stock_quantity <= 0 && (
                                <div className="bg-white/90 backdrop-blur-sm text-[#1B1B1B] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm border border-gray-100">
                                  Archived
                                </div>
                              )}
                            </div>

                            {/* Hover Action Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700 flex justify-end">
                              <WishlistButton productId={product.id} productName={product.name} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-playfair font-black tracking-tight text-[#1B1B1B]">
                                {product.name}
                              </h3>
                              <p className="text-sm font-bold text-[#1B1B1B]">
                                {product.is_on_sale && product.sale_price ? (
                                  <span className="flex flex-col items-end">
                                    <span className="text-gray-400 text-[10px] line-through decoration-[1px]">₨ {product.price.toLocaleString()}</span>
                                    <span>₨ {product.sale_price.toLocaleString()}</span>
                                  </span>
                                ) : (
                                  <span>₨ {product.price.toLocaleString()}</span>
                                )}
                              </p>
                            </div>

                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
                              {product.is_on_sale ? `Limited Release` : `Core Collection`}
                            </p>
                          </div>
                        </Link>

                        <div className="mt-6 pt-6 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {product.stock_quantity !== null && product.stock_quantity > 0 && (
                            <AddToCartButton
                              product={product}
                              className="w-full"
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-100 rounded-sm"
                  >
                    <Search className="w-12 h-12 text-gray-200 mb-6" />
                    <h3 className="text-2xl font-playfair font-black text-[#1B1B1B] mb-2">No matching pieces.</h3>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8">Refine your criteria and explore again.</p>
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory(null)
                        setMinPrice(0)
                        setMaxPrice(100000)
                      }}
                      className="px-8 py-3 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
