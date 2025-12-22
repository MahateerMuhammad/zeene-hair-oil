"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"

const slides = [
  {
    id: 1,
    title: "Curated Lifestyle",
    subtitle: "DESIGN-LED SELECTION",
    description: "Discover a collection where design meets utility. We source the world's most innovative products for your modern lifestyle.",
    image: "/lifestyle/curated.png",
    color: "#FDFDFD",
    accent: "#1B1B1B"
  },
  {
    id: 2,
    title: "Timeless Quality",
    subtitle: "BUILT TO LAST",
    description: "Invest in pieces that stand the test of time. Our premium selection focuses on craftsmanship and enduring quality.",
    image: "/lifestyle/design.png",
    color: "#F9F5F2",
    accent: "#B8860B"
  },
  {
    id: 3,
    title: "Modern Trends",
    subtitle: "GLOBAL INSPIRATION",
    description: "Stay ahead of the curve with our latest arrivals. Fresh perspectives and contemporary designs, delivered to your door.",
    image: "/lifestyle/trends.png",
    color: "#F7F8F9",
    accent: "#1F8D9D"
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  return (
    <section className="relative h-[85vh] sm:h-[90vh] overflow-hidden bg-white">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0 flex items-center"
          style={{ backgroundColor: slides[currentSlide].color }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-block text-xs sm:text-sm font-bold tracking-[0.3em] uppercase mb-4"
                style={{ color: slides[currentSlide].accent }}
              >
                {slides[currentSlide].subtitle}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl sm:text-6xl lg:text-8xl font-playfair font-black text-[#1B1B1B] mb-6 leading-tight"
              >
                {slides[currentSlide].title.split(" ").map((word, i) => (
                  <span key={i} className="block lg:inline">{word} </span>
                ))}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-lg sm:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-light"
              >
                {slides[currentSlide].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <Link
                  href="/products"
                  className="inline-flex items-center px-10 py-4 bg-[#1B1B1B] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#1F8D9D] transition-colors duration-500 rounded-sm group"
                >
                  Shop the Collection
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="ml-3"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>

            {/* Image Content */}
            <div className="order-1 lg:order-2 relative flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
                className="relative w-full max-w-[500px] aspect-[4/5]"
              >
                <Image
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  fill
                  className="object-cover rounded-sm shadow-2xl"
                  priority
                />

                {/* Floating Detail */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute -bottom-8 -right-8 bg-white/80 backdrop-blur-md p-6 shadow-xl rounded-sm hidden sm:block border-l-4"
                  style={{ borderLeftColor: slides[currentSlide].accent }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Featured Edit</p>
                  <p className="text-sm font-playfair font-bold text-[#1B1B1B]">{slides[currentSlide].title}</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-6 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1)
              setCurrentSlide(index)
            }}
            className="group relative py-2"
          >
            <div
              className={`h-[2px] w-8 transition-all duration-500 rounded-full ${index === currentSlide ? "bg-[#1B1B1B]" : "bg-gray-300"
                }`}
            />
            {index === currentSlide && (
              <motion.div
                layoutId="active-nav"
                className="absolute inset-0 bg-transparent flex justify-center"
              >
                <div className="w-1 h-1 bg-[#1B1B1B] rounded-full -top-1" />
              </motion.div>
            )}
            <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-opacity duration-300 ${index === currentSlide ? "opacity-100" : "opacity-0"
              }`}>
              0{index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Side Navigation */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col space-y-4 z-20">
        <button
          onClick={prevSlide}
          className="w-12 h-12 flex items-center justify-center border border-gray-200 hover:border-[#1B1B1B] hover:bg-white transition-all rounded-full group bg-white/50 backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#1B1B1B]" />
        </button>
        <button
          onClick={nextSlide}
          className="w-12 h-12 flex items-center justify-center border border-gray-200 hover:border-[#1B1B1B] hover:bg-white transition-all rounded-full group bg-white/50 backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1B1B1B]" />
        </button>
      </div>
    </section>
  )
}
