import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Client } from 'pg'
import { createTestDatabase, bootPayload, seedStore, startActiveSubscription, stockOf, shutdown } from './helpers'

const h = vi.hoisted(() => ({ session: '' as string, user: null as any, jar: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (n: string) => (h.jar.has(n) ? { value: h.jar.get(n) } : undefined), set: (n: string, v: string) => void h.jar.set(n, v) }),
  headers: async () => new Headers(),
}))
vi.mock('next-auth/next', () => ({ getServerSession: async () => (h.session ? { user: { email: h.session } } : null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/auth/getPayloadUser', () => ({ getPayloadUser: async () => h.user }))

let db: Awaited<ReturnType<typeof createTestDatabase>>
let payload: any
let sent: { to?: string; bcc?: string; subject: string; html: string }[]
let store: { product: any; product2: any }

const setUser = (user: any, email: string) => {
  h.user = user
  h.session = email
}
const env = () => ({ payload, store, setUser })

beforeAll(async () => {
  db = await createTestDatabase()
  ;({ payload, sent } = await bootPayload(db.uri))
  store = await seedStore(payload)
})
afterAll(async () => {
  await shutdown(payload, db)
})

const DAY = 24 * 3600 * 1000
const getSub = (id: any) => payload.findByID({ collection: 'subscriptions', id, depth: 0, overrideAccess: true }) as Promise<any>
const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const mailsTo = (to: string) => sent.filter((m) => m.to === to)
const mark = () => sent.length
const since = (n: number) => sent.slice(n)
const markPaid = (id: any) => payload.update({ collection: 'orders', id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })

async function sqlOnTestDb(query: string, params: any[] = []) {
  const c = new Client({ host: '127.0.0.1', port: 54329, user: 'postgres', password: 'postgres', database: db.name })
  await c.connect()
  try {
    return (await c.query(query, params)).rows
  } finally {
    await c.end()
  }
}

async function withOpenInvoice(opts: Parameters<typeof startActiveSubscription>[1] = {}) {
  const s = await startActiveSubscription(env(), opts)
  const { processSubscriptions } = await import('@/lib/subscriptions/process')
  const sub = await getSub(s.subId)
  await processSubscriptions(payload, new Date(sub.nextInvoiceDate))
  const after = await getSub(s.subId)
  return { ...s, invoiceId: after.openInvoice as number, dueDate: new Date(after.nextDueDate) }
}

describe('unpaid invoice: reminders (never more than 3 emails), then lapse', () => {
  it('walks the whole timeline: nothing early, due-day reminder, final notice, then the plan goes on hold', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    const D = s.dueDate
    const at = (offsetDays: number, hour = 9) => new Date(Date.UTC(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate() + offsetDays, hour))
    const stockBefore = await stockOf(payload, store.product.id)
    const customerMailsBefore = mailsTo(s.email).length

    // before the due day: silence
    expect(await processSubscriptions(payload, at(-3))).toMatchObject({ dueDayReminders: 0, finalNotices: 0, lapsed: 0 })
    // due day: ONE friendly reminder
    expect(await processSubscriptions(payload, at(0))).toMatchObject({ dueDayReminders: 1, finalNotices: 0, lapsed: 0 })
    expect(mailsTo(s.email).filter((m) => /^Reminder:/.test(m.subject))).toHaveLength(1)
    // same day again, and the days after: no repeat
    expect(await processSubscriptions(payload, at(0, 20))).toMatchObject({ dueDayReminders: 0 })
    expect(await processSubscriptions(payload, at(3))).toMatchObject({ dueDayReminders: 0, finalNotices: 0 })
    // a week late: ONE final notice
    expect(await processSubscriptions(payload, at(7))).toMatchObject({ finalNotices: 1, lapsed: 0 })
    expect(await processSubscriptions(payload, at(10))).toMatchObject({ finalNotices: 0, lapsed: 0 })
    expect((await getOrder(s.invoiceId)).invoiceReminderStage).toBe(2)
    expect((await getSub(s.subId)).status).toBe('active') // still billing-eligible, invoice still payable

    // two weeks late: invoice cancelled, stock released, plan on hold, customer told, support alerted
    const run = await processSubscriptions(payload, at(14))
    expect(run).toMatchObject({ lapsed: 1, errors: 0 })
    const sub = await getSub(s.subId)
    expect(sub).toMatchObject({ status: 'lapsed', openInvoice: null, nextInvoiceDate: null })
    expect(sub.lapsedAt).toBeTruthy()
    expect((await getOrder(s.invoiceId)).status).toBe('cancelled')
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore + 2)

    const toCustomer = mailsTo(s.email).slice(customerMailsBefore).map((m) => m.subject)
    expect(toCustomer).toHaveLength(3) // reminder, final notice, on-hold notice - never spammy
    expect(toCustomer[0]).toMatch(/^Reminder:/)
    expect(toCustomer[1]).toMatch(/^Final notice:/)
    expect(toCustomer[2]).toMatch(/on hold/)
    expect(sent.some((m) => m.to === 'support@longeviaresearch.com' && /put on hold/.test(m.subject))).toBe(true)

    // lapsed plans are left alone afterwards
    const m = mark()
    expect(await processSubscriptions(payload, at(60))).toMatchObject({ invoicesCreated: 0, lapsed: 0, dueDayReminders: 0, finalNotices: 0 })
    expect(since(m)).toHaveLength(0)
  })

  it('if the daily job missed days, it catches up with ONE email (the lapse notice), not a burst of reminders', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    const m = mark()
    const run = await processSubscriptions(payload, new Date(s.dueDate.getTime() + 20 * DAY))
    expect(run).toMatchObject({ lapsed: 1, dueDayReminders: 0, finalNotices: 0 })
    expect(since(m).filter((x) => x.to === s.email)).toHaveLength(1)
    expect((await getSub(s.subId)).status).toBe('lapsed')
  })

  it('paying on time stops the reminders: no final notice, no lapse for the paid month', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    await processSubscriptions(payload, s.dueDate) // the due-day reminder goes out
    await markPaid(s.invoiceId)
    const m = mark()
    const later = await processSubscriptions(payload, new Date(s.dueDate.getTime() + 10 * DAY))
    expect(later).toMatchObject({ dueDayReminders: 0, finalNotices: 0, lapsed: 0, errors: 0 })
    // (the NEXT month's invoice may legitimately appear this far in the future - but nothing about the paid month)
    expect(since(m).filter((x) => x.to === s.email && /^(Reminder|Final notice)|on hold/.test(x.subject))).toHaveLength(0)
    expect((await getSub(s.subId)).status).toBe('active')
  })

  it('a late daily job never hands out an invoice that is already overdue, and never reminds in the same run', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await startActiveSubscription(env())
    const sub = await getSub(s.subId)
    const veryLate = new Date(new Date(sub.nextDueDate).getTime() + 5 * DAY) // job was down for days past the due date
    const m = mark()
    const run = await processSubscriptions(payload, veryLate)
    expect(run).toMatchObject({ invoicesCreated: 1, dueDayReminders: 0, finalNotices: 0, lapsed: 0 })
    const inv = await getOrder((await getSub(s.subId)).openInvoice)
    expect(new Date(inv.invoiceDueDate).getTime()).toBe(veryLate.getTime() + 2 * DAY) // at least 2 days to pay
    expect(since(m).filter((x) => x.to === s.email)).toHaveLength(1) // just the invoice
  })

  it('an invoice created in the last 3 days is never lapsed or final-noticed, whatever its due date says', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    // an invoice that was only just created, but whose due date is long past (e.g. made by hand in the admin)
    await payload.update({ collection: 'orders', id: s.invoiceId, data: { invoiceDueDate: new Date(Date.now() - 30 * DAY).toISOString() } as any, overrideAccess: true })
    const run = await processSubscriptions(payload, new Date())
    expect(run.lapsed).toBe(0)
    expect(run.finalNotices).toBe(0)
    expect((await getSub(s.subId)).status).toBe('active')
  })
})

