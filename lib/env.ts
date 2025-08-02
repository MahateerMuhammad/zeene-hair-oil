// Server-side environment variables
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
} as const

// Client-side environment variables (safe to expose)
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
} as const

// Validation for required environment variables
export const validateEnv = () => {
  const requiredServerEnv = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'CONTACT_EMAIL',
  ] as const

  const requiredClientEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_WHATSAPP_NUMBER',
  ] as const

  const missingVars: string[] = []

  // Check server environment variables
  if (typeof window === 'undefined') {
    requiredServerEnv.forEach(key => {
      if (!process.env[key]) {
        missingVars.push(key)
      }
    })
  }

  // Check client environment variables
  requiredClientEnv.forEach(key => {
    const value = process.env[key]
    if (!value || value === '') {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

// For server-side validation, we'll validate when the env is actually accessed
export const getValidatedServerEnv = () => {
  if (typeof window === 'undefined') {
    validateEnv()
  }
  return serverEnv
}

export const getValidatedClientEnv = () => {
  // Only validate on client-side if we're not in build/SSR mode
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    validateEnv()
  }
  return clientEnv
}