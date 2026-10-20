'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Stripe from 'stripe'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { signOrderCookie, verifyOrderCookie } from '@/lib/orders/orderCookie'
import { buildBridgeHandoff } from '@/lib/payments/bridge'
import { checkStripePaymentCoversOrder, STRIPE_OPEN_STATUSES } from '@/lib/orders/payments'
import { alertAdmin } from '@/lib/orders/alerts'
import { computeOrderPricing } from '@/lib/checkout/pricing'
import { loadShippingMethods, loadActiveProcessingFees } from '@/lib/checkout/data'
import { getSubscriptionSettings, allowedPaymentMethods } from '@/lib/subscriptions/settings'
import { createSubscriptionForCheckout, syncSubscription } from '@/lib/subscriptions/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10' as any,
})

export async function getShippingMethods() {
  const payload = await getPayload({ config: configPromise })
  return loadShippingMethods(payload)
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
  return loadActiveProcessingFees(payload)
}

export async function createPaymentIntent(
  items: any[], 
  shippingMethodName: string,
  couponCode: string | undefined,
  isRedeemingPoints: boolean,
  previousPaymentIntentId?: string
) {
  const payload = await getPayload({ config: configPromise })


  const pricing = await computeOrderPricing(payload, { items, shippingMethodName, couponCode, isRedeemingPoints })
  if (pricing.error !== undefined) {
    return { error: pricing.error, updatedItems: pricing.updatedItems, priceChanged: pricing.priceChanged }
  }
  const { total } = pricing

  // Subscription plans are paid by card through the Authorize.net bridge or by Zelle - never with Stripe.
  if (pricing.planMonths != null) {
    return { error: 'Subscriptions are paid by card (Authorize.net) or Zelle.' }
  }

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
    const metadata: Record<string, string> = {}
    if (affiliateRef) metadata.affiliateId = affiliateRef
    if (clickCookie) metadata.clickId = clickCookie

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    })

    // The cart/shipping/coupon/points changed, so the previous intent is obsolete. Cancel it
    // (only if it was never bound to an order) rather than leaving it dangling in Stripe.
    if (previousPaymentIntentId && previousPaymentIntentId.startsWith('pi_') && previousPaymentIntentId !== paymentIntent.id) {
      try {
        const previous = await stripe.paymentIntents.retrieve(previousPaymentIntentId)
        if (!previous.metadata?.orderId && STRIPE_OPEN_STATUSES.includes(previous.status)) {
          await stripe.paymentIntents.cancel(previous.id)
        }
      } catch (cancelErr) {
        console.warn('Could not cancel previous PaymentIntent:', cancelErr)
      }
    }

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

  const pricing = await computeOrderPricing(payload, { items, shippingMethodName, couponCode, isRedeemingPoints })
  if (pricing.error !== undefined) {
    return { error: pricing.error, updatedItems: pricing.updatedItems, priceChanged: pricing.priceChanged }
  }
  const {
    subtotal, discountAmount, finalShipping, feeTotal, appliedFees, tax,
    pointsToRedeem, total, liveItems, productsById,
  } = pricing

  // --- Validate how this order is being paid -------------------------------------------
  // paymentIntentId is client-supplied; it selects the payment path, so every path is
  // checked against the server-computed total and the admin-enabled payment methods.
  const isFreeOrder = total <= 0
  const isStripeIntent = !!paymentIntentId && !['free_order', 'manual', 'authnet_bridge'].includes(paymentIntentId)
  const effectivePaymentMethod = paymentMethod || 'stripe'
  let stripeIntentToBind: Stripe.PaymentIntent | null = null

  // --- Subscription plan rules ----------------------------------------------------------
  const isPlan = pricing.planMonths != null
  let subscriptionPaymentMethod: 'authnet_bridge' | 'zelle' = 'authnet_bridge'
  if (isPlan) {
    if (!formData?.acceptSubscriptionTerms) {
      return { error: 'Please accept the subscription terms to continue.' }
    }
    if (isStripeIntent) {
      return { error: 'Subscriptions are paid by card (Authorize.net) or Zelle.' }
    }
    const allowed = allowedPaymentMethods(await getSubscriptionSettings(payload))
    if (allowed.includes(effectivePaymentMethod as any)) {
      subscriptionPaymentMethod = effectivePaymentMethod as 'authnet_bridge' | 'zelle'
    } else if (isFreeOrder && allowed.length > 0) {
      subscriptionPaymentMethod = allowed[0] // a fully-covered first month needs no payment method; pick a default
    } else {
      return { error: 'This payment method is not available for subscriptions. Please choose card or Zelle.' }
    }
  }

  if (!isFreeOrder) {
    if (paymentIntentId === 'free_order') {
      return { error: 'Your order total changed. Please review your cart and try again.' }
    }

    const activeMethodIds = (await getPaymentMethodsSettings()).map((m: any) => m.methodId)
    if (!activeMethodIds.includes(effectivePaymentMethod)) {
      return { error: 'This payment method is no longer available. Please choose another one.' }
    }

    if (paymentIntentId === 'authnet_bridge') {
      if (effectivePaymentMethod !== 'authnet_bridge') {
        return { error: 'Invalid payment method for this order.' }
      }
    } else if (paymentIntentId === 'manual') {
      if (effectivePaymentMethod !== 'zelle') {
        return { error: 'Invalid payment method for this order.' }
      }
    } else if (isStripeIntent) {
      if (effectivePaymentMethod !== 'stripe') {
        return { error: 'Invalid payment method for this order.' }
      }
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
        if (!STRIPE_OPEN_STATUSES.includes(intent.status)) {
          return { error: 'This payment session is no longer valid. Please refresh the page and try again.' }
        }
        if (intent.currency !== 'usd' || intent.amount !== Math.round(total * 100)) {
          return { error: 'Your payment session is out of date. Please wait a moment and try again.' }
        }
        stripeIntentToBind = intent
      } catch (err: any) {
        console.error('Failed to verify PaymentIntent:', err)
        return { error: 'Could not verify your payment session. Please refresh the page and try again.' }
      }
    } else {
      return { error: 'Missing payment information. Please refresh the page and try again.' }
    }
  }

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

    // A subscription belongs to an account (so the customer can pause, skip and pay invoices later)
    if (isPlan && !payloadUserId) {
      return { error: 'Please log in or create an account to start a subscription.' }
    }

    // Format order items for Payload
    const orderItems = items.map((item, idx) => {
      const parsedId = parseInt(String(item.productId), 10)
      const productData = productsById.get(item.productId)
      return {
        product: isNaN(parsedId) ? item.productId : parsedId,
        variant: item.variantSku || 'DEFAULT',
        price: liveItems[idx].priceSnapshot,
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
        ...(isPlan
          ? {
              orderType: 'subscription_first',
              cycleNumber: 1,
              cyclesTotal: pricing.planMonths,
              subscriptionDiscountPercent: pricing.planDiscountPercent,
            }
          : {}),
      } as any
    })

    // Create the subscription (waiting for this first payment) and link it to the order.
    let createdSubscriptionId: string | number | null = null
    if (isPlan) {
      try {
        const cookieJar = await cookies()
        const sub = await createSubscriptionForCheckout(payload, {
          ownerId: payloadUserId as any,
          firstOrderId: order.id,
          planMonths: pricing.planMonths as number,
          discountPercent: pricing.planDiscountPercent as number,
          items: items.map((item) => {
            const parsedId = parseInt(String(item.productId), 10)
            return {
              productId: isNaN(parsedId) ? item.productId : parsedId,
              variantSku: item.variantSku,
              variantTitle: item.variantTitle,
              quantity: item.quantity,
            }
          }),
          paymentMethod: subscriptionPaymentMethod,
          shippingMethod: pricing.shippingMethodName,
          shippingAddress: {
            line1: formData.address,
            line2: formData.apartment || '',
            city: formData.city,
            state: formData.state,
            postalCode: formData.zip,
            country: 'US',
          },
          customerFirstName: formData.firstName,
          customerLastName: formData.lastName,
          customerPhone: formData.phone,
          affiliateId: await findSubscriptionAffiliate(payload, couponCode, cookieJar.get('affiliate_ref')?.value),
          affiliateClickId: cookieJar.get('affiliate_click_id')?.value || null,
          // an "every monthly payment" coupon keeps discounting the later monthly invoices
          recurringCouponCode: pricing.couponApplied && pricing.couponSubscriptionScope === 'every_month' ? pricing.appliedCouponCode : null,
        })
        createdSubscriptionId = sub.id
      } catch (subErr) {
        console.error('Failed to create subscription record; cancelling the new order:', subErr)
        await payload.update({ collection: 'orders', id: order.id, data: { status: 'cancelled' } as any }).catch(() => undefined)
        return { error: 'We could not set up your subscription, and you have not been charged. Please try again.' }
      }
    }

    if (stripeIntentToBind) {
       // A previous attempt with this same intent (e.g. a declined card) left an order behind.
       // Cancel it if it never got paid so abandoned attempts don't pile up as pending orders.
       const previousOrderId = stripeIntentToBind.metadata?.orderId
       if (previousOrderId && String(previousOrderId) !== String(order.id)) {
          try {
             const previousOrder: any = await payload.findByID({
                collection: 'orders',
                id: isNaN(Number(previousOrderId)) ? previousOrderId : Number(previousOrderId),
                depth: 0,
             })
             if (previousOrder && previousOrder.paymentMethod === 'stripe' && previousOrder.status === 'pending' && previousOrder.paymentStatus === 'unpaid' && !previousOrder.isFinalized) {
                await payload.update({ collection: 'orders', id: previousOrder.id, data: { status: 'cancelled' } })
             }
          } catch (prevErr) {
             console.warn(`Could not cancel superseded order ${previousOrderId}:`, prevErr)
          }
       }

       await stripe.paymentIntents.update(stripeIntentToBind.id, {
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

    // A first month that was already fully covered (coupon/points): the subscription starts right away.
    if (isPlan && createdSubscriptionId && total <= 0) {
      await syncSubscription(payload, createdSubscriptionId, order.id)
    }

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
      const payload = await getPayload({ config: configPromise })
      const order = await payload.findByID({
        collection: 'orders',
        id: isNaN(Number(orderId)) ? orderId : Number(orderId),
        depth: 0,
      }).catch(() => null)

      if (!order) {
        console.error(`syncPaymentStatus: order ${orderId} not found`)
        return { error: 'Payment verification failed' }
      }

      const check = checkStripePaymentCoversOrder(paymentIntent, order)
      if (!check.ok) {
        console.error(`syncPaymentStatus: PaymentIntent ${paymentIntentId} does not cover order ${orderId}: ${check.reason}`)
        await alertAdmin('⚠️ Payment does not match order', {
          'Order ID': orderId,
          'PaymentIntent': paymentIntentId,
          'Reason': check.reason,
        })
        return { error: 'Payment verification failed' }
      }

      const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
      const finalized = await finalizeOrder(orderId, paymentIntent.metadata)
      return finalized ? { success: true } : { error: 'Failed to finalize order' }
    }
    return { success: false, status: paymentIntent.status }
  } catch (error: any) {
    console.error('Failed to sync payment status:', error)
    return { error: error.message }
  }
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

    // Only the browser that placed the order (signed cookie) or its logged-in owner may start its payment.
    // Otherwise anyone could request hand-offs for other people's order numbers and read the names/emails inside.
    const cookieStore = await cookies()
    let authorized = verifyOrderCookie(String(order.id), cookieStore.get(`order_auth_${order.id}`)?.value)
    if (!authorized) {
      const session = await getServerSession(authOptions)
      if (session?.user?.email && order.owner) {
        const ownerId = typeof order.owner === 'object' ? order.owner.id : order.owner
        const ownerDoc: any = await payload.findByID({ collection: 'users', id: ownerId, depth: 0 }).catch(() => null)
        authorized = !!ownerDoc && ownerDoc.email === session.user.email
      }
    }
    if (!authorized) {
      return { error: 'Order not found' }
    }

    const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com'

    // The bridge echoes affiliateId/clickId back unchanged in the confirmation webhook so attribution still works.
    return buildBridgeHandoff({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountCents,
      email: order.guestEmail || '',
      firstName: order.customerFirstName || '',
      lastName: order.customerLastName || '',
      returnUrl: `${appUrl}/order-confirmation/${order.id}`,
      cancelUrl: `${appUrl}/checkout`,
      affiliateId: cookieStore.get('affiliate_ref')?.value || null,
      clickId: cookieStore.get('affiliate_click_id')?.value || null,
    })
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


// Which affiliate earns commission on every month of a subscription: the owner of the coupon used
// (if any), otherwise the affiliate from the referral cookie - the same rule attributeOrder applies to one-time orders.
async function findSubscriptionAffiliate(
  payload: Awaited<ReturnType<typeof getPayload>>,
  couponCode: string | undefined,
  cookieAffiliateId: string | undefined,
): Promise<string | number | null> {
  if (couponCode) {
    const res = await payload.find({ collection: 'affiliates', where: { couponCode: { equals: couponCode } }, limit: 1, depth: 0 })
    if (res.docs[0]) return res.docs[0].id
  }
  if (cookieAffiliateId) {
    const id = isNaN(Number(cookieAffiliateId)) ? cookieAffiliateId : Number(cookieAffiliateId)
    const aff = await payload.findByID({ collection: 'affiliates', id, depth: 0 }).catch(() => null)
    if (aff) return aff.id
  }
  return null
}
