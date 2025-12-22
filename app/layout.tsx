import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import PerformanceMonitorComponent from "@/components/performance-monitor"
import WhatsAppFloat from "@/components/whatsapp-float"
import { Toaster } from "sonner"
import { PageTransition } from "@/components/page-transition"
import Navigation from "@/components/navigation"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "ZEENE | Curated Lifestyle & Modern Essentials",
  description:
    "Discover a premium selection of curated lifestyle essentials. Experience modern luxury with ZEENE's timeless quality and sophisticated design.",
  keywords: "premium e-commerce, lifestyle essentials, modern luxury, curated products, ZEENE",
  generator: 'v0.dev',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zeene.store',
    title: 'ZEENE | Curated Lifestyle & Modern Essentials',
    description: 'Discover a premium selection of curated lifestyle essentials. Experience modern luxury with ZEENE’s timeless quality.',
    siteName: 'ZEENE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZEENE | Curated Lifestyle & Modern Essentials',
    description: 'Discover a premium selection of curated lifestyle essentials.',
  },
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
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1B1B1B" />
        <meta name="msapplication-TileColor" content="#1B1B1B" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${playfair.variable} ${inter.variable} font-inter antialiased bg-white text-[#1B1B1B]`}>
        <Providers>
          <PerformanceMonitorComponent />
          <Navigation />
          <PageTransition>
            {children}
          </PageTransition>
          <WhatsAppFloat />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-inter text-[10px] font-bold tracking-widest uppercase rounded-sm border-none shadow-2xl",
              style: {
                background: '#1B1B1B',
                color: 'white',
                padding: '16px 24px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
