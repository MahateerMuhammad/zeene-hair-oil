import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

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
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} font-inter antialiased`}>
        <Providers>
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
