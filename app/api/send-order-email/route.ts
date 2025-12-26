import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { sanitizeInput, validateEmail, checkRateLimit } from "../../../lib/security"

// Use the working API key directly
import { getValidatedServerEnv } from "../../../lib/env"

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
    // Validate env vars at request time
    const serverEnv = getValidatedServerEnv()
    const resend = new Resend(serverEnv.RESEND_API_KEY)
    
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
        subject: `New Order - ${productName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 580px; margin: 60px auto; background: white; border: 1px solid #E8E8E8;">
              
              <!-- Header -->
              <div style="padding: 60px 48px 48px; border-bottom: 1px solid #F0F0F0;">
                <p style="margin: 0 0 12px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.4em; text-transform: uppercase; color: #999;">Admin</p>
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 900; color: #000; letter-spacing: -0.03em; line-height: 1.1;">New Order</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 48px;">
                
                <!-- Order Number -->
                <div style="margin-bottom: 48px;">
                  <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Order Number</p>
                  <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 15px; color: #000; font-weight: 500;">${orderId}</p>
                </div>
                
                <!-- Product -->
                <div style="margin-bottom: 48px; padding: 32px; background: #FAFAFA;">
                  <p style="margin: 0 0 16px 0; font-size: 17px; color: #000; font-weight: 500;">${productName}</p>
                  <p style="margin: 0 0 20px 0; font-size: 13px; color: #666; line-height: 1.6;">${quantity} × PKR ${productPrice.toFixed(0)}</p>
                  <div style="padding-top: 20px; border-top: 1px solid #E8E8E8;">
                    <p style="margin: 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999;">Total</p>
                    <p style="margin: 8px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #000;">PKR ${totalAmount.toFixed(0)}</p>
                  </div>
                </div>
                
                <!-- Customer -->
                <div style="margin-bottom: 48px;">
                  <p style="margin: 0 0 20px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Customer</p>
                  <div style="line-height: 1.8;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #000;">${customerName}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${customerEmail}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${customerPhone}</p>
                    <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.6;">${customerAddress}</p>
                  </div>
                </div>
                
              </div>
              
              <!-- Footer -->
              <div style="padding: 32px 48px; border-top: 1px solid #F0F0F0; background: #FAFAFA;">
                <p style="margin: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999; text-align: center;">ZEENE</p>
              </div>
              
            </div>
          </body>
          </html>
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
        subject: `Order Approved - ${orderId}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 580px; margin: 60px auto; background: white; border: 1px solid #E8E8E8;">
              
              <!-- Header -->
              <div style="padding: 60px 48px 48px; border-bottom: 1px solid #F0F0F0;">
                <div style="width: 48px; height: 48px; background: #000; margin: 0 0 24px 0; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px; font-weight: 300;">✓</span>
                </div>
                <p style="margin: 0 0 12px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.4em; text-transform: uppercase; color: #999;">Approved</p>
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 900; color: #000; letter-spacing: -0.03em; line-height: 1.1;">Order Confirmed</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 48px;">
                
                <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.7; color: #666;">
                  Hi ${customerName}, your order has been approved and will be delivered within 5-7 business days.
                </p>
                
                <!-- Order Details -->
                <div style="margin-bottom: 48px; padding: 32px; background: #FAFAFA;">
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Order</p>
                    <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #000;">${orderId}</p>
                  </div>
                  
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Product</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px; color: #000; font-weight: 500;">${productName}</p>
                    <p style="margin: 0; font-size: 13px; color: #666;">Quantity: ${quantity}</p>
                  </div>
                  
                  <div style="padding-top: 24px; border-top: 1px solid #E8E8E8;">
                    <p style="margin: 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999;">Total</p>
                    <p style="margin: 8px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #000;">PKR ${totalAmount.toFixed(0)}</p>
                  </div>
                </div>
                
                <!-- Delivery -->
                <div style="margin-bottom: 48px;">
                  <p style="margin: 0 0 16px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Delivery</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; line-height: 1.6;">${customerAddress}</p>
                  <p style="margin: 0; font-size: 13px; color: #666;">${customerPhone}</p>
                </div>
                
                <!-- Contact -->
                <div style="padding-top: 32px; border-top: 1px solid #F0F0F0;">
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">Questions?</p>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;"><a href="mailto:zeene.contact@gmail.com" style="color: #000; text-decoration: none;">zeene.contact@gmail.com</a></p>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;"><a href="https://wa.me/923241715470" style="color: #000; text-decoration: none;">+92 324 1715470</a></p>
                  <p style="margin: 0; font-size: 13px; color: #666;"><a href="https://www.instagram.com/zeene.store" style="color: #000; text-decoration: none;">@zeene.store</a></p>
                </div>
                
              </div>
              
              <!-- Footer -->
              <div style="padding: 32px 48px; border-top: 1px solid #F0F0F0; background: #FAFAFA;">
                <p style="margin: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999; text-align: center;">ZEENE</p>
              </div>
              
            </div>
          </body>
          </html>
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
        subject: `Order Update - ${orderId}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 580px; margin: 60px auto; background: white; border: 1px solid #E8E8E8;">
              
              <!-- Header -->
              <div style="padding: 60px 48px 48px; border-bottom: 1px solid #F0F0F0;">
                <p style="margin: 0 0 12px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.4em; text-transform: uppercase; color: #999;">Update</p>
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 900; color: #000; letter-spacing: -0.03em; line-height: 1.1;">Order Status</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 48px;">
                
                <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.7; color: #666;">
                  Hi ${customerName}, we're unable to process your order at this time due to product availability or delivery constraints.
                </p>
                
                <!-- Order Details -->
                <div style="margin-bottom: 48px; padding: 32px; background: #FAFAFA;">
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Order</p>
                    <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; color: #000;">${orderId}</p>
                  </div>
                  
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999;">Product</p>
                    <p style="margin: 0 0 4px 0; font-size: 15px; color: #000; font-weight: 500;">${productName}</p>
                    <p style="margin: 0; font-size: 13px; color: #666;">Quantity: ${quantity}</p>
                  </div>
                  
                  <div style="padding-top: 24px; border-top: 1px solid #E8E8E8;">
                    <p style="margin: 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999;">Amount</p>
                    <p style="margin: 8px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #000;">PKR ${totalAmount.toFixed(0)}</p>
                  </div>
                </div>
                
                <!-- Contact -->
                <div style="padding-top: 32px; border-top: 1px solid #F0F0F0;">
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #999;">Contact us for assistance</p>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;"><a href="mailto:zeene.contact@gmail.com" style="color: #000; text-decoration: none;">zeene.contact@gmail.com</a></p>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;"><a href="https://wa.me/923241715470" style="color: #000; text-decoration: none;">+92 324 1715470</a></p>
                  <p style="margin: 0; font-size: 13px; color: #666;"><a href="https://www.instagram.com/zeene.store" style="color: #000; text-decoration: none;">@zeene.store</a></p>
                </div>
                
              </div>
              
              <!-- Footer -->
              <div style="padding: 32px 48px; border-top: 1px solid #F0F0F0; background: #FAFAFA;">
                <p style="margin: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #999; text-align: center;">ZEENE</p>
              </div>
              
            </div>
          </body>
          </html>
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