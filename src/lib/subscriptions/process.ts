import { orderLabel } from './labels'
import type { Payload } from 'payload'
import { addDays, desiredReminderStage, diffDays } from './schedule'
import { getSubscriptionSettings } from './settings'
import { cancelUnpaidInvoice, createCycleInvoice, findOpenInvoice } from './invoices'
import { getSubscription, sendInvoiceNotice, updateSub } from './service'

type Id = string | number
const idOf = (v: any): Id | null => (v && typeof v === 'object' ? v.id : v ?? null)

export interface SubscriptionRunSummary {
  invoicesCreated: number
  dueDayReminders: number
  finalNotices: number
  lapsed: number
  firstPaymentsExpired: number
  errors: number
}

const BATCH = 200

/**
 * The daily subscription job (runs inside /api/cron/daily-maintenance).
 *
 *  1. creates and emails the invoice for every subscription whose invoice date has arrived
 *  2. unpaid invoices: one reminder on the due day, one final notice a week later, then the invoice is
 *     cancelled and the subscription is put on hold ("lapsed") - at most ONE email per invoice per run
 *  3. cancels subscriptions whose very first payment never arrived (e.g. Zelle)
 *
 * Everything is date-based ("on or before today") and idempotent, so a missed day simply catches up.
 * Each subscription is handled in its own try/catch: one bad record never blocks the others.
 */
export async function processSubscriptions(payload: Payload, now = new Date()): Promise<SubscriptionRunSummary> {
  const settings = await getSubscriptionSettings(payload)
  const summary: SubscriptionRunSummary = { invoicesCreated: 0, dueDayReminders: 0, finalNotices: 0, lapsed: 0, firstPaymentsExpired: 0, errors: 0 }

  // Invoices created in THIS run must not also be reminded in this run (that would be two emails at once).
  const createdThisRun = new Set<string>()

  // ---- 1. invoices that are due to be created ------------------------------------------------------
  const due = await payload.find({
    collection: 'subscriptions' as any,
    where: { and: [{ status: { equals: 'active' } }, { nextInvoiceDate: { less_than_equal: now.toISOString() } }] },
    limit: BATCH,
    depth: 0,
    overrideAccess: true,
  })
  for (const sub of due.docs as any[]) {
    try {
      if (await findOpenInvoice(payload, sub.id)) continue // already has an unpaid order
      const result = await createCycleInvoice(payload, sub, { reason: 'scheduled', now })
      if (!result) {
        // nothing to invoice (should not happen: a subscription has no end) - just make sure the record is in sync
        const { syncSubscription } = await import('./service')
        await syncSubscription(payload, sub.id)
        continue
      }
      await updateSub(payload, sub.id, {
        openInvoice: result.order.id,
        nextDueDate: result.order.invoiceDueDate,
        nextInvoiceDate: null,
      })
      if (result.created) {
        createdThisRun.add(String(result.order.id))
        await sendInvoiceNotice(payload, result.order.id, 'scheduled')
        summary.invoicesCreated++
      }
    } catch (err) {
      summary.errors++
      console.error(`processSubscriptions: failed to invoice subscription ${sub.id}`, err)
    }
  }

  // ---- 2. reminders and lapse for unpaid recurring invoices ----------------------------------------------
  const openInvoices = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { orderType: { equals: 'subscription_cycle' } },
        { status: { equals: 'pending' } },
        { paymentStatus: { equals: 'unpaid' } },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  for (const order of openInvoices.docs as any[]) {
    try {
      if (createdThisRun.has(String(order.id))) continue
      const dueDate = order.invoiceDueDate ? new Date(order.invoiceDueDate) : null
      if (!dueDate || isNaN(dueDate.getTime())) continue

      let stage = desiredReminderStage(now, dueDate, settings)
      // A just-created invoice (e.g. an admin-made one) is never lapsed or "final-noticed" in its first 3 days.
      if (stage >= 2 && diffDays(new Date(order.createdAt), now) < 3) stage = 1
      const current = Number(order.invoiceReminderStage) || 0
      if (stage <= current) continue

      const subscriptionId = idOf(order.subscription)
      const sub = subscriptionId ? await getSubscription(payload, subscriptionId) : null
      if (!sub || !['active', 'lapsed'].includes(sub.status)) continue

      if (stage === 3) {
        const cancelled = await cancelUnpaidInvoice(payload, order.id, `unpaid ${settings.lapseAfterDays} days after the due date`)
        if (cancelled) {
          await updateSub(payload, sub.id, { status: 'lapsed', lapsedAt: now.toISOString(), openInvoice: null, nextInvoiceDate: null })
          const { sendLapseEmail } = await import('./emails')
          await sendLapseEmail(payload, order.id).catch((e) => console.error('lapse email failed', e))
          const { alertAdmin } = await import('@/lib/orders/alerts')
          await alertAdmin('Subscription put on hold (invoice unpaid)', {
            Subscription: `SUB-${sub.id}`,
            Invoice: `#${order.orderNumber || order.id} (${orderLabel(order.cycleNumber)})`,
            Customer: order.guestEmail,
          })
          summary.lapsed++
        }
      } else {
        const { sendReminderEmail } = await import('./emails')
        await sendReminderEmail(payload, order.id, stage as 1 | 2)
        await payload.update({ collection: 'orders', id: order.id, data: { invoiceReminderStage: stage } as any, overrideAccess: true })
        if (stage === 1) summary.dueDayReminders++
        else summary.finalNotices++
      }
    } catch (err) {
      summary.errors++
      console.error(`processSubscriptions: failed to process invoice ${order.id}`, err)
    }
  }

  // ---- 3. first payment never arrived ------------------------------------------------------------------
  const cutoff = addDays(now, -settings.firstPaymentExpiryDays)
  const stale = await payload.find({
    collection: 'subscriptions' as any,
    where: { and: [{ status: { equals: 'pending_payment' } }, { createdAt: { less_than: cutoff.toISOString() } }] },
    limit: BATCH,
    depth: 0,
    overrideAccess: true,
  })
  for (const sub of stale.docs as any[]) {
    try {
      const firstId = idOf(sub.firstOrder)
      if (firstId) {
        // Cancelling the unpaid first order also cancels the subscription (order hook).
        const cancelled = await cancelUnpaidInvoice(payload, firstId, `first payment not received within ${settings.firstPaymentExpiryDays} days`)
        if (!cancelled) {
          const fresh = await getSubscription(payload, sub.id)
          if (fresh?.status === 'pending_payment') await updateSub(payload, sub.id, { status: 'cancelled' })
        }
      } else {
        await updateSub(payload, sub.id, { status: 'cancelled' })
      }
      summary.firstPaymentsExpired++
    } catch (err) {
      summary.errors++
      console.error(`processSubscriptions: failed to expire subscription ${sub.id}`, err)
    }
  }

  return summary
}
