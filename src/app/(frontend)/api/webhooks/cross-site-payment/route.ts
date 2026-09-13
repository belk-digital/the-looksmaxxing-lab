import { headers } from 'next/headers'
import crypto from 'crypto'

const webhookSecret = process.env.CROSS_SITE_PAYMENT_SECRET

interface CrossSitePaymentEvent {
  orderId: string
  amountCents: number
  status: 'succeeded' | 'failed'
  txnId?: string
  affiliateId?: string | null
  clickId?: string | null
}

function isValidSignature(rawBody: string, signature: string | null): boolean {
  if (!webhookSecret || !signature) return false

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)

  if (expectedBuf.length !== signatureBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, signatureBuf)
}

// Called by the longeviabeauty.com bridge plugin once the Authorize.net charge for a
// pending 'authnet_bridge' order resolves. This is the source of truth for finalizing
// the order — the browser redirect back to /order-confirmation is UX only.
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const headersList = await headers()
    const signature = headersList.get('x-longevia-signature')

    if (!webhookSecret) {
      console.error('CROSS_SITE_PAYMENT_SECRET is not configured')
      return new Response('Webhook not configured', { status: 500 })
    }

    if (!isValidSignature(rawBody, signature)) {
      // Temporary diagnostics for the WordPress-side signature mismatch we're chasing -
      // remove once resolved. Logs enough to compare against what WordPress computed,
      // without logging the secret itself.
      const expected = webhookSecret ? crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex') : null
      console.error('Cross-site payment webhook signature verification failed.', {
        receivedSignature: signature,
        expectedSignature: expected,
        rawBodyLength: rawBody.length,
        rawBody,
        headers: Object.fromEntries(headersList.entries()),
      })
      return new Response('Webhook Error: invalid signature', { status: 400 })
    }

    const event = JSON.parse(rawBody) as CrossSitePaymentEvent

    if (event.status === 'succeeded' && event.orderId) {
      try {
        const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
        const finalized = await finalizeOrder(event.orderId, {
          source: 'authnet_bridge',
          txnId: event.txnId,
          affiliateId: event.affiliateId,
          clickId: event.clickId,
        })
        // finalizeOrder swallows its own errors and resolves to false rather than
        // throwing, so this has to be checked explicitly - otherwise a genuine
        // failure here would still be reported back as 200, telling WordPress not
        // to retry a delivery that never actually finalized anything.
        if (!finalized) {
          console.error(`finalizeOrder returned false for order ${event.orderId}`)
          return new Response('Webhook Error: failed to finalize order', { status: 500 })
        }
        console.log(`Successfully finalized order ${event.orderId} via cross-site payment webhook.`)
      } catch (updateErr) {
        console.error(`Failed to finalize order ${event.orderId}:`, updateErr)
        return new Response('Webhook Error: failed to finalize order', { status: 500 })
      }
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error: any) {
    console.error('Cross-site payment webhook error:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
}
