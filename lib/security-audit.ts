// Security audit and vulnerability fixes

import { sanitizeInput } from './security'

// Enhanced XSS protection
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') return ''
  
  return html
    // Remove all script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/script>/gi, '')
    // Remove dangerous HTML tags
    .replace(/<(iframe|object|embed|form|input|textarea|select|button|link|meta|style)[^>]*>/gi, '')
    .replace(/<\/(iframe|object|embed|form|input|textarea|select|button|link|meta|style)>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: and data: URLs
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""')
    .replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""')
    // Remove style attributes that could contain expressions
    .replace(/style\s*=\s*["'][^"']*expression\([^"']*\)["']/gi, '')
    .replace(/style\s*=\s*["'][^"']*javascript:[^"']*["']/gi, '')
}

// SQL injection prevention for search queries
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''
  
  return query
    // Remove SQL keywords and dangerous characters
    .replace(/[';\\--]/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|DECLARE|CAST|CONVERT)\b/gi, '')
    // Remove potential SQL injection patterns
    .replace(/(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi, '')
    .replace(/(\b(OR|AND)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/gi, '')
    // Limit length and sanitize
    .trim()
    .substring(0, 100)
}

// File upload security
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' }
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i,
    /\.scr$/i, /\.com$/i, /\.pif$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: 'Suspicious file type detected' }
  }
  
  return { valid: true }
}

// URL validation and sanitization
export function validateURL(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false
  
  try {
    const urlObj = new URL(url)
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }
    
    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase()
      
      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false
      }
      
      // Block private IP ranges
      const privateIPPatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/
      ]
      
      if (privateIPPatterns.some(pattern => pattern.test(hostname))) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

// Enhanced input validation for forms
export function validateFormData(data: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check for required fields
  const requiredFields = ['customer_name', 'address', 'phone']
  requiredFields.forEach(field => {
    if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
      errors.push(`${field.replace('_', ' ')} is required`)
    }
  })
  
  // Validate each field
  if (data.customer_name) {
    const sanitized = sanitizeInput(data.customer_name)
    if (sanitized !== data.customer_name) {
      errors.push('Customer name contains invalid characters')
    }
    if (sanitized.length < 2 || sanitized.length > 50) {
      errors.push('Customer name must be between 2 and 50 characters')
    }
  }
  
  if (data.address) {
    const sanitized = sanitizeInput(data.address)
    if (sanitized !== data.address) {
      errors.push('Address contains invalid characters')
    }
    if (sanitized.length < 10 || sanitized.length > 200) {
      errors.push('Address must be between 10 and 200 characters')
    }
  }
  
  if (data.phone) {
    const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format')
    }
  }
  
  if (data.quantity) {
    const quantity = parseInt(data.quantity)
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      errors.push('Quantity must be between 1 and 100')
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// Rate limiting with IP tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>()

export function enhancedRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000,
  blockDuration: number = 300000 // 5 minutes block
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  // Clean up expired entries
  if (now % 10000 < 100) { // Cleanup every ~10 seconds
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime && !value.blocked) {
        rateLimitStore.delete(key)
      }
    }
  }
  
  if (!record || (now > record.resetTime && !record.blocked)) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs, blocked: false })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }
  
  // Check if currently blocked
  if (record.blocked && now < record.resetTime) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  // Reset block status if block period expired
  if (record.blocked && now >= record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs, blocked: false })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }
  
  if (record.count >= maxRequests) {
    // Block the identifier
    record.blocked = true
    record.resetTime = now + blockDuration
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// Content Security Policy nonce generator
export function generateCSPNonce(): string {
  const array = new Uint8Array(16)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Buffer.from(array).toString('base64')
}

// Secure session token validation
export function validateSessionToken(token: string): boolean {
  if (typeof token !== 'string' || !token.trim()) return false
  
  // Check token format (should be base64 or similar)
  const tokenRegex = /^[A-Za-z0-9+/=_-]+$/
  if (!tokenRegex.test(token)) return false
  
  // Check token length (reasonable bounds)
  if (token.length < 20 || token.length > 500) return false
  
  return true
}

// Environment variable validation
export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  return { valid: missing.length === 0, missing }
}

// Security headers validation
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      media-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
  }
}