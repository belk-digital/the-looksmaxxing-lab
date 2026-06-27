import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { attributeOrder } from '@/lib/affiliates/commission'

/**
 * Centralized post-checkout logic.
 * Safely processes inventory, coupons, user points, and affiliate tracking.
 * This should be called exactly once when an order is finalized.
 */
export async function finalizeOrder(orderId: string | number, paymentIntentMetadata?: any, skipPaymentStatusUpdate: boolean = false) {
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

    // Mark as finalized immediately to prevent race conditions
    await payload.update({
      collection: 'orders',
      id: idToUse,
      data: { isFinalized: true } as any,
    })

    // 1. Mark Order as Paid (unless it's a manual payment awaiting funds)
    if (!skipPaymentStatusUpdate && order.paymentStatus !== 'captured') {
      await payload.update({
        collection: 'orders',
        id: idToUse,
        data: {
          status: 'paid',
          paymentStatus: 'captured',
        }
      })
    }

    // 2. Decrement Inventory
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const productId = item.product && typeof item.product === 'object' ? item.product.id : item.product;
        if (productId) {
          const productDoc = await payload.findByID({ collection: 'products', id: productId });
          if (productDoc) {
            const qty = item.quantity || 1;
            const newStock = Math.max(0, (productDoc.stock || 0) - qty);
            await payload.update({ collection: 'products', id: productId, data: { stock: newStock } });
          }
        }
      }
    }

    // 3. Update Coupon Usage & Deduct Store Credit
    if (order.couponCode) {
      const coupons = await payload.find({ collection: 'coupons', where: { code: { equals: order.couponCode } }, overrideAccess: true })
      if (coupons.docs.length > 0) {
        const coupon = coupons.docs[0]

        const updateData: any = {
          usageCount: (coupon.usageCount || 0) + 1
        }

        if (coupon.type === 'store_credit' && typeof coupon.remainingBalance === 'number') {
          updateData.remainingBalance = Math.max(0, coupon.remainingBalance - (order.discountTotal || 0))
        }

        await payload.update({
          collection: 'coupons',
          id: coupon.id,
          data: updateData,
          overrideAccess: true
        })
      }
    }

    // 4. Deduct User Points and Clear Cart
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
          data: { maxxPoints: currentPoints }
      })

      const carts = await payload.find({ collection: 'carts', where: { user: { equals: userId } } });
      if (carts.docs.length > 0) {
        await payload.update({ collection: 'carts', id: carts.docs[0].id, data: { items: [] } });
      }
    } else if (paymentIntentMetadata?.cartId) {
      await payload.update({ collection: 'carts', id: paymentIntentMetadata.cartId, data: { items: [] } });
    }

    // 5. Affiliate Attribution
    const affiliateId = paymentIntentMetadata?.affiliateId;
    const clickId = paymentIntentMetadata?.clickId;

    if (affiliateId || order.couponCode) {
      attributeOrder(
        order as any,
        affiliateId || null,
        order.couponCode || null,
        clickId || null
      ).catch(console.error)
    }

    // 6. Send Email
    try {
        let customerEmail = order.guestEmail;
        if (!customerEmail && order.owner) {
            const userDoc = typeof order.owner === 'object' ? order.owner : await payload.findByID({ collection: 'users', id: order.owner });
            customerEmail = userDoc.email;
        }
        if (customerEmail) {
            const { generateOrderInvoiceHtml } = await import('@/lib/emails/generateOrderEmail');
            const invoiceHtml = await generateOrderInvoiceHtml(order, payload);

            await payload.sendEmail({
                to: customerEmail,
                bcc: 'support@thelooksmaxxinglab.com',
                subject: `Order Confirmation #${order.orderNumber || order.id}`,
                html: invoiceHtml,
            })
        }
    } catch (err) {
        console.error('Failed to send confirmation email', err)
    }



    return true

  } catch (error) {
    console.error('Error in finalizeOrder:', error)
    return false
  }
}
