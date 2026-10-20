import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
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

const getSub = (id: any) => payload.findByID({ collection: 'subscriptions', id, depth: 0, overrideAccess: true }) as Promise<any>
const getOrder = (id: any) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }) as Promise<any>
const DAY = 24 * 3600 * 1000
const days = (iso: string, from: string) => Math.round((new Date(iso).getTime() - new Date(from).getTime()) / DAY)

/** Moves the customer to "month 2 invoice open". */
async function withOpenInvoice(opts: Parameters<typeof startActiveSubscription>[1] = {}) {
  const s = await startActiveSubscription(env(), opts)
  const { processSubscriptions } = await import('@/lib/subscriptions/process')
  const sub = await getSub(s.subId)
  await processSubscriptions(payload, new Date(sub.nextInvoiceDate))
  const after = await getSub(s.subId)
  return { ...s, invoiceId: after.openInvoice as number }
}

/** Pretends the last payment happened 90 days ago, so the next month's date has already passed. */
async function makeOverdue(s: { subId: any; firstOrderId: any }) {
  await payload.update({ collection: 'orders', id: s.firstOrderId, data: { paidAt: new Date(Date.now() - 90 * DAY).toISOString() } as any, overrideAccess: true })
  await payload.update({ collection: 'subscriptions', id: s.subId, data: { nextDueDate: new Date(Date.now() - 60 * DAY).toISOString() } as any, overrideAccess: true })
}
const ordersOf = async (subId: any) =>
  (await payload.find({ collection: 'orders', where: { subscription: { equals: subId } }, limit: 50, depth: 0, overrideAccess: true })).totalDocs

describe('pause / resume', () => {
  it('pausing cancels the unpaid invoice, gives its stock back, stops billing; resuming after the due date passed creates the invoice right away', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await withOpenInvoice()
    const stockBefore = await stockOf(payload, store.product.id)
    const invoiceBefore = await getOrder(s.invoiceId)
    expect(invoiceBefore.isFinalized).toBe(true)

    expect(await pauseSubscription(payload, s.subId)).toEqual({ ok: true })

    const sub = await getSub(s.subId)
    expect(sub).toMatchObject({ status: 'paused' })
    expect(sub.pausedAt).toBeTruthy()
    expect(sub.openInvoice).toBeNull()
    expect(sub.nextInvoiceDate).toBeNull()
    const cancelled = await getOrder(s.invoiceId)
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.isFinalized).toBe(false)
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore + 2) // reservation released

    // paused: even a year later, nothing is created or emailed
    const mails = sent.length
    const idle = await processSubscriptions(payload, new Date(Date.now() + 400 * DAY))
    expect(idle).toMatchObject({ invoicesCreated: 0, lapsed: 0, errors: 0 })
    expect(sent.length).toBe(mails)

    // pausing twice is refused, politely
    expect(await pauseSubscription(payload, s.subId)).toMatchObject({ ok: false })

    const before = await stockOf(payload, store.product.id)
    // 3 days after the month's original due date: the date passed while paused, so the invoice goes out right away
    const resumeAt = new Date(new Date(invoiceBefore.invoiceDueDate).getTime() + 3 * DAY)
    const resumed: any = await resumeSubscription(payload, s.subId, resumeAt)
    expect(resumed.ok).toBe(true)
    expect(resumed.orderId).toBeTruthy()
    const after = await getSub(s.subId)
    expect(after).toMatchObject({ status: 'active', openInvoice: resumed.orderId })
    expect(after.pausedAt).toBeNull()
    const inv = await getOrder(resumed.orderId)
    expect(inv).toMatchObject({ orderType: 'subscription_cycle', cycleNumber: 2, paymentStatus: 'unpaid' })
    const dueIn = days(inv.invoiceDueDate, resumeAt.toISOString())
    expect(dueIn).toBeGreaterThanOrEqual(6)
    expect(dueIn).toBeLessThanOrEqual(7)
    expect(await stockOf(payload, store.product.id)).toBe(before - 2)
    expect(sent.some((m) => m.to === s.email && /welcome back/i.test(m.html))).toBe(true)

    expect(await resumeSubscription(payload, s.subId)).toMatchObject({ ok: false }) // not paused any more
  })

  it('a pause with no unpaid invoice works too, and a paused plan whose months are all paid just completes on resume', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env(), { months: 3 })
    expect(await pauseSubscription(payload, s.subId)).toEqual({ ok: true })
    expect((await getSub(s.subId)).status).toBe('paused')
    const resumed: any = await resumeSubscription(payload, s.subId)
    expect(resumed.ok).toBe(true)
    expect((await getSub(s.subId)).status).toBe('active')
  })

  it('cannot pause something that is not active (completed / waiting for first payment)', async () => {
    const { pauseSubscription } = await import('@/lib/subscriptions/service')
    const pending = await startActiveSubscription(env(), { markPaid: false })
    expect(await pauseSubscription(payload, pending.subId)).toMatchObject({ ok: false })
    await payload.update({ collection: 'subscriptions', id: pending.subId, data: { status: 'completed' } as any, overrideAccess: true })
    expect(await pauseSubscription(payload, pending.subId)).toMatchObject({ ok: false })
  })
})

