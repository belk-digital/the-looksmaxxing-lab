import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email, firstName } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!process.env.RESEND_AUDIENCE_ID) {
      console.error('RESEND_AUDIENCE_ID is not configured in environment variables.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Add contact to Resend Audience
    const { data, error } = await resend.contacts.create({
      email,
      firstName,
      audienceId: process.env.RESEND_AUDIENCE_ID,
      unsubscribed: false,
    })

    if (error) {
      console.error('Resend API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to the newsletter', data },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Newsletter Subscription Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
