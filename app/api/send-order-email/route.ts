import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { sanitizeInput, validateEmail, checkRateLimit } from "../../../lib/security"

// Use the working API key directly
const resend = new Resend('re_ZZEC9iu7_LDuQgZyoDJfFeQUKbDf6S656')

interface OrderEmailData {
  type: 'new_order' | 'order_approved' | 'order_rejected'
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  productName: string
  productPrice: number
  quantity: number
  totalAmount: number
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP, 10, 60000)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body: OrderEmailData = await request.json()
    
    // Validate required fields
    if (!body.type || !body.orderId || !body.customerName || !body.customerEmail) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email
    if (!validateEmail(body.customerEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedCustomerName = sanitizeInput(body.customerName)
    const sanitizedProductName = sanitizeInput(body.productName || '')
    const sanitizedAddress = sanitizeInput(body.customerAddress || '')
    const sanitizedPhone = sanitizeInput(body.customerPhone || '')

    const {
      type,
      orderId,
      customerEmail,
      productPrice,
      quantity,
      totalAmount
    } = body

    // Use sanitized values
    const customerName = sanitizedCustomerName
    const customerPhone = sanitizedPhone
    const customerAddress = sanitizedAddress
    const productName = sanitizedProductName

    if (type === 'new_order') {
      // Send email to admin about new order
      const { data, error } = await resend.emails.send({
        from: "no-reply@zeene.store",
        to: ["zeene.contact@gmail.com"],
        subject: `New Order Received - ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1F8D9D 0%, #3E7346 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Order Received!</h1>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #1B1B1B; margin-bottom: 20px;">Order Details</h2>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong style="color: #1F8D9D;">Order ID:</strong>
                <p style="margin: 5px 0 0 0; color: #333; font-family: monospace;">${orderId}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong style="color: #1F8D9D;">Product:</strong>
                <p style="margin: 5px 0 0 0; color: #333;">${productName}</p>
                <p style="margin: 5px 0 0 0; color: #666;">Quantity: ${quantity} × PKR ${productPrice.toFixed(0)} = PKR ${totalAmount.toFixed(0)}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong style="color: #1F8D9D;">Customer Information:</strong>
                <p style="margin: 5px 0 0 0; color: #333;"><strong>Name:</strong> ${customerName}</p>
                <p style="margin: 5px 0 0 0; color: #333;"><strong>Email:</strong> ${customerEmail}</p>
                <p style="margin: 5px 0 0 0; color: #333;"><strong>Phone:</strong> ${customerPhone}</p>
                <p style="margin: 5px 0 0 0; color: #333;"><strong>Address:</strong> ${customerAddress}</p>
              </div>
              
              <div style="background: #FDBA2D; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #1B1B1B; font-weight: bold;">
                  Please review and approve this order in your admin dashboard.
                </p>
              </div>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #1B1B1B; color: white;">
              <p style="margin: 0;">ZEENE Hair Oil - Admin Notification</p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.error('Failed to send new order email:', error)
        throw new Error(`Failed to send new order email: ${JSON.stringify(error)}`)
      }

      console.log('New order email sent successfully:', data)

    } else if (type === 'order_approved') {
      // Send approval email to customer
      const { data, error } = await resend.emails.send({
        from: "no-reply@zeene.store",
        to: [customerEmail],
        subject: `Order Approved - ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1F8D9D 0%, #3E7346 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Order Approved!</h1>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #1B1B1B;">Hi ${customerName},</h2>
              
              <p style="color: #333; line-height: 1.6;">
                Great news! Your order has been approved and will be processed for delivery.
              </p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3E7346;">
                <h3 style="color: #1F8D9D; margin-top: 0;">Order Summary:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${orderId}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Product:</strong> ${productName}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${quantity}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Total Amount:</strong> PKR ${totalAmount.toFixed(0)}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Payment:</strong> Cash on Delivery</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1F8D9D; margin-top: 0;">Delivery Information:</h3>
                <p style="margin: 5px 0; color: #333;"><strong>Address:</strong> ${customerAddress}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> ${customerPhone}</p>
              </div>
              
              <div style="background: #3E7346; padding: 15px; border-radius: 8px; color: white; text-align: center;">
                <p style="margin: 0; font-weight: bold;">
                  Your order will be delivered within 2-3 business days. Our team will contact you before delivery.
                </p>
              </div>
              
              <p style="color: #333; line-height: 1.6; margin-top: 20px;">
                If you have any questions, feel free to contact us:
              </p>
              
              <ul style="color: #333; line-height: 1.6;">
                <li>Email: <a href="mailto:zeene.contact@gmail.com" style="color: #1F8D9D;">zeene.contact@gmail.com</a></li>
                <li>WhatsApp: <a href="https://wa.me/923241715470" style="color: #25D366;">+92 324 1715470</a></li>
                <li>Instagram: <a href="https://www.instagram.com/zeene.store" style="color: #1F8D9D;">@zeene.store</a></li>
              </ul>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #1B1B1B; color: white;">
              <p style="margin: 0 0 10px 0;">ZEENE Hair Oil - Healthy Hair Starts Here</p>
              <p style="margin: 0; color: #FDBA2D;">Thank you for choosing ZEENE! 💚</p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.error('Failed to send approval email:', error)
        throw new Error(`Failed to send approval email: ${JSON.stringify(error)}`)
      }

      console.log('Approval email sent successfully:', data)

    } else if (type === 'order_rejected') {
      // Send rejection email to customer
      const { data, error } = await resend.emails.send({
        from: "no-reply@zeene.store",
        to: [customerEmail],
        subject: `Order Update - ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1F8D9D 0%, #3E7346 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Order Update</h1>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: #1B1B1B;">Hi ${customerName},</h2>
              
              <p style="color: #333; line-height: 1.6;">
                We regret to inform you that we're unable to process your recent order at this time.
              </p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #1F8D9D; margin-top: 0;">Order Details:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${orderId}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Product:</strong> ${productName}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${quantity}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> PKR ${totalAmount.toFixed(0)}</p>
              </div>
              
              <p style="color: #333; line-height: 1.6;">
                This could be due to product availability or delivery constraints in your area. 
                Please feel free to contact us for more information or to place a new order.
              </p>
              
              <div style="background: #1F8D9D; padding: 15px; border-radius: 8px; color: white; text-align: center;">
                <p style="margin: 0; font-weight: bold;">
                  We apologize for any inconvenience and appreciate your understanding.
                </p>
              </div>
              
              <p style="color: #333; line-height: 1.6; margin-top: 20px;">
                Contact us for assistance:
              </p>
              
              <ul style="color: #333; line-height: 1.6;">
                <li>Email: <a href="mailto:zeene.contact@gmail.com" style="color: #1F8D9D;">zeene.contact@gmail.com</a></li>
                <li>WhatsApp: <a href="https://wa.me/923241715470" style="color: #25D366;">+92 324 1715470</a></li>
                <li>Instagram: <a href="https://www.instagram.com/zeene.store" style="color: #1F8D9D;">@zeene.store</a></li>
              </ul>
            </div>
            
            <div style="padding: 20px; text-align: center; background: #1B1B1B; color: white;">
              <p style="margin: 0 0 10px 0;">ZEENE Hair Oil - We Value Your Business</p>
              <p style="margin: 0; color: #FDBA2D;">Thank you for your interest in ZEENE!</p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.error('Failed to send rejection email:', error)
        throw new Error(`Failed to send rejection email: ${JSON.stringify(error)}`)
      }

      console.log('Rejection email sent successfully:', data)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully" 
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to send email. Please try again.",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}