describe('after the plan is on hold: reactivate, or a late payment', () => {
  async function lapse() {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    await processSubscriptions(payload, new Date(s.dueDate.getTime() + 14 * DAY))
    expect((await getSub(s.subId)).status).toBe('lapsed')
    return s
  }

  it('"pay to reactivate" creates a fresh invoice for the SAME month; paying it restarts the plan', async () => {
    const { reactivateSubscription } = await import('@/lib/subscriptions/service')
    const s = await lapse()
    const res: any = await reactivateSubscription(payload, s.subId)
    expect(res.ok).toBe(true)
    expect(res.orderId).not.toBe(s.invoiceId)
    const fresh = await getOrder(res.orderId)
    expect(fresh).toMatchObject({ cycleNumber: 2, paymentStatus: 'unpaid', status: 'pending' })
    expect((await getSub(s.subId)).status).toBe('lapsed') // still on hold until it is actually paid

    await markPaid(fresh.id)
    const sub = await getSub(s.subId)
    expect(sub).toMatchObject({ status: 'active', cyclesCompleted: 2, openInvoice: null })
    expect(sub.lapsedAt).toBeNull()
    expect(new Date(sub.nextDueDate).getTime()).toBeGreaterThan(Date.now() + 25 * DAY)
  })

  it('reactivating something that is not on hold is refused', async () => {
    const { reactivateSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    expect(await reactivateSubscription(payload, s.subId)).toMatchObject({ ok: false })
  })

  it('a late card payment for the OLD, cancelled invoice still counts: the order is paid, stock re-reserved, plan resumes', async () => {
    const { markSubscriptionOrderPaid } = await import('@/lib/subscriptions/service')
    const s = await lapse()
    const stockBefore = await stockOf(payload, store.product.id)
    expect(await markSubscriptionOrderPaid(payload, s.invoiceId, { txnId: 'LATE-1' })).toBe(true)
    const order = await getOrder(s.invoiceId)
    expect(order).toMatchObject({ status: 'paid', paymentStatus: 'captured', paymentTxnId: 'LATE-1', isFinalized: true })
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore - 2)
    expect(await getSub(s.subId)).toMatchObject({ status: 'active', cyclesCompleted: 2 })
  })

  it('paying the same month twice (old + reactivation invoice) counts it once and alerts support', async () => {
    const { reactivateSubscription } = await import('@/lib/subscriptions/service')
    const s = await lapse()
    const res: any = await reactivateSubscription(payload, s.subId)
    await markPaid(res.orderId)
    const m = mark()
    await markPaid(s.invoiceId) // the customer ALSO paid the cancelled one
    expect((await getSub(s.subId)).cyclesCompleted).toBe(2)
    expect(since(m).some((x) => x.to === 'support@longeviaresearch.com' && /duplicate subscription payment/i.test(x.subject))).toBe(true)
  })
})

