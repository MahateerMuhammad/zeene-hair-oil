"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { toast } from "sonner"

interface WishlistButtonProps {
  productId: string
  productName: string
}

export function WishlistButton({ productId, productName }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      checkWishlist()
    }
  }, [user, productId])

  const checkWishlist = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single()

      if (data) setIsInWishlist(true)
    } catch (error) {
      // Not in wishlist
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist")
      return
    }

    setLoading(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) throw error

        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("wishlists")
          .insert({
            user_id: user.id,
            product_id: productId,
          })

        if (error) throw error

        setIsInWishlist(true)
        toast.success(`${productName} added to wishlist`)
      }
    } catch (error: any) {
      console.error("Wishlist error full:", JSON.stringify(error, null, 2))
      console.error("Wishlist error mesg:", error.message)
      toast.error(error.message || "Failed to update wishlist")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isInWishlist ? "default" : "outline"}
      size="icon"
      onClick={toggleWishlist}
      disabled={loading}
      className="transition-all"
    >
      <Heart
        className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`}
      />
    </Button>
  )
}
