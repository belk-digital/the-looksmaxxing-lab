/**
 * Builds the server-side Purchase event from the order in the database.
 *
 * The browser only tells us WHICH order (the confirmation-page URL id). Everything
 * that matters (value, products, customer details) is read here from the order, so a
 * visitor can't make us report a purchase that didn't happen or change its value.
 *
 * Mirrors the browser Purchase rules in OrderConfirmationClient.tsx:
 *   - only Stripe orders, or orders whose payment is confirmed captured;
 *   - value = subtotal - coupon discount (shipping and processing fees excluded);
 *   - content_ids are product slugs.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyOrderCookie } from '@/lib/orders/orderCookie'
import { purchaseEventId } from './meta-event-id'
import type { MetaCustomData, MetaUserInput } from './meta-capi'

export type MetaPurchase = {
  eventId: string
  custom: MetaCustomData
  user: MetaUserInput
}

/** Returns null unless the caller proves they placed this order and it is confirmed paid. */
export async function loadMetaPurchase(
  orderRef: string,
  orderAuthCookie: string | undefined,
): Promise<MetaPurchase | null> {
  if (!/^[\w-]{1,64}$/.test(orderRef)) return null
  // Same proof the confirmation page itself requires.
  if (!verifyOrderCookie(orderRef, orderAuthCookie)) return null

  const payload = await getPayload({ config: configPromise })
  let order: any
  try {
    const numericId = parseInt(orderRef, 10)
    order = await payload.findByID({
      collection: 'orders',
      id: Number.isNaN(numericId) ? orderRef : numericId,
      depth: 1,
    })
  } catch {
    return null
  }
  if (!order) return null

  const confirmed = order.paymentMethod === 'stripe' || order.paymentStatus === 'captured'
  if (!confirmed) return null

  const items: any[] = Array.isArray(order.items) ? order.items : []
  if (items.length === 0) return null

  const contentIds = items.map((item, i) => {
    const product = item.product && typeof item.product === 'object' ? item.product : item.productSnapshot
    return String(product?.slug || product?.id || i)
  })

  const value = Math.round(((order.subtotal || 0) - (order.discountTotal || 0)) * 100) / 100
  const owner = order.owner && typeof order.owner === 'object' ? order.owner : null

  return {
    eventId: purchaseEventId(order.orderNumber || String(order.id)),
    custom: {
      value,
      currency: 'USD',
      content_ids: contentIds,
      content_type: 'product',
      num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || undefined,
    },
    user: {
      email: order.guestEmail || owner?.email || null,
      phone: order.customerPhone || null,
      firstName: order.customerFirstName || null,
      lastName: order.customerLastName || null,
      city: order.shippingAddress?.city || null,
      state: order.shippingAddress?.state || null,
      zip: order.shippingAddress?.postalCode || null,
      country: order.shippingAddress?.country || 'US',
    },
  }
}
