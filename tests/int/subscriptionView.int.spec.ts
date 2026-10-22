import { describe, it, expect, vi } from 'vitest'

// store.ts imports a server action and the toast library; the pure rules under test need neither.
vi.mock('@/app/(frontend)/actions/cart', () => ({ syncCartToPayload: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { buildSubscriptionView } from '@/lib/subscriptions/view'
import { cartConflict } from '@/lib/cart/store'
import { nextUnpaidCycle, tokensMatch, newInvoiceToken, payUrl } from '@/lib/subscriptions/invoices'
import { buildInvoiceEmail, buildReminderEmail, buildLapseEmail, buildPaymentReceivedEmail, esc } from '@/lib/subscriptions/emails'

const sub = (over: any = {}) => ({ status: 'active', planMonths: 3, nextDueDate: '2026-11-20T00:00:00Z', nextInvoiceDate: '2026-11-13T00:00:00Z', cyclesCompleted: 1, ...over })
const paid = (n: number, over: any = {}) => ({ id: 100 + n, orderNumber: String(1000 + n), cycleNumber: n, orderType: n === 1 ? 'subscription_first' : 'subscription_cycle', status: 'paid', paymentStatus: 'captured', total: 45, paidAt: `2026-10-${10 + n}T00:00:00Z`, ...over })
const open = (n: number, over: any = {}) => ({ id: 200 + n, orderNumber: String(2000 + n), cycleNumber: n, orderType: 'subscription_cycle', status: 'pending', paymentStatus: 'unpaid', total: 45, invoiceDueDate: '2026-11-20T00:00:00Z', invoiceToken: 'tok_' + n, ...over })

describe('buildSubscriptionView - which options the customer sees', () => {
  it('active, nothing owed: order early / skip / pause', () => {
    const v = buildSubscriptionView(sub(), [paid(1)])
    expect(v.actions).toEqual(['order_next_month', 'skip_month', 'pause'])
    expect(v.statusLabel).toBe('Active')
    expect(v.ordersPaid).toBe(1)
    expect(v.intervalMonths).toBe(3)
    expect(v.statusHelp).toMatch(/next invoice will be emailed on/i)
  })

  it('active with an unpaid invoice: pay now / skip / pause (no early-order while one is open)', () => {
    const v = buildSubscriptionView(sub(), [paid(1), open(2)])
    expect(v.actions).toEqual(['pay_now', 'skip_month', 'pause'])
    expect(v.openInvoice).toMatchObject({ order: 2, total: 45, payPath: '/pay/202/tok_2' })
    expect(v.schedule[1]).toMatchObject({ order: 2, state: 'awaiting_payment', payPath: '/pay/202/tok_2' })
    expect(v.schedule).toHaveLength(2) // the open invoice IS the next order: no extra "upcoming" row
    expect(v.statusHelp).toMatch(/Order 2 is ready to pay/)
  })

  it('paused: only resume', () => {
    const v = buildSubscriptionView(sub({ status: 'paused' }), [paid(1)])
    expect(v.actions).toEqual(['resume'])
    expect(v.schedule.map((r) => r.state)).toEqual(['paid', 'skipped_hold'])
    expect(v.schedule[1]).toMatchObject({ order: 2, label: 'On pause' })
    expect(v.statusHelp).toMatch(/keeps its normal date/)
  })

  it('lapsed: reactivate (or pay the fresh invoice) and pause', () => {
    expect(buildSubscriptionView(sub({ status: 'lapsed' }), [paid(1)]).actions).toEqual(['reactivate', 'pause'])
    expect(buildSubscriptionView(sub({ status: 'lapsed' }), [paid(1), open(2)]).actions).toEqual(['pay_now', 'pause'])
    expect(buildSubscriptionView(sub({ status: 'lapsed' }), [paid(1)]).statusTone).toBe('red')
  })

  it('ended / cancelled / waiting for first payment: no buttons, and nothing is planned after the last order', () => {
    const ended = buildSubscriptionView(sub({ status: 'completed' }), [paid(1), paid(2), paid(3)])
    expect(ended.actions).toEqual([])
    expect(ended.statusLabel).toBe('Ended')
    expect(ended.schedule.map((r) => r.state)).toEqual(['paid', 'paid', 'paid']) // no "upcoming" row
    expect(buildSubscriptionView(sub({ status: 'cancelled' }), [paid(1)]).actions).toEqual([])
    const first = buildSubscriptionView(sub({ status: 'pending_payment' }), [])
    expect(first.actions).toEqual([])
    expect(first.statusLabel).toBe('Waiting for first payment')
    expect(first.schedule).toEqual([{ order: 1, state: 'upcoming', label: 'Waiting for first payment', date: null }])
  })

  it('a subscription never runs out: after any number of paid orders the options stay and the next order is listed', () => {
    const v = buildSubscriptionView(sub({ planMonths: 1, cyclesCompleted: 5 }), [1, 2, 3, 4, 5].map((n) => paid(n)))
    expect(v.actions).toEqual(['order_next_month', 'skip_month', 'pause'])
    expect(v.ordersPaid).toBe(5)
    expect(v.schedule[v.schedule.length - 1]).toMatchObject({ order: 6, state: 'upcoming', date: '2026-11-20T00:00:00Z' })
  })

  it('the interval is the plan length (1, 3 or 6 months); anything odd counts as 1', () => {
    for (const months of [1, 3, 6]) expect(buildSubscriptionView(sub({ planMonths: months }), [paid(1)]).intervalMonths).toBe(months)
    expect(buildSubscriptionView(sub({ planMonths: 0 }), [paid(1)]).intervalMonths).toBe(1)
    expect(buildSubscriptionView(sub({ planMonths: 'x' as any }), [paid(1)]).intervalMonths).toBe(1)
  })

  it('a long history shows only the newest orders (plus the next one) and says how many older ones are hidden', () => {
    const v = buildSubscriptionView(sub({ planMonths: 1, cyclesCompleted: 12 }), Array.from({ length: 12 }, (_, i) => paid(i + 1)))
    expect(v.schedule).toHaveLength(8)
    expect(v.olderOrders).toBe(5) // 12 paid + 1 upcoming = 13 rows; the 5 oldest are not listed
    expect(v.schedule[0].order).toBe(6)
    expect(v.schedule[7]).toMatchObject({ order: 13, state: 'upcoming' })
    expect(v.ordersPaid).toBe(12)
    expect(buildSubscriptionView(sub(), [paid(1)]).olderOrders).toBe(0)
  })

  it('"order next delivery now" respects the minimum days between early orders', () => {
    const blocked = buildSubscriptionView(sub(), [paid(1)], { minDaysBetweenEarlyOrders: 7, daysSinceLastEarlyOrder: 2 })
    expect(blocked.actions).not.toContain('order_next_month')
    expect(blocked.actions).toContain('skip_month')
    const ok = buildSubscriptionView(sub(), [paid(1)], { minDaysBetweenEarlyOrders: 7, daysSinceLastEarlyOrder: 9 })
    expect(ok.actions).toContain('order_next_month')
    const never = buildSubscriptionView(sub(), [paid(1)], { minDaysBetweenEarlyOrders: 7, daysSinceLastEarlyOrder: null })
    expect(never.actions).toContain('order_next_month')
  })

  it('order rows show paid / shipped / delivered with tracking, and upcoming', () => {
    const v = buildSubscriptionView(sub({ cyclesCompleted: 3 }), [
      paid(1, { status: 'completed' }),
      paid(2, { status: 'shipped', trackingLink: 'https://track/2' }),
      paid(3),
    ])
    expect(v.schedule.map((r) => r.state)).toEqual(['delivered', 'shipped', 'paid', 'upcoming'])
    expect(v.schedule[1].trackingLink).toBe('https://track/2')
    expect(v.ordersPaid).toBe(3)
  })

  it('cancelled invoices are ignored, and a double-paid order counts once', () => {
    const v = buildSubscriptionView(sub(), [paid(1), open(2, { status: 'cancelled' }), paid(2), paid(2, { id: 999, paidAt: '2026-12-01T00:00:00Z' })])
    expect(v.ordersPaid).toBe(2)
    expect(v.schedule[1].state).toBe('paid')
    expect(v.openInvoice).toBeNull()
  })

  it('an open invoice without a token is never offered as a payable link', () => {
    const v = buildSubscriptionView(sub(), [paid(1), open(2, { invoiceToken: null })])
    expect(v.openInvoice).toBeNull()
    expect(v.actions).toContain('order_next_month') // nothing payable, so the customer can still act
  })
})

describe('cartConflict - subscriptions are checked out on their own', () => {
  const line = (planMonths: number | null) => ({ lineId: 'x', productId: '1', variantSku: 'A', quantity: 1, priceSnapshot: 10, product: { id: '1', name: 'P', imageUrl: null }, planMonths }) as any

  it('empty cart accepts anything', () => {
    expect(cartConflict([], null)).toBeNull()
    expect(cartConflict([], 6)).toBeNull()
  })
  it('one-time items mix only with one-time items', () => {
    expect(cartConflict([line(null)], null)).toBeNull()
    expect(cartConflict([line(null)], 3)).toBe('cart_has_one_time')
    expect(cartConflict([line(undefined as any)], 3)).toBe('cart_has_one_time')
  })
  it('plan items mix only with the same plan length', () => {
    expect(cartConflict([line(3)], 3)).toBeNull()
    expect(cartConflict([line(3), line(3)], 3)).toBeNull()
    expect(cartConflict([line(3)], 6)).toBe('different_plan_length')
    expect(cartConflict([line(3)], null)).toBe('cart_has_plan')
  })
})

describe('invoice helpers', () => {
  it('finds the first unpaid order number - there is always one, a subscription has no end', () => {
    expect(nextUnpaidCycle(new Map())).toBe(1)
    expect(nextUnpaidCycle(new Map([[1, 1]]))).toBe(2)
    expect(nextUnpaidCycle(new Map([[1, 1], [3, 1]]))).toBe(2) // gap: order 2 still owed
    expect(nextUnpaidCycle(new Map([[1, 1], [2, 1], [3, 1]]))).toBe(4)
    expect(nextUnpaidCycle(new Set([1, 2]))).toBe(3)
    expect(nextUnpaidCycle(new Set(Array.from({ length: 200 }, (_, i) => i + 1)))).toBe(201)
  })
  it('tokens are long, unique, URL-safe and compared exactly', () => {
    const a = newInvoiceToken()
    const b = newInvoiceToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]{30,}$/)
    expect(tokensMatch(a, a)).toBe(true)
    expect(tokensMatch(a, b)).toBe(false)
    expect(tokensMatch(a, a.slice(0, -1))).toBe(false)
    expect(tokensMatch(null, a)).toBe(false)
    expect(tokensMatch(a, '')).toBe(false)
  })
  it('builds the pay link from the id and token', () => {
    expect(payUrl(42, 'abc')).toMatch(/\/pay\/42\/abc$/)
  })
})

describe('subscription emails', () => {
  const invoice = (over: any = {}) => ({
    id: 7, orderNumber: '1007', cycleNumber: 2, total: 45.5, subtotal: 40.5, shippingTotal: 5, feeTotal: 0,
    subscriptionDiscountPercent: 15, invoiceDueDate: '2026-11-20T00:00:00Z', invoiceToken: 'secrettoken123456789', paymentMethod: 'authnet_bridge',
    customerFirstName: 'Ann', items: [{ productSnapshot: { name: 'BPC-157' }, variant: '10mg', quantity: 2, price: 20.25 }], ...over,
  })

  it('card invoice: clearly a subscription, shows the order number, amount, due date and a pay-by-card link', () => {
    const { subject, html } = buildInvoiceEmail({ order: invoice(), subscriptionId: 9, reason: 'scheduled' })
    expect(subject).toBe('Subscription invoice #1007 - Order 2 (due November 20, 2026)')
    expect(html).toContain('Subscription · Order 2')
    expect(html).toContain('Your invoice')
    expect(html).toContain('$45.50')
    expect(html).toContain('/pay/7/secrettoken123456789')
    expect(html).toContain('Pay $45.50 by card')
    expect(html).toContain('/account/subscriptions/9')
    expect(html).not.toContain('Zelle QR')
  })

  it('Zelle invoice: instructions, QR, order number, and a card alternative', () => {
    const { html } = buildInvoiceEmail({ order: invoice({ paymentMethod: 'zelle' }), subscriptionId: 9, reason: 'scheduled' })
    expect(html).toContain('Pay with Zelle')
    expect(html).toContain('Zelle QR Code')
    expect(html).toContain('#1007')
    expect(html).toContain('Pay by card instead')
    expect(html).toContain('/pay/7/secrettoken123456789')
  })

  it('intro wording follows the reason (early / resume / reactivate)', () => {
    expect(buildInvoiceEmail({ order: invoice(), subscriptionId: 9, reason: 'early' }).html).toMatch(/as requested/)
    expect(buildInvoiceEmail({ order: invoice(), subscriptionId: 9, reason: 'resume' }).html).toMatch(/welcome back/i)
    expect(buildInvoiceEmail({ order: invoice(), subscriptionId: 9, reason: 'reactivate' }).html).toMatch(/reactivate/i)
  })

  it('reminders: due-day vs final notice, and the lapse notice offers reactivation', () => {
    const r1 = buildReminderEmail({ order: invoice(), subscriptionId: 9, stage: 1 })
    expect(r1.subject).toMatch(/^Reminder: subscription invoice #1007/)
    const r2 = buildReminderEmail({ order: invoice(), subscriptionId: 9, stage: 2 })
    expect(r2.subject).toMatch(/^Final notice:/)
    expect(r2.html).toMatch(/put on hold/)
    const lapse = buildLapseEmail({ order: invoice(), subscriptionId: 9 })
    expect(lapse.subject).toMatch(/on hold/)
    expect(lapse.html).toContain('Reactivate my subscription')
  })

  it('payment received: names the order and the next invoice date; there is no "last month" - it just continues', () => {
    const mid = buildPaymentReceivedEmail({ order: invoice(), subscriptionId: 9, nextDueDate: '2026-12-20T00:00:00Z' })
    expect(mid.subject).toBe('Payment received - Subscription order #1007 (Order 2)')
    expect(mid.html).toContain('December 20, 2026')
    expect(mid.html).toMatch(/next invoice will be emailed before/)
    expect(mid.html).not.toMatch(/to go|last month/)
    const noDate = buildPaymentReceivedEmail({ order: invoice({ cycleNumber: 6 }), subscriptionId: 9 })
    expect(noDate.subject).toContain('Order 6')
    expect(noDate.html).not.toMatch(/next invoice will be emailed/)
  })

  it('every email says how often the customer gets an order ("why am I getting this")', () => {
    const order = invoice()
    for (const [months, words] of [[1, 'every month'], [3, 'every 3 months'], [6, 'every 6 months']] as const) {
      for (const m of [
        buildInvoiceEmail({ order, subscriptionId: 9, reason: 'scheduled', intervalMonths: months }),
        buildReminderEmail({ order, subscriptionId: 9, stage: 1, intervalMonths: months }),
        buildLapseEmail({ order, subscriptionId: 9, intervalMonths: months }),
        buildPaymentReceivedEmail({ order, subscriptionId: 9, intervalMonths: months }),
      ]) {
        expect(m.html).toContain(`have an order delivered ${words} from Longevia Research`)
        expect(m.html).toContain('never charge your card automatically')
      }
    }
    // when the interval is unknown the wording stays truthful
    expect(buildInvoiceEmail({ order, subscriptionId: 9, reason: 'scheduled' }).html).toContain('on a regular schedule')
  })

  it('escapes customer-controlled text so a name can never inject HTML into an email', () => {
    const { html } = buildInvoiceEmail({
      order: invoice({ customerFirstName: '<script>alert(1)</script>', items: [{ productSnapshot: { name: '<img src=x onerror=1>' }, variant: '"><b>', quantity: 1, price: 1 }] }),
      subscriptionId: 9,
      reason: 'scheduled',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('<img src=x onerror=1>')
    expect(html).toContain('&lt;script&gt;')
    expect(esc('a&b<c>"d')).toBe('a&amp;b&lt;c&gt;&quot;d')
  })
})
