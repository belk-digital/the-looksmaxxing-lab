import type { Payload, PayloadRequest } from 'payload'
import { addDays, addMonths, invoiceDateFor, nextDueAfterPayment, diffDays, planResume, type ResumePlan } from './schedule'
import { getSubscriptionSettings, allowedPaymentMethods, type SubscriptionPaymentMethod } from './settings'
import {
  cancelUnpaidInvoice,
  createCycleInvoice,
  findOpenInvoice,
  getPaidCycles,
  nextUnpaidCycle,
} from './invoices'

type Id = string | number
const idOf = (v: any): Id | null => (v && typeof v === 'object' ? v.id : v ?? null)

/** Updates made by the system itself must not re-trigger the admin "status changed" hook. */
const SYSTEM_CONTEXT = { skipSubscriptionHook: true }

export async function updateSub(payload: Payload, id: Id, data: Record<string, unknown>, req?: PayloadRequest) {
  return payload.update({
    collection: 'subscriptions' as any,
    id,
    data: data as any,
    overrideAccess: true,
    context: SYSTEM_CONTEXT,
    ...(req ? { req } : {}),
  }) as Promise<any>
}

export async function getSubscription(payload: Payload, id: Id, req?: PayloadRequest): Promise<any | null> {
  return (await payload
    .findByID({ collection: 'subscriptions' as any, id, depth: 0, overrideAccess: true, ...(req ? { req } : {}) })
    .catch(() => null)) as any
}

export type ActionResult<T = {}> = ({ ok: true } & T) | { ok: false; error: string }
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })

// ------------------------------------------------------------------------------------------------
// Recompute everything from the paid orders (idempotent - safe to call any number of times)
// ------------------------------------------------------------------------------------------------

/**
 * Brings a subscription in line with the orders that have actually been paid: months paid, status, and the
 * date of the next month. Called whenever a subscription order becomes paid (any payment method).
 */
export async function syncSubscription(payload: Payload, subscriptionId: Id, triggerOrderId?: Id | null, req?: PayloadRequest): Promise<any | null> {
  const sub = await getSubscription(payload, subscriptionId, req)
  if (!sub) return null

  const settings = await getSubscriptionSettings(payload)
  const paid = await getPaidCycles(payload, sub.id, req)
  const total = Number(sub.planMonths)
  const cyclesCompleted = paid.size

  // Nothing has been paid yet (e.g. a sync fired before the payment landed): leave the status alone.
  if (cyclesCompleted === 0) return updateSub(payload, sub.id, { cyclesCompleted: 0 }, req)

  const latestPaid = [...paid.values()].reduce<Date | null>((m, v) => (!m || v.paidAt > m ? v.paidAt : m), null)
  const earliestPaid = [...paid.values()].reduce<Date | null>((m, v) => (!m || v.paidAt < m ? v.paidAt : m), null)

  // Late payment for a subscription that was cancelled only because its FIRST payment never arrived in time.
  const firstOrderId = idOf(sub.firstOrder)
  const revivable = sub.status === 'cancelled' && cyclesCompleted > 0 && !sub.startedAt && triggerOrderId != null && String(triggerOrderId) === String(firstOrderId)

  const data: Record<string, unknown> = { cyclesCompleted }
  if (earliestPaid && !sub.startedAt) data.startedAt = earliestPaid.toISOString()

  let status: string = sub.status
  if (cyclesCompleted >= total) {
    status = 'completed'
    Object.assign(data, { nextDueDate: null, nextInvoiceDate: null, openInvoice: null, pausedAt: null, lapsedAt: null })
  } else if (status === 'cancelled' && !revivable) {
    // Admin-cancelled subscription: record the payment but do not restart billing.
    if (triggerOrderId != null) {
      const { alertAdmin } = await import('@/lib/orders/alerts')
      await alertAdmin('⚠️ Payment received for a cancelled subscription', {
        Subscription: `SUB-${sub.id}`,
        Order: String(triggerOrderId),
        Note: 'Billing was NOT restarted. Refund or reactivate manually.',
      })
    }
  } else {
    if (status === 'pending_payment' || status === 'lapsed' || revivable) status = 'active'
    data.status = status
    if (status === 'active') {
      data.lapsedAt = null
      if (latestPaid) {
        const due = nextDueAfterPayment(latestPaid)
        data.nextDueDate = due.toISOString()
        data.nextInvoiceDate = invoiceDateFor(due, settings.invoiceLeadDays).toISOString()
      }
    } else if (status === 'paused') {
      data.nextInvoiceDate = null
    }
  }
  if (status === 'completed') data.status = 'completed'

  // The tracked "open invoice" may have just been paid or cancelled.
  const openId = idOf(sub.openInvoice)
  if (openId) {
    const open: any = await payload.findByID({ collection: 'orders', id: openId, depth: 0, overrideAccess: true, ...(req ? { req } : {}) }).catch(() => null)
    if (!open || open.paymentStatus === 'captured' || open.status === 'cancelled') data.openInvoice = null
  }

  // Two paid orders for the same month = the customer paid twice. Tell the admin.
  if (triggerOrderId != null) {
    const trigger: any = await payload
      .findByID({ collection: 'orders', id: triggerOrderId, depth: 0, overrideAccess: true, ...(req ? { req } : {}) })
      .catch(() => null)
    if (trigger?.cycleNumber != null) {
      const sameMonth = await payload.find({
        collection: 'orders',
        where: {
          and: [
            { subscription: { equals: sub.id } },
            { paymentStatus: { equals: 'captured' } },
            { cycleNumber: { equals: trigger.cycleNumber } },
          ],
        },
        depth: 0,
        limit: 5,
        overrideAccess: true,
        ...(req ? { req } : {}),
      })
      if (sameMonth.totalDocs > 1) {
        const { alertAdmin } = await import('@/lib/orders/alerts')
        await alertAdmin('⚠️ Possible duplicate subscription payment', {
          Subscription: `SUB-${sub.id}`,
          'Order paid just now': String(triggerOrderId),
          Note: `More than one paid order exists for the same month (${sameMonth.docs.map((d: any) => '#' + (d.orderNumber || d.id)).join(', ')}). One may need a refund.`,
        })
      }
    }
  }

  return updateSub(payload, sub.id, data, req)
}

