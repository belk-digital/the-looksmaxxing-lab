'use server'

import { Resend } from 'resend'

export async function subscribeToNewsletter(email: string) {
  if (!email || typeof email !== 'string') {
    return { success: false, error: 'Valid email is required' }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!resendApiKey || !audienceId) {
    console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID environment variables')
    return { success: false, error: 'Newsletter service is not configured correctly on the server.' }
  }

  const resend = new Resend(resendApiKey)

  try {
    const { data, error } = await resend.contacts.create({
      email: email.toLowerCase(),
      unsubscribed: false,
      audienceId: audienceId,
    })

    if (error) {
      console.error('Resend API Error:', error)
      return { success: false, error: error.message || 'Failed to subscribe to newsletter.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Newsletter subscription error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again later.' }
  }
}
