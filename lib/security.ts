// Security utilities for input validation and sanitization

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    // Remove script tags (more comprehensive)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/script>/gi, '')
    // Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '')
    .replace(/about:/gi, '')
    // Remove event handlers (more comprehensive)
    .replace(/on\w+\s*=/gi, '')
    .replace(/on\w+\s*\(/gi, '')
    // Remove HTML tags and attributes
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;[^&gt;]*&gt;/g, '')
    // Remove dangerous characters
    .replace(/[<>'"&]/g, '')
    // Remove null bytes and control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential SQL injection patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, 1000)
}

export function validateEmail(email: string): boolean {
  try {
    if (typeof email !== 'string' || !email.trim()) return false
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    // Check length constraints
    if (email.length > 254) return false
    
    // Check for dangerous patterns
    if (/[<>'"&]/.test(email)) return false
    
    // Split and validate parts
    const parts = email.split('@')
    if (parts.length !== 2) return false
    
    const [localPart, domainPart] = parts
    if (localPart.length > 64 || localPart.length === 0) return false
    if (domainPart.length > 253 || domainPart.length === 0) return false
    
    return emailRegex.test(email)
  } catch (error) {
    console.error('Email validation error:', error)
    return false
  }
}

export function validatePhone(phone: string): boolean {
  // Allow international phone numbers with +, digits, spaces, hyphens, parentheses
  const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/
  return phoneRegex.test(phone)
}

export function validateName(name: string): boolean {
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/
  return nameRegex.test(name)
}

export function validateAddress(address: string): boolean {
  // Basic address validation - allow alphanumeric, spaces, common punctuation
  const addressRegex = /^[a-zA-Z0-9\s\-.,#/()]{10,200}$/
  return addressRegex.test(address)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (typeof password !== 'string') {
    return { valid: false, message: "Password must be a string" }
  }
  
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" }
  }
  
  if (password.length > 128) {
    return { valid: false, message: "Password must be less than 128 characters" }
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123']
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: "Password is too common. Please choose a stronger password" }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" }
  }
  
  // Check for special characters (recommended but not required)
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    // Don't fail, just warn in console for now
    console.warn("Password would be stronger with special characters")
  }
  
  return { valid: true }
}

export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 100
}

export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && price <= 1000000 && Number.isFinite(price)
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes