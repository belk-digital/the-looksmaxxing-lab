/**
 * Turns raw subscription + order records into exactly what the customer sees on the subscription page:
 * a status, the list of their orders (paid ones, the open invoice, and the next planned one), and the list of
 * actions that are allowed RIGHT NOW. A subscription has no end: an order every N months until it is paused.
 * Pure (no database), so every state can be tested.
 */
import { planInterval } from './schedule'

export type SubscriptionStatus = 'pending_payment' | 'active' | 'paused' | 'lapsed' | 'completed' | 'cancelled'

export type OrderState =
  | 'paid' // paid, preparing to ship
  | 'shipped'
  | 'delivered'
  | 'awaiting_payment' // an invoice exists and is unpaid
  | 'upcoming' // not invoiced yet
  | 'skipped_hold' // subscription paused / on hold

export interface ScheduleRow {
  /** Order number within the subscription: 1 = the first order, 2 = the next one, ... */
  order: number
  state: OrderState
  label: string
  /** Date shown next to the label (due date, invoice date or paid date), ISO string. */
  date?: string | null
  orderId?: string | number
  orderNumber?: string
  total?: number
  trackingLink?: string | null
  /** Link to pay this order (only when awaiting payment). */
  payPath?: string
}

export type SubscriptionAction =
  | 'pay_now'
  | 'order_next_month' // "Order next delivery now"
  | 'skip_month' // "Skip next delivery"
  | 'pause'
  | 'resume'
  | 'reactivate'

export interface SubscriptionView {
  statusLabel: string
  statusTone: 'green' | 'amber' | 'blue' | 'red' | 'gray'
  statusHelp: string
  /** How many orders have been paid so far. */
  ordersPaid: number
  /** An order every this many months (1, 3 or 6). */
  intervalMonths: number
  /** Orders shown newest-last; this many OLDER ones are not listed (they are in "My orders"). */
  olderOrders: number
  schedule: ScheduleRow[]
  actions: SubscriptionAction[]
  /** The unpaid invoice, if any. */
  openInvoice: { id: string | number; dueDate: string | null; total: number; payPath: string; order: number } | null
  nextInvoiceDate: string | null
  nextDueDate: string | null
}

