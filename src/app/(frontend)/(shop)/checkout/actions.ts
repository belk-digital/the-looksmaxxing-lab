'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Stripe from 'stripe'
import { verifyCoupon, getUserMaxxPoints } from '../actions'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

function signOrderCookie(orderId: string): string {
  const secret = process.env.PAYLOAD_SECRET || 'fallback-secret'
  return crypto.createHmac('sha256', secret).update(`order_${orderId}`).digest('hex')
}

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
    { method: 'Express Shipping', price: 2500, estimatedDays: 2 }
  ]
}

export async function getPaymentMethodsSettings() {
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({ slug: 'payment-methods-settings' })

  if (settings?.methods && settings.methods.length > 0) {
    return settings.methods.filter((m: any) => m.isActive)
  }

  // Fallback if the global hasn't been saved yet
  return [
    { methodId: 'stripe', label: 'Credit / Debit Card', description: '', isActive: true },
    { methodId: 'zelle', label: 'Zelle', description: '', isActive: true },
    {
      methodId: 'authnet_bridge',
      label: 'Credit Card (via Longevia Beauty)',
      description: "You'll be securely redirected to our partner checkout at Longevia Beauty to complete your card payment, then brought back here automatically once it's done.",
      isActive: true,
    },
  ]
}

export async function getActiveProcessingFees() {
  const payload = await getPayload({ config: configPromise })
  const fees = await payload.find({
    collection: 'processing-fees',
    depth: 0,
    overrideAccess: true,
    limit: 100,
  })
  return fees.docs.filter((f: any) => f.isActive)
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
  let pricesChanged = false;
  const { revalidateCartPrices } = await import('@/app/(frontend)/actions/cart')
  const liveItems = await revalidateCartPrices(items)

  for (let i = 0; i < items.length; i++) {
     const item = items[i]
     const liveItem = liveItems[i]
     
     const itemPrice = Number(item.priceSnapshot)
     const livePrice = Number(liveItem.priceSnapshot)
     
     if (itemPrice !== livePrice && !(Number.isNaN(itemPrice) && Number.isNaN(livePrice))) {
       pricesChanged = true
     }

     const productRes = await payload.findByID({ collection: 'products', id: (!isNaN(Number(item.productId)) ? Number(item.productId) : item.productId) as any, depth: 0 })
     if (!productRes) {
        return { error: `Product not found: ${item.productId}` }
     }
     if ((productRes.stock || 0) < item.quantity) {
        return { error: `Insufficient stock for ${productRes.name || 'item'}. Only ${productRes.stock} left.` }
     }
     subtotal += liveItem.priceSnapshot * item.quantity
  }

  if (pricesChanged) {
    return { 
      error: 'Prices for some items have updated since they were added to your cart. We have refreshed your cart with the latest live prices.', 
      updatedItems: liveItems,
      priceChanged: true
    }
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

  const shippingCost = (selectedMethod?.price || 0) / 100

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const isExpressShipping = shippingMethodName.toLowerCase().includes('express')
  const finalShipping = (freeShipping && !isExpressShipping) ? 0 : shippingCost
  
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

  // Check for affiliate ref cookie and block self-referral
  const cookieStore = await cookies()
  let affiliateRef = cookieStore.get('affiliate_ref')?.value || null
  let clickCookie = cookieStore.get('affiliate_click_id')?.value || null

  if (affiliateRef) {
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const userRes = await payload.find({
        collection: 'users',
        where: { email: { equals: session.user.email } },
        limit: 1,
        overrideAccess: true,
      })
      const currentUser = userRes.docs[0]
      if (currentUser) {
        const affRes = await payload.findByID({
          collection: 'affiliates',
          id: isNaN(Number(affiliateRef)) ? affiliateRef : Number(affiliateRef),
        }).catch(() => null)
        if (affRes) {
          const affUserId = typeof affRes.user === 'object' && affRes.user !== null ? affRes.user.id : affRes.user
          if (String(affUserId) === String(currentUser.id)) {
            affiliateRef = null
            clickCookie = null
          }
        }
      }
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        affiliateId: affiliateRef || null,
        clickId: clickCookie || null
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
  _userId?: string,
  paymentMethod?: string
) {
  const payload = await getPayload({ config: configPromise })

  let subtotal = 0;
  let pricesChanged = false;
  const { revalidateCartPrices } = await import('@/app/(frontend)/actions/cart')
  const liveItems = await revalidateCartPrices(items)

  const productsCache = new Map()

  for (let i = 0; i < items.length; i++) {
     const item = items[i]
     const liveItem = liveItems[i]
     
     if (item.priceSnapshot !== liveItem.priceSnapshot) {
       pricesChanged = true
     }

     const productRes = await payload.findByID({ collection: 'products', id: (!isNaN(Number(item.productId)) ? Number(item.productId) : item.productId) as any, depth: 0 })
     if (!productRes) {
        return { error: `Product not found: ${item.productId}` }
     }
     productsCache.set(item.productId, productRes)
     if ((productRes.stock || 0) < item.quantity) {
        return { error: `Insufficient stock for ${productRes.name || 'item'}. Only ${productRes.stock} left.` }
     }
     subtotal += liveItem.priceSnapshot * item.quantity
  }

  if (pricesChanged) {
    return { 
      error: 'Prices for some items have updated since they were added to your cart. We have refreshed your cart with the latest live prices.', 
      updatedItems: liveItems,
      priceChanged: true
    }
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

  const shippingCost = (selectedMethod?.price || 0) / 100

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const isExpressShipping = shippingMethodName.toLowerCase().includes('express')
  const finalShipping = (freeShipping && !isExpressShipping) ? 0 : shippingCost
  
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
    // Verify authenticated user server-side instead of trusting client
    let payloadUserId = null
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
       const userRes = await payload.find({
          collection: 'users',
          where: { email: { equals: session.user.email } }
       })
       if (userRes.docs.length > 0) {
          payloadUserId = userRes.docs[0].id
          
          // Save the address to their profile if it doesn't already exist
          if (formData.address && formData.city && formData.zip) {
            const existingAddress = await payload.find({
              collection: 'addresses',
              where: {
                and: [
                  { user: { equals: payloadUserId } },
                  { line1: { equals: formData.address } },
                  { postalCode: { equals: formData.zip } },
                ]
              }
            })

            if (existingAddress.docs.length === 0) {
              const allUserAddresses = await payload.find({
                collection: 'addresses',
                where: { user: { equals: payloadUserId } }
              })
              const isFirst = allUserAddresses.docs.length === 0

              await payload.create({
                collection: 'addresses',
                data: {
                  user: payloadUserId,
                  label: isFirst ? 'Default Address' : 'Additional Address',
                  firstName: formData.firstName || '',
                  lastName: formData.lastName || '',
                  line1: formData.address,
                  line2: formData.apartment || '',
                  city: formData.city,
                  state: formData.state,
                  postalCode: formData.zip,
                  country: 'US',
                  phone: formData.phone || '',
                  isDefaultShipping: isFirst,
                  isDefaultBilling: isFirst
                }
              })
            }
          }
       }
    }

    // Format order items for Payload
    const orderItems = items.map(item => {
      const parsedId = parseInt(String(item.productId), 10)
      const productData = productsCache.get(item.productId)
      return {
        product: isNaN(parsedId) ? item.productId : parsedId,
        variant: item.variantSku || 'DEFAULT',
        price: item.priceSnapshot,
        quantity: item.quantity,
        productSnapshot: productData || null
      }
    })

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
        status: total <= 0 ? 'paid' : 'pending',
        paymentStatus: total <= 0 ? 'captured' : 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountAmount * 100) / 100,
        redeemedPoints: Math.round(pointsToRedeem * 100) / 100,
        shippingTotal: Math.round(finalShipping * 100) / 100,
        taxTotal: Math.round(tax * 100) / 100,
        feeTotal: Math.round(feeTotal * 100),
        appliedFees,
        total: Math.round(total * 100) / 100,
        shippingMethod: shippingMethodName,
        couponCode: couponCode || '',
        paymentMethod: paymentMethod || 'stripe',
      } as any
    })

    // Update Stripe PaymentIntent with the Order ID (unless it's a free order)
    if (paymentIntentId && paymentIntentId !== 'free_order' && paymentIntentId !== 'manual' && paymentIntentId !== 'authnet_bridge') {
       await stripe.paymentIntents.update(paymentIntentId, {
          metadata: {
             orderId: String(order.id)
          }
       })
    } else if (total <= 0) {
       // Instantly finalize the free order (deduct inventory, use coupons, give points)
       const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
       await finalizeOrder(order.id, {
          cartId: undefined, // user cart cleared in finalizeOrder, guest cart is in formData guestCart
          affiliateId: (await cookies()).get('affiliate_ref')?.value,
          clickId: (await cookies()).get('affiliate_click_id')?.value,
       })
    } else if (paymentIntentId === 'manual') {
       // Finalize the order but leave it as unpaid (so email sends with manual instructions)
       const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
       await finalizeOrder(order.id, {
          cartId: undefined,
          affiliateId: (await cookies()).get('affiliate_ref')?.value,
          clickId: (await cookies()).get('affiliate_click_id')?.value,
       }, true)
    }
    // paymentIntentId === 'authnet_bridge': leave the order pending/unpaid here.
    // It gets finalized later by the cross-site-payment webhook once longeviabeauty.com
    // confirms the Authorize.net charge (see createCrossSitePaymentRedirect below).

    // Set a cookie to authorize the order confirmation page
    const cookieStore = await cookies()
    cookieStore.set(`order_auth_${order.id}`, signOrderCookie(String(order.id)), {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
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

    // Verify the PaymentIntent actually belongs to this order
    if (paymentIntent.metadata?.orderId !== orderId) {
      console.error(`syncPaymentStatus: PaymentIntent ${paymentIntentId} does not belong to order ${orderId}`)
      return { error: 'Payment verification failed' }
    }

    if (paymentIntent.status === 'succeeded') {
      const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
      await finalizeOrder(orderId, paymentIntent.metadata)
      return { success: true }
    }
    return { success: false, status: paymentIntent.status }
  } catch (error: any) {
    console.error('Failed to sync payment status:', error)
    return { error: error.message }
  }
}

