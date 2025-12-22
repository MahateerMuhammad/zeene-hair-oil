"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#F9F9F9] via-white to-[#1F8D9D]/10 pt-16 sm:pt-18 md:pt-20 lg:pt-22">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Oil Drops Animation */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#FDBA2D] rounded-full oil-drop opacity-60"
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}

        {/* Floating Leaves */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute text-[#3E7346] opacity-30 floating-animation"
            style={{
              left: `${10 + i * 25}%`,
              top: `${20 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
              fontSize: "2rem",
            }}
          >
            🍃
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-gradient">Shop Smart</span>
              <br />
              <span className="text-[#1B1B1B]">Live Better</span>
            </motion.h1>

            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover amazing products at unbeatable prices. Shop from our curated collection and enjoy a seamless shopping experience.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/products"
                  className="inline-block text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-[#1F8D9D] text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  Buy Now
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/products"
                  className="inline-block text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-gray-200 text-[#1F8D9D] rounded-lg font-semibold transition-all duration-300 hover:bg-gray-300 text-center"
                >
                  Browse Categories
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Product Showcase */}
          <motion.div 
            className="relative flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {/* Main Product Image */}
              <motion.div
                className="relative glow-effect rounded-2xl overflow-hidden"
                style={{
                  transform: `rotateY(${scrollY * 0.1}deg) rotateX(${scrollY * 0.05}deg)`,
                }}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 10,
                  rotateX: 5
                }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/oil.png"
                  alt="Featured Product"
                  width={400}
                  height={500}
                  className="w-64 h-80 sm:w-72 sm:h-88 lg:w-80 lg:h-96 object-cover rounded-2xl"
                />

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F8D9D]/20 to-transparent rounded-2xl" />
              </motion.div>

              {/* Floating Elements Around Product */}
              <motion.div 
                className="absolute -top-4 -right-4 w-8 h-8 bg-[#FDBA2D] rounded-full opacity-80"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#3E7346] rounded-full opacity-60"
                animate={{ 
                  y: [0, 10, 0],
                  x: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.div
                className="absolute top-1/2 -left-8 w-4 h-4 bg-[#1F8D9D] rounded-full opacity-70"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-[#1F8D9D]" />
      </div>
    </section>
  )
}
