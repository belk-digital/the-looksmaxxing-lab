import crypto from 'crypto'
import type { Payload, PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { computeOrderPricing } from '@/lib/checkout/pricing'
import { getSubscriptionSettings } from './settings'
import { addDays } from './schedule'

/**
 * Monthly invoices. Each month of a subscription is a normal order with orderType "subscription_cycle".
 *
 * Stock model for monthly orders: stock is RESERVED when the invoice is created (finalizeOrder with
 * skipPaymentStatusUpdate, exactly like a Zelle order today) and RELEASED if the unpaid invoice is cancelled
 * (skip, pause, lapse). The `isFinalized` flag on the order means "stock is reserved".
 */

export const SUBSCRIPTION_ORDER_TYPES = ['subscription_first', 'subscription_cycle'] as const

type Id = string | number

const idOf = (v: any): Id | null => (v && typeof v === 'object' ? v.id : v ?? null)

export function serverUrl(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')
}

/** Secret that lets a customer open the pay link for ONE invoice. */
export function newInvoiceToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export function payUrl(orderId: Id, token: string): string {
  return `${serverUrl()}/pay/${orderId}/${token}`
}

export function tokensMatch(expected: string | null | undefined, received: string | null | undefined): boolean {
  if (!expected || !received) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const opts = (req?: PayloadRequest) => (req ? { req } : {})

/** cycleNumber -> when it was paid, for every captured order of this subscription. */
export async function getPaidCycles(payload: Payload, subscriptionId: Id, req?: PayloadRequest): Promise<Map<number, { paidAt: Date; orderId: Id }>> {
  const res = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { subscription: { equals: subscriptionId } },
        { paymentStatus: { equals: 'captured' } },
        { orderType: { in: [...SUBSCRIPTION_ORDER_TYPES] } },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    ...opts(req),
  })
  const out = new Map<number, { paidAt: Date; orderId: Id }>()
  for (const o of res.docs as any[]) {
    const n = Number(o.cycleNumber)
    if (!Number.isFinite(n) || n < 1) continue
    const paidAt = new Date(o.paidAt || o.updatedAt || o.createdAt)
    const existing = out.get(n)
    if (!existing || paidAt > existing.paidAt) out.set(n, { paidAt, orderId: o.id })
  }
  return out
}

/** Smallest month number (1..total) that has not been paid, or null when every month is paid. */
export function nextUnpaidCycle(paid: Map<number, unknown> | Set<number>, total: number): number | null {
  for (let n = 1; n <= total; n++) {
    if (!(paid instanceof Set ? paid.has(n) : paid.has(n))) return n
  }
  return null
}

export async function findOpenInvoice(payload: Payload, subscriptionId: Id, req?: PayloadRequest): Promise<any | null> {
  const res = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { subscription: { equals: subscriptionId } },
        { orderType: { equals: 'subscription_cycle' } },
        { status: { equals: 'pending' } },
        { paymentStatus: { equals: 'unpaid' } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    ...opts(req),
  })
  return res.docs[0] ?? null
}

/** Adds stock back for an order whose stock was reserved, and marks it as no longer reserved. */
export async function releaseReservedStock(payload: Payload, order: any, req?: PayloadRequest): Promise<void> {
  if (!order?.isFinalized) return
  for (const item of order.items || []) {
    const productId = idOf(item.product)
    if (!productId) continue
    const product: any = await payload.findByID({ collection: 'products', id: productId, depth: 0, ...opts(req) }).catch(() => null)
    if (!product) continue
    await payload.update({
      collection: 'products',
      id: productId,
      data: { stock: (product.stock || 0) + (item.quantity || 1) },
      ...opts(req),
    })
  }
  const db = payload.db as any
  await db.drizzle.execute(sql`UPDATE "orders" SET "is_finalized" = false WHERE "id" = ${order.id}`)
}

async function appendInternalNote(payload: Payload, order: any, note: string, req?: PayloadRequest) {
  const notes = Array.isArray(order.notes) ? order.notes : []
  return [...notes, { type: 'internal', note }]
}

/**
 * Cancels an UNPAID monthly invoice (skip / pause / lapse / admin) and gives its reserved stock back.
 * Never touches an order that has been paid. Returns true if it cancelled something.
 */
export async function cancelUnpaidInvoice(payload: Payload, orderId: Id, reason: string, req?: PayloadRequest): Promise<boolean> {
  const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true, ...opts(req) }).catch(() => null)
  if (!order) return false
  if (order.paymentStatus === 'captured' || order.status !== 'pending' || order.paymentStatus !== 'unpaid') return false

  await releaseReservedStock(payload, order, req)
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'cancelled', notes: await appendInternalNote(payload, order, `Invoice cancelled automatically: ${reason}.`, req) } as any,
    overrideAccess: true,
    ...opts(req),
  })
  return true
}

export type InvoiceReason = 'scheduled' | 'early' | 'resume' | 'reactivate'

export interface CreateInvoiceOptions {
  reason: InvoiceReason
  now?: Date
  /** Override the due date (default: the subscription's next due date for "scheduled", otherwise now + lead days). */
  dueDate?: Date
}

/**
 * Creates the next unpaid monthly invoice for a subscription (idempotent: if an open invoice already
 * exists it is returned instead). Does NOT send email - the caller does that, so this stays testable.
 * Returns null when every month of the plan has already been paid.
 */
