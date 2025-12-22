"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ImageIcon, AlertCircle } from "lucide-react"

interface ProductImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  showPlaceholder?: boolean
  priority?: boolean
  fill?: boolean
}

export default function ProductImage({
  src,
  alt,
  width = 500,
  height = 500,
  className,
  fallbackSrc = "/product-placeholder.svg",
  showPlaceholder = true,
  priority = false,
  fill = false,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // If no src provided or image failed to load, show placeholder
  if (!src || imageError) {
    if (!showPlaceholder) {
      return null
    }

    return (
      <div className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden",
        className
      )}>
        <div className="flex flex-col items-center justify-center p-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p className="text-sm font-medium">No Image Available</p>
          <p className="text-xs text-gray-500 mt-1">Product image not found</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/10 rounded-full"></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="placeholder-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#placeholder-pattern)" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        className={cn(
          "transition-all duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* Error indicator */}
      {imageError && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}