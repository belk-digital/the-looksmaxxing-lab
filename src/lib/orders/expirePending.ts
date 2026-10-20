import Stripe from 'stripe'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { checkStripePaymentCoversOrder } from '@/lib/orders/payments'

const STRIPE_ORDER_MAX_AGE_HOURS = 24
// Bridge payments happen on another site and are confirmed by a retrying webhook, so allow longer.
const BRIDGE_ORDER_MAX_AGE_HOURS = 72

/**
 * Cancels orders that were created at checkout but never paid (declined/abandoned card, customer
 * closed the tab on the bridge's payment page). Unpaid orders are never finalized, so nothing
 * needs reversing: stock, coupons and points are only consumed in finalizeOrder.
 *
 * Safety: before cancelling a Stripe order, Stripe is searched for a succeeded PaymentIntent for
 * it. If one exists the webhook evidently missed it, so the order is finalized instead.
 * A late bridge payment still finalizes a cancelled order (cancelled -> paid is allowed).
 */
export async function expirePendingOrders() {
  const payload = await getPayload({ config: configPromise })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-04-10' as any })

  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
  const result = { cancelled: 0, recovered: 0, skipped: 0, failed: 0 }

  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { status: { equals: 'pending' } },
        { paymentStatus: { equals: 'unpaid' } },
        // Monthly subscription invoices follow their own due-date / lapse rules (see processSubscriptions).
        { orderType: { not_equals: 'subscription_cycle' } },
        { or: [{ isFinalized: { equals: false } }, { isFinalized: { exists: false } }] },
        {
          or: [
            { and: [{ paymentMethod: { equals: 'stripe' } }, { createdAt: { less_than: hoursAgo(STRIPE_ORDER_MAX_AGE_HOURS) } }] },
            { and: [{ paymentMethod: { equals: 'authnet_bridge' } }, { createdAt: { less_than: hoursAgo(BRIDGE_ORDER_MAX_AGE_HOURS) } }] },
          ],
        },
      ],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  for (const order of docs as any[]) {
    try {
      if (order.paymentMethod === 'stripe') {
        let paidIntent: Stripe.PaymentIntent | undefined
        try {
          const found = await stripe.paymentIntents.search({ query: `metadata['orderId']:'${order.id}'`, limit: 10 })
          paidIntent = found.data.find((pi) => pi.status === 'succeeded')
        } catch (searchErr) {
          // Can't prove it wasn't paid, so don't cancel it.
          console.error(`expirePendingOrders: Stripe search failed for order ${order.id}; skipping`, searchErr)
          result.skipped++
          continue
        }

        if (paidIntent) {
          const check = checkStripePaymentCoversOrder(paidIntent, order)
          if (check.ok) {
            const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
            if (await finalizeOrder(order.id, paidIntent.metadata)) {
              result.recovered++
              continue
            }
          }
          // Paid but not recoverable automatically: leave it for a human.
          console.error(`expirePendingOrders: order ${order.id} has a succeeded PaymentIntent that could not be finalized`)
          result.skipped++
          continue
        }
      }

      const notes = Array.isArray(order.notes) ? order.notes : []
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: 'cancelled',
          notes: [...notes, { type: 'internal', note: 'Automatically cancelled: payment was never completed.' }],
        } as any,
        overrideAccess: true,
      })
      result.cancelled++
    } catch (err) {
      result.failed++
      console.error(`expirePendingOrders: failed to process order ${order.id}`, err)
    }
  }

  return { found: docs.length, ...result }
}
