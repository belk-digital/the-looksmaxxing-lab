import { headers } from 'next/headers'
import crypto from 'crypto'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { orderTotalCents } from '@/lib/orders/payments'
import { alertAdmin } from '@/lib/orders/alerts'

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
      // Deliberately does not log the expected signature, headers or body: a valid HMAC for
      // a known body in the logs is enough to forge a request.
      console.error('Cross-site payment webhook signature verification failed.', {
        hasSignature: !!signature,
        rawBodyLength: rawBody.length,
      })
      return new Response('Webhook Error: invalid signature', { status: 400 })
    }

    let event: CrossSitePaymentEvent
    try {
      event = JSON.parse(rawBody) as CrossSitePaymentEvent
    } catch {
      return new Response('Webhook Error: malformed body', { status: 400 })
    }

    if (event.status === 'succeeded' && event.orderId) {
      const payload = await getPayload({ config: configPromise })
      const order = await payload.findByID({
        collection: 'orders',
        id: isNaN(Number(event.orderId)) ? event.orderId : Number(event.orderId),
        depth: 0,
      }).catch(() => null)

      if (!order) {
        console.error(`Cross-site payment webhook: order ${event.orderId} not found`)
        return new Response('Webhook Error: order not found', { status: 404 })
      }

      // Already paid and fully processed: acknowledge (so WordPress stops retrying). If this is a DIFFERENT
      // card transaction than the one we recorded, the customer paid twice - tell the admin.
      if (order.paymentStatus === 'captured' && order.isFinalized) {
        if (event.txnId && order.paymentTxnId && String(event.txnId) !== String(order.paymentTxnId)) {
          await alertAdmin('⚠️ Duplicate card payment for an already-paid order', {
            'Order ID': event.orderId,
            'First transaction': order.paymentTxnId,
            'New transaction': event.txnId,
            'Paid (cents)': event.amountCents,
            Note: 'The customer appears to have paid this order twice. One payment may need a refund.',
          })
        }
        return new Response('Webhook handled successfully', { status: 200 })
      }

      const isSubscriptionOrder = order.orderType === 'subscription_first' || order.orderType === 'subscription_cycle'
      if (order.paymentMethod !== 'authnet_bridge') {
        // A subscriber who normally pays by Zelle may still pay a recurring invoice by card from the pay page.
        if (isSubscriptionOrder && order.paymentMethod === 'zelle' && order.paymentStatus !== 'captured') {
          await payload.update({ collection: 'orders', id: order.id, data: { paymentMethod: 'authnet_bridge' } as any, overrideAccess: true })
          order.paymentMethod = 'authnet_bridge'
        } else {
          console.error(`Cross-site payment webhook: order ${event.orderId} is a "${order.paymentMethod}" order, not authnet_bridge`)
          return new Response('Webhook Error: order is not a bridge order', { status: 400 })
        }
      }

      const paidCents = Number(event.amountCents)
      const expectedCents = orderTotalCents(order)

      // Only an underpayment blocks finalization. WooCommerce / the Authorize.net gateway can
      // legitimately report a slightly higher total (e.g. a gateway surcharge), and refusing
      // those would leave a customer who really paid with an unfinalized order. Overpayments
      // are finalized and flagged for a human instead.
      if (!Number.isFinite(paidCents) || paidCents < expectedCents) {
        console.error(`Cross-site payment webhook: paid ${event.amountCents} cents is less than order ${event.orderId} total ${expectedCents} cents`)
        await alertAdmin('⚠️ Bridge payment is less than order total', {
          'Order ID': event.orderId,
          'Transaction': event.txnId,
          'Paid (cents)': event.amountCents,
          'Order total (cents)': expectedCents,
        })
        return new Response('Webhook Error: amount is less than order total', { status: 400 })
      }
      if (paidCents > expectedCents) {
        console.warn(`Cross-site payment webhook: paid ${paidCents} cents exceeds order ${event.orderId} total ${expectedCents} cents; finalizing anyway`)
        await alertAdmin('ℹ️ Bridge payment is more than order total', {
          'Order ID': event.orderId,
          'Transaction': event.txnId,
          'Paid (cents)': paidCents,
          'Order total (cents)': expectedCents,
        })
      }

      try {
        let finalized: boolean
        if (order.orderType === 'subscription_cycle') {
          // A recurring invoice: mark it paid. The order hook then updates the subscription and emails the receipt.
          const { markSubscriptionOrderPaid } = await import('@/lib/subscriptions/service')
          finalized = await markSubscriptionOrderPaid(payload, order.id, { txnId: event.txnId })
        } else {
          const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
          finalized = await finalizeOrder(event.orderId, {
            source: 'authnet_bridge',
            txnId: event.txnId,
            affiliateId: event.affiliateId,
            clickId: event.clickId,
          })
          // Remember the card transaction so a second payment for the same order can be detected.
          if (finalized && event.txnId) {
            try {
              await payload.update({ collection: 'orders', id: order.id, data: { paymentTxnId: String(event.txnId) } as any, overrideAccess: true })
            } catch (e) {
              // Bookkeeping only: never let it turn a successful payment into a retry.
              console.warn('Could not store payment transaction id', e)
            }
          }
        }
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
