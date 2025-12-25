/**
 * Auth utility functions for handling session and token issues
 */

export function clearAuthStorage() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all Supabase auth-related items from localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth') || key === 'zeene-auth-token')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log('Auth storage cleared')
      return true
    } catch (error) {
      console.error('Failed to clear auth storage:', error)
      return false
    }
  }
  return false
}

export function hasValidSession() {
  if (typeof window !== 'undefined') {
    try {
      const authToken = localStorage.getItem('zeene-auth-token')
      if (!authToken) return false
      
      const session = JSON.parse(authToken)
      // Check if refresh token exists
      return !!(session && session.refresh_token)
    } catch (error) {
      return false
    }
  }
  return false
}

export async function handleAuthError(error: any) {
  // Handle specific auth errors
  if (error?.message?.includes('refresh') || error?.message?.includes('token')) {
    console.error('Auth token error detected, clearing storage')
    clearAuthStorage()
    
    // Redirect to login if on client side
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}
