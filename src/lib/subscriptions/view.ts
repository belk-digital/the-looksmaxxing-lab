/**
 * Turns raw subscription + order records into exactly what the customer sees on the subscription page:
 * a status, a month-by-month schedule, and the list of actions that are allowed RIGHT NOW.
 * Pure (no database), so every state can be tested.
 */

export type SubscriptionStatus = 'pending_payment' | 'active' | 'paused' | 'lapsed' | 'completed' | 'cancelled'

export type MonthState =
  | 'paid' // paid, preparing to ship
  | 'shipped'
  | 'delivered'
  | 'awaiting_payment' // an invoice exists and is unpaid
  | 'upcoming' // not invoiced yet
  | 'skipped_hold' // plan paused / on hold

export interface ScheduleRow {
  month: number
  state: MonthState
  label: string
  /** Date shown next to the label (due date, invoice date or paid date), ISO string. */
  date?: string | null
  orderId?: string | number
  orderNumber?: string
  total?: number
  trackingLink?: string | null
  /** Link to pay this month (only when awaiting payment). */
  payPath?: string
}

export type SubscriptionAction =
  | 'pay_now'
  | 'order_next_month'
  | 'skip_month'
  | 'pause'
  | 'resume'
  | 'reactivate'

export interface SubscriptionView {
  statusLabel: string
  statusTone: 'green' | 'amber' | 'blue' | 'red' | 'gray'
  statusHelp: string
  monthsPaid: number
  monthsTotal: number
  schedule: ScheduleRow[]
  actions: SubscriptionAction[]
  /** The unpaid invoice, if any. */
  openInvoice: { id: string | number; dueDate: string | null; total: number; payPath: string; month: number } | null
  nextInvoiceDate: string | null
  nextDueDate: string | null
}

