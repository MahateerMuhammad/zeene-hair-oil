"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { validateProduct, validateImageFile, sanitizeInput } from "@/lib/validation"
import { sanitizeInput as securitySanitize, validateName, validatePrice, checkRateLimit } from "@/lib/security"
import { logger } from "@/lib/logger"
import ProductImage from "@/components/ui/product-image"
import ErrorBoundary from "@/components/ui/error-boundary"
import Loading from "@/components/ui/loading"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { Package, Users, ShoppingCart, Plus, Edit, Trash2, Check, X, AlertCircle, ArrowRight, Eye } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

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

interface Variant {
  id?: string
  product_id?: string
  name: string
  sku: string
  price_override: string
  stock_quantity: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
}

interface Order {
  id: string
  customer_name: string
  customer_email: string
  address: string
  phone: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  payment_method: string
  receipt_url?: string
  order_number?: string
  payment_status?: string
  total_amount?: number
  coupon_code?: string
  discount_amount?: number
  order_items?: Array<{
    product_name: string
    product_price: number
    quantity: number
    variant_name?: string
  }>
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "categories" | "coupons">("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
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
  const [productVariants, setProductVariants] = useState<Variant[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string, message: string }>>([])
  const [submitError, setSubmitError] = useState<string>("")
  const [deleting, setDeleting] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
  })
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_discount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true
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
      await Promise.all([fetchOrders(), fetchProducts(), fetchCategories(), fetchCoupons()])
    }

    checkAuth()
  }, [user, userRole, router])

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching coupons:", error)
    } else {
      setCoupons(data || [])
    }
  }

  const fetchOrders = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      console.log(`Fetched ${ordersData?.length || 0} orders`)

      // Fetch order items for each order separately
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id)

          if (itemsError) {
            console.error('Error fetching items for order:', order.id)
            console.error('Full error:', JSON.stringify(itemsError, null, 2))
            console.error('Error details:', {
              message: itemsError.message,
              code: itemsError.code,
              details: itemsError.details,
              hint: itemsError.hint
            })
          } else {
            console.log(`Order ${order.order_number}: ${itemsData?.length || 0} items found`)
          }

          return {
            ...order,
            order_items: itemsData || []
          }
        })
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
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
          order_items (
            product_name,
            product_price,
            quantity
          )
        `)
        .eq("id", orderId)
        .single()

      if (fetchError) throw fetchError

      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error

      // Send email notification to customer
      try {
        const customerEmail = orderDetails.customer_email
        const totalAmount = orderDetails.total_amount || 0
        const orderItems = orderDetails.order_items || []
        const firstItem = orderItems[0] || { product_name: 'Product', product_price: 0, quantity: 1 }
        const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)

        if (customerEmail) {
          const emailType = status === 'approved' ? 'order_approved' : 'order_rejected'
          
          await fetch('/api/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: emailType,
              orderId: orderDetails.order_number || orderId,
              customerName: orderDetails.customer_name,
              customerEmail: customerEmail,
              customerPhone: orderDetails.phone || '',
              customerAddress: orderDetails.address || '',
              productName: firstItem.product_name,
              productPrice: firstItem.product_price,
              quantity: totalQuantity,
              totalAmount: totalAmount
            })
          })
          toast.success(`Order ${status} and email sent to customer`)
        } else {
          toast.success(`Order ${status}`)
        }
      } catch (emailError) {
        console.error("Failed to send status email:", emailError)
        toast.warning(`Order ${status} but email failed to send`)
      }

      fetchOrders()
    } catch (error) {
      logger.databaseError('Failed to update order status', 'UPDATE', 'orders', error as Error)
      setSubmitError('Failed to update order status. Please try again.')
      toast.error('Failed to update order status')
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

      let productId = editingProduct?.id

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select().single()
        if (error) throw error
        productId = data.id
      }

      // Save variants
      if (productId) {
        // approach: delete old variants and insert new ones
        if (editingProduct) {
          await supabase.from("product_variants").delete().eq("product_id", productId)
        }

        if (productVariants.length > 0) {
          const variantsToInsert = productVariants.map(v => ({
            product_id: productId,
            name: v.name,
            sku: v.sku || null,
            price_override: v.price_override ? parseFloat(v.price_override) : null,
            stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : 0
          }))
          const { error: variantError } = await supabase.from("product_variants").insert(variantsToInsert)
          if (variantError) throw variantError
        }
      }

      setShowProductModal(false)
      setEditingProduct(null)
      setProductForm({ name: "", price: "", description: "", image_url: "", is_on_sale: false, sale_price: "", sale_percentage: "", category_id: "", stock_quantity: "" })
      setProductVariants([])
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
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryForm)
          .eq("id", editingCategory.id)

        if (error) throw error
        toast.success("Category updated successfully!")
      } else {
        const { error } = await supabase.from("categories").insert([categoryForm])
        if (error) throw error
        toast.success("Category added successfully!")
      }

      setShowCategoryModal(false)
      setEditingCategory(null)
      setCategoryForm({ name: "", slug: "" })
      fetchCategories()
    } catch (error: any) {
      console.error("Category error:", error)
      setSubmitError(`Failed to save category: ${error.message}`)
    }
  }

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    console.log("Submitting coupon form:", couponForm)

    const formattedData = {
      ...couponForm,
      discount_value: parseFloat(couponForm.discount_value),
      min_order_amount: couponForm.min_order_amount ? parseFloat(couponForm.min_order_amount) : 0,
      max_discount: couponForm.max_discount ? parseFloat(couponForm.max_discount) : null,
      usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
      valid_from: couponForm.valid_from || new Date().toISOString(),
      valid_until: couponForm.valid_until || null,
    }

    if (isNaN(formattedData.discount_value) || formattedData.discount_value <= 0) {
      setSubmitError("Discount value must be greater than 0")
      return
    }

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(formattedData)
          .eq("id", editingCoupon.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("coupons").insert([formattedData])
        if (error) throw error
      }

      setShowCouponModal(false)
      setEditingCoupon(null)
      setCouponForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_amount: "",
        max_discount: "",
        usage_limit: "",
        valid_from: "",
        valid_until: "",
        is_active: true
      })
      fetchCoupons()
      toast.success("Coupon saved successfully!")
    } catch (error: any) {
      console.error("Coupon submission error:", error)
      setSubmitError(error.message || "Failed to save coupon.")
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return

    const { error } = await supabase.from("coupons").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete coupon")
    } else {
      toast.success("Coupon deleted")
      fetchCoupons()
    }
  }

  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setCouponForm({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        min_order_amount: coupon.min_order_amount?.toString() || "",
        max_discount: coupon.max_discount?.toString() || "",
        usage_limit: coupon.usage_limit?.toString() || "",
        valid_from: coupon.valid_from?.split('T')[0] || "",
        valid_until: coupon.valid_until?.split('T')[0] || "",
        is_active: coupon.is_active
      })
    } else {
      setEditingCoupon(null)
      setCouponForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_amount: "",
        max_discount: "",
        usage_limit: "",
        valid_from: "",
        valid_until: "",
        is_active: true
      })
    }
    setShowCouponModal(true)
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

  const addVariant = () => {
    setProductVariants([
      ...productVariants,
      { name: "", sku: "", price_override: "", stock_quantity: "0" }
    ])
  }

  const removeVariant = (index: number) => {
    const newVariants = [...productVariants]
    newVariants.splice(index, 1)
    setProductVariants(newVariants)
  }

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...productVariants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setProductVariants(newVariants)
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
      // Fetch variants
      supabase.from("product_variants").select("*").eq("product_id", product.id)
        .then(({ data }) => {
          if (data) {
            setProductVariants(data.map(v => ({
              id: v.id,
              name: v.name,
              sku: v.sku || "",
              price_override: v.price_override?.toString() || "",
              stock_quantity: v.stock_quantity?.toString() || "0"
            })))
          }
        })
    } else {
      setEditingProduct(null)
      setProductForm({ name: "", price: "", description: "", image_url: "", is_on_sale: false, sale_price: "", sale_percentage: "", category_id: "", stock_quantity: "" })
      setProductVariants([])
    }
    setImageFiles([])
    setValidationErrors([])
    setSubmitError("")
    setShowProductModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1F8D9D] border-t-transparent mb-4" />
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Synchronizing Dashboard...</p>
        </div>
      </div>
    )
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-40 text-center">
          <h1 className="text-4xl font-playfair font-black text-[#1B1B1B] mb-4">Unauthorized Access.</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Administrative credentials required for this sector.</p>
          <button onClick={() => router.push("/")} className="mt-8 px-8 py-3 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors">Return to Safety</button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-6xl md:text-8xl font-playfair font-black text-[#1B1B1B] leading-[0.8] tracking-tighter mb-6">
                Executive<br />Protocol.
              </h1>
              <div className="h-[2px] w-24 bg-[#1F8D9D] mb-6" />
              <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">ZEENE Management Environment</p>
            </motion.div>
          </div>

          {/* Stats Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { label: "Acquisition Flow", value: orders.length, icon: ShoppingCart, sub: "Total Transactions" },
              { label: "Inventory Depth", value: products.length, icon: Package, sub: "Registered Assets" },
              { label: "Awaiting Action", value: orders.filter((order) => order.status === "pending").length, icon: Users, sub: "Pending Confirmation" }
            ].map((stat, i) => (
              <div key={i} className="bg-[#F9F9F9] p-8 rounded-sm hover:shadow-2xl transition-all duration-700 group border border-transparent hover:border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 group-hover:text-[#1F8D9D] transition-colors">{stat.label}</p>
                    <p className="text-4xl font-playfair font-black text-[#1B1B1B]">{stat.value}</p>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">{stat.sub}</p>
                  </div>
                  <stat.icon className="w-5 h-5 text-gray-200 group-hover:text-[#1F8D9D] transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Tab Protocols */}
          <div className="bg-white">
            <div className="border-b border-gray-100 flex flex-wrap gap-12 mb-12">
              {[
                { id: "orders", label: "Acquisitions" },
                { id: "products", label: "Inventory" },
                { id: "categories", label: "Taxonomy" },
                { id: "coupons", label: "Privileges" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-500 relative group ${activeTab === tab.id ? "text-[#1B1B1B]" : "text-gray-300 hover:text-gray-500"
                    }`}
                >
                  {tab.label}
                  <div className={`absolute bottom-0 left-0 h-[2px] bg-[#1F8D9D] transition-all duration-700 ease-[0.16,1,0.3,1] ${activeTab === tab.id ? "w-full" : "w-0 group-hover:w-1/2"
                    }`} />
                </button>
              ))}
            </div>

            <div>
              {activeTab === "orders" ? (
                <div className="space-y-12">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-gray-50">
                    <h2 className="text-3xl font-playfair font-black text-[#1B1B1B]">Acquisition Flow</h2>
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
                      Processing {orders.length} Entries
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-40 border border-dashed border-gray-100 bg-[#F9F9F9] rounded-sm">
                      <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Zero Entries Detected.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="group border border-gray-100 rounded-sm p-8 hover:shadow-xl transition-all duration-500 bg-white">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                            <div className="flex-1 min-w-0 space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <h3 className="font-playfair font-black text-2xl text-[#1B1B1B]">{order.customer_name}</h3>
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-sm text-[9px] font-bold tracking-[0.2em] uppercase ${order.status === "pending"
                                    ? "bg-yellow-50 text-yellow-600"
                                    : order.status === "approved"
                                      ? "bg-green-50 text-green-600"
                                      : "bg-red-50 text-red-600"
                                    }`}
                                >
                                  {order.status}
                                </span>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-8 text-sm">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-2">Order Details</p>
                                    <div className="space-y-2">
                                      {order.order_items && order.order_items.length > 0 ? (
                                        order.order_items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between text-gray-600 font-light">
                                            <span>{item.product_name} <span className="text-gray-300">× {item.quantity}</span></span>
                                            <span className="font-medium">PKR {item.product_price.toLocaleString()}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-gray-400 italic font-light">No items found</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300">Total Valuation</p>
                                    <p className="font-playfair font-black text-xl text-[#1B1B1B]">PKR {order.total_amount?.toLocaleString()}</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-2">Logistics</p>
                                    <div className="space-y-1 text-gray-600 font-light">
                                      <p>{order.phone}</p>
                                      <p>{order.address}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex px-3 py-1 bg-[#F9F9F9] text-gray-400 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm">
                                      {order.payment_method === 'bank_transfer' ? 'Direct Debit' : 'COD'}
                                    </span>
                                    {order.order_number && (
                                      <span className="inline-flex px-3 py-1 bg-[#F9F9F9] text-gray-400 text-[9px] font-bold tracking-[0.1em] uppercase rounded-sm">
                                        #{order.order_number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {order.receipt_url && (
                                <div className="pt-4">
                                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300 mb-3">Verification Asset</p>
                                  <div className="flex items-center gap-4">
                                    <div className="relative w-20 h-20 bg-gray-50 border border-gray-100 overflow-hidden cursor-zoom-in rounded-sm" onClick={() => window.open(order.receipt_url, '_blank')}>
                                      <img
                                        src={order.receipt_url}
                                        alt="Receipt"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <a
                                      href={order.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1F8D9D] hover:text-[#1B1B1B] transition-colors flex items-center gap-2"
                                    >
                                      View Evidence <ArrowRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-row lg:flex-col gap-3 lg:w-48 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-50 pt-6 lg:pt-0 lg:pl-8">
                              <div className="bg-[#F9F9F9] p-4 text-center rounded-sm mb-4 hidden lg:block">
                                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1">Date</p>
                                <p className="text-sm font-medium text-[#1B1B1B]">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>

                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, "approved")}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-[#1B1B1B] hover:bg-green-600 text-white px-4 py-3 rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase transition-colors shadow-lg hover:shadow-xl"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, "rejected")}
                                    className="flex-1 flex items-center justify-center space-x-2 border border-gray-200 hover:border-red-500 hover:text-red-600 text-gray-400 px-4 py-3 rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                              {order.status !== "pending" && (
                                <div className="text-center py-4 opacity-50">
                                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300">Action Complete</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "products" ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 space-y-4 sm:space-y-0">
                    <h2 className="text-3xl font-playfair font-black text-[#1B1B1B]">Inventory Control</h2>
                    <button
                      onClick={() => openProductModal()}
                      className="group flex items-center justify-center space-x-3 bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Register Asset</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-40 border border-dashed border-gray-100 bg-[#F9F9F9] rounded-sm">
                      <Package className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Inventory Depleted.</p>
                      <p className="text-sm font-light text-gray-400">Initialize new assets to populate the catalog.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {products.map((product) => (
                        <div key={product.id} className="group border border-gray-100 rounded-sm bg-white hover:shadow-2xl transition-all duration-700 hover:-translate-y-1">
                          <div className="relative aspect-[3/4] overflow-hidden bg-[#F9F9F9]">
                            {product.image_url ? (
                              <ProductImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                width={400}
                                height={500}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <Package className="w-12 h-12" />
                              </div>
                            )}

                            {product.is_on_sale && (
                              <div className="absolute top-4 left-4 bg-[#1B1B1B] text-white px-3 py-1 text-[8px] font-bold tracking-[0.2em] uppercase">
                                Edition Price
                              </div>
                            )}

                            {product.stock_quantity !== null && product.stock_quantity <= 0 && (
                              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 text-[8px] font-bold tracking-[0.2em] uppercase text-gray-400 border border-gray-100">
                                Depleted
                              </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex gap-2">
                              <button
                                onClick={() => openProductModal(product)}
                                className="flex-1 bg-white text-[#1B1B1B] py-3 text-[8px] font-bold tracking-[0.2em] uppercase hover:bg-[#1F8D9D] hover:text-white transition-colors"
                              >
                                Modify
                              </button>
                              <button
                                onClick={() => openDeleteModal(product)}
                                className="w-10 bg-red-500 text-white flex items-center justify-center hover:bg-black transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="font-playfair font-bold text-lg text-[#1B1B1B] mb-2 line-clamp-1" title={product.name}>
                              {product.name}
                            </h3>
                            <div className="flex items-baseline justify-between mb-4">
                              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Valuation</p>
                              {product.is_on_sale && product.sale_price ? (
                                <div className="text-right">
                                  <span className="text-[10px] text-gray-300 line-through mr-2">PKR {product.price.toLocaleString()}</span>
                                  <span className="font-playfair font-black text-[#1B1B1B]">PKR {product.sale_price.toLocaleString()}</span>
                                </div>
                              ) : (
                                <span className="font-playfair font-black text-[#1B1B1B]">PKR {product.price.toLocaleString()}</span>
                              )}
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">
                              <span>{product.category_id ? categories.find(c => c.id === product.category_id)?.name : 'Uncategorized'}</span>
                              <span>{product.stock_quantity ?? '∞'} Units</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === "coupons" ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 space-y-4 sm:space-y-0">
                    <h2 className="text-3xl font-playfair font-black text-[#1B1B1B]">Privilege Protocols</h2>
                    <button
                      onClick={() => openCouponModal()}
                      className="group flex items-center justify-center space-x-3 bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Issue Concession</span>
                    </button>
                  </div>

                  {coupons.length === 0 ? (
                    <div className="text-center py-40 border border-dashed border-gray-100 bg-[#F9F9F9] rounded-sm">
                      <Check className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">No Active Protocols.</p>
                      <p className="text-sm font-light text-gray-400">Establish new privilege tokens for clientele.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="group border border-gray-100 rounded-sm p-8 bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <span className="inline-block px-3 py-1 bg-[#F9F9F9] text-[#1B1B1B] text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm mb-3">
                                {coupon.code}
                              </span>
                              <h3 className="font-playfair font-black text-2xl text-[#1B1B1B]">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `PKR ${coupon.discount_value} OFF`}
                              </h3>
                            </div>
                            <span className={`px-2 py-1 rounded-sm text-[8px] font-bold tracking-[0.2em] uppercase ${coupon.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {coupon.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm font-light text-gray-500 mb-8 border-t border-gray-50 pt-6">
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300">Utilization</span>
                              <span className="font-medium text-[#1B1B1B]">{coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}</span>
                            </div>
                            {coupon.min_order_amount && (
                              <div className="flex justify-between">
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300">Minimum</span>
                                <span className="font-medium text-[#1B1B1B]">PKR {coupon.min_order_amount}</span>
                              </div>
                            )}
                            {coupon.valid_until && (
                              <div className="flex justify-between">
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-300">Expiration</span>
                                <span className="font-medium text-[#1B1B1B]">{new Date(coupon.valid_until).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-4">
                            <button
                              onClick={() => openCouponModal(coupon)}
                              className="flex-1 bg-[#1B1B1B] text-white py-3 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-[#1F8D9D] transition-colors shadow-lg"
                            >
                              Modify
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="flex-1 border border-gray-200 text-gray-400 py-3 text-[9px] font-bold tracking-[0.2em] uppercase hover:border-red-500 hover:text-red-500 transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 space-y-4 sm:space-y-0">
                    <h2 className="text-3xl font-playfair font-black text-[#1B1B1B]">Taxonomy Structure</h2>
                    <button
                      onClick={() => openCategoryModal()}
                      className="group flex items-center justify-center space-x-3 bg-[#1B1B1B] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-colors shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Establish Class</span>
                    </button>
                  </div>

                  {categories.length === 0 ? (
                    <div className="text-center py-40 border border-dashed border-gray-100 bg-[#F9F9F9] rounded-sm">
                      <Package className="w-12 h-12 text-gray-200 mx-auto mb-6" />
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-2">Taxonomy Undefined.</p>
                      <p className="text-sm font-light text-gray-400">Initialize categorization structure for efficient asset management.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categories.map((category) => (
                        <div key={category.id} className="group border border-gray-100 rounded-sm p-8 bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                              <h3 className="font-playfair font-black text-2xl text-[#1B1B1B]">{category.name}</h3>
                              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">{category.slug}</p>
                            </div>
                            <div className="w-10 h-10 bg-[#F9F9F9] rounded-full flex items-center justify-center text-[#1B1B1B] group-hover:bg-[#1F8D9D] group-hover:text-white transition-colors">
                              <Package className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex gap-4 pt-6 border-t border-gray-50">
                            <button
                              onClick={() => openCategoryModal(category)}
                              className="flex-1 bg-white border border-gray-200 text-[#1B1B1B] py-3 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-[#1B1B1B] hover:text-white hover:border-[#1B1B1B] transition-colors"
                            >
                              Modify
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="w-12 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Category Protocol Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-md w-full p-12 shadow-2xl transition-all duration-700">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-4xl font-playfair font-black text-[#1B1B1B]">
                  {editingCategory ? "Update taxonomy." : "Classify asset."}
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-300 hover:text-[#1B1B1B] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-8">
                {submitError && (
                  <div className={`p-4 border text-[10px] font-bold tracking-[0.2em] uppercase ${submitError.includes('successfully')
                    ? 'bg-green-50 border-green-100 text-[#1F8D9D]'
                    : 'bg-red-50 border-red-100 text-red-500'
                    }`}>
                    {submitError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Class Identity</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                    placeholder="e.g., LIFESTYLE, ORGANICS"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">System Alias (Optional)</label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                    placeholder="AUTO_GENERATE"
                  />
                </div>

                <div className="flex gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-4 border border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-300 hover:text-[#1B1B1B] transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-all shadow-xl"
                  >
                    {editingCategory ? "Confirm protocol" : "Initialize class"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Asset Protocol Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-all duration-700">
              <div className="flex items-center justify-between p-12 pb-8 border-b border-gray-50">
                <h3 className="text-4xl font-playfair font-black text-[#1B1B1B]">
                  {editingProduct ? "Modify asset." : "Establish asset."}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-300 hover:text-[#1B1B1B] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-12 py-8 space-y-12">
                <form id="product-form" onSubmit={handleProductSubmit} className="space-y-12">
                  {submitError && (
                    <div className={`p-4 border text-[10px] font-bold tracking-[0.2em] uppercase ${submitError.includes('successfully') ? 'bg-green-50 border-green-100 text-[#1F8D9D]' : 'bg-red-50 border-red-100 text-red-500'}`}>
                      {submitError}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Asset Identity</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                          placeholder="Asset name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Valuation (PKR)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Taxonomy Class</label>
                        <select
                          value={productForm.category_id}
                          onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                          className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none appearance-none"
                        >
                          <option value="">UNCATEGORIZED</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Inventory Units</label>
                        <input
                          type="number"
                          value={productForm.stock_quantity}
                          onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                          className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                          placeholder="UNLIMITED"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Visual Evidence</label>
                        <div className="pt-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFiles(e.target.files)}
                            className="hidden"
                            id="asset-image"
                          />
                          <label htmlFor="asset-image" className="cursor-pointer group flex items-center space-x-4">
                            <div className="w-16 h-16 bg-[#F9F9F9] flex items-center justify-center border border-dashed border-gray-100 group-hover:border-[#1F8D9D] transition-colors">
                              <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#1F8D9D]" />
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 group-hover:text-[#1B1B1B]">Upload File</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Asset Narrative</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none resize-none h-32"
                      placeholder="Descriptive logs..."
                    />
                  </div>

                  {/* Promotion Logic */}
                  <div className="space-y-8 pt-8 border-t border-gray-50">
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D]">Promotion Protocol</p>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, is_on_sale: !productForm.is_on_sale })}
                        className={`w-12 h-6 rounded-full transition-all duration-500 relative ${productForm.is_on_sale ? 'bg-[#1F8D9D]' : 'bg-gray-100'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-500 ${productForm.is_on_sale ? 'translate-x-6' : ''}`} />
                      </button>
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B]">Active Promotion</span>
                    </div>

                    {productForm.is_on_sale && (
                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Promotional Value</label>
                          <input
                            type="number"
                            value={productForm.sale_price}
                            onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })}
                            className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                            placeholder="Discounted price"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Deviation Percentage</label>
                          <input
                            type="number"
                            value={productForm.sale_percentage}
                            onChange={(e) => setProductForm({ ...productForm, sale_percentage: e.target.value })}
                            className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                            placeholder="%"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-12 border-t border-gray-50 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-12 py-4 border border-gray-100 text-[10px] font-bold tracking-[0.4em] uppercase text-gray-300 hover:text-[#1B1B1B] transition-all"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={uploadingImages}
                  className="flex-1 py-4 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-[#1F8D9D] transition-all disabled:opacity-50"
                >
                  {uploadingImages ? "SYNCHRONIZING..." : "CONFIRM PROTOCOL"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deletion Protocol Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-md w-full p-12 shadow-2xl border border-gray-50">
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-2">
                  <h3 className="text-4xl font-playfair font-black text-[#1B1B1B]">Eliminate asset.</h3>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-red-500">Irreversible Action Detected</p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-300 hover:text-[#1B1B1B] transition-colors"
                  disabled={deleting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8 mb-12">
                <p className="text-sm font-light text-gray-500 leading-relaxed">
                  Are you command to proceed with the total elimination of <span className="font-bold text-[#1B1B1B]">"{productToDelete.name}"</span> from the system archive?
                </p>

                <div className="p-6 bg-red-50 space-y-4">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-800">Elimination Log:</p>
                  <ul className="text-[10px] font-bold tracking-[0.1em] uppercase text-red-700 space-y-2">
                    <li className="flex items-center gap-2">• REMOVE FROM PUBLIC INTERFACE</li>
                    <li className="flex items-center gap-2">• DELETE VISUAL ARCHIVES</li>
                    <li className="flex items-center gap-2">• NULLIFY PENDING ACQUISITIONS</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 py-4 border border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-300 hover:text-[#1B1B1B] transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={deleting}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl"
                >
                  {deleting ? "ELIMINATING..." : "CONFIRM ELIMINATION"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Protocol Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm max-w-lg w-full p-12 shadow-2xl transition-all duration-700">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-4xl font-playfair font-black text-[#1B1B1B]">
                  {editingCoupon ? "Modify concession." : "Issue concession."}
                </h3>
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="text-gray-300 hover:text-[#1B1B1B] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCouponSubmit} className="space-y-8">
                {submitError && (
                  <div className={`p-4 border text-[10px] font-bold tracking-[0.2em] uppercase ${submitError.includes('successfully') ? 'bg-green-50 border-green-100 text-[#1F8D9D]' : 'bg-red-50 border-red-100 text-red-500'}`}>
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Coupon Key</label>
                    <input
                      type="text"
                      required
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                      placeholder="CODE_2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Valuation Type</label>
                    <select
                      value={couponForm.discount_type}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none appearance-none"
                    >
                      <option value="percentage">PERCENTAGE</option>
                      <option value="fixed">FIXED AMOUNT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Value</label>
                    <input
                      type="number"
                      required
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Threshold (Optional)</label>
                    <input
                      type="number"
                      value={couponForm.min_order_amount}
                      onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Usage Cap</label>
                    <input
                      type="number"
                      value={couponForm.usage_limit}
                      onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                      placeholder="UNLIMITED"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400">Expiration</label>
                    <input
                      type="date"
                      value={couponForm.valid_until}
                      onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                      className="w-full px-0 py-4 border-b border-gray-100 focus:border-[#1F8D9D] transition-colors bg-transparent text-[#1B1B1B] font-light outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-12">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 py-4 border border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-300 hover:text-[#1B1B1B] transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#1B1B1B] text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-[#1F8D9D] transition-all shadow-xl"
                  >
                    {editingCoupon ? "Update protocol" : "Initialize concession"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