const STATUS: Record<SubscriptionStatus, { label: string; tone: SubscriptionView['statusTone'] }> = {
  pending_payment: { label: 'Waiting for first payment', tone: 'amber' },
  active: { label: 'Active', tone: 'green' },
  paused: { label: 'Paused', tone: 'blue' },
  lapsed: { label: 'On hold - invoice unpaid', tone: 'red' },
  completed: { label: 'Ended', tone: 'gray' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
}

export const statusLabel = (s: string) => STATUS[s as SubscriptionStatus]?.label ?? s

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''

/** The newest this many orders are listed on the page. */
const MAX_ORDERS_SHOWN = 8

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
  const intervalMonths = planInterval(sub.planMonths)
  const status = sub.status as SubscriptionStatus
  const meta = STATUS[status] ?? { label: sub.status, tone: 'gray' as const }

  // Best order per order number: a paid one wins over an open invoice; cancelled invoices are ignored.
  const paidByOrder = new Map<number, OrderLike>()
  const openByOrder = new Map<number, OrderLike>()
  for (const o of orders) {
    const n = Number(o.cycleNumber)
    if (!Number.isFinite(n) || n < 1) continue
    if (o.paymentStatus === 'captured') {
      const prev = paidByOrder.get(n)
      if (!prev || new Date(o.paidAt || o.updatedAt || 0) > new Date(prev.paidAt || prev.updatedAt || 0)) paidByOrder.set(n, o)
    } else if (o.orderType === 'subscription_cycle' && o.status === 'pending' && o.paymentStatus === 'unpaid') {
      openByOrder.set(n, o)
    }
  }

  const ordersPaid = paidByOrder.size
  const held = status === 'paused' || status === 'lapsed'

  // every order that exists (paid or open), oldest first
  const known = [...new Set([...paidByOrder.keys(), ...openByOrder.keys()])].sort((a, b) => a - b)
  const rows: ScheduleRow[] = known.map((n) => {
    const paid = paidByOrder.get(n)
    if (paid) {
      const shipped = ['fulfilled', 'shipped'].includes(String(paid.status))
      const delivered = paid.status === 'completed'
      return {
        order: n,
        state: delivered ? 'delivered' : shipped ? 'shipped' : 'paid',
        label: delivered ? 'Delivered' : shipped ? 'Shipped' : 'Paid - preparing to ship',
        date: paid.paidAt || paid.updatedAt || null,
        orderId: paid.id,
        orderNumber: String(paid.orderNumber || paid.id),
        total: paid.total ?? undefined,
        trackingLink: paid.trackingLink || null,
      } as ScheduleRow
    }
    const open = openByOrder.get(n)!
    return {
      order: n,
      state: 'awaiting_payment',
      label: 'Awaiting payment',
      date: open.invoiceDueDate || null,
      orderId: open.id,
      orderNumber: String(open.orderNumber || open.id),
      total: open.total ?? undefined,
      payPath: open.invoiceToken ? `/pay/${open.id}/${open.invoiceToken}` : undefined,
    } as ScheduleRow
  })

  // The next planned order (nothing is planned for a subscription that has ended). When an invoice is open, THAT is the next order.
  if (status !== 'completed' && status !== 'cancelled' && openByOrder.size === 0) {
    let next = 1
    while (paidByOrder.has(next)) next++
    rows.push({
      order: next,
      state: held ? 'skipped_hold' : 'upcoming',
      label: status === 'pending_payment' ? 'Waiting for first payment' : held ? (status === 'paused' ? 'On pause' : 'On hold') : 'Upcoming',
      date: status === 'pending_payment' ? null : sub.nextDueDate || null,
    })
  }

  const olderOrders = Math.max(0, rows.length - MAX_ORDERS_SHOWN)
  const schedule = olderOrders ? rows.slice(olderOrders) : rows

  // The single open invoice (there is at most one).
  let openInvoice: SubscriptionView['openInvoice'] = null
  for (const [n, o] of openByOrder) {
    if (o.invoiceToken) {
      openInvoice = { id: o.id, dueDate: o.invoiceDueDate || null, total: o.total ?? 0, payPath: `/pay/${o.id}/${o.invoiceToken}`, order: n }
      break
    }
  }

  // ---- which buttons are allowed right now -----------------------------------------------------------------
  const actions: SubscriptionAction[] = []
  if (status === 'active') {
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
  if (status === 'pending_payment') help = 'Your subscription starts as soon as your first payment is confirmed.'
  else if (status === 'active' && openInvoice) help = `Order ${openInvoice.order} is ready to pay${openInvoice.dueDate ? ` - due ${fmt(openInvoice.dueDate)}` : ''}. Your order ships once it is paid.`
  else if (status === 'active') help = sub.nextInvoiceDate ? `Your next invoice will be emailed on ${fmt(sub.nextInvoiceDate)}.` : 'Your next invoice will be emailed soon.'
  else if (status === 'paused') help = 'No invoices are sent while paused. Resume anytime: your next order keeps its normal date, and if that date has already passed the invoice is sent right away.'
  else if (status === 'lapsed') help = 'We did not receive payment for your last invoice, so your subscription is on hold. Pay a fresh invoice to continue.'
  else if (status === 'completed') help = 'This subscription has ended.'
  else if (status === 'cancelled') help = 'This subscription is cancelled. You can start a new one anytime.'

  return {
    statusLabel: meta.label,
    statusTone: meta.tone,
    statusHelp: help,
    ordersPaid,
    intervalMonths,
    olderOrders,
    schedule,
    actions,
    openInvoice,
    nextInvoiceDate: sub.nextInvoiceDate || null,
    nextDueDate: sub.nextDueDate || null,
  }
}