// ------------------------------------------------------------------------------------------------
// Creating the subscription at checkout
// ------------------------------------------------------------------------------------------------

export interface CheckoutSubscriptionInput {
  ownerId: Id
  firstOrderId: Id
  planMonths: number
  discountPercent: number
  items: { productId: Id; variantSku?: string | null; variantTitle?: string | null; quantity: number }[]
  paymentMethod: SubscriptionPaymentMethod
  shippingMethod: string
  shippingAddress: { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string }
  customerFirstName?: string
  customerLastName?: string
  customerPhone?: string
  affiliateId?: Id | null
  affiliateClickId?: string | null
  /** Coupon code that discounts every monthly invoice (only for "every monthly payment" coupons). */
  recurringCouponCode?: string | null
}

/** Creates the subscription (waiting for its first payment) and links the first order to it. */
export async function createSubscriptionForCheckout(payload: Payload, input: CheckoutSubscriptionInput): Promise<any> {
  const sub: any = await (payload.create as any)({
    collection: 'subscriptions',
    overrideAccess: true,
    context: SYSTEM_CONTEXT,
    data: {
      owner: input.ownerId,
      status: 'pending_payment',
      planMonths: input.planMonths,
      discountPercent: input.discountPercent,
      paymentMethod: input.paymentMethod,
      shippingMethod: input.shippingMethod,
      shippingAddress: input.shippingAddress,
      customerFirstName: input.customerFirstName || '',
      customerLastName: input.customerLastName || '',
      customerPhone: input.customerPhone || '',
      firstOrder: input.firstOrderId,
      cyclesCompleted: 0,
      affiliate: input.affiliateId ?? undefined,
      affiliateClickId: input.affiliateClickId ?? undefined,
      recurringCouponCode: input.recurringCouponCode || undefined,
      items: input.items.map((i) => ({
        product: i.productId,
        variantSku: i.variantSku || 'DEFAULT',
        variantTitle: i.variantTitle || i.variantSku || '',
        quantity: i.quantity,
      })),
    },
  })

  await payload.update({
    collection: 'orders',
    id: input.firstOrderId,
    data: { subscription: sub.id } as any,
    overrideAccess: true,
  })
  return sub
}

// ------------------------------------------------------------------------------------------------
// Customer / admin actions. These assume the caller already checked who is allowed to act.
// ------------------------------------------------------------------------------------------------

export async function pauseSubscription(payload: Payload, id: Id): Promise<ActionResult> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (sub.status === 'paused') return fail('This subscription is already paused.')
  if (!['active', 'lapsed'].includes(sub.status)) return fail('Only an active subscription can be paused.')

  const open = await findOpenInvoice(payload, sub.id)
  if (open) await cancelUnpaidInvoice(payload, open.id, 'subscription paused')

  // A pause only stops invoices - it does not move the month's due date. Remember it so "resume" can keep to the calendar.
  const keepDue = open?.invoiceDueDate || sub.nextDueDate || null
  await updateSub(payload, sub.id, {
    status: 'paused',
    pausedAt: new Date().toISOString(),
    nextInvoiceDate: null,
    openInvoice: null,
    ...(keepDue ? { nextDueDate: keepDue } : {}),
  })
  return { ok: true }
}

