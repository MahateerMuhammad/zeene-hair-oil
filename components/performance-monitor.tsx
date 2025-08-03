"use client"

import { useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/performance'

/**
 * Performance monitoring component that tracks Core Web Vitals
 * Only active in development mode to avoid affecting production performance
 */
export default function PerformanceMonitorComponent() {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') return

    const monitor = PerformanceMonitor.getInstance()
    
    // Monitor Core Web Vitals
    const observeWebVitals = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            if (lastEntry) {
              console.log(`🎯 LCP: ${lastEntry.startTime.toFixed(2)}ms`)
            }
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // First Input Delay (FID) - via event timing
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry) => {
              const eventEntry = entry as any // Type assertion for PerformanceEventTiming
              if (eventEntry.processingStart) {
                const fid = eventEntry.processingStart - eventEntry.startTime
                console.log(`⚡ FID: ${fid.toFixed(2)}ms`)
              }
            })
          })
          fidObserver.observe({ entryTypes: ['first-input'] })

          // Cumulative Layout Shift (CLS)
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0
            const entries = list.getEntries()
            entries.forEach((entry) => {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value
              }
            })
            if (clsValue > 0) {
              console.log(`📐 CLS: ${clsValue.toFixed(4)}`)
            }
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })

          // Cleanup observers on unmount
          return () => {
            lcpObserver.disconnect()
            fidObserver.disconnect()
            clsObserver.disconnect()
          }
        } catch (error) {
          console.warn('Performance monitoring not supported:', error)
        }
      }
    }

    // Start monitoring after page load
    if (document.readyState === 'complete') {
      observeWebVitals()
    } else {
      window.addEventListener('load', observeWebVitals)
      return () => window.removeEventListener('load', observeWebVitals)
    }
  }, [])

  // Monitor memory usage periodically in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
        
        // Only log if memory usage is high
        if (used > 50) {
          console.log(`🧠 Memory: ${used}MB / ${total}MB`)
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // This component doesn't render anything
  return null
}