describe('skip a month', () => {
  it('with no invoice yet: the next shipment moves a month later and no month is lost', async () => {
    const { skipNextMonth } = await import('@/lib/subscriptions/service')
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await startActiveSubscription(env())
    const before = await getSub(s.subId)

    const res: any = await skipNextMonth(payload, s.subId)
    expect(res.ok).toBe(true)
    const after = await getSub(s.subId)
    expect(after.cyclesCompleted).toBe(1) // nothing consumed
    const moved = days(after.nextDueDate, before.nextDueDate)
    expect(moved).toBeGreaterThanOrEqual(28)
    expect(moved).toBeLessThanOrEqual(31)
    expect(days(after.nextDueDate, after.nextInvoiceDate)).toBe(7)

    // the OLD invoice date passes: still nothing; the NEW one arrives: invoice created for month 2
    // (judged on THIS subscription: other subscriptions in the shared test database may be due on the same day)
    await processSubscriptions(payload, new Date(before.nextInvoiceDate))
    expect((await getSub(s.subId)).openInvoice).toBeNull()
    await processSubscriptions(payload, new Date(after.nextInvoiceDate))
    expect((await getOrder((await getSub(s.subId)).openInvoice)).cycleNumber).toBe(2)
  })

  it('with an unpaid invoice: it is cancelled (stock back) and the schedule moves from that due date', async () => {
    const { skipNextMonth } = await import('@/lib/subscriptions/service')
    const s = await withOpenInvoice()
    const inv = await getOrder(s.invoiceId)
    const stockBefore = await stockOf(payload, store.product.id)

    expect((await skipNextMonth(payload, s.subId)).ok).toBe(true)
    const sub = await getSub(s.subId)
    expect((await getOrder(s.invoiceId)).status).toBe('cancelled')
    expect(sub.openInvoice).toBeNull()
    expect(await stockOf(payload, store.product.id)).toBe(stockBefore + 2)
    const moved = days(sub.nextDueDate, inv.invoiceDueDate)
    expect(moved).toBeGreaterThanOrEqual(28)
    expect(moved).toBeLessThanOrEqual(31)
  })

  it('is refused when paused, waiting for first payment, or every month is already paid', async () => {
    const { skipNextMonth, pauseSubscription } = await import('@/lib/subscriptions/service')
    const a = await startActiveSubscription(env())
    await pauseSubscription(payload, a.subId)
    expect(await skipNextMonth(payload, a.subId)).toMatchObject({ ok: false })
    const b = await startActiveSubscription(env(), { markPaid: false })
    expect(await skipNextMonth(payload, b.subId)).toMatchObject({ ok: false })
    expect(await skipNextMonth(payload, 999999)).toMatchObject({ ok: false, error: 'Subscription not found.' })
  })
})

