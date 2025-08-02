"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { validateProduct, validateImageFile, sanitizeInput } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { Package, Users, ShoppingCart, Plus, Edit, Trash2, Check, X, AlertCircle } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  created_at: string
  is_on_sale: boolean | null
  sale_price: number | null
  sale_percentage: number | null
}

interface Order {
  id: string
  customer_name: string
  address: string
  phone: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  products: {
    name: string
    price: number
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    image_url: "",
    is_on_sale: false,
    sale_price: "",
    sale_percentage: "",
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Array<{field: string, message: string}>>([])
  const [submitError, setSubmitError] = useState<string>("")

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      // Wait a bit for userRole to be set
      if (user && userRole === null) {
        // Still loading role
        return
      }

      if (userRole !== "admin") {
        router.push("/")
        return
      }

      // Only fetch data if user is admin
      await Promise.all([fetchOrders(), fetchProducts()])
    }

    checkAuth()
  }, [user, userRole, router])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          products (
            name,
            price
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      logger.databaseError('Failed to fetch orders', 'SELECT', 'orders', error as Error)
      setSubmitError('Failed to fetch orders. Please try again.')
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      logger.databaseError('Failed to fetch products', 'SELECT', 'products', error as Error)
      setSubmitError('Failed to fetch products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error

      // If approved, you would send email here
      if (status === "approved") {
        // Email functionality would go here
        // Order approved - email would be sent
      }

      fetchOrders()
    } catch (error) {
      logger.databaseError('Failed to update order status', 'UPDATE', 'orders', error as Error)
      setSubmitError('Failed to update order status. Please try again.')
    }
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        // Error uploading image, skipping
        continue
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors([])
    setSubmitError("")
    setUploadingImages(true)

    try {
      // Validate product data
      const validation = validateProduct({
        name: productForm.name,
        price: productForm.price,
        description: productForm.description,
        image_url: productForm.image_url,
      })

      if (!validation.success) {
        setValidationErrors(validation.errors || [])
        setUploadingImages(false)
        return
      }

      let imageUrl = productForm.image_url
      
      // Validate and upload new image if any (only use the first one)
      if (imageFiles.length > 0) {
        const file = imageFiles[0] // Only use the first image
        const fileValidation = validateImageFile(file)
        if (!fileValidation.valid) {
          setSubmitError(fileValidation.error || 'Invalid file')
          setUploadingImages(false)
          return
        }
        
        const uploadedUrls = await uploadImages([file])
        if (uploadedUrls.length > 0) {
          imageUrl = uploadedUrls[0]
        }
      }

      const productData = {
        name: sanitizeInput(validation.data!.name),
        price: validation.data!.price,
        description: validation.data!.description ? sanitizeInput(validation.data!.description) : null,
        image_url: imageUrl || null,
        is_on_sale: productForm.is_on_sale,
        sale_price: productForm.is_on_sale && productForm.sale_price ? parseFloat(productForm.sale_price) : null,
        sale_percentage: productForm.is_on_sale && productForm.sale_percentage ? parseInt(productForm.sale_percentage) : null,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert(productData)
        if (error) throw error
      }

      setShowProductModal(false)
      setEditingProduct(null)
      setProductForm({ name: "", price: "", description: "", image_url: "", is_on_sale: false, sale_price: "", sale_percentage: "" })
      setImageFiles([])
      setValidationErrors([])
      setSubmitError("")
      fetchProducts()
    } catch (error) {
      logger.databaseError('Failed to save product', editingProduct ? 'UPDATE' : 'INSERT', 'products', error as Error)
      setSubmitError("Error saving product. Please try again.")
    } finally {
      setUploadingImages(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      logger.databaseError('Failed to delete product', 'DELETE', 'products', error as Error)
      setSubmitError('Failed to delete product. Please try again.')
    }
  }

  const handleImageFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0] // Only take the first file
      const validation = validateImageFile(file)
      
      if (validation.valid) {
        setImageFiles([file]) // Replace any existing file
        setSubmitError("")
      } else {
        setSubmitError(`File validation error: ${validation.error}`)
      }
    }
  }



  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        description: product.description || "",
        image_url: product.image_url || "",
        is_on_sale: product.is_on_sale || false,
        sale_price: product.sale_price ? product.sale_price.toString() : "",
        sale_percentage: product.sale_percentage ? product.sale_percentage.toString() : "",
      })
    } else {
      setEditingProduct(null)
      setProductForm({ name: "", price: "", description: "", image_url: "", is_on_sale: false, sale_price: "", sale_percentage: "" })
    }
    setImageFiles([])
    setValidationErrors([])
    setSubmitError("")
    setShowProductModal(true)
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

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-[#1B1B1B]">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-[#1B1B1B] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your ZEENE store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-[#1F8D9D]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-[#1B1B1B]">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-[#FDBA2D]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-2xl font-bold text-[#1B1B1B]">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-[#3E7346]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-[#1B1B1B]">
                  {orders.filter((order) => order.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-[#1F8D9D] text-[#1F8D9D]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-[#1F8D9D] text-[#1F8D9D]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Products
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "orders" ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-[#1B1B1B]">Orders Management</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <h3 className="font-semibold text-[#1B1B1B]">{order.customer_name}</h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Product: {order.products?.name} - PKR {order.products?.price}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">Phone: {order.phone}</p>
                            <p className="text-sm text-gray-600">Address: {order.address}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Ordered: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {order.status === "pending" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateOrderStatus(order.id, "approved")}
                                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, "rejected")}
                                className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-[#1B1B1B]">Products Management</h2>
                  <button onClick={() => openProductModal()} className="btn-primary flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={product.image_url || "/placeholder.svg?height=200&width=300&query=hair oil bottle"}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-[#1B1B1B]">{product.name}</h3>
                            {product.is_on_sale && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                ON SALE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <div className="mb-4">
                            {product.is_on_sale && product.sale_price ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 line-through">PKR {product.price}</span>
                                <span className="text-lg font-bold text-[#1F8D9D]">PKR {product.sale_price}</span>
                                {product.sale_percentage && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    -{product.sale_percentage}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-lg font-bold text-[#1F8D9D]">PKR {product.price}</p>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => openProductModal(product)}
                              className="flex items-center space-x-1 bg-[#1F8D9D] hover:bg-[#1F8D9D]/90 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-2xl font-semibold text-[#1B1B1B]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleProductSubmit} className="space-y-4">
                {/* Error Messages */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 text-sm">{submitError}</span>
                  </div>
                )}
                
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-700 text-sm font-medium">Validation Errors:</span>
                    </div>
                    <ul className="text-red-600 text-xs space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="Enter price in PKR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">
                  Upload Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFiles(e.target.files)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  aria-label="Upload product image"
                  title="Select product image"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select an image (max 5MB). Supported formats: JPG, PNG, WebP
                </p>
                
                {/* Preview new image */}
                {imageFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">New Image to Upload:</p>
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(imageFiles[0])}
                        alt="New product image"
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setImageFiles([])}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="Enter image URL or upload an image above"
                />
                {productForm.image_url && (
                  <div className="mt-2">
                    <img
                      src={productForm.image_url}
                      alt="Current product image"
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Sale Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-lg font-medium text-[#1B1B1B]">Sale Settings</h4>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_on_sale"
                    checked={productForm.is_on_sale}
                    onChange={(e) => setProductForm({ ...productForm, is_on_sale: e.target.checked })}
                    className="w-4 h-4 text-[#1F8D9D] bg-gray-100 border-gray-300 rounded focus:ring-[#1F8D9D] focus:ring-2"
                  />
                  <label htmlFor="is_on_sale" className="text-sm font-medium text-[#1B1B1B]">
                    Put this product on sale
                  </label>
                </div>

                {productForm.is_on_sale && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Sale Price (PKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.sale_price}
                        onChange={(e) => {
                          const salePrice = parseFloat(e.target.value) || 0;
                          const originalPrice = parseFloat(productForm.price) || 0;
                          const percentage = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
                          setProductForm({ 
                            ...productForm, 
                            sale_price: e.target.value,
                            sale_percentage: percentage > 0 ? percentage.toString() : ""
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm"
                        placeholder="Sale price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Discount %</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={productForm.sale_percentage}
                        onChange={(e) => {
                          const percentage = parseInt(e.target.value) || 0;
                          const originalPrice = parseFloat(productForm.price) || 0;
                          const salePrice = originalPrice > 0 ? originalPrice - (originalPrice * percentage / 100) : 0;
                          setProductForm({ 
                            ...productForm, 
                            sale_percentage: e.target.value,
                            sale_price: salePrice > 0 ? salePrice.toFixed(2) : ""
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm"
                        placeholder="Discount %"
                      />
                    </div>
                  </div>
                )}
              </div>

                <div className="pt-4 border-t border-gray-200 mt-6">
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImages ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading Images...</span>
                      </div>
                    ) : (
                      editingProduct ? "Update Product" : "Add Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
