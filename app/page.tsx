"use client"

import HeroSection from "@/components/hero-section"
import FeaturedProducts from "@/components/featured-products"
import Link from "next/link"
import { Leaf, Shield, Heart, Star, Mail, Phone, Instagram, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: <Leaf className="w-5 h-5" />,
    title: "Eco Conscious",
    description: "Sustainably sourced, thoughtfully made.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Premium Quality",
    description: "Exceptional standards for every product.",
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Curated Design",
    description: "Handpicked with a focus on aesthetics.",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Modern Trends",
    description: "Always ahead of the global curve.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
      <main>
        <HeroSection />

        <FeaturedProducts />

        <div className="h-px bg-transparent" />

        {/* Visual Journal - Infinite Marquee */}
        <section className="py-20 bg-white overflow-hidden">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-4">The Aesthetic</p>
            <h2 className="text-3xl font-playfair font-black text-[#1B1B1B]">Visual Journal</h2>
          </div>

          <div className="relative w-full flex overflow-hidden group">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: "-100%" }}
              transition={{ duration: 45, ease: "linear", repeat: Infinity }}
            >
              {[
                "/new_assets/modern-vase.jpg",
                "/new_assets/gold-ring.jpg",
                "/new_assets/luxury-oil.jpg",
                "/new_assets/chair.jpeg",
                "/new_assets/silk-texture.jpg",
                "/new_assets/modern-chair.png",
                "/new_assets/modern-vase.jpg",
                "/new_assets/gold-ring.jpg",
                "/new_assets/luxury-oil.jpg",
                "/new_assets/chair.jpeg",
                "/new_assets/silk-texture.jpg",
                "/new_assets/modern-chair.png"
              ].map((src, index) => (
                <div key={index} className="relative w-64 h-80 sm:w-80 sm:h-96 flex-shrink-0 bg-[#F9F9F9] rounded-sm overflow-hidden mr-4 sm:mr-8">
                  <img
                    src={src}
                    alt="Visual Journal"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
                </div>
              ))}
            </motion.div>
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: "-100%" }}
              transition={{ duration: 45, ease: "linear", repeat: Infinity }}
            >
              {[
                "/new_assets/modern-vase.jpg",
                "/new_assets/gold-ring.jpg",
                "/new_assets/luxury-oil.jpg",
                "/new_assets/chair.jpeg",
                "/new_assets/silk-texture.jpg",
                "/new_assets/modern-chair.png",
                "/new_assets/modern-vase.jpg",
                "/new_assets/gold-ring.jpg",
                "/new_assets/luxury-oil.jpg",
                "/new_assets/chair.jpeg",
                "/new_assets/silk-texture.jpg",
                "/new_assets/modern-chair.png"
              ].map((src, index) => (
                <div key={index} className="relative w-64 h-80 sm:w-80 sm:h-96 flex-shrink-0 bg-[#F9F9F9] rounded-sm overflow-hidden mr-4 sm:mr-8">
                  <img
                    src={src}
                    alt="Visual Journal"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Brand Manifesto Section */}
        <section className="py-40 bg-white overflow-hidden will-change-transform">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-24">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-8"
              >
                Our Manifesto
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-playfair font-black text-[#1B1B1B] leading-[0.9] mb-12 tracking-tighter"
              >
                Curation <br />
                <span className="text-gray-200 italic">as an Art.</span>
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.4, duration: 1 }}
                className="h-[1px] w-24 bg-[#1F8D9D] mx-auto mb-12"
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-xl sm:text-2xl text-gray-400 font-light leading-relaxed tracking-tight"
              >
                "We believe that the objects we surround ourselves with define the quality of our days.
                ZEENE is more than a store—it's a commitment to the exceptional, a filter for the mundane,
                and a celebration of modern design."
              </motion.p>
            </div>

            {/* Asymmetrical Visual Narrative */}
            <div className="grid grid-cols-12 gap-8 items-center">
              <motion.div
                className="col-span-12 lg:col-span-7 transform-gpu"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1 }}
              >
                <div className="relative aspect-[16/9] bg-gray-100 rounded-sm overflow-hidden shadow-2xl group">
                  <img
                    src="/hero/organic.png"
                    alt="Design Philosophy"
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-opacity duration-1000 group-hover:opacity-0" />
                </div>
              </motion.div>

              <motion.div
                className="col-span-12 lg:col-span-4 lg:col-start-9 space-y-12 transform-gpu"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-playfair font-bold text-[#1B1B1B]">Elevated Essentials</h3>
                  <p className="text-gray-500 font-light leading-relaxed">
                    Every piece in our collection is selected not just for its function, but for its ability to inspire.
                    From architectural home goods to timeless fashion, we prioritize the permanent over the transient.
                  </p>
                  <Link
                    href="/about"
                    className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B] border-b border-black pb-1 hover:text-[#1F8D9D] hover:border-[#1F8D9D] transition-all"
                  >
                    Read Our Story
                  </Link>
                </div>

                <div className="relative aspect-square w-2/3 lg:w-full bg-gray-50 rounded-sm overflow-hidden shadow-xl ring-8 ring-white">
                  <img
                    src="/hero/shine.png"
                    alt="Current Trends"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Collection Spotlight - Mosaic Grid */}
        <section className="py-32 bg-[#F9F9F9]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 px-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-4">The Campaign</p>
                <h2 className="text-4xl sm:text-6xl font-playfair font-black text-[#1B1B1B]">Season 01</h2>
              </div>
              <Link href="/products" className="hidden md:block text-[10px] font-bold tracking-[0.2em] uppercase border-b border-black pb-1 hover:text-[#1F8D9D] hover:border-[#1F8D9D] transition-colors">
                View Full Lookbook
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[120vh] md:h-[80vh]">
              {/* Large Featured Image */}
              <motion.div
                className="md:col-span-6 relative group overflow-hidden rounded-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <img src="/new_assets/modern-vase.jpg" alt="Campaign 01" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-white text-[10px] font-bold tracking-[0.3em] uppercase mb-2">Editorial</p>
                  <p className="text-white text-3xl font-playfair font-bold">The Modern Ritual</p>
                </div>
              </motion.div>

              {/* Right Column Grid */}
              <div className="md:col-span-6 grid grid-cols-2 gap-4">
                <motion.div
                  className="col-span-2 h-[40vh] md:h-auto relative group overflow-hidden rounded-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <img src="/new_assets/modern-chair.png" alt="Campaign 02" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-sm">
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#1B1B1B]">New Arrivals</p>
                  </div>
                </motion.div>

                <motion.div
                  className="relative group overflow-hidden rounded-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <img src="/new_assets/gold-ring.jpg" alt="Campaign 03" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                </motion.div>

                <motion.div
                  className="bg-[#1B1B1B] p-8 flex flex-col justify-center items-center text-center rounded-sm cursor-pointer group hover:bg-[#1F8D9D] transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Shop The Edit</p>
                  <p className="text-white font-playfair text-2xl italic group-hover:scale-110 transition-transform duration-500">→</p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal CTA */}
        <section className="py-40 bg-white border-y border-gray-100 will-change-transform">
          <div className="container mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-5xl sm:text-7xl font-playfair font-black text-[#1B1B1B] mb-12"
            >
              Elevate Your Ritual.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/products"
                className="inline-flex items-center px-12 py-5 bg-[#1B1B1B] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#1F8D9D] transition-all duration-500 group"
              >
                Shop ZEENE Now
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative bg-[#0A0A0A] text-white pt-32 pb-12 overflow-hidden transform-gpu">
        {/* Simplified Background Watermark for Performance */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.02]">
          <span className="text-[20vw] font-playfair font-black tracking-tighter leading-none block transform-gpu">ZEENE</span>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Newsletter Section */}
          <div className="max-w-2xl mx-auto text-center mb-32">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-6"
            >
              The Inner Circle
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-playfair font-bold mb-8"
            >
              Stay Ahead of the Curve.
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/20 pb-4 focus-within:border-[#1F8D9D] transition-colors"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="bg-transparent border-none outline-none w-full text-lg font-light text-center sm:text-left placeholder:text-gray-600"
              />
              <button className="text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:text-[#1F8D9D] transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-4 space-y-8 text-center md:text-left">
              <Link href="/" className="inline-block">
                <h2 className="text-3xl font-playfair font-black tracking-tighter">ZEENE.</h2>
              </Link>
              <p className="text-gray-500 text-sm max-w-xs mx-auto md:mx-0 font-light leading-relaxed">
                A curated destination for those who appreciate the intersection of modern design and timeless quality. Elevated essentials for your daily ritual.
              </p>
              <div className="flex justify-center md:justify-start space-x-8">
                <a href="https://www.instagram.com/zeene.store" target="_blank" className="group">
                  <Instagram className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </a>
                <a href="#" className="group">
                  <Mail className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-7 space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Collections</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">New Arrivals</Link></li>
                <li><Link href="/products" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Essentials</Link></li>
                <li><Link href="/categories" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Archives</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Journal</Link></li>
                <li><Link href="/about" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Our Story</Link></li>
                <li><Link href="/contact" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Utility</h4>
              <ul className="space-y-4">
                <li><Link href="/shipping" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Shipping</Link></li>
                <li><Link href="/faq" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-sm font-light text-gray-500 hover:text-[#1F8D9D] transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 space-y-6 md:space-y-0 text-center md:text-left">
            <p className="text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase">
              &copy; 2024 ZEENE. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 opacity-30">
              <div className="h-10 w-16 bg-white/10 rounded-sm"></div>
              <div className="h-10 w-16 bg-white/10 rounded-sm"></div>
              <div className="h-10 w-16 bg-white/10 rounded-sm"></div>
            </div>
          </div>
        </div>
      </footer>
    </div >
  )
}