describe('first payment never arrives', () => {
  it('after the expiry window the unpaid first order and the subscription are cancelled and stock is released', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const stockBefore = await stockOf(payload, store.product.id)
    const s = await startActiveSubscription(env(), { markPaid: false })
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore - 2) // reserved at checkout, like any Zelle order

    expect((await processSubscriptions(payload, new Date(Date.now() + 10 * DAY))).firstPaymentsExpired).toBe(0) // too early
    expect((await getSub(s.subId)).status).toBe('pending_payment')

    const run = await processSubscriptions(payload, new Date(Date.now() + 15 * DAY))
    expect(run.firstPaymentsExpired).toBe(1)
    expect(await getSub(s.subId)).toMatchObject({ status: 'cancelled' })
    expect(await getOrder(s.firstOrderId)).toMatchObject({ status: 'cancelled', isFinalized: false })
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore)
  })

  it('a payment that finally arrives still starts the subscription', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await startActiveSubscription(env(), { markPaid: false })
    await processSubscriptions(payload, new Date(Date.now() + 15 * DAY))
    expect((await getSub(s.subId)).status).toBe('cancelled')
    await markPaid(s.firstOrderId)
    expect(await getSub(s.subId)).toMatchObject({ status: 'active', cyclesCompleted: 1 })
  })

  it('a payment on a subscription STAFF cancelled does not restart billing - support is told instead', async () => {
    const s = await startActiveSubscription(env())
    const invoice = await withOpenInvoiceFor(s)
    await payload.update({ collection: 'subscriptions', id: s.subId, data: { status: 'cancelled' } as any, overrideAccess: true })
    const m = mark()
    await markPaid(invoice)
    const sub = await getSub(s.subId)
    expect(sub.status).toBe('cancelled')
    expect(since(m).some((x) => x.to === 'support@longeviaresearch.com' && /cancelled subscription/i.test(x.subject))).toBe(true)
  })
})

async function withOpenInvoiceFor(s: { subId: number }) {
  const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
  const res: any = await orderNextMonthNow(payload, s.subId)
  return res.orderId as number
}

