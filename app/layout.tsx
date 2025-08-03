import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import PerformanceMonitorComponent from "@/components/performance-monitor"
import WhatsAppFloat from "@/components/whatsapp-float"
import { Toaster } from "sonner"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "ZEENE Hair Oil - Healthy Hair Starts Here",
  description:
    "Premium natural hair oil for healthy, shiny, and beautiful hair. Experience the power of nature with ZEENE.",
  keywords: "hair oil, natural hair care, healthy hair, hair growth, ZEENE",
  generator: 'v0.dev',
  // Performance and SEO enhancements
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Open Graph for better social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zeene.store',
    title: 'ZEENE Hair Oil - Healthy Hair Starts Here',
    description: 'Premium natural hair oil for healthy, shiny, and beautiful hair. Experience the power of nature with ZEENE.',
    siteName: 'ZEENE Hair Oil',
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'ZEENE Hair Oil - Healthy Hair Starts Here',
    description: 'Premium natural hair oil for healthy, shiny, and beautiful hair.',
  },
  // Verification and other meta tags
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        {/* Viewport meta for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1F8D9D" />
        <meta name="msapplication-TileColor" content="#1F8D9D" />
        {/* Prevent zoom on iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${playfair.variable} ${inter.variable} font-inter antialiased`}>
        <Providers>
          <PerformanceMonitorComponent />
          {children}
          <WhatsAppFloat />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F8D9D',
                color: 'white',
                border: 'none',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
