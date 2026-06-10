'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Stripe from 'stripe'
import { verifyCoupon, getUserMaxxPoints } from '../actions'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
})

export async function getShippingMethods() {
  const payload = await getPayload({ config: configPromise })
  const zones = await payload.find({
    collection: 'shippingzones',
    limit: 1,
    depth: 0,
  })

  if (zones.docs.length > 0 && zones.docs[0].methods) {
    return zones.docs[0].methods
  }
  
  // Fallback if none exist
  return [
    { method: 'Standard Shipping', price: 0, estimatedDays: 5 },
    { method: 'Express Shipping', price: 25, estimatedDays: 2 }
  ]
}

export async function getActiveProcessingFees() {
  const payload = await getPayload({ config: configPromise })
  const fees = await payload.find({
    collection: 'processing-fees',
    where: { isActive: { equals: true } },
    depth: 0,
    overrideAccess: true,
  })
  return fees.docs
}

export async function createPaymentIntent(
  items: any[], 
  shippingMethodName: string,
  couponCode: string | undefined,
  isRedeemingPoints: boolean
) {
  const payload = await getPayload({ config: configPromise })


  // Validate items, check stock, and calculate subtotal securely on server
  let subtotal = 0;
  for (const item of items) {
     const productRes = await payload.findByID({ collection: 'products', id: item.productId, depth: 0 })
     if (!productRes) {
        return { error: `Product not found: ${item.productId}` }
     }
     if ((productRes.stock || 0) < item.quantity) {
        return { error: `Insufficient stock for ${productRes.name || 'item'}. Only ${productRes.stock} left.` }
     }
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

  const methods = await getShippingMethods()
  const selectedMethod = methods.find((m: any) => m.method === shippingMethodName) || methods[0]
  
  // Validate minOrderAmount for the selected shipping method
  if ((selectedMethod as any)?.minOrderAmount && (selectedMethod as any).minOrderAmount > 0) {
    if (subtotal < (selectedMethod as any).minOrderAmount) {
       return { error: `Your cart subtotal must be at least $${(selectedMethod as any).minOrderAmount} to use ${selectedMethod.method}.` }
    }
  }

  const shippingCost = selectedMethod?.price || 0

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const finalShipping = freeShipping ? 0 : shippingCost
  
  // Calculate dynamic processing fees
  const activeFees = await getActiveProcessingFees()
  let feeTotal = 0
  activeFees.forEach((fee: any) => {
    if (!fee.isOptional) {
      if (fee.type === 'percentage') {
        feeTotal += subtotalAfterDiscount * (fee.amount / 100)
      } else if (fee.type === 'fixed_amount') {
        feeTotal += (fee.amount / 100)
      }
    }
  })

  const tax = 0 // Statically 0 now, handled by ProcessingFees
  const totalBeforePoints = subtotalAfterDiscount + finalShipping + tax + feeTotal

  let pointsToRedeem = 0;
  if (isRedeemingPoints) {
    const availablePoints = await getUserMaxxPoints()
    pointsToRedeem = Math.min(availablePoints, totalBeforePoints)
  }

  const total = totalBeforePoints - pointsToRedeem
  const amountInCents = Math.round(total * 100)

  if (amountInCents < 50) {
      return { error: 'Order total too low for Stripe processing (minimum $0.50)' }
  }

  // Check for affiliate ref cookie
  const cookieStore = await cookies()
  const affiliateRef = cookieStore.get('affiliate_ref')?.value

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        affiliateId: affiliateRef || null
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
  shippingMethodName: string,
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

  const methods = await getShippingMethods()
  const selectedMethod = methods.find((m: any) => m.method === shippingMethodName) || methods[0]

  // Validate minOrderAmount for the selected shipping method
  if ((selectedMethod as any)?.minOrderAmount && (selectedMethod as any).minOrderAmount > 0) {
    if (subtotal < (selectedMethod as any).minOrderAmount) {
       return { error: `Your cart subtotal must be at least $${(selectedMethod as any).minOrderAmount} to use ${selectedMethod.method}.` }
    }
  }

  const shippingCost = selectedMethod?.price || 0

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const finalShipping = freeShipping ? 0 : shippingCost
  
  // Calculate dynamic processing fees
  const activeFees = await getActiveProcessingFees()
  let feeTotal = 0
  const appliedFees: any[] = []
  
  activeFees.forEach((fee: any) => {
    if (!fee.isOptional) {
      const amount = fee.type === 'percentage' 
        ? subtotalAfterDiscount * (fee.amount / 100)
        : (fee.amount / 100)
      
      feeTotal += amount
      appliedFees.push({
        feeId: fee.id,
        feeName: fee.name,
        amount: Math.round(amount * 100) // cents for Payload array
      })
    }
  })

  const tax = 0 // Statically 0 now, handled by ProcessingFees
  const totalBeforePoints = subtotalAfterDiscount + finalShipping + tax + feeTotal

  let pointsToRedeem = 0;
  if (isRedeemingPoints) {
    const availablePoints = await getUserMaxxPoints()
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
        feeTotal: Math.round(feeTotal * 100),
        appliedFees,
        total: total,
        shippingMethod: shippingMethodName,
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

export async function syncPaymentStatus(paymentIntentId: string, orderId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status === 'succeeded') {
      const payload = await getPayload({ config: configPromise })
      const numericId = parseInt(orderId, 10)
      const idToUse = isNaN(numericId) ? orderId : numericId

      const order = await payload.findByID({
        collection: 'orders',
        id: idToUse,
        depth: 0,
      })

      // Only update if it hasn't been updated by the webhook yet
      if (order.paymentStatus !== 'captured') {
        await payload.update({
          collection: 'orders',
          id: idToUse,
          data: {
            status: 'paid',
            paymentStatus: 'captured',
          }
        })

        // Also decrement stock
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

        // Clear user's Payload cart instantly
        if (order.owner) {
          const userId = typeof order.owner === 'object' ? order.owner.id : order.owner
          const carts = await payload.find({ collection: 'carts', where: { user: { equals: userId } } });
          if (carts.docs.length > 0) {
            await payload.update({ collection: 'carts', id: carts.docs[0].id, data: { items: [] } });
          }
        }
      }
      return { success: true }
    }
    return { success: false, status: paymentIntent.status }
  } catch (error: any) {
    console.error('Failed to sync payment status:', error)
    return { error: error.message }
  }
}

