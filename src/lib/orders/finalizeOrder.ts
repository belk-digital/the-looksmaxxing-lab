import { getPayload } from 'payload'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import configPromise from '@payload-config'
import { attributeOrder } from '@/lib/affiliates/commission'

/**
 * Atomically flips is_finalized false -> true. Only one concurrent caller (e.g. the Stripe
 * webhook vs. the browser's syncPaymentStatus fallback) can win; everyone else gets false.
 */
async function claimOrder(payload: Payload, id: string | number): Promise<boolean> {
  const db = payload.db as any
  const res: any = await db.drizzle.execute(
    sql`UPDATE "orders" SET "is_finalized" = true WHERE "id" = ${id} AND COALESCE("is_finalized", false) = false RETURNING "id"`,
  )
  const rows = res?.rows ?? res
  return Array.isArray(rows) && rows.length > 0
}

async function releaseClaim(payload: Payload, id: string | number): Promise<void> {
  const db = payload.db as any
  await db.drizzle.execute(sql`UPDATE "orders" SET "is_finalized" = false WHERE "id" = ${id}`)
}

async function recordFailedSteps(payload: Payload, id: string | number, failures: string[]) {
  try {
    const fresh: any = await payload.findByID({ collection: 'orders', id, depth: 0 })
    const notes = Array.isArray(fresh?.notes) ? fresh.notes : []
    await payload.update({
      collection: 'orders',
      id,
      data: {
        notes: [
          ...notes,
          {
            type: 'internal',
            note: `Automatic finalization completed with errors in: ${failures.join(', ')}. Check server logs and reconcile stock/coupon/points/affiliate/email manually.`,
          },
        ],
      } as any,
    })
  } catch (err) {
    console.error('finalizeOrder: could not record failed steps on order', err)
  }
}

/**
 * Centralized post-checkout logic.
 * Safely processes inventory, coupons, user points, and affiliate tracking.
 * Runs its side effects at most once per order.
 *
 * Marking the order paid is the critical step: if it fails nothing else has happened yet, so
 * the claim is released and false is returned so the caller (Stripe / WordPress) can retry.
 * Once the order is paid, the remaining steps are isolated from each other and failures are
 * logged and noted on the order rather than retried, since re-running them would double-apply.
 */