/** Works out what a resume should do for this subscription right now (see planResume). */
async function planResumeFor(payload: Payload, sub: any, now: Date, req?: PayloadRequest): Promise<ResumePlan> {
  const settings = await getSubscriptionSettings(payload)
  const paid = await getPaidCycles(payload, sub.id, req)
  const lastPaidAt = [...paid.values()].reduce<Date | null>((m, v) => (!m || v.paidAt > m ? v.paidAt : m), null)
  return planResume({ now, scheduledDue: sub.nextDueDate ? new Date(sub.nextDueDate) : null, lastPaidAt, leadDays: settings.invoiceLeadDays })
}

export async function resumeSubscription(payload: Payload, id: Id, now = new Date()): Promise<ActionResult<{ orderId?: Id; scheduledFor?: string }>> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (sub.status !== 'paused') return fail('This subscription is not paused.')

  const paid = await getPaidCycles(payload, sub.id)
  if (nextUnpaidCycle(paid, Number(sub.planMonths)) === null) {
    await updateSub(payload, sub.id, { status: 'completed', pausedAt: null, nextDueDate: null, nextInvoiceDate: null })
    return { ok: true }
  }

  // The calendar keeps running: the next month keeps its normal date (see planResume).
  const plan = await planResumeFor(payload, sub, now)
  if (plan.mode === 'wait') {
    await updateSub(payload, sub.id, {
      status: 'active',
      pausedAt: null,
      openInvoice: null,
      nextDueDate: plan.dueDate.toISOString(),
      nextInvoiceDate: plan.invoiceDate.toISOString(),
    })
    return { ok: true, scheduledFor: plan.invoiceDate.toISOString() }
  }

  await updateSub(payload, sub.id, { status: 'active', pausedAt: null, nextDueDate: plan.dueDate.toISOString(), nextInvoiceDate: null })
  const fresh = await getSubscription(payload, sub.id)
  const result = await createCycleInvoice(payload, fresh, { reason: 'resume', now, dueDate: plan.dueDate })
  if (!result) return { ok: true }
  await updateSub(payload, sub.id, { openInvoice: result.order.id, nextDueDate: result.order.invoiceDueDate || plan.dueDate.toISOString(), nextInvoiceDate: null })
  if (result.created) await sendInvoiceNotice(payload, result.order.id, 'resume')
  return { ok: true, orderId: result.order.id }
}

export async function skipNextMonth(payload: Payload, id: Id, now = new Date()): Promise<ActionResult<{ nextDueDate: string }>> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (sub.status !== 'active') return fail('Only an active subscription can skip a month.')

  const paid = await getPaidCycles(payload, sub.id)
  if (nextUnpaidCycle(paid, Number(sub.planMonths)) === null) return fail('All months of this plan are already paid.')

  const settings = await getSubscriptionSettings(payload)
  const open = await findOpenInvoice(payload, sub.id)
  const base = new Date(open?.invoiceDueDate || sub.nextDueDate || now)
  if (open) await cancelUnpaidInvoice(payload, open.id, 'month skipped by customer')

  // Never schedule in the past: if the due date already passed, push from today.
  const from = base < now ? now : base
  const newDue = addMonths(from, 1)
  await updateSub(payload, sub.id, {
    nextDueDate: newDue.toISOString(),
    nextInvoiceDate: invoiceDateFor(newDue, settings.invoiceLeadDays).toISOString(),
    openInvoice: null,
  })
  return { ok: true, nextDueDate: newDue.toISOString() }
}