const STATUS: Record<SubscriptionStatus, { label: string; tone: SubscriptionView['statusTone'] }> = {
  pending_payment: { label: 'Waiting for first payment', tone: 'amber' },
  active: { label: 'Active', tone: 'green' },
  paused: { label: 'Paused', tone: 'blue' },
  lapsed: { label: 'On hold - invoice unpaid', tone: 'red' },
  completed: { label: 'Completed', tone: 'gray' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
}

export const statusLabel = (s: string) => STATUS[s as SubscriptionStatus]?.label ?? s

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''

interface OrderLike {
  id: string | number
  orderNumber?: string | null
  cycleNumber?: number | null
  orderType?: string | null
  status?: string | null
  paymentStatus?: string | null
  total?: number | null
  invoiceDueDate?: string | null
  invoiceToken?: string | null
  paidAt?: string | null
  updatedAt?: string | null
  trackingLink?: string | null
}

interface SubLike {
  status: string
  planMonths: number
  nextDueDate?: string | null
  nextInvoiceDate?: string | null
  cyclesCompleted?: number | null
}

export function buildSubscriptionView(
  sub: SubLike,
  orders: OrderLike[],
  opts: { minDaysBetweenEarlyOrders?: number; daysSinceLastEarlyOrder?: number | null } = {},
): SubscriptionView {
  const total = Number(sub.planMonths)
  const status = sub.status as SubscriptionStatus
  const meta = STATUS[status] ?? { label: sub.status, tone: 'gray' as const }

  // Best order per month: a paid one wins over an open invoice; cancelled invoices are ignored.
  const paidByMonth = new Map<number, OrderLike>()
  const openByMonth = new Map<number, OrderLike>()
  for (const o of orders) {
    const n = Number(o.cycleNumber)
    if (!Number.isFinite(n) || n < 1) continue
    if (o.paymentStatus === 'captured') {
      const prev = paidByMonth.get(n)
      if (!prev || new Date(o.paidAt || o.updatedAt || 0) > new Date(prev.paidAt || prev.updatedAt || 0)) paidByMonth.set(n, o)
    } else if (o.orderType === 'subscription_cycle' && o.status === 'pending' && o.paymentStatus === 'unpaid') {
      openByMonth.set(n, o)
    }
  }

  const monthsPaid = paidByMonth.size
  const held = status === 'paused' || status === 'lapsed'

  const schedule: ScheduleRow[] = []
  for (let n = 1; n <= total; n++) {
    const paid = paidByMonth.get(n)
    const open = openByMonth.get(n)
    if (paid) {
      const shipped = ['fulfilled', 'shipped'].includes(String(paid.status))
      const delivered = paid.status === 'completed'
      schedule.push({
        month: n,
        state: delivered ? 'delivered' : shipped ? 'shipped' : 'paid',
        label: delivered ? 'Delivered' : shipped ? 'Shipped' : 'Paid - preparing to ship',
        date: paid.paidAt || paid.updatedAt || null,
        orderId: paid.id,
        orderNumber: String(paid.orderNumber || paid.id),
        total: paid.total ?? undefined,
        trackingLink: paid.trackingLink || null,
      })
    } else if (open) {
      schedule.push({
        month: n,
        state: 'awaiting_payment',
        label: 'Awaiting payment',
        date: open.invoiceDueDate || null,
        orderId: open.id,
        orderNumber: String(open.orderNumber || open.id),
        total: open.total ?? undefined,
        payPath: open.invoiceToken ? `/pay/${open.id}/${open.invoiceToken}` : undefined,
      })
    } else {
      schedule.push({
        month: n,
        state: held ? 'skipped_hold' : 'upcoming',
        label: held ? (status === 'paused' ? 'On pause' : 'On hold') : 'Upcoming',
        date: n === monthsPaid + 1 ? sub.nextDueDate || null : null,
      })
    }
  }

  // The single open invoice (there is at most one).
  let openInvoice: SubscriptionView['openInvoice'] = null
  for (const [n, o] of openByMonth) {
    if (o.invoiceToken) {
      openInvoice = { id: o.id, dueDate: o.invoiceDueDate || null, total: o.total ?? 0, payPath: `/pay/${o.id}/${o.invoiceToken}`, month: n }
      break
    }
  }

  // ---- which buttons are allowed right now -----------------------------------------------------------------
  const actions: SubscriptionAction[] = []
  const allPaid = monthsPaid >= total
  if (status === 'active' && !allPaid) {
    if (openInvoice) actions.push('pay_now')
    else {
      const gapOk =
        !opts.minDaysBetweenEarlyOrders ||
        opts.daysSinceLastEarlyOrder == null ||
        opts.daysSinceLastEarlyOrder >= opts.minDaysBetweenEarlyOrders
      if (gapOk) actions.push('order_next_month')
    }
    actions.push('skip_month', 'pause')
  } else if (status === 'paused') {
    actions.push('resume')
  } else if (status === 'lapsed') {
    if (openInvoice) actions.push('pay_now')
    else actions.push('reactivate')
    actions.push('pause')
  }

  let help = ''
  if (status === 'pending_payment') help = 'Your plan starts as soon as your first payment is confirmed.'
  else if (status === 'active' && openInvoice) help = `Month ${openInvoice.month} is ready to pay${openInvoice.dueDate ? ` - due ${fmt(openInvoice.dueDate)}` : ''}. Your order ships once it is paid.`
  else if (status === 'active' && !allPaid) help = sub.nextInvoiceDate ? `Your next invoice will be emailed on ${fmt(sub.nextInvoiceDate)}.` : 'Your next invoice will be emailed soon.'
  else if (status === 'paused') help = 'No invoices are sent while paused. Resume anytime: your next month keeps its normal date, and if that date has already passed the invoice is sent right away.'
  else if (status === 'lapsed') help = 'We did not receive payment for your last invoice, so billing is on hold. Pay a fresh invoice to continue.'
  else if (status === 'completed') help = 'All months of this plan are paid. Thank you for subscribing!'
  else if (status === 'cancelled') help = 'This subscription is cancelled. You can start a new one anytime.'

  return {
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusHelp: help,
    monthsPaid,
    monthsTotal: total,
    schedule,
    actions,
    openInvoice,
    nextInvoiceDate: sub.nextInvoiceDate || null,
    nextDueDate: sub.nextDueDate || null,
  }
}
