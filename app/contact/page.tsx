"use client"

import { Mail, Phone, Instagram, Clock, Send, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#1F8D9D]/20">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#1F8D9D] mb-6">Concierge</p>
              <h1 className="text-7xl md:text-9xl font-playfair font-black text-[#1B1B1B] leading-[0.8] tracking-tighter mb-12">
                Let's Start<br />A Dialogue.
              </h1>
              <div className="h-[2px] w-24 bg-[#1B1B1B] mb-12" />
              <p className="text-gray-500 font-light text-xl max-w-2xl leading-relaxed">
                Whether you have a product inquiry or simply wish to discuss architectural aesthetics, our team is dedicated to providing a seamless experience.
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-12 gap-24">
            {/* Contact Details - Editorial List */}
            <div className="lg:col-span-5 space-y-20">
              <div className="space-y-12">
                {[
                  {
                    label: "Email Inquiry",
                    value: "zeene.contact@gmail.com",
                    href: "mailto:zeene.contact@gmail.com",
                    icon: Mail
                  },
                  {
                    label: "Direct Connection",
                    value: "+92 324 1715470",
                    href: "https://wa.me/923241715470",
                    icon: Phone
                  },
                  {
                    label: "Digital Studio",
                    value: "instagram.com/zeene.store",
                    href: "https://www.instagram.com/zeene.store",
                    icon: Instagram
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.8 }}
                    className="group"
                  >
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="block space-y-3">
                      <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400 group-hover:text-[#1F8D9D] transition-colors flex items-center">
                        <item.icon size={12} className="mr-3" />
                        {item.label}
                      </p>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4 group-hover:border-[#1F8D9D] transition-all">
                        <span className="text-2xl font-playfair font-black text-[#1B1B1B]">{item.value}</span>
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#1F8D9D]" />
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>

              <div className="p-12 bg-[#F9F9F9] rounded-sm space-y-6">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1B1B1B]">Business Hours</p>
                <div className="grid grid-cols-2 gap-8 text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">
                  <div className="space-y-2">
                    <p className="text-gray-300">Weekdays</p>
                    <p className="text-[#1B1B1B]">09:00 — 18:00</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300">Saturday</p>
                    <p className="text-[#1B1B1B]">10:00 — 16:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form - High Contrast */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="bg-white"
              >
                <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Your Identity</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-xl font-playfair font-black focus:outline-none focus:border-[#1B1B1B] transition-colors placeholder:text-gray-200"
                        placeholder="Name (e.g., John Smith)"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Digital Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-xl font-playfair font-black focus:outline-none focus:border-[#1B1B1B] transition-colors placeholder:text-gray-200"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Subject Of Interest</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-xl font-playfair font-black focus:outline-none focus:border-[#1B1B1B] transition-colors placeholder:text-gray-200"
                      placeholder="Product Inquiry / Partnership"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Elaborate Your Message</label>
                    <textarea
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-xl font-playfair font-black focus:outline-none focus:border-[#1B1B1B] transition-colors placeholder:text-gray-200 resize-none"
                      placeholder="Your detailed inquiry here..."
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    className="w-full h-20 bg-[#1B1B1B] text-white text-[12px] font-bold tracking-[0.5em] uppercase hover:bg-[#1F8D9D] transition-all duration-700 shadow-2xl flex items-center justify-center space-x-4 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                    ) : (
                      <>
                        <span>Submit Dialogue</span>
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>

          {/* Minimalist FAQ / Common Threads */}
          <div className="mt-40 pt-40 border-t border-gray-100">
            <h2 className="text-4xl font-playfair font-black text-[#1B1B1B] text-center mb-20 leading-tight">Frequently Discussed.</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                {
                  q: "Execution Time?",
                  a: "Domestic deliveries are finalized within 2-5 business cycles."
                },
                {
                  q: "Sourcing Policy?",
                  a: "Strict adherence to 100% natural, botanically derived ingredients."
                },
                {
                  q: "Transaction Types?",
                  a: "Primarily Cash on Delivery (COD) for localized trust and security."
                },
                {
                  q: "Return Protocol?",
                  a: "We offer a sophisticated return window for unopened architectural pieces."
                }
              ].map((faq, index) => (
                <div key={index} className="space-y-4">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1F8D9D]">{faq.q}</p>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