function signCrossSitePayload(encodedPayload: string): string {
  const secret = process.env.CROSS_SITE_PAYMENT_SECRET
  if (!secret) {
    throw new Error('CROSS_SITE_PAYMENT_SECRET is not configured')
  }
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('hex')
}

// Hands off a pending 'authnet_bridge' order to longeviabeauty.com to be paid via the
// Authorize.net gateway already configured there (WooCommerce). The order is only
// finalized later, when the cross-site-payment webhook confirms the charge succeeded.
export async function createCrossSitePaymentRedirect(orderId: string) {
  try {
    const bridgeUrl = process.env.LONGEVIA_BEAUTY_BRIDGE_URL
    if (!bridgeUrl) {
      return { error: 'Cross-site payment is not configured' }
    }

    const payload = await getPayload({ config: configPromise })
    const order = await payload.findByID({
      collection: 'orders',
      id: isNaN(Number(orderId)) ? orderId : Number(orderId),
      depth: 0,
    })

    if (!order) {
      return { error: 'Order not found' }
    }
    if (order.paymentMethod !== 'authnet_bridge') {
      return { error: 'Order is not set up for this payment method' }
    }
    if (order.paymentStatus === 'captured') {
      return { error: 'Order is already paid' }
    }

    const amountCents = Math.round((order.total || 0) * 100)
    if (amountCents < 50) {
      return { error: 'Order total too low to process' }
    }

    const ownerEmail = typeof order.owner === 'object' && order.owner !== null ? order.owner.email : undefined
    const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com'
    const cookieStore = await cookies()

    const body = {
      orderId: String(order.id),
      orderNumber: order.orderNumber,
      amountCents,
      currency: 'usd',
      email: order.guestEmail || ownerEmail || '',
      firstName: order.customerFirstName || '',
      lastName: order.customerLastName || '',
      returnUrl: `${appUrl}/order-confirmation/${order.id}`,
      cancelUrl: `${appUrl}/checkout`,
      // Passed through opaquely; the WordPress bridge must echo these back unchanged
      // in the confirmation webhook so affiliate attribution can still be applied.
      affiliateId: cookieStore.get('affiliate_ref')?.value || null,
      clickId: cookieStore.get('affiliate_click_id')?.value || null,
      nonce: crypto.randomBytes(16).toString('hex'),
      ts: Date.now(),
    }

    // Sign one opaque, base64url-encoded blob rather than the object itself.
    // WordPress receives it as separate POST fields and re-serializing form-decoded
    // strings back into JSON there wouldn't reliably reproduce the exact bytes we
    // hashed here (number vs. string types, key order) — so the signed material has
    // to travel as a single untouched string instead of being reconstructed on the
    // other end.
    const encodedPayload = Buffer.from(JSON.stringify(body)).toString('base64url')
    const sig = signCrossSitePayload(encodedPayload)

    return { redirectUrl: bridgeUrl, fields: { payload: encodedPayload, sig } }
  } catch (error: any) {
    console.error('Failed to create cross-site payment redirect:', error)
    return { error: error.message }
  }
}

export async function notifyAdminFailedPayment(orderId: string, errorMessage: string) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const order = await payload.findByID({
      collection: 'orders',
      id: isNaN(Number(orderId)) ? orderId : Number(orderId),
      depth: 0,
    })

    if (!order) return { success: false }

    const customerEmail = (typeof order.owner === 'object' && order.owner !== null ? order.owner.email : order.guestEmail) || 'N/A'
    const total = `$${(order.total || 0).toFixed(2)}`

    const html = `
      <h2>Payment Failed Alert</h2>
      <p>A customer attempted to checkout but their payment failed.</p>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Customer Email:</strong> ${customerEmail}</li>
        <li><strong>Total:</strong> ${total}</li>
        <li><strong>Error Message:</strong> ${errorMessage}</li>
      </ul>
      <p>You can check their cart/order details in the Payload Admin panel to see what they were trying to buy.</p>
    `

    await payload.sendEmail({
      to: 'support@longeviaresearch.com',
      subject: `⚠️ Payment Failed - Order ${orderId}`,
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send admin failure notification:', error)
    return { success: false }
  }
}

