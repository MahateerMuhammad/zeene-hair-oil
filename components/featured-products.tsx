"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import ProductImage from "@/components/ui/product-image"

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  is_on_sale: boolean | null
  sale_price: number | null
  sale_percentage: number | null
  stock_quantity: number | null
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3) // Show only 3 featured products on home page

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching featured products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-[#F9F9F9]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
              Featured <span className="text-gradient">Products</span>
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F8D9D]"></div>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-20 bg-[#F9F9F9]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
              Featured <span className="text-gradient">Products</span>
            </h2>
            <p className="text-xl text-gray-600">Coming soon! Our premium hair oil collection.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-[#F9F9F9]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
            Featured <span className="text-gradient">Products</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our premium collection of natural hair oils
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 relative border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                y: -15,
                boxShadow: "0 35px 70px -15px rgba(31, 141, 157, 0.3)"
              }}
            >
              {/* Enhanced Sale Badge */}
              {product.is_on_sale && product.sale_percentage && (
                <div className="absolute top-6 left-6 z-20">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg">
                      -{product.sale_percentage}% OFF
                    </div>
                    <div className="absolute -bottom-1 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
                  </div>
                </div>
              )}

              {/* Enhanced Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                    width={400}
                    height={400}
                  />
                </motion.div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Stock Status Overlay */}
                {product.stock_quantity !== null && product.stock_quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-red-500 text-white px-6 py-3 rounded-xl text-lg font-bold shadow-lg">
                      Out of Stock
                    </div>
                  </div>
                )}
                
                {product.stock_quantity !== null && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                  <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                    Only {product.stock_quantity} left!
                  </div>
                )}
              </div>

              {/* Enhanced Content */}
              <div className="p-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-[#1B1B1B] mb-3 group-hover:text-[#1F8D9D] transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Enhanced Price Section */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    {product.is_on_sale && product.sale_price ? (
                      <>
                        <span className="text-sm text-gray-400 line-through mb-1">
                          PKR {product.price.toFixed(0)}
                        </span>
                        <span className="text-3xl font-bold text-[#1F8D9D]">
                          PKR {product.sale_price.toFixed(0)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-[#1B1B1B]">
                        PKR {product.price.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Enhanced Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  {product.stock_quantity !== null && product.stock_quantity <= 0 ? (
                    <button
                      disabled
                      className="flex items-center justify-center space-x-3 w-full px-6 py-4 bg-gray-300 text-gray-500 rounded-2xl cursor-not-allowed font-semibold text-lg"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Out of Stock</span>
                    </button>
                  ) : (
                    <Link
                      href={`/products/${product.id}`}
                      className="group/btn flex items-center justify-center space-x-3 w-full px-6 py-4 bg-gradient-to-r from-[#1F8D9D] to-[#16A085] text-white rounded-2xl hover:from-[#186F7B] hover:to-[#138D75] transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
                    >
                      <ShoppingCart className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                      <span>View Details</span>
                    </Link>
                  )}
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#1F8D9D]/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#16A085]/10 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/products"
              className="inline-block bg-[#1F8D9D] hover:bg-[#186F7B] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Products
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
