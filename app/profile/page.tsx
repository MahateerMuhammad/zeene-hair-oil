"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Package, Heart, User, LogOut, ArrowRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"
import ProductImage from "@/components/ui/product-image"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  order_items: Array<{
    product_name: string
    quantity: number
    subtotal: number
  }>
}

interface WishlistItem {
  id: string
  products: {
    id: string
    name: string
    price: number
    image_url: string
    is_on_sale: boolean
    sale_price: number | null
  }
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "profile">("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchProfileData()
  }, [user, router])

  const fetchProfileData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await Promise.all([
        fetchProfile(),
        fetchOrders(),
        fetchWishlist(),
      ])
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("users")
      .select("full_name, phone, email")
      .eq("id", user?.id)
      .single()

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        email: data.email || "",
      })
    }
  }

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        order_items (
          product_name,
          quantity,
          subtotal
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) setOrders(data)
  }

  const fetchWishlist = async () => {
    const { data } = await supabase
      .from("wishlists")
      .select(`
        id,
        products (
          id,
          name,
          price,
          image_url,
          is_on_sale,
          sale_price
        )
      `)
      .eq("user_id", user?.id)

    if (data) {
      setWishlist(data as any as WishlistItem[])
    }
  }

  const removeFromWishlist = async (wishlistId: string) => {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", wishlistId)

    if (error) {
      toast.error("Failed to remove from wishlist")
    } else {
      toast.success("Removed from wishlist")
      fetchWishlist()
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F8D9D] border-t-transparent mb-4" />
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400 ml-4">Loading Profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20"
        >
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-6">Account Portal</p>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-6xl md:text-8xl font-playfair font-black text-[#1B1B1B] leading-[0.8] tracking-tighter mb-6">
                {profile.full_name || "Your"}<br />Profile.
              </h1>
              <div className="h-[2px] w-24 bg-[#1B1B1B] mb-6" />
              <p className="text-sm text-gray-500 font-light">{profile.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="group flex items-center space-x-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-[#1B1B1B] transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-12 mb-16 border-b border-gray-100">
          {[
            { id: "orders", label: "Orders", icon: Package },
            { id: "wishlist", label: "Wishlist", icon: Heart },
            { id: "profile", label: "Settings", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group flex items-center space-x-3 pb-6 border-b-2 transition-all ${activeTab === tab.id
                  ? "border-[#1B1B1B]"
                  : "border-transparent hover:border-gray-200"
                }`}
            >
              <tab.icon
                size={16}
                className={activeTab === tab.id ? "text-[#1B1B1B]" : "text-gray-400 group-hover:text-gray-600"}
              />
              <span
                className={`text-[10px] font-bold tracking-[0.3em] uppercase ${activeTab === tab.id ? "text-[#1B1B1B]" : "text-gray-400 group-hover:text-gray-600"
                  }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-playfair font-black text-[#1B1B1B] mb-8">Order History</h2>
            {orders.length === 0 ? (
              <div className="text-center py-24 border border-gray-100">
                <Package className="w-12 h-12 mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-playfair font-black text-[#1B1B1B] mb-4">No orders yet.</h3>
                <p className="text-sm text-gray-400 mb-8">Start exploring our curated collection</p>
                <Link href="/products">
                  <button className="bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors">
                    Discover Products
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 p-8 hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Order Number</p>
                        <p className="text-lg font-playfair font-black text-[#1B1B1B]">{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Total</p>
                        <p className="text-2xl font-playfair font-black text-[#1B1B1B]">₨ {order.total_amount.toLocaleString()}</p>
                        <span className={`inline-block mt-2 px-3 py-1 text-[8px] font-bold tracking-widest uppercase ${order.status === "approved"
                            ? "bg-green-50 text-green-600"
                            : order.status === "pending"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-red-50 text-red-600"
                          }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-6 border-t border-gray-100">
                      {order.order_items?.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          {item.product_name} <span className="text-gray-400">× {item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-playfair font-black text-[#1B1B1B] mb-8">Saved Items</h2>
            {wishlist.length === 0 ? (
              <div className="text-center py-24 border border-gray-100">
                <Heart className="w-12 h-12 mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-playfair font-black text-[#1B1B1B] mb-4">Your wishlist is empty.</h3>
                <p className="text-sm text-gray-400 mb-8">Save items you love for later</p>
                <Link href="/products">
                  <button className="bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors">
                    Browse Collection
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wishlist.map((item) => (
                  <div key={item.id} className="group relative border border-gray-100 hover:border-gray-200 transition-colors">
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                    <Link href={`/products/${item.products.id}`}>
                      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        {item.products.image_url && (
                          <ProductImage
                            src={item.products.image_url}
                            alt={item.products.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-sm font-bold tracking-wide uppercase text-[#1B1B1B] mb-2 line-clamp-2">
                          {item.products.name}
                        </h3>
                        <p className="text-lg font-playfair font-black text-[#1B1B1B]">
                          ₨ {item.products.is_on_sale && item.products.sale_price
                            ? item.products.sale_price.toLocaleString()
                            : item.products.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Profile Settings Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-playfair font-black text-[#1B1B1B] mb-8">Account Settings</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-gray-50 border-b border-gray-200 py-3 outline-none text-sm font-medium text-gray-400"
                />
                <p className="text-[8px] text-gray-400 tracking-wider uppercase mt-2">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-transparent border-b border-gray-200 py-3 focus:border-[#1B1B1B] outline-none transition-colors text-sm font-medium"
                  placeholder="+92 300 1234567"
                />
              </div>
              <button className="group flex items-center space-x-3 bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors">
                <span>Save Changes</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
