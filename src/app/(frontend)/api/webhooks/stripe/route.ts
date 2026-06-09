import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature') as string

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret as string)
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`)
      
      const orderId = paymentIntent.metadata?.orderId
      if (orderId) {
         try {
            const payload = await getPayload({ config: configPromise })
            const numericId = parseInt(orderId, 10)
            const idToUse = isNaN(numericId) ? orderId : numericId

            const order = await payload.findByID({
               collection: 'orders',
               id: idToUse,
               depth: 0,
            })

            await payload.update({
               collection: 'orders',
               id: idToUse,
               data: {
                  status: 'paid',
                  paymentStatus: 'captured',
               }
            })
            console.log(`Successfully updated order ${orderId} to paid/captured in Payload.`)

            // 1. Decrement Inventory
            if (order.items && Array.isArray(order.items)) {
               for (const item of order.items) {
                  const productId = typeof item.product === 'object' ? item.product.id : item.product;
                  if (productId) {
                     const productDoc = await payload.findByID({ collection: 'products', id: productId });
                     if (productDoc) {
                        const newStock = Math.max(0, (productDoc.stock || 0) - (item.quantity || 1));
                        await payload.update({ collection: 'products', id: productId, data: { stock: newStock } });
                     }
                  }
               }
            }

            // 2. Increment Coupon Usage
            if (order.couponCode) {
               const coupons = await payload.find({ collection: 'coupons', where: { code: { equals: order.couponCode } } })
               if (coupons.docs.length > 0) {
                  const coupon = coupons.docs[0]
                  await payload.update({
                     collection: 'coupons',
                     id: coupon.id,
                     data: { usageCount: (coupon.usageCount || 0) + 1 }
                  })
               }
            }

            // 3. User Points and 4. Clear Cart
            if (order.owner) {
               const userId = typeof order.owner === 'object' ? order.owner.id : order.owner
               const user = await payload.findByID({ collection: 'users', id: userId })
               
               let currentPoints = user.purityPoints || 0
               // Deduct redeemed
               if (order.redeemedPoints && order.redeemedPoints > 0) {
                  currentPoints = Math.max(0, currentPoints - order.redeemedPoints)
               }
               // Award earned (1 point per $10 spent)
               const earnedPoints = Math.floor((order.subtotal || 0) / 10)
               currentPoints += earnedPoints

               await payload.update({
                  collection: 'users',
                  id: userId,
                  data: { purityPoints: currentPoints }
               })

               // Clear Cart
               const carts = await payload.find({ collection: 'carts', where: { user: { equals: userId } } });
               if (carts.docs.length > 0) {
                  await payload.update({ collection: 'carts', id: carts.docs[0].id, data: { items: [] } });
               }
            } else if (paymentIntent.metadata?.cartId) {
               // Clear Guest Cart
               await payload.update({ collection: 'carts', id: paymentIntent.metadata.cartId, data: { items: [] } });
            }

            // 5. Affiliate Conversions
            const affiliateId = paymentIntent.metadata?.affiliateId;
            if (affiliateId) {
               const numericAffiliateId = parseInt(affiliateId, 10)
               if (!isNaN(numericAffiliateId)) {
                  await payload.create({
                     collection: 'affiliate-conversions',
                     data: {
                        affiliate: numericAffiliateId,
                        order: idToUse as any,
                        orderSubtotal: order.subtotal || 0,
                        commissionAmount: Math.round((order.subtotal || 0) * 100 * 0.10), // 10% in cents
                        status: 'pending',
                     }
                  })
               }
            }

            // 6. Order Confirmation Email
            try {
               let customerEmail = order.guestEmail;
               if (!customerEmail && order.owner) {
                  const userDoc = typeof order.owner === 'object' ? order.owner : await payload.findByID({ collection: 'users', id: order.owner });
                  customerEmail = userDoc.email;
               }
               if (customerEmail) {
                  await payload.sendEmail({
                     to: customerEmail,
                     subject: `Order Confirmation #${order.orderNumber || order.id}`,
                     html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                           <h1 style="color: #000; letter-spacing: -1px;">Thank you for your order!</h1>
                           <p style="color: #666; font-size: 16px;">We have received your order <strong>#${order.orderNumber || order.id}</strong> and are preparing it for shipment.</p>
                           <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                           <p style="color: #000; font-weight: bold;">Order Total: $${(order.total || 0).toFixed(2)}</p>
                           <p style="color: #666; font-size: 14px; margin-top: 30px;">The Looksmaxxing Lab</p>
                        </div>
                     `,
                  })
               }
            } catch (err) {
               console.error('Failed to send confirmation email', err)
            }
         } catch (updateErr) {
            console.error(`Failed to update order ${orderId} in Payload:`, updateErr)
         }
      }
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
}