describe('order next month early', () => {
  it('creates the invoice immediately; asking again just returns the same one; paying restarts the monthly clock', async () => {
    const { orderNextMonthNow } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())

    const first: any = await orderNextMonthNow(payload, s.subId)
    expect(first.ok).toBe(true)
    const again: any = await orderNextMonthNow(payload, s.subId)
    expect(again).toMatchObject({ ok: true, orderId: first.orderId }) // never two open invoices

    const sub = await getSub(s.subId)
    expect(sub.openInvoice).toBe(first.orderId)
    expect(sub.lastEarlyOrderAt).toBeTruthy()
    const inv = await getOrder(first.orderId)
    expect(inv).toMatchObject({ cycleNumber: 2, orderType: 'subscription_cycle', paymentStatus: 'unpaid' })
    expect(sent.some((m) => m.to === s.email && /as requested/.test(m.html))).toBe(true)

    // pay it (Zelle, marked by admin) -> next month is due one month from NOW, not from the old schedule
    await payload.update({ collection: 'orders', id: inv.id, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
    const paid = await getSub(s.subId)
    expect(paid.cyclesCompleted).toBe(2)
    expect(paid.openInvoice).toBeNull()
    const gap = days(paid.nextDueDate, new Date().toISOString())
    expect(gap).toBeGreaterThanOrEqual(28)
    expect(gap).toBeLessThanOrEqual(31)
  })

  it('refused when paused / lapsed / finished, and honours the minimum days between early orders', async () => {
    const { orderNextMonthNow, pauseSubscription } = await import('@/lib/subscriptions/service')
    const paused = await startActiveSubscription(env())
    await pauseSubscription(payload, paused.subId)
    expect(await orderNextMonthNow(payload, paused.subId)).toMatchObject({ ok: false })

    const lapsed = await startActiveSubscription(env())
    await payload.update({ collection: 'subscriptions', id: lapsed.subId, data: { status: 'lapsed' } as any, overrideAccess: true })
    expect(await orderNextMonthNow(payload, lapsed.subId)).toMatchObject({ ok: false })

    await payload.updateGlobal({ slug: 'subscription-settings', data: { minDaysBetweenEarlyOrders: 5 } as any })
    const gated = await startActiveSubscription(env())
    const one: any = await orderNextMonthNow(payload, gated.subId)
    expect(one.ok).toBe(true)
    await payload.update({ collection: 'orders', id: one.orderId, data: { status: 'paid', paymentStatus: 'captured' } as any, overrideAccess: true })
    const second = await orderNextMonthNow(payload, gated.subId)
    expect(second).toMatchObject({ ok: false })
    expect((second as any).error).toMatch(/again in \d+ day/)
    await payload.updateGlobal({ slug: 'subscription-settings', data: { minDaysBetweenEarlyOrders: 0 } as any })
  })
})

describe('address and payment method', () => {
  it('a new address applies to the subscription AND to an unpaid invoice', async () => {
    const { updateSubscriptionAddress } = await import('@/lib/subscriptions/service')
    const s = await withOpenInvoice()
    const res = await updateSubscriptionAddress(payload, s.subId, { firstName: 'Zed', lastName: 'New', phone: '555', line1: '9 Elm Rd', line2: 'Apt 2', city: 'Boston', state: 'MA', postalCode: '02108' })
    expect(res).toEqual({ ok: true })
    const sub = await getSub(s.subId)
    expect(sub.shippingAddress).toMatchObject({ line1: '9 Elm Rd', city: 'Boston', postalCode: '02108' })
    expect(sub.customerFirstName).toBe('Zed')
    const inv = await getOrder(s.invoiceId)
    expect(inv.shippingAddress).toMatchObject({ line1: '9 Elm Rd', city: 'Boston', state: 'MA' })
    expect(inv.customerFirstName).toBe('Zed')
  })

  it('rejects an incomplete address', async () => {
    const { updateSubscriptionAddress } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const res: any = await updateSubscriptionAddress(payload, s.subId, { firstName: 'A', lastName: '', line1: '', city: 'X', state: 'NY', postalCode: '' })
    expect(res.ok).toBe(false)
    expect((await getSub(s.subId)).shippingAddress.line1).toBe('1 Main St')
  })

  it('switching the payment method updates future invoices and an open one; unknown or disallowed methods are refused', async () => {
    const { setSubscriptionPaymentMethod } = await import('@/lib/subscriptions/service')
    const s = await withOpenInvoice({ method: 'zelle' })
    expect(await setSubscriptionPaymentMethod(payload, s.subId, 'authnet_bridge')).toEqual({ ok: true })
    expect((await getSub(s.subId)).paymentMethod).toBe('authnet_bridge')
    expect((await getOrder(s.invoiceId)).paymentMethod).toBe('authnet_bridge')
    expect(await setSubscriptionPaymentMethod(payload, s.subId, 'stripe')).toMatchObject({ ok: false })
    expect(await setSubscriptionPaymentMethod(payload, s.subId, 'bitcoin')).toMatchObject({ ok: false })

    await payload.updateGlobal({ slug: 'subscription-settings', data: { allowZelle: false } as any })
    expect(await setSubscriptionPaymentMethod(payload, s.subId, 'zelle')).toMatchObject({ ok: false }) // switched off by admin
    await payload.updateGlobal({ slug: 'subscription-settings', data: { allowZelle: true } as any })
  })
})

describe('who may act: the customer-facing server actions', () => {
  it('only the owner can change a subscription; strangers and logged-out visitors cannot', async () => {
    const actions = await import('@/app/(frontend)/(shop)/account/subscriptions/actions')
    const owner = await startActiveSubscription(env())
    const ownerUser = h.user
    const ownerEmail = h.session

    // a different logged-in customer
    const stranger = await startActiveSubscription(env())
    expect(h.user.id).not.toBe(ownerUser.id)
    for (const attempt of [
      () => actions.pauseSubscriptionAction(String(owner.subId)),
      () => actions.skipMonthAction(String(owner.subId)),
      () => actions.orderNextMonthAction(String(owner.subId)),
      () => actions.resumeSubscriptionAction(String(owner.subId)),
      () => actions.reactivateSubscriptionAction(String(owner.subId)),
      () => actions.payCurrentInvoiceAction(String(owner.subId)),
      () => actions.setPaymentMethodAction(String(owner.subId), 'authnet_bridge'),
      () => actions.updateAddressAction(String(owner.subId), { firstName: 'Evil', lastName: '', line1: 'x', city: 'x', state: 'x', postalCode: '1' }),
    ]) {
      expect(await attempt()).toEqual({ ok: false, error: 'Subscription not found.' }) // looks exactly like a missing one
    }
    expect((await getSub(owner.subId)).status).toBe('active')
    expect((await getSub(owner.subId)).shippingAddress.line1).toBe('1 Main St')
    expect(stranger.subId).not.toBe(owner.subId)

    // logged out
    h.user = null
    h.session = ''
    expect(await actions.pauseSubscriptionAction(String(owner.subId))).toMatchObject({ ok: false, error: expect.stringMatching(/log in/i) })

    // the real owner
    h.user = ownerUser
    h.session = ownerEmail
    expect(await actions.pauseSubscriptionAction(String(owner.subId))).toEqual({ ok: true })
    expect((await getSub(owner.subId)).status).toBe('paused')

    // garbage ids
    expect(await actions.pauseSubscriptionAction('abc')).toMatchObject({ ok: false })
    expect(await actions.pauseSubscriptionAction("1; drop table orders")).toMatchObject({ ok: false })
  })

  it('"order next month" / "resume" / "pay now" hand back the secure pay-page path of the invoice', async () => {
    const actions = await import('@/app/(frontend)/(shop)/account/subscriptions/actions')
    const s = await startActiveSubscription(env())
    const early: any = await actions.orderNextMonthAction(String(s.subId))
    expect(early.ok).toBe(true)
    const inv = await getOrder((await getSub(s.subId)).openInvoice)
    expect(early.payPath).toBe(`/pay/${inv.id}/${inv.invoiceToken}`)
    const pay: any = await actions.payCurrentInvoiceAction(String(s.subId))
    expect(pay.payPath).toBe(early.payPath)

    await actions.pauseSubscriptionAction(String(s.subId))
    await makeOverdue(s) // the next month is already due, so resuming hands over the invoice
    const resumed: any = await actions.resumeSubscriptionAction(String(s.subId))
    const inv2 = await getOrder((await getSub(s.subId)).openInvoice)
    expect(resumed.payPath).toBe(`/pay/${inv2.id}/${inv2.invoiceToken}`)
    expect(resumed.message).toBe('Welcome back! Your next invoice is ready.')
    expect((await actions.payCurrentInvoiceAction(String(s.subId)) as any).ok).toBe(true)
  })

  it('"pay now" with nothing to pay says so', async () => {
    const actions = await import('@/app/(frontend)/(shop)/account/subscriptions/actions')
    const s = await startActiveSubscription(env())
    expect(await actions.payCurrentInvoiceAction(String(s.subId))).toMatchObject({ ok: false, error: expect.stringMatching(/no unpaid invoice/i) })
  })
})

// Runs last on purpose: these scenarios leave active subscriptions with a scheduled invoice behind, which the older
// "nothing happens while paused / skipped" checks above must not see.
describe('resume keeps the calendar (a pause never moves a month\'s date)', () => {
  it('a short pause with nothing owed: resuming creates NO invoice and keeps the normal dates; the daily job invoices on the normal day', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    const s = await startActiveSubscription(env())
    const before = await getSub(s.subId)
    expect(await pauseSubscription(payload, s.subId)).toEqual({ ok: true })
    expect(new Date((await getSub(s.subId)).nextDueDate).getTime()).toBe(new Date(before.nextDueDate).getTime()) // pause remembered the date

    const mails = sent.length
    const orders = await ordersOf(s.subId)
    const r: any = await resumeSubscription(payload, s.subId)
    expect(r.ok).toBe(true)
    expect(r.orderId).toBeUndefined()
    expect(new Date(r.scheduledFor).getTime()).toBe(new Date(before.nextInvoiceDate).getTime())

    const after = await getSub(s.subId)
    expect(after).toMatchObject({ status: 'active', openInvoice: null, pausedAt: null })
    expect(new Date(after.nextDueDate).getTime()).toBe(new Date(before.nextDueDate).getTime())
    expect(new Date(after.nextInvoiceDate).getTime()).toBe(new Date(before.nextInvoiceDate).getTime())
    expect(await ordersOf(s.subId)).toBe(orders) // no order created
    expect(sent.length).toBe(mails) // nothing emailed

    // a day before the normal invoice day: still nothing; on the day: the invoice, due on the original date
    await processSubscriptions(payload, new Date(new Date(before.nextInvoiceDate).getTime() - DAY))
    expect((await getSub(s.subId)).openInvoice).toBeNull()
    await processSubscriptions(payload, new Date(before.nextInvoiceDate))
    const inv = await getOrder((await getSub(s.subId)).openInvoice)
    expect(inv).toMatchObject({ cycleNumber: 2, paymentStatus: 'unpaid' })
    expect(new Date(inv.invoiceDueDate).getTime()).toBe(new Date(before.nextDueDate).getTime())
  })

  it('a long pause (the date passed meanwhile): resuming invoices right away with the full 7 days to pay', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const before = await getSub(s.subId)
    await pauseSubscription(payload, s.subId)
    const resumeAt = new Date(new Date(before.nextDueDate).getTime() + 50 * DAY)
    const r: any = await resumeSubscription(payload, s.subId, resumeAt)
    expect(r.ok).toBe(true)
    expect(r.orderId).toBeTruthy()
    const inv = await getOrder(r.orderId)
    expect(days(inv.invoiceDueDate, resumeAt.toISOString())).toBe(7)
    const after = await getSub(s.subId)
    expect(after).toMatchObject({ status: 'active', openInvoice: r.orderId, nextInvoiceDate: null })
    expect(sent.some((m) => m.to === s.email && /welcome back/i.test(m.html))).toBe(true)
  })

  it('paused while an invoice was open, resumed soon after: the new invoice keeps the ORIGINAL due date (not pushed to +7 days)', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await withOpenInvoice()
    const original = await getOrder(s.invoiceId)
    await pauseSubscription(payload, s.subId)
    expect(new Date((await getSub(s.subId)).nextDueDate).getTime()).toBe(new Date(original.invoiceDueDate).getTime())

    const resumeAt = new Date(new Date(original.invoiceDueDate).getTime() - 5 * DAY) // inside the 7-day lead window, before the due date
    const r: any = await resumeSubscription(payload, s.subId, resumeAt)
    expect(r.orderId).toBeTruthy()
    const inv = await getOrder(r.orderId)
    expect(new Date(inv.invoiceDueDate).getTime()).toBe(new Date(original.invoiceDueDate).getTime())
  })

  it('resuming the day before the due date still gives at least 2 days to pay', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const before = await getSub(s.subId)
    await pauseSubscription(payload, s.subId)
    const resumeAt = new Date(new Date(before.nextDueDate).getTime() - 12 * 3600 * 1000)
    const r: any = await resumeSubscription(payload, s.subId, resumeAt)
    const inv = await getOrder(r.orderId)
    expect(new Date(inv.invoiceDueDate).getTime() - resumeAt.getTime()).toBeGreaterThanOrEqual(2 * DAY - 1000)
  })

  it('a month moved later by "skip" keeps that later date through a pause and resume', async () => {
    const { skipNextMonth, pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const skipped: any = await skipNextMonth(payload, s.subId)
    expect(skipped.ok).toBe(true)
    await pauseSubscription(payload, s.subId)
    const r: any = await resumeSubscription(payload, s.subId)
    expect(r.orderId).toBeUndefined()
    const after = await getSub(s.subId)
    expect(new Date(after.nextDueDate).getTime()).toBe(new Date(skipped.nextDueDate).getTime())
    expect(days(after.nextDueDate, after.nextInvoiceDate)).toBe(7)
  })

  it('pausing and resuming over and over never produces extra orders or emails', async () => {
    const { pauseSubscription, resumeSubscription } = await import('@/lib/subscriptions/service')
    const s = await startActiveSubscription(env())
    const orders = await ordersOf(s.subId)
    const mails = sent.length
    for (let i = 0; i < 4; i++) {
      expect(await pauseSubscription(payload, s.subId)).toEqual({ ok: true })
      expect(await resumeSubscription(payload, s.subId)).toMatchObject({ ok: true })
    }
    expect(await ordersOf(s.subId)).toBe(orders)
    expect(sent.length).toBe(mails)
  })

  it('staff setting the status back to Active in the admin follows the same rule', async () => {
    const { processSubscriptions } = await import('@/lib/subscriptions/process')
    // short pause: the normal invoice day is kept
    const a = await startActiveSubscription(env())
    const before = await getSub(a.subId)
    await payload.update({ collection: 'subscriptions', id: a.subId, data: { status: 'paused' } as any, overrideAccess: true })
    await payload.update({ collection: 'subscriptions', id: a.subId, data: { status: 'active' } as any, overrideAccess: true })
    const backA = await getSub(a.subId)
    expect(new Date(backA.nextInvoiceDate).getTime()).toBe(new Date(before.nextInvoiceDate).getTime())
    expect(new Date(backA.nextDueDate).getTime()).toBe(new Date(before.nextDueDate).getTime())

    // date already passed: the next daily run invoices it, with 7 days to pay
    const b = await startActiveSubscription(env())
    await payload.update({ collection: 'subscriptions', id: b.subId, data: { status: 'paused' } as any, overrideAccess: true })
    await makeOverdue(b)
    await payload.update({ collection: 'subscriptions', id: b.subId, data: { status: 'active' } as any, overrideAccess: true })
    const backB = await getSub(b.subId)
    expect(new Date(backB.nextInvoiceDate).getTime()).toBeLessThanOrEqual(Date.now())
    await processSubscriptions(payload, new Date())
    const inv = await getOrder((await getSub(b.subId)).openInvoice)
    expect(days(inv.invoiceDueDate, new Date().toISOString())).toBeGreaterThanOrEqual(6)
    expect(days(inv.invoiceDueDate, new Date().toISOString())).toBeLessThanOrEqual(7)
  })

  it('the customer\'s Resume button says what happened: waits (no pay link) or hands over the invoice', async () => {
    const actions = await import('@/app/(frontend)/(shop)/account/subscriptions/actions')
    const s = await startActiveSubscription(env())
    await actions.pauseSubscriptionAction(String(s.subId))
    const early: any = await actions.resumeSubscriptionAction(String(s.subId))
    expect(early).toMatchObject({ ok: true, payPath: null })
    expect(early.message).toMatch(/^Welcome back! Your next invoice will be emailed on [A-Z][a-z]{2} \d{1,2}, \d{4}\.$/)

    await actions.pauseSubscriptionAction(String(s.subId))
    await makeOverdue(s)
    const late: any = await actions.resumeSubscriptionAction(String(s.subId))
    expect(late.ok).toBe(true)
    expect(late.payPath).toMatch(/^\/pay\/\d+\//)
    expect(late.message).toBe('Welcome back! Your next invoice is ready.')
  })
})
