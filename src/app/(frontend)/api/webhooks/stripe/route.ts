import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { checkStripePaymentCoversOrder } from '@/lib/orders/payments'
import { alertAdmin } from '@/lib/orders/alerts'

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
        const payload = await getPayload({ config: configPromise })
        const order = await payload.findByID({
          collection: 'orders',
          id: isNaN(Number(orderId)) ? orderId : Number(orderId),
          depth: 0,
        }).catch(() => null)

        if (!order) {
          // Retrying won't help; acknowledge and flag it for a human.
          console.error(`Stripe webhook: order ${orderId} not found for PaymentIntent ${paymentIntent.id}`)
          await alertAdmin('⚠️ Stripe payment received for unknown order', {
            'Order ID': orderId,
            'PaymentIntent': paymentIntent.id,
            'Amount (cents)': paymentIntent.amount,
          })
          return new Response('Order not found', { status: 200 })
        }

        const check = checkStripePaymentCoversOrder(paymentIntent, order)
        if (!check.ok) {
          console.error(`Stripe webhook: PaymentIntent ${paymentIntent.id} does not cover order ${orderId}: ${check.reason}`)
          await alertAdmin('⚠️ Payment does not match order', {
            'Order ID': orderId,
            'PaymentIntent': paymentIntent.id,
            'Reason': check.reason,
          })
          // Not finalized on purpose. 200 so Stripe doesn't retry a payment that will never match.
          return new Response('Payment does not match order', { status: 200 })
        }

        const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
        const finalized = await finalizeOrder(orderId, paymentIntent.metadata)
        if (!finalized) {
          console.error(`Failed to finalize order ${orderId} in Payload via webhook.`)
          // Non-2xx so Stripe retries; finalizeOrder releases its claim when it fails early.
          return new Response('Failed to finalize order', { status: 500 })
        }
        console.log(`Successfully finalized order ${orderId} in Payload via webhook.`)
      }
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
}