export async function orderNextMonthNow(payload: Payload, id: Id, now = new Date()): Promise<ActionResult<{ orderId: Id }>> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (sub.status === 'paused') return fail('Resume your subscription first.')
  if (sub.status === 'lapsed') return fail('Your last invoice was not paid. Use "Pay to reactivate" instead.')
  if (sub.status !== 'active') return fail('This subscription is not active.')

  const paid = await getPaidCycles(payload, sub.id)
  if (nextUnpaidCycle(paid, Number(sub.planMonths)) === null) return fail('All months of this plan are already paid.')

  const open = await findOpenInvoice(payload, sub.id)
  if (open) return { ok: true, orderId: open.id } // already has an unpaid month - just pay that one

  const settings = await getSubscriptionSettings(payload)
  if (settings.minDaysBetweenEarlyOrders > 0 && sub.lastEarlyOrderAt) {
    const since = diffDays(new Date(sub.lastEarlyOrderAt), now)
    if (since < settings.minDaysBetweenEarlyOrders) {
      return fail(`You can order the next month again in ${settings.minDaysBetweenEarlyOrders - since} day(s).`)
    }
  }

  const due = addDays(now, settings.invoiceLeadDays)
  const result = await createCycleInvoice(payload, sub, { reason: 'early', now, dueDate: due })
  if (!result) return fail('All months of this plan are already paid.')
  await updateSub(payload, sub.id, {
    openInvoice: result.order.id,
    nextDueDate: due.toISOString(),
    nextInvoiceDate: null,
    lastEarlyOrderAt: now.toISOString(),
  })
  if (result.created) await sendInvoiceNotice(payload, result.order.id, 'early')
  return { ok: true, orderId: result.order.id }
}

/** A lapsed subscription: create a fresh invoice for the month that was never paid. */
export async function reactivateSubscription(payload: Payload, id: Id, now = new Date()): Promise<ActionResult<{ orderId: Id }>> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (sub.status !== 'lapsed') return fail('This subscription does not need reactivating.')

  const settings = await getSubscriptionSettings(payload)
  const due = addDays(now, settings.invoiceLeadDays)
  const result = await createCycleInvoice(payload, sub, { reason: 'reactivate', now, dueDate: due })
  if (!result) return fail('All months of this plan are already paid.')
  await updateSub(payload, sub.id, { openInvoice: result.order.id, nextDueDate: due.toISOString(), nextInvoiceDate: null })
  if (result.created) await sendInvoiceNotice(payload, result.order.id, 'reactivate')
  return { ok: true, orderId: result.order.id }
}

export interface AddressInput {
  firstName: string
  lastName: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
}

export async function updateSubscriptionAddress(payload: Payload, id: Id, a: AddressInput): Promise<ActionResult> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  if (!a.line1?.trim() || !a.city?.trim() || !a.state?.trim() || !a.postalCode?.trim() || !a.firstName?.trim()) {
    return fail('Please fill in name, street address, city, state and ZIP code.')
  }
  const shippingAddress = { line1: a.line1.trim(), line2: (a.line2 || '').trim(), city: a.city.trim(), state: a.state.trim(), postalCode: a.postalCode.trim(), country: 'US' }
  await updateSub(payload, sub.id, {
    shippingAddress,
    customerFirstName: a.firstName.trim(),
    customerLastName: (a.lastName || '').trim(),
    customerPhone: (a.phone || '').trim(),
  })

  // An invoice that has not been paid/shipped yet should go to the new address too.
  const open = await findOpenInvoice(payload, sub.id)
  if (open) {
    await payload.update({
      collection: 'orders',
      id: open.id,
      data: { shippingAddress, customerFirstName: a.firstName.trim(), customerLastName: (a.lastName || '').trim(), customerPhone: (a.phone || '').trim() } as any,
      overrideAccess: true,
    })
  }
  return { ok: true }
}

export async function setSubscriptionPaymentMethod(payload: Payload, id: Id, method: string): Promise<ActionResult> {
  const sub = await getSubscription(payload, id)
  if (!sub) return fail('Subscription not found.')
  const settings = await getSubscriptionSettings(payload)
  if (!allowedPaymentMethods(settings).includes(method as SubscriptionPaymentMethod)) return fail('That payment method is not available for subscriptions.')

  await updateSub(payload, sub.id, { paymentMethod: method })
  const open = await findOpenInvoice(payload, sub.id)
  if (open && open.paymentMethod !== method) {
    await payload.update({ collection: 'orders', id: open.id, data: { paymentMethod: method } as any, overrideAccess: true })
  }
  return { ok: true }
}

// ------------------------------------------------------------------------------------------------
// Admin edits the Status field in the Payload admin
// ------------------------------------------------------------------------------------------------

/**
 * Runs inside the admin's save (same transaction, via `req`). Only does work that is safe there; creating
 * a new invoice after an admin "resume" is left to the daily job (nextInvoiceDate = now).
 */
