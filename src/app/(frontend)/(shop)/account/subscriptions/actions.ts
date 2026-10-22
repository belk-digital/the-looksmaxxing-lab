'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import {
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  skipNextMonth,
  orderNextMonthNow,
  reactivateSubscription,
  updateSubscriptionAddress,
  setSubscriptionPaymentMethod,
  type AddressInput,
} from '@/lib/subscriptions/service'
import { findOpenInvoice, payUrl } from '@/lib/subscriptions/invoices'

type Id = string | number
type Failure = { ok: false; error: string }

/** Every action starts here: who is asking, and is this subscription really theirs? */
async function authorize(subscriptionId: string): Promise<{ payload: Awaited<ReturnType<typeof getPayload>>; sub: any } | Failure> {
  const user = await getPayloadUser()
  if (!user) return { ok: false, error: 'Please log in to manage your subscription.' }
  const payload = await getPayload({ config: configPromise })
  const id = Number(subscriptionId)
  if (!Number.isInteger(id)) return { ok: false, error: 'Subscription not found.' }
  const sub = await getSubscription(payload, id)
  const ownerId = sub && (typeof sub.owner === 'object' && sub.owner ? sub.owner.id : sub.owner)
  if (!sub || String(ownerId) !== String(user.id)) return { ok: false, error: 'Subscription not found.' }
  return { payload, sub }
}

const refresh = (id: string) => {
  revalidatePath('/account/subscriptions')
  revalidatePath(`/account/subscriptions/${id}`)
}

/** The pay-page path (with its secret) of an order, so the browser can go and pay it. */
async function payPathFor(payload: Awaited<ReturnType<typeof getPayload>>, orderId: Id): Promise<string | null> {
  const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!order?.invoiceToken) return null
  return payUrl(order.id, order.invoiceToken).replace(/^https?:\/\/[^/]+/, '')
}

export async function pauseSubscriptionAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await pauseSubscription(auth.payload, auth.sub.id)
  refresh(subscriptionId)
  return result
}

export async function resumeSubscriptionAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await resumeSubscription(auth.payload, auth.sub.id)
  refresh(subscriptionId)
  if (result.ok && result.orderId) {
    return { ok: true as const, payPath: await payPathFor(auth.payload, result.orderId), message: 'Welcome back! Your next invoice is ready.' }
  }
  if (result.ok && result.scheduledFor) {
    const day = new Date(result.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    return { ok: true as const, payPath: null, message: `Welcome back! Your next invoice will be emailed on ${day}.` }
  }
  return result.ok ? { ok: true as const, payPath: null, message: 'Welcome back!' } : result
}

export async function skipMonthAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await skipNextMonth(auth.payload, auth.sub.id)
  refresh(subscriptionId)
  return result
}

/** "Order next delivery now": creates the invoice immediately and returns where to pay it. */
export async function orderNextMonthAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await orderNextMonthNow(auth.payload, auth.sub.id)
  refresh(subscriptionId)
  if (!result.ok) return result
  return { ok: true as const, payPath: await payPathFor(auth.payload, result.orderId) }
}

export async function reactivateSubscriptionAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await reactivateSubscription(auth.payload, auth.sub.id)
  refresh(subscriptionId)
  if (!result.ok) return result
  return { ok: true as const, payPath: await payPathFor(auth.payload, result.orderId) }
}

/** "Pay now" for an invoice that already exists. */
export async function payCurrentInvoiceAction(subscriptionId: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const open = await findOpenInvoice(auth.payload, auth.sub.id)
  if (!open) return { ok: false as const, error: 'There is no unpaid invoice right now.' }
  return { ok: true as const, payPath: await payPathFor(auth.payload, open.id) }
}

export async function updateAddressAction(subscriptionId: string, address: AddressInput) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await updateSubscriptionAddress(auth.payload, auth.sub.id, address)
  refresh(subscriptionId)
  return result
}

export async function setPaymentMethodAction(subscriptionId: string, method: string) {
  const auth = await authorize(subscriptionId)
  if ('ok' in auth) return auth
  const result = await setSubscriptionPaymentMethod(auth.payload, auth.sub.id, method)
  refresh(subscriptionId)
  return result
}