describe('staff change the status in the admin', () => {
  it('setting Paused or Cancelled cancels the unpaid invoice and releases its stock', async () => {
    for (const status of ['paused', 'cancelled', 'completed'] as const) {
      const s = await withOpenInvoice()
      const stockBefore = await stockOf(payload, store.product.id)
      await payload.update({ collection: 'subscriptions', id: s.subId, data: { status } as any, overrideAccess: true })
      const sub = await getSub(s.subId)
      expect(sub.status).toBe(status)
      expect(sub.openInvoice).toBeNull()
      expect(sub.nextInvoiceDate).toBeNull()
      expect((await getOrder(s.invoiceId)).status).toBe('cancelled')
      expect(await stockOf(payload, store.product.id)).toBe(stockBefore + 2)
    }
  })

  it('setting a paused plan back to Active follows the calendar: a short pause keeps the normal invoice day; once the date has passed, the next daily run invoices it', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const day = 24 * 3600 * 1000

    // short pause: the normal invoice day is kept, nothing is invoiced early
    const a = await startActiveSubscription(env())
    const before = await getSub(a.subId)
    await payload.update({ collection: 'subscriptions', id: a.subId, data: { status: 'paused' } as any, overrideAccess: true })
    await payload.update({ collection: 'subscriptions', id: a.subId, data: { status: 'active' } as any, overrideAccess: true })
    const subA = await getSub(a.subId)
    expect(subA.status).toBe('active')
    expect(subA.pausedAt).toBeNull()
    expect(new Date(subA.nextInvoiceDate).getTime()).toBe(new Date(before.nextInvoiceDate).getTime())
    await processSubscriptions(payload, new Date())
    expect((await getSub(a.subId)).openInvoice).toBeNull()

    // the month's date passed while paused: the next daily run invoices it
    const b = await startActiveSubscription(env())
    await payload.update({ collection: 'subscriptions', id: b.subId, data: { status: 'paused' } as any, overrideAccess: true })
    await payload.update({ collection: 'orders', id: b.firstOrderId, data: { paidAt: new Date(Date.now() - 90 * day).toISOString() } as any, overrideAccess: true })
    await payload.update({ collection: 'subscriptions', id: b.subId, data: { nextDueDate: new Date(Date.now() - 60 * day).toISOString() } as any, overrideAccess: true })
    await payload.update({ collection: 'subscriptions', id: b.subId, data: { status: 'active' } as any, overrideAccess: true })
    expect(new Date((await getSub(b.subId)).nextInvoiceDate).getTime()).toBeLessThanOrEqual(Date.now() + 1000)
    await processSubscriptions(payload, new Date())
    expect((await getSub(b.subId)).openInvoice).toBeTruthy()
  })

  it('editing other fields (note, address) does not disturb billing', async () => {
    const s = await withOpenInvoice()
    await payload.update({ collection: 'subscriptions', id: s.subId, data: { adminNote: 'VIP' } as any, overrideAccess: true })
    const sub = await getSub(s.subId)
    expect(sub).toMatchObject({ status: 'active', adminNote: 'VIP' })
    expect(sub.openInvoice).toBe(s.invoiceId)
    expect((await getOrder(s.invoiceId)).status).toBe('pending')
  })
})

describe('two things at the same instant', () => {
  it('two "order next month now" clicks create exactly ONE open invoice', async () => {
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const [a, b]: any[] = await Promise.all([orderNextMonthNow(payload, s.subId), orderNextMonthNow(payload, s.subId)])
    expect(a.ok && b.ok).toBe(true)
    expect(a.orderId).toBe(b.orderId)
    const open = await sqlOnTestDb(`select id from orders where subscription_id = $1 and order_type = 'subscription_cycle' and status = 'pending' and payment_status = 'unpaid'`, [s.subId])
    expect(open).toHaveLength(1)
  })

  it('the daily job and a customer click racing each other still leave exactly one invoice (and one email)', async () => {
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await startActiveSubscription(env())
    const sub = await getSub(s.subId)
    const m = mark()
    await Promise.all([processSubscriptions(payload, new Date(sub.nextInvoiceDate)), orderNextMonthNow(payload, s.subId)])
    const open = await sqlOnTestDb(`select id from orders where subscription_id = $1 and order_type = 'subscription_cycle' and status = 'pending' and payment_status = 'unpaid'`, [s.subId])
    expect(open).toHaveLength(1)
    const invoiceMails = since(m).filter((x) => x.to === s.email && /^Subscription invoice/.test(x.subject))
    expect(invoiceMails).toHaveLength(1)
  })

  it('the database itself refuses a second open invoice for the same month', async () => {
    const s = await withOpenInvoice()
    await expect(
      payload.create({
        collection: 'orders',
        overrideAccess: true,
        data: { owner: s.user.id, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'zelle', total: 5, orderType: 'subscription_cycle', subscription: s.subId, cycleNumber: 2, cyclesTotal: 3, items: [{ product: store.product.id, quantity: 1, price: 5 }] } as any,
      }),
    ).rejects.toThrow()
  })
})

describe('the generic unpaid-order cleanup leaves subscription invoices alone', () => {
  it('cancels an abandoned card order after 72h, but never a monthly invoice (it follows its own lapse rules)', async () => {
    const { expirePendingOrders } = await import('@/lib/orders/expirePending')
    // a card invoice (month 2) and a card FIRST month nobody paid, both backdated 5 days
    const withInvoice = await withOpenInvoice({ method: 'authnet_bridge' })
    const abandoned = await startActiveSubscription(env(), { method: 'authnet_bridge', markPaid: false })
    await sqlOnTestDb(`update orders set created_at = now() - interval '5 days' where id = any($1)`, [[withInvoice.invoiceId, abandoned.firstOrderId]])

    const run = await expirePendingOrders()
    expect(run.failed).toBe(0)
    expect((await getOrder(withInvoice.invoiceId)).status).toBe('pending') // untouched
    expect((await getOrder(abandoned.firstOrderId)).status).toBe('cancelled')
    expect((await getSub(abandoned.subId)).status).toBe('cancelled') // never started
    expect((await getSub(withInvoice.subId)).status).toBe('active')
  })
})
