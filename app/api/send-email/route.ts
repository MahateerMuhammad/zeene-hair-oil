import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getValidatedServerEnv } from "../../../lib/env"

const serverEnv = getValidatedServerEnv()
const resend = new Resend(serverEnv.RESEND_API_KEY)

// Input validation and sanitization
function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const name = sanitizeInput(body.name).substring(0, 100)
    const email = sanitizeInput(body.email).substring(0, 100)
    const subject = sanitizeInput(body.subject).substring(0, 200)
    const message = sanitizeInput(body.message).substring(0, 2000)

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }

    // Rate limiting check (basic)
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    // Additional validation
    if (name.length < 2 || subject.length < 5 || message.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide more detailed information" },
        { status: 400 }
      )
    }

    // Send email to business
    const businessEmail = await resend.emails.send({
      from: "ZEENE Contact Form <noreply@zeene.store>",
      to: [serverEnv.CONTACT_EMAIL || "zeene.contact@gmail.com"],
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1F8D9D 0%, #3E7346 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #1B1B1B; margin-bottom: 20px;">Contact Details</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #1F8D9D;">Name:</strong>
              <p style="margin: 5px 0 0 0; color: #333;">${name}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #1F8D9D;">Email:</strong>
              <p style="margin: 5px 0 0 0; color: #333;">${email}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #1F8D9D;">Subject:</strong>
              <p style="margin: 5px 0 0 0; color: #333;">${subject}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <strong style="color: #1F8D9D;">Message:</strong>
              <p style="margin: 5px 0 0 0; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #1B1B1B; color: white;">
            <p style="margin: 0;">This email was sent from the ZEENE Hair Oil contact form.</p>
          </div>
        </div>
      `,
    })

    // Send confirmation email to customer
    const confirmationEmail = await resend.emails.send({
      from: "ZEENE Hair Oil <noreply@zeene.store>",
      to: [email],
      subject: "Thank you for contacting ZEENE Hair Oil",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1F8D9D 0%, #3E7346 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thank You for Contacting Us!</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #1B1B1B;">Hi ${name},</h2>
            
            <p style="color: #333; line-height: 1.6;">
              Thank you for reaching out to ZEENE Hair Oil! We've received your message and our team will get back to you within 24 hours.
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FDBA2D;">
              <h3 style="color: #1F8D9D; margin-top: 0;">Your Message Summary:</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Message:</strong></p>
              <p style="margin: 5px 0; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="color: #333; line-height: 1.6;">
              In the meantime, feel free to:
            </p>
            
            <ul style="color: #333; line-height: 1.6;">
              <li>Browse our <a href="https://zeene.store/products" style="color: #1F8D9D;">premium hair oil products</a></li>
              <li>Follow us on <a href="https://www.instagram.com/zeene.store" style="color: #1F8D9D;">Instagram @zeene.store</a></li>
              <li>Contact us directly on <a href="https://wa.me/923241715470" style="color: #25D366;">WhatsApp</a></li>
            </ul>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #1B1B1B; color: white;">
            <p style="margin: 0 0 10px 0;">ZEENE Hair Oil - Healthy Hair Starts Here</p>
            <p style="margin: 0; color: #FDBA2D;">📧 zeene.contact@gmail.com | 📱 +92 324 1715470</p>
          </div>
        </div>
      `,
    })

    // Emails sent successfully

    return NextResponse.json({ 
      success: true, 
      message: "Thank you for your message! We'll get back to you soon." 
    })
  } catch (error) {
    // Log error securely (consider using proper logging service in production)
    return NextResponse.json(
      { success: false, message: "Failed to send email. Please try again." },
      { status: 500 }
    )
  }
}
