'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Stripe from 'stripe'
import { verifyCoupon, getUserPurityPoints } from '../actions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
})

export async function createPaymentIntent(
  items: any[], 
  shippingMethod: 'standard' | 'express',
  couponCode: string | undefined,
  isRedeemingPoints: boolean
) {
  const payload = await getPayload({ config: configPromise })

  // Validate items and calculate subtotal securely on server
  let subtotal = 0;
  for (const item of items) {
     subtotal += item.priceSnapshot * item.quantity
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (couponCode) {
    const couponRes = await verifyCoupon(couponCode, subtotal, items)
    if (couponRes.valid) {
      discountAmount = couponRes.discount || 0
      freeShipping = couponRes.freeShipping || false
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const shippingCost = shippingMethod === 'standard' ? 0 : 25
  const finalShipping = freeShipping ? 0 : shippingCost
  const tax = subtotalAfterDiscount * 0.08
  const totalBeforePoints = subtotalAfterDiscount + finalShipping + tax

  let pointsToRedeem = 0;
  if (isRedeemingPoints) {
    const availablePoints = await getUserPurityPoints()
    pointsToRedeem = Math.min(availablePoints, totalBeforePoints)
  }

  const total = totalBeforePoints - pointsToRedeem
  const amountInCents = Math.round(total * 100)

  if (amountInCents < 50) {
      return { error: 'Order total too low for Stripe processing (minimum $0.50)' }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      }
    })

    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: total }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return { error: error.message }
  }
}

export async function createPayloadOrder(
  items: any[], 
  shippingMethod: 'standard' | 'express',
  couponCode: string | undefined,
  isRedeemingPoints: boolean,
  formData: any,
  paymentIntentId: string,
  userId?: string
) {
  const payload = await getPayload({ config: configPromise })

  let subtotal = 0;
  for (const item of items) {
     subtotal += item.priceSnapshot * item.quantity
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (couponCode) {
    const couponRes = await verifyCoupon(couponCode, subtotal, items)
    if (couponRes.valid) {
      discountAmount = couponRes.discount || 0
      freeShipping = couponRes.freeShipping || false
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const shippingCost = shippingMethod === 'standard' ? 0 : 25
  const finalShipping = freeShipping ? 0 : shippingCost
  const tax = subtotalAfterDiscount * 0.08
  const totalBeforePoints = subtotalAfterDiscount + finalShipping + tax

  let pointsToRedeem = 0;
  if (isRedeemingPoints) {
    const availablePoints = await getUserPurityPoints()
    pointsToRedeem = Math.min(availablePoints, totalBeforePoints)
  }

  const total = totalBeforePoints - pointsToRedeem

  try {
    // Attempt to map clerk userId to Payload User
    let payloadUserId = null
    if (userId) {
       const userRes = await payload.find({
          collection: 'users',
          where: { clerkUserId: { equals: userId } }
       })
       if (userRes.docs.length > 0) {
          payloadUserId = userRes.docs[0].id
       }
    }

    // Format order items for Payload
    const orderItems = items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }))

    // Create pending Order in Payload
    const order = await payload.create({
      collection: 'orders',
      data: {
        owner: payloadUserId,
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerPhone: formData.phone,
        guestEmail: formData.email,
        shippingAddress: {
          line1: formData.address,
          line2: formData.apartment || '',
          city: formData.city,
          state: formData.state,
          postalCode: formData.zip,
          country: 'US', // default
        },
        items: orderItems,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal: subtotal,
        discountTotal: discountAmount,
        redeemedPoints: pointsToRedeem,
        shippingTotal: finalShipping,
        taxTotal: tax,
        feeTotal: 0,
        total: total,
        shippingMethod: shippingMethod,
        couponCode: couponCode || '',
      }
    })

    // Update Stripe PaymentIntent with the Order ID
    await stripe.paymentIntents.update(paymentIntentId, {
       metadata: {
          orderId: String(order.id)
       }
    })

    return { orderId: String(order.id) }
  } catch (error: any) {
    console.error('Failed to create Payload order:', error)
    return { error: error.message }
  }
}
