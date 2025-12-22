"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  shipping_status: string
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

interface Address {
  id: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  is_default: boolean
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
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
        fetchAddresses(),
      ])
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        shipping_status,
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
    const { data, error } = await supabase
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
      // Type assertion to handle Supabase's relationship typing
      setWishlist(data as any as WishlistItem[])
    }
  }

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", user?.id)
      .order("is_default", { ascending: false })

    if (data) setAddresses(data)
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
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {profile.full_name?.[0] || profile.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.full_name || "User Profile"}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white p-1 shadow">
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="h-4 w-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order History</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Link href="/products">
                      <Button>Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{order.total_amount}</p>
                            <Badge variant={order.status === "approved" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        {order.order_items?.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {item.product_name} x {item.quantity}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">My Wishlist</h2>
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        {item.products.image_url && (
                          <div className="relative h-40 mb-3">
                            <Image
                              src={item.products.image_url}
                              alt={item.products.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{item.products.name}</h3>
                        <p className="text-lg font-bold text-[#3E7346]">
                          ₹{item.products.is_on_sale && item.products.sale_price
                            ? item.products.sale_price
                            : item.products.price}
                        </p>
                        <Link href={`/products/${item.products.id}`}>
                          <Button className="w-full mt-3" size="sm">
                            View Product
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Saved Addresses</h2>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No saved addresses</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{address.full_name}</p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                            <p className="text-sm mt-2">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm">
                              {address.city}, {address.state} {address.postal_code}
                            </p>
                            {address.is_default && (
                              <Badge className="mt-2" variant="default">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile.email} disabled />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