export async function createCycleInvoice(
  payload: Payload,
  sub: any,
  options: CreateInvoiceOptions,
  req?: PayloadRequest,
): Promise<{ order: any; created: boolean } | null> {
  const now = options.now ?? new Date()
  const settings = await getSubscriptionSettings(payload)

  const paid = await getPaidCycles(payload, sub.id, req)
  const cycleNumber = nextUnpaidCycle(paid, Number(sub.planMonths))
  if (cycleNumber === null) return null

  const existing = await findOpenInvoice(payload, sub.id, req)
  if (existing) return { order: existing, created: false }

  const owner: any = await payload.findByID({ collection: 'users', id: idOf(sub.owner)!, depth: 0, overrideAccess: true, ...opts(req) })

  const items = (sub.items || []).map((it: any) => ({
    productId: String(idOf(it.product)),
    variantSku: it.variantSku || 'DEFAULT',
    variantTitle: it.variantTitle || it.variantSku || null,
    quantity: Number(it.quantity) || 1,
    priceSnapshot: 0,
    planMonths: Number(sub.planMonths),
  }))

  const pricing = await computeOrderPricing(
    payload,
    { items, shippingMethodName: sub.shippingMethod || '', isRedeemingPoints: false, couponCode: sub.recurringCouponCode || undefined },
    {
      checkStock: false,
      detectPriceChange: false,
      lenientShipping: true,
      recurringCoupon: true,
      plan: { months: Number(sub.planMonths), discountPercent: Number(sub.discountPercent) || 0 },
    },
  )
  if (pricing.error !== undefined) throw new Error(`Could not price invoice for subscription ${sub.id}: ${pricing.error}`)

  // A scheduled invoice is due on the subscription's due date. If the daily job ran late, never hand the customer an
  // invoice that is already (nearly) overdue: give at least 2 days.
  const earliestDue = addDays(now, 2)
  const scheduledDue = sub.nextDueDate ? new Date(sub.nextDueDate) : addDays(now, settings.invoiceLeadDays)
  const dueDate = options.dueDate ?? (options.reason === 'scheduled' ? (scheduledDue < earliestDue ? earliestDue : scheduledDue) : addDays(now, settings.invoiceLeadDays))

  const addr = sub.shippingAddress || {}
  const orderItems = items.map((it: any, idx: number) => {
    const parsed = parseInt(it.productId, 10)
    return {
      product: isNaN(parsed) ? it.productId : parsed,
      variant: it.variantSku,
      price: pricing.liveItems[idx].priceSnapshot,
      quantity: it.quantity,
      productSnapshot: pricing.productsById.get(it.productId) || null,
    }
  })

  let order: any
  try {
    order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      ...opts(req),
      data: {
        owner: owner.id,
        orderType: 'subscription_cycle',
        subscription: sub.id,
        cycleNumber,
        cyclesTotal: Number(sub.planMonths),
        subscriptionDiscountPercent: Number(sub.discountPercent) || 0,
        invoiceDueDate: dueDate.toISOString(),
        invoiceReminderStage: 0,
        invoiceToken: newInvoiceToken(),
        customerFirstName: sub.customerFirstName || owner.firstName || '',
        customerLastName: sub.customerLastName || owner.lastName || '',
        customerPhone: sub.customerPhone || owner.phone || '',
        guestEmail: owner.email,
        shippingAddress: {
          line1: addr.line1 || '',
          line2: addr.line2 || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || 'US',
        },
        items: orderItems,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal: Math.round(pricing.subtotal * 100) / 100,
        discountTotal: Math.round(pricing.discountAmount * 100) / 100,
        redeemedPoints: 0,
        shippingTotal: Math.round(pricing.finalShipping * 100) / 100,
        taxTotal: 0,
        feeTotal: Math.round(pricing.feeTotal * 100),
        appliedFees: pricing.appliedFees,
        total: Math.round(pricing.total * 100) / 100,
        shippingMethod: pricing.shippingMethodName,
        couponCode: pricing.couponApplied ? pricing.appliedCouponCode || '' : '',
        paymentMethod: sub.paymentMethod,
      } as any,
    })
  } catch (err) {
    // A concurrent request (daily job vs. the customer's "order next month now" click) may have won the race:
    // the database allows only one open invoice per month and rejects the second one (Payload reports that
    // as a generic validation error, so we do not try to recognise it - we just check whether an open invoice
    // now exists). If one does, use it; otherwise this was a real failure.
    const winner = await findOpenInvoice(payload, sub.id, req)
    if (winner) return { order: winner, created: false }
    throw err
  }

  // Reserve stock (and record the affiliate sale as pending) now, like a Zelle order. The order stays unpaid.
  const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
  const reserved = await finalizeOrder(
    order.id,
    { source: 'subscription', affiliateId: idOf(sub.affiliate) ? String(idOf(sub.affiliate)) : undefined, clickId: sub.affiliateClickId || undefined },
    true,
  )
  if (!reserved) console.error(`createCycleInvoice: could not reserve stock for order ${order.id} (subscription ${sub.id})`)

  return { order, created: true }
}

/**
 * Finds a monthly invoice from the id + secret token in an emailed pay link. Returns null for anything that
 * doesn't match, so a wrong guess looks exactly like a missing page.
 */
export async function loadInvoiceByToken(payload: Payload, orderId: string, token: string): Promise<any | null> {
  const id = Number(orderId)
  if (!Number.isInteger(id) || id < 1 || typeof token !== 'string' || token.length < 16) return null
  const order: any = await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!order || order.orderType !== 'subscription_cycle') return null
  return tokensMatch(order.invoiceToken, token) ? order : null
}
