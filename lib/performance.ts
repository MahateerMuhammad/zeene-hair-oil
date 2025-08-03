// Performance optimization utilities

import { useCallback, useRef } from 'react'

// Debounce function to prevent excessive API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Hook for debounced callbacks
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  ) as T
}

// Lazy loading utility for images
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}

// Memory cleanup utility
export function cleanupEventListeners(
  element: Element | Window,
  events: Array<{ type: string; listener: EventListener }>
): void {
  events.forEach(({ type, listener }) => {
    element.removeEventListener(type, listener)
  })
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): void {
    this.metrics.set(label, performance.now())
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(label)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    this.metrics.delete(label)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }

  measureAsync<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startTiming(label)
    return asyncFn().finally(() => this.endTiming(label))
  }
}

// Image preloading utility
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Batch image preloading
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => preloadImage(url).catch(() => {})) // Ignore errors
  await Promise.all(promises)
}

// Resource hints utility
export function addResourceHints(urls: string[], rel: 'preload' | 'prefetch' = 'preload'): void {
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = url
    link.as = 'image'
    document.head.appendChild(link)
  })
}

// Bundle size analyzer (development only)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const totalSize = scripts.reduce((size, script) => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('/_next/')) {
        // Estimate size based on URL patterns (rough estimation)
        return size + (src.includes('chunks') ? 50000 : 200000)
      }
      return size
    }, 0)
    
    console.log(`📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
  }
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory
    console.log(`🧠 Memory usage:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    })
  }
}