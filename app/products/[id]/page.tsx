"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, ShoppingBag, Heart, Star, Plus, Minus, ShieldCheck, Truck, RotateCcw } from "lucide-react"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading from "@/components/ui/loading"
import { motion, AnimatePresence } from "framer-motion"
import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { ProductReviews } from "@/components/product-reviews"
import { WishlistButton } from "@/components/wishlist-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  sku: string | null
  category: string | null
}

interface Variant {
  id: string
  name: string
  sku: string | null
  price_override: number | null
  stock_quantity: number | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [activeTab, setActiveTab] = useState('description')

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

      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .eq("is_active", true)

      if (!variantError && variantData) {
        setVariants(variantData)
        if (variantData.length > 0) {
          setSelectedVariant(variantData[0])
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-32 flex items-center justify-center">
          <Loading size="lg" text="Curating details..." fullScreen={false} />
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
        <main className="pt-32 pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-12">
              <motion.button
                onClick={() => router.push("/products")}
                className="group flex items-center space-x-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[#1B1B1B]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Shop</span>
              </motion.button>

              <div className="hidden sm:flex space-x-4">
                <WishlistButton productId={product.id} productName={product.name} />
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-16 xl:gap-24">
              {/* Product Visuals - Sticky Section */}
              <motion.div
                className="lg:col-span-7 space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="sticky top-32">
                  <div className="relative aspect-[4/5] bg-[#F9F9F9] rounded-sm overflow-hidden group shadow-2xl">
                    <img
                      src={product.image_url || ''}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    />

                    {product.is_on_sale && (
                      <div className="absolute top-8 left-8 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2">
                        Limited Time Offer
                      </div>
                    )}

                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-sm font-bold tracking-[0.4em] uppercase text-[#1B1B1B]">Sold Out</span>
                      </div>
                    )}
                  </div>

                  {/* Visual Footnote */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden">
                      <img src={product.image_url || ''} className="w-full h-full object-cover opacity-50 contrast-125" />
                    </div>
                    <div className="p-8 bg-[#F9F9F9] rounded-sm flex flex-col justify-end">
                      <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 mb-2">Perspective</p>
                      <p className="text-xs text-gray-500 font-light leading-relaxed">Designed for permanence. A study in modern essentials.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Product Info - Editorial Style */}
              <div className="lg:col-span-5 space-y-12">
                <div className="space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D]"
                  >
                    {product.category || "Curated Edition"}
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl sm:text-7xl font-playfair font-black text-[#1B1B1B] leading-[0.9] tracking-tighter"
                  >
                    {product.name}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-6 pt-4"
                  >
                    {product.is_on_sale && product.sale_price ? (
                      <div className="flex items-baseline space-x-4">
                        <span className="text-3xl font-playfair font-black text-[#1B1B1B]">₨ {(product.sale_price + (selectedVariant?.price_override || 0)).toLocaleString()}</span>
                        <span className="text-lg text-gray-400 line-through font-light">₨ {(product.price + (selectedVariant?.price_override || 0)).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-playfair font-black text-[#1B1B1B]">₨ {(product.price + (selectedVariant?.price_override || 0)).toLocaleString()}</span>
                    )}

                    {product.rating && (
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < Math.round(product.rating || 0) ? "fill-[#FDBA2D] text-[#FDBA2D]" : "text-gray-200"} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">({product.review_count})</span>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Variant Configuration */}
                {variants.length > 0 && (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1B1B1B]">Configuration</p>
                    <div className="flex flex-wrap gap-3">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-6 py-3 rounded-sm border transition-all text-[10px] font-bold tracking-[0.1em] uppercase ${selectedVariant?.id === v.id
                            ? 'bg-[#1B1B1B] border-[#1B1B1B] text-white shadow-xl'
                            : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                            }`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interaction Section */}
                <div className="space-y-8 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 rounded-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 hover:bg-gray-50 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-4 hover:bg-gray-50 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1">Total</p>
                      <p className="text-xl font-bold">₨ {(((product.is_on_sale ? product.sale_price : product.price) || product.price) + (selectedVariant?.price_override || 0) * quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <AddToCartButton
                      product={product}
                      quantity={quantity}
                      selectedVariant={selectedVariant}
                      className="flex-1 py-5 bg-[#1B1B1B] hover:bg-[#1F8D9D] text-white text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-500 rounded-sm shadow-2xl"
                    />
                  </div>
                </div>

                {/* Logistics Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 bg-[#F9F9F9] rounded-sm">
                  <div className="text-center space-y-3">
                    <Truck size={18} className="mx-auto text-[#1B1B1B]" />
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase leading-tight">Fast<br />Delivery</p>
                  </div>
                  <div className="text-center space-y-3 border-x border-gray-200">
                    <ShieldCheck size={18} className="mx-auto text-[#1B1B1B]" />
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase leading-tight">Secure<br />Payment</p>
                  </div>
                  <div className="text-center space-y-3">
                    <RotateCcw size={18} className="mx-auto text-[#1B1B1B]" />
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase leading-tight">Easy<br />Returns</p>
                  </div>
                </div>

                {/* Detailed Tabs */}
                <div className="pt-12">
                  <Tabs defaultValue="description" className="w-full">
                    <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 p-0 h-auto rounded-none mb-8">
                      <TabsTrigger value="description" className="px-0 py-4 mr-12 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 data-[state=active]:text-black">Specification</TabsTrigger>
                      <TabsTrigger value="reviews" className="px-0 py-4 mr-12 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 data-[state=active]:text-black">Reviews</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="mt-0">
                      <p className="text-gray-500 font-light leading-[1.8] text-lg">
                        {product.description || "A meticulously crafted piece designed to elevate your daily routine. Combining modern innovation with timeless utility, this curated essential represents our commitment to quality and architectural aesthetics."}
                      </p>
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-0">
                      <ProductReviews productId={product.id} productName={product.name} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}