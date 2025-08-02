"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ShoppingCart, X, Phone, MapPin, User, Plus, Minus, Eye } from "lucide-react"

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
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      // Error fetching products
    } finally {
      setLoading(false)
    }
  }

  const handleOrderNow = (product: Product) => {
    if (!user) {
      alert("Please login to place an order")
      return
    }
    setSelectedProduct(product)
    setShowOrderModal(true)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !user) return

    setOrderLoading(true)
    try {
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        product_id: selectedProduct.id,
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

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
            Our <span className="text-gradient">Premium</span> Collection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our range of natural hair oils crafted for healthy, beautiful hair
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 relative"
            >
              {product.is_on_sale && product.sale_percentage && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                  -{product.sale_percentage}% OFF
                </div>
              )}
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image_url || "/placeholder.svg?height=300&width=300&query=hair oil bottle"}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#1B1B1B] mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {product.is_on_sale && product.sale_price ? (
                      <>
                        <span className="text-lg text-gray-500 line-through">PKR {product.price.toFixed(0)}</span>
                        <span className="text-2xl font-bold text-[#1F8D9D]">PKR {product.sale_price.toFixed(0)}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-[#1F8D9D]">PKR {product.price.toFixed(0)}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-[#1F8D9D] rounded-full hover:bg-gray-300 transition-colors duration-300"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Link>
                    <button
                      onClick={() => handleOrderNow(product)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#1F8D9D] text-white rounded-full hover:bg-[#186F7B] transition-colors duration-300"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No products available at the moment.</p>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-[#1B1B1B]">Order {selectedProduct.name}</h3>
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
                    <span className="font-semibold">{selectedProduct.name}</span>
                    <div className="text-right">
                      {selectedProduct.is_on_sale && selectedProduct.sale_price ? (
                        <>
                          <span className="text-sm text-gray-500 line-through block">PKR {selectedProduct.price.toFixed(0)}</span>
                          <span className="text-[#1F8D9D] font-bold">PKR {selectedProduct.sale_price.toFixed(0)} each</span>
                        </>
                      ) : (
                        <span className="text-[#1F8D9D] font-bold">PKR {selectedProduct.price.toFixed(0)} each</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#1B1B1B]">Quantity:</span>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, quantity: Math.max(1, orderForm.quantity - 1) })}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{orderForm.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, quantity: orderForm.quantity + 1 })}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Total Price */}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="text-[#1F8D9D] font-bold text-lg">
                      PKR {((selectedProduct.is_on_sale && selectedProduct.sale_price ? selectedProduct.sale_price : selectedProduct.price) * orderForm.quantity).toFixed(0)}
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
                  className="w-full py-3 text-white rounded-full transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#1F8D9D" }}
                >
                  {orderLoading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