export async function onSubscriptionStatusChanged(payload: Payload, sub: any, previousStatus: string, req?: PayloadRequest): Promise<void> {
  const status = sub.status
  try {
    if (status === 'paused' || status === 'cancelled' || status === 'completed') {
      const open = await findOpenInvoice(payload, sub.id, req)
      if (open) await cancelUnpaidInvoice(payload, open.id, `subscription marked ${status} by staff`, req)
      await updateSub(
        payload,
        sub.id,
        {
          openInvoice: null,
          nextInvoiceDate: null,
          ...(status === 'paused' ? { pausedAt: sub.pausedAt || new Date().toISOString() } : {}),
          ...(status === 'cancelled' || status === 'completed' ? { nextDueDate: null } : {}),
        },
        req,
      )
    } else if (status === 'active' && (previousStatus === 'paused' || previousStatus === 'lapsed')) {
      // Same rule as the customer's "Resume": keep the month's normal date; if it has passed, the next daily run invoices it.
      const now = new Date()
      const plan = await planResumeFor(payload, sub, now, req)
      await updateSub(
        payload,
        sub.id,
        {
          pausedAt: null,
          lapsedAt: null,
          nextDueDate: plan.dueDate.toISOString(),
          nextInvoiceDate: (plan.mode === 'wait' ? plan.invoiceDate : now).toISOString(),
        },
        req,
      )
    }
  } catch (err) {
    console.error(`onSubscriptionStatusChanged failed for subscription ${sub.id}:`, err)
  }
}

// ------------------------------------------------------------------------------------------------
// Order events (called from the order hook / payment webhook)
// ------------------------------------------------------------------------------------------------

/** An order of a subscription became paid. */
export async function onSubscriptionOrderPaid(payload: Payload, order: any, req?: PayloadRequest): Promise<void> {
  const subscriptionId = idOf(order.subscription)
  if (!subscriptionId) return
  await syncSubscription(payload, subscriptionId, order.id, req)

  // Customer-facing receipt for monthly orders and manual (Zelle) first payments. Card first payments get
  // their receipt from the normal order-confirmation email that finalizeOrder already sends.
  const needsReceipt = order.orderType === 'subscription_cycle' || (order.orderType === 'subscription_first' && order.paymentMethod === 'zelle')
  if (needsReceipt) {
    try {
      const { sendPaymentReceivedEmail } = await import('./emails')
      await sendPaymentReceivedEmail(payload, order, req)
    } catch (err) {
      console.error('Failed to send subscription payment-received email', err)
    }
  }
}

/** A subscription order was cancelled (by the system or by staff). */
export async function onSubscriptionOrderCancelled(payload: Payload, order: any, req?: PayloadRequest): Promise<void> {
  const subscriptionId = idOf(order.subscription)
  if (!subscriptionId) return
  const sub = await getSubscription(payload, subscriptionId, req)
  if (!sub) return

  const data: Record<string, unknown> = {}
  if (idOf(sub.openInvoice) != null && String(idOf(sub.openInvoice)) === String(order.id)) data.openInvoice = null

  // The first payment never arrived and its order was cancelled: nothing was ever bought.
  if (order.orderType === 'subscription_first' && sub.status === 'pending_payment') data.status = 'cancelled'

  if (Object.keys(data).length) await updateSub(payload, sub.id, data, req)
}

/**
 * Marks a monthly order paid (used by the card-payment webhook). Reserves stock first if the invoice had been
 * cancelled and released, then flips it to paid; the order hook takes care of the subscription from there.
 */
export async function markSubscriptionOrderPaid(
  payload: Payload,
  orderId: Id,
  meta: { txnId?: string | null } = {},
): Promise<boolean> {
  const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order) return false
  if (order.paymentStatus === 'captured') return true

  if (!order.isFinalized) {
    const sub = await getSubscription(payload, idOf(order.subscription)!)
    const { finalizeOrder } = await import('@/lib/orders/finalizeOrder')
    await finalizeOrder(
      order.id,
      { source: 'subscription', affiliateId: sub && idOf(sub.affiliate) ? String(idOf(sub.affiliate)) : undefined, clickId: sub?.affiliateClickId || undefined },
      true,
    )
  }

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid', paymentStatus: 'captured', ...(meta.txnId ? { paymentTxnId: meta.txnId } : {}) } as any,
    overrideAccess: true,
  })
  return true
}

/** Emails the customer about a newly created invoice. Never throws (an email problem must not undo billing). */
export async function sendInvoiceNotice(payload: Payload, orderId: Id, reason: 'scheduled' | 'early' | 'resume' | 'reactivate'): Promise<void> {
  try {
    const { sendInvoiceEmail } = await import('./emails')
    await sendInvoiceEmail(payload, orderId, reason)
  } catch (err) {
    console.error(`Failed to send invoice email for order ${orderId}:`, err)
  }
}