export async function finalizeOrder(orderId: string | number, paymentIntentMetadata?: any, skipPaymentStatusUpdate = false) {
  try {
    const payload = await getPayload({ config: configPromise })
    const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId
    const idToUse = isNaN(numericId as number) ? orderId : numericId

    const order = await payload.findByID({
      collection: 'orders',
      id: idToUse,
      depth: 0,
    })

    if (!order) {
      console.error(`finalizeOrder: Order ${orderId} not found`)
      return false
    }

    // Prevent duplicate finalization
    if ((order as any).isFinalized) {
      console.warn(`finalizeOrder: Order ${orderId} already finalized. Skipping.`)
      return true
    }

    // Claim atomically; losing the race means another caller is already finalizing.
    const claimed = await claimOrder(payload, idToUse)
    if (!claimed) {
      console.warn(`finalizeOrder: Order ${orderId} was claimed by another caller. Skipping.`)
      return true
    }

    // 1. Mark Order as Paid (unless it's a manual payment awaiting funds)
    if (!skipPaymentStatusUpdate && order.paymentStatus !== 'captured') {
      try {
        await payload.update({
          collection: 'orders',
          id: idToUse,
          data: {
            status: 'paid',
            paymentStatus: 'captured',
          },
        })
      } catch (err) {
        console.error(`finalizeOrder: failed to mark order ${orderId} paid; releasing claim so it can be retried`, err)
        try {
          await releaseClaim(payload, idToUse)
        } catch (releaseErr) {
          console.error(`finalizeOrder: could not release claim on order ${orderId}`, releaseErr)
        }
        return false
      }
      // Keep the in-memory copy in sync so everything below (the invoice email in
      // particular) reflects the update instead of the stale pre-finalization values.
      order.status = 'paid'
      order.paymentStatus = 'captured'
    }

    const failures: string[] = []
    const runStep = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn()
      } catch (err) {
        failures.push(name)
        console.error(`finalizeOrder: step "${name}" failed for order ${orderId}`, err)
      }
    }

    // 2. Decrement Inventory
    await runStep('inventory', async () => {
      if (!order.items || !Array.isArray(order.items)) return
      for (const item of order.items) {
        const productId = item.product && typeof item.product === 'object' ? item.product.id : item.product
        if (!productId) continue
        const productDoc = await payload.findByID({ collection: 'products', id: productId })
        if (productDoc) {
          const qty = item.quantity || 1
          const newStock = Math.max(0, (productDoc.stock || 0) - qty)
          await payload.update({ collection: 'products', id: productId, data: { stock: newStock } })
        }
      }
    })

    // 3. Update Coupon Usage & Deduct Store Credit
    await runStep('coupon', async () => {
      if (!order.couponCode) return
      const coupons = await payload.find({ collection: 'coupons', where: { code: { equals: order.couponCode } }, overrideAccess: true })
      if (coupons.docs.length === 0) return
      const coupon = coupons.docs[0]

      const updateData: any = {
        usageCount: (coupon.usageCount || 0) + 1,
      }

      // remainingBalance is stored in cents; order.discountTotal is in dollars.
      if (coupon.type === 'store_credit' && typeof coupon.remainingBalance === 'number') {
        updateData.remainingBalance = Math.max(0, coupon.remainingBalance - Math.round((order.discountTotal || 0) * 100))
      }

      await payload.update({
        collection: 'coupons',
        id: coupon.id,
        data: updateData,
        overrideAccess: true,
      })
    })

    // 4. Deduct User Points and Clear Cart
    await runStep('points-and-cart', async () => {
      if (order.owner) {
        const userId = typeof order.owner === 'object' ? order.owner.id : order.owner
        const user = await payload.findByID({ collection: 'users', id: userId })

        let currentPoints = user.maxxPoints || 0
        if (order.redeemedPoints && order.redeemedPoints > 0) {
          currentPoints = Math.max(0, currentPoints - order.redeemedPoints)
        }

        await payload.update({
          collection: 'users',
          id: userId,
          data: { maxxPoints: currentPoints },
        })

        const carts = await payload.find({ collection: 'carts', where: { user: { equals: userId } } })
        if (carts.docs.length > 0) {
          await payload.update({ collection: 'carts', id: carts.docs[0].id, data: { items: [] } })
        }
      } else if (paymentIntentMetadata?.cartId) {
        await payload.update({ collection: 'carts', id: paymentIntentMetadata.cartId, data: { items: [] } })
      }
    })

    // 5. Affiliate Attribution (awaited so it isn't dropped when a serverless invocation ends)
    await runStep('affiliate', async () => {
      const affiliateId = paymentIntentMetadata?.affiliateId
      const clickId = paymentIntentMetadata?.clickId
      if (affiliateId || order.couponCode) {
        await attributeOrder(order as any, affiliateId || null, order.couponCode || null, clickId || null)
      }
    })

    // 6. Send Email
    await runStep('email', async () => {
      let customerEmail = order.guestEmail
      if (!customerEmail && order.owner) {
        const userDoc: any = typeof order.owner === 'object' ? order.owner : await payload.findByID({ collection: 'users', id: order.owner })
        customerEmail = userDoc.email
      }
      if (customerEmail) {
        const { generateOrderInvoiceHtml } = await import('@/lib/emails/generateOrderEmail')
        const invoiceHtml = await generateOrderInvoiceHtml(order, payload)

        await payload.sendEmail({
          to: customerEmail,
          bcc: 'support@longeviaresearch.com',
          subject: `Order Confirmation #${order.orderNumber || order.id}`,
          html: invoiceHtml,
        })
      }
    })

    if (failures.length > 0) {
      await recordFailedSteps(payload, idToUse, failures)
    }

    return true
  } catch (error) {
    console.error('Error in finalizeOrder:', error)
    return false
  }
}
