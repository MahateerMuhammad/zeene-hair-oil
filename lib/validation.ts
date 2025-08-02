import { z } from 'zod'

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Product name contains invalid characters'),
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price is too high')
    .refine((val) => Number(val.toFixed(2)) === val, 'Price can have at most 2 decimal places'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  image_url: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
})

// Order validation schema
export const orderSchema = z.object({
  customer_name: z.string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Customer name can only contain letters and spaces'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  phone: z.string()
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters'),
  product_id: z.string().uuid('Invalid product ID'),
})

// User validation schema
export const userSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
})

// File validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' }
  }
  
  return { valid: true }
}

// Sanitize HTML content
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Sanitize user input for database
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ')
}

// Validate and sanitize product data
export const validateProduct = (data: any) => {
  try {
    const sanitized = {
      ...data,
      name: sanitizeInput(data.name),
      description: data.description ? sanitizeInput(data.description) : undefined,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
    }
    
    return {
      success: true,
      data: productSchema.parse(sanitized),
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }],
    }
  }
}

// Validate and sanitize order data
export const validateOrder = (data: any) => {
  try {
    const sanitized = {
      ...data,
      customer_name: sanitizeInput(data.customer_name),
      address: sanitizeInput(data.address),
      phone: sanitizeInput(data.phone.replace(/[^\d+\-\s()]/g, '')),
    }
    
    return {
      success: true,
      data: orderSchema.parse(sanitized),
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }],
    }
  }
}

// Rate limiting helper
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>()
  
  return (identifier: string): boolean => {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!requests.has(identifier)) {
      requests.set(identifier, [])
    }
    
    const userRequests = requests.get(identifier)!
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false // Rate limited
    }
    
    validRequests.push(now)
    requests.set(identifier, validRequests)
    
    return true // Request allowed
  }
}

// CSRF token validation
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return token === sessionToken && token.length > 10
}