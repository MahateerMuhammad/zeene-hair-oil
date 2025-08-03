import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getValidatedServerEnv } from "../../../lib/env"

const serverEnv = getValidatedServerEnv()
const resend = new Resend(serverEnv.RESEND_API_KEY)

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zeene.contact@gmail.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    console.log('Email sent successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}