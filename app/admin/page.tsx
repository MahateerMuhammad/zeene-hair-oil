"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { validateProduct, validateImageFile, sanitizeInput } from "@/lib/validation"
import { sanitizeInput as securitySanitize, validateName, validatePrice, checkRateLimit } from "@/lib/security"
import { logger } from "@/lib/logger"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading from "@/components/ui/loading"
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
  category_id: string | null
  stock_quantity: number | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
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
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "categories">("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    image_url: "",
    is_on_sale: false,
    sale_price: "",
    sale_percentage: "",
    category_id: "",
    stock_quantity: "",
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Array<{field: string, message: string}>>([])
  const [submitError, setSubmitError] = useState<string>("")
  const [deleting, setDeleting] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
  })

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
      await Promise.all([fetchOrders(), fetchProducts(), fetchCategories()])
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: "approved" | "rejected") => {
    try {
      // Get order details first
      const { data: orderDetails, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          products (name, price, sale_price, is_on_sale),
          users (email)
        `)
        .eq("id", orderId)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error

      // Send email notification to customer
      try {
        const product = orderDetails.products
        // Use customer_email from order (works for both guest and authenticated users)
        const customerEmail = orderDetails.customer_email || orderDetails.users?.email
        const totalAmount = (product.is_on_sale && product.sale_price 
          ? product.sale_price 
          : product.price) * orderDetails.quantity

        if (customerEmail) {
          await fetch('/api/send-order-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: status === 'approved' ? 'order_approved' : 'order_rejected',
              orderId: orderId,
              customerName: orderDetails.customer_name,
              customerEmail: customerEmail,
              customerPhone: orderDetails.phone,
              customerAddress: orderDetails.address,
              productName: product.name,
              productPrice: product.is_on_sale && product.sale_price 
                ? product.sale_price 
                : product.price,
              quantity: orderDetails.quantity,
              totalAmount: totalAmount
            })
          })
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        // Don't fail the status update if email fails
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
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        console.log('Uploading image to:', filePath)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        console.log('Upload successful:', uploadData)

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        if (data.publicUrl) {
          uploadedUrls.push(data.publicUrl)
          console.log('Public URL generated:', data.publicUrl)
        } else {
          throw new Error('Failed to generate public URL for uploaded image')
        }
      } catch (error) {
        console.error('Error uploading file:', file.name, error)
        throw error // Re-throw to handle in the calling function
      }
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
        
        try {
          console.log('Starting image upload for:', file.name)
          const uploadedUrls = await uploadImages([file])
          if (uploadedUrls.length > 0) {
            imageUrl = uploadedUrls[0]
            console.log('Image uploaded successfully:', imageUrl)
          } else {
            throw new Error('No URL returned from image upload')
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          setSubmitError(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}. Please check if the storage bucket is set up correctly.`)
          setUploadingImages(false)
          return
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
        category_id: productForm.category_id || null,
        stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : null,
      }

      console.log('Product data to save:', productData)
      console.log('Final image URL:', imageUrl)

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

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setProductToDelete(null)
    setShowDeleteModal(false)
    setDeleting(false)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      setDeleting(true)
      setSubmitError("") // Clear any previous errors
      
      // First, delete the product image from storage if it exists
      if (productToDelete.image_url && productToDelete.image_url.includes('product-images')) {
        try {
          // Extract the file path from the URL
          const urlParts = productToDelete.image_url.split('/product-images/')
          if (urlParts.length > 1) {
            const filePath = `products/${urlParts[1]}`
            await supabase.storage
              .from('product-images')
              .remove([filePath])
          }
        } catch (imageError) {
          console.warn('Failed to delete product image:', imageError)
          // Continue with product deletion even if image deletion fails
        }
      }

      // Delete the product from database
      const { error } = await supabase.from("products").delete().eq("id", productToDelete.id)

      if (error) throw error

      // Show success message
      setSubmitError(`Product "${productToDelete.name}" has been successfully deleted.`)
      setTimeout(() => setSubmitError(""), 3000) // Clear success message after 3 seconds
      
      closeDeleteModal()
      fetchProducts()
    } catch (error) {
      logger.databaseError('Failed to delete product', 'DELETE', 'products', error as Error)
      setSubmitError(`Failed to delete "${productToDelete.name}". Please try again.`)
      setDeleting(false)
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

  // Category Management Functions
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        slug: category.slug,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", slug: "" })
    }
    setSubmitError("")
    setShowCategoryModal(true)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      }

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id)
        
        if (error) throw error
        setSubmitError("Category updated successfully!")
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(categoryData)
        
        if (error) throw error
        setSubmitError("Category added successfully!")
      }

      setTimeout(() => {
        setSubmitError("")
        setShowCategoryModal(false)
        fetchCategories()
      }, 1500)
    } catch (error: any) {
      console.error("Category error:", error)
      setSubmitError(`Failed to save category: ${error.message}`)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category will not be deleted.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error
      
      setSubmitError("Category deleted successfully!")
      setTimeout(() => setSubmitError(""), 2000)
      fetchCategories()
    } catch (error: any) {
      console.error("Delete category error:", error)
      setSubmitError(`Failed to delete category: ${error.message}`)
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
        category_id: product.category_id || "",
        stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : "",
      })
    } else {
      setEditingProduct(null)
      setProductForm({ name: "", price: "", description: "", image_url: "", is_on_sale: false, sale_price: "", sale_percentage: "", category_id: "", stock_quantity: "" })
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
        <Loading size="lg" text="Loading admin dashboard..." fullScreen={false} />
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
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F9F9F9]">
        <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-[#1B1B1B] mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your ZEENE store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-[#1F8D9D]" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1B1B1B]">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#FDBA2D]" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Products</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1B1B1B]">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#3E7346]" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Pending Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1B1B1B]">
                  {orders.filter((order) => order.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                  activeTab === "orders"
                    ? "border-[#1F8D9D] text-[#1F8D9D]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 sm:hidden" />
                  <span>Orders</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                  activeTab === "products"
                    ? "border-[#1F8D9D] text-[#1F8D9D]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Package className="w-4 h-4 sm:hidden" />
                  <span>Products</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
                  activeTab === "categories"
                    ? "border-[#1F8D9D] text-[#1F8D9D]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Package className="w-4 h-4 sm:hidden" />
                  <span>Categories</span>
                </span>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "orders" ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#1B1B1B] mb-2 sm:mb-0">Orders Management</h2>
                  <div className="text-sm text-gray-500">
                    {orders.length} total orders
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No orders yet</p>
                  </div>
                ) : (
                  <div className="max-h-96 sm:max-h-[32rem] overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                              <h3 className="font-semibold text-[#1B1B1B] text-sm sm:text-base truncate">{order.customer_name}</h3>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium self-start ${
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
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              <p className="break-words">
                                <span className="font-medium">Product:</span> {order.products?.name} - PKR {order.products?.price}
                              </p>
                              <p className="break-all">
                                <span className="font-medium">Phone:</span> {order.phone}
                              </p>
                              <p className="break-words">
                                <span className="font-medium">Address:</span> {order.address}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                <span className="font-medium">Ordered:</span> {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {order.status === "pending" && (
                            <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                              <button
                                onClick={() => updateOrderStatus(order.id, "approved")}
                                className="flex items-center justify-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, "rejected")}
                                className="flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "products" ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#1B1B1B]">Products Management</h2>
                  <button 
                    onClick={() => openProductModal()} 
                    className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No products yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                        <div className="relative">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-40 sm:h-48 object-cover"
                            width={300}
                            height={192}
                          />
                          {product.is_on_sale && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              ON SALE
                            </span>
                          )}
                        </div>
                        <div className="p-3 sm:p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold text-[#1B1B1B] text-sm sm:text-base truncate" title={product.name}>
                              {product.name}
                            </h3>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2" title={product.description || ''}>
                            {product.description}
                          </p>
                          <div className="mb-3 sm:mb-4">
                            {product.is_on_sale && product.sale_price ? (
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-xs sm:text-sm text-gray-500 line-through">PKR {product.price}</span>
                                <span className="text-base sm:text-lg font-bold text-[#1F8D9D]">PKR {product.sale_price}</span>
                                {product.sale_percentage && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded self-start">
                                    -{product.sale_percentage}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-base sm:text-lg font-bold text-[#1F8D9D]">PKR {product.price}</p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              onClick={() => openProductModal(product)}
                              className="flex items-center justify-center space-x-1 bg-[#1F8D9D] hover:bg-[#1F8D9D]/90 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors flex-1"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(product)}
                              className="flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs sm:text-sm transition-colors flex-1"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#1B1B1B]">Categories Management</h2>
                  <button 
                    onClick={() => openCategoryModal()} 
                    className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 mb-4">No categories yet</p>
                    <p className="text-xs sm:text-sm text-gray-500">Add categories like Clothing, Food, Wellness, etc.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="mb-3">
                          <h3 className="font-semibold text-[#1B1B1B] text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.slug}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openCategoryModal(category)}
                            className="flex items-center justify-center space-x-1 bg-[#1F8D9D] hover:bg-[#1F8D9D]/90 text-white px-3 py-2 rounded text-sm transition-colors flex-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="flex items-center justify-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-[#1B1B1B]">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {submitError && (
                <div className={`border rounded-lg p-3 ${
                  submitError.includes('successfully') 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="e.g., Clothing, Food, Wellness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B1B1B] mb-2">Slug (Optional)</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent"
                  placeholder="Auto-generated from name"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#1F8D9D] text-white rounded-lg hover:bg-[#186F7B] transition-colors"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg sm:text-2xl font-semibold text-[#1B1B1B]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close modal"
                title="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
              <form onSubmit={handleProductSubmit} className="space-y-3 sm:space-y-4">
                {/* Error Messages */}
                {submitError && (
                  <div className={`border rounded-lg p-3 flex items-center space-x-2 ${
                    submitError.includes('successfully') 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <AlertCircle className={`w-4 h-4 ${
                      submitError.includes('successfully') 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm ${
                      submitError.includes('successfully') 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {submitError}
                    </span>
                    {submitError.includes('storage bucket') && (
                      <div className="ml-2">
                        <a 
                          href="/IMAGE_UPLOAD_SETUP_GUIDE.md" 
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Setup Guide
                        </a>
                      </div>
                    )}
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
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter price in PKR"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter stock quantity (leave empty for unlimited)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited stock. Set to 0 to mark as out of stock.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm sm:text-base resize-none"
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">
                  Upload Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFiles(e.target.files)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8D9D] focus:border-transparent text-sm"
                  aria-label="Upload product image"
                  title="Select product image"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 5MB. Formats: JPG, PNG, WebP
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
              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-200">
                <h4 className="text-base sm:text-lg font-medium text-[#1B1B1B]">Sale Settings</h4>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_on_sale"
                    checked={productForm.is_on_sale}
                    onChange={(e) => setProductForm({ ...productForm, is_on_sale: e.target.checked })}
                    className="w-4 h-4 text-[#1F8D9D] bg-gray-100 border-gray-300 rounded focus:ring-[#1F8D9D] focus:ring-2"
                  />
                  <label htmlFor="is_on_sale" className="text-xs sm:text-sm font-medium text-[#1B1B1B]">
                    Put this product on sale
                  </label>
                </div>

                {productForm.is_on_sale && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ml-0 sm:ml-7">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Sale Price (PKR)</label>
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
                      <label className="block text-xs sm:text-sm font-medium text-[#1B1B1B] mb-1 sm:mb-2">Discount %</label>
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

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="w-full btn-primary py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={deleting}
                aria-label="Close delete confirmation modal"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{productToDelete.name}"</span>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium mb-2">This action will:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span>Remove the product from your store</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span>Delete the product image</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span>Cancel any pending orders for this product</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
}
