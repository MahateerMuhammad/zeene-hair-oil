"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ArrowRight } from "lucide-react"
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
        .limit(4) // Show 4 for a balanced grid

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
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 w-48 mx-auto rounded-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-50 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1F8D9D] mb-3"
            >
              Curated Selection
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-playfair font-black text-[#1B1B1B]"
            >
              Featured Essentials
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/products"
              className="group flex items-center text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#1B1B1B] transition-colors"
            >
              Explore All
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="group will-change-transform transform-gpu"
            >
              <Link href={`/products/${product.id}`} className="block space-y-4">
                <div className="relative aspect-[4/5] bg-[#F9F9F9] overflow-hidden rounded-sm shadow-sm">
                  <img
                    src={product.image_url || ''}
                    alt={product.name}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B]">Sold Out</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1B1B1B] tracking-tight group-hover:text-[#1F8D9D] transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {product.is_on_sale && product.sale_price ? (
                      <>
                        <span className="text-sm font-bold text-[#1F8D9D]">
                          PKR {product.sale_price.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-gray-300 line-through font-bold">
                          PKR {product.price.toFixed(0)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        PKR {product.price.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Rating Display */}
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`w-3 h-3 ${star <= Math.round((product as any).rating || 0) ? "text-yellow-400" : "text-gray-200"}`}
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">({(product as any).review_count || 0})</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
