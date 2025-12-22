"use client"

import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import FeaturedProducts from "@/components/featured-products"
import Link from "next/link"
import { Leaf, Shield, Heart, Star, Mail, Phone, Instagram } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  const features = [
    {
      icon: <Leaf className="w-8 h-8 text-[#3E7346]" />,
      title: "Quality Products",
      description: "Carefully curated selection of premium products for your needs",
    },
    {
      icon: <Shield className="w-8 h-8 text-[#1F8D9D]" />,
      title: "Secure Shopping",
      description: "Safe and secure checkout with trusted payment methods",
    },
    {
      icon: <Heart className="w-8 h-8 text-[#FDBA2D]" />,
      title: "Customer First",
      description: "Dedicated support team ready to help you every step of the way",
    },
    {
      icon: <Star className="w-8 h-8 text-[#3E7346]" />,
      title: "Best Value",
      description: "Competitive prices with regular deals and discounts on top brands",
    },
  ]

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B1B1B] mb-4">
              Why Shop With <span className="text-gradient">Us</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your trusted destination for quality products and exceptional shopping experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-xl bg-[#F9F9F9] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-[#1B1B1B] mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1F8D9D] to-[#3E7346] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Discover Amazing Products Today
          </motion.h2>
          <motion.p 
            className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of happy shoppers who trust us for quality products and excellent service
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              href="/products"
              className="inline-block bg-[#FDBA2D] hover:bg-[#FDBA2D]/90 text-[#1B1B1B] px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </Link>
          </motion.div>
        </div>
        
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </section>

      {/* Footer */}
      <footer className="bg-[#1B1B1B] text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">ZEENE Store</h3>
              <p className="text-gray-400 mb-4">Your one-stop shop for quality products and great deals.</p>

              {/* Social Media Links */}
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/zeene.store?igsh=c2J0a20zMDM4bmI1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#FDBA2D] transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/products" className="block text-gray-400 hover:text-white transition-colors">
                  Products
                </Link>
                <Link href="/login" className="block text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="block text-gray-400 hover:text-white transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-[#FDBA2D]" />
                  <a href="mailto:zeene.contact@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                    zeene.contact@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-[#FDBA2D]" />
                  <a
                    href="https://wa.me/923241715470"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    +92 324 1715470 (WhatsApp)
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Instagram className="w-4 h-4 text-[#FDBA2D]" />
                  <a
                    href="https://www.instagram.com/zeene.store?igsh=c2J0a20zMDM4bmI1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    @zeene.store
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-400">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ZEENE Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
