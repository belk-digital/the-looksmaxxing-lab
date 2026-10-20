import { describe, it, expect } from 'vitest'
import {
  addMonths,
  addDays,
  diffDays,
  nextDueAfterPayment,
  invoiceDateFor,
  desiredReminderStage,
  planResume,
} from '@/lib/subscriptions/schedule'
import { applyPlanDiscount } from '@/lib/subscriptions/discount'
import {
  DEFAULT_SUBSCRIPTION_SETTINGS,
  findActivePlan,
  allowedPaymentMethods,
  getSubscriptionSettings,
} from '@/lib/subscriptions/settings'

const d = (s: string) => new Date(s)
const iso = (x: Date) => x.toISOString().slice(0, 10)

describe('addMonths', () => {
  it('keeps the same day when possible', () => {
    expect(iso(addMonths(d('2026-10-15T10:00:00Z'), 1))).toBe('2026-11-15')
    expect(iso(addMonths(d('2026-10-15T10:00:00Z'), 3))).toBe('2027-01-15')
    expect(iso(addMonths(d('2026-10-15T10:00:00Z'), 12))).toBe('2027-10-15')
  })
  it('clamps to the end of shorter months (never spills into the next one)', () => {
    expect(iso(addMonths(d('2026-01-31T00:00:00Z'), 1))).toBe('2026-02-28')
    expect(iso(addMonths(d('2028-01-31T00:00:00Z'), 1))).toBe('2028-02-29') // leap year
    expect(iso(addMonths(d('2026-03-31T00:00:00Z'), 1))).toBe('2026-04-30')
    expect(iso(addMonths(d('2026-08-31T00:00:00Z'), 6))).toBe('2027-02-28')
  })
  it('crosses year boundaries and handles negatives', () => {
    expect(iso(addMonths(d('2026-12-15T00:00:00Z'), 1))).toBe('2027-01-15')
    expect(iso(addMonths(d('2026-01-15T00:00:00Z'), -1))).toBe('2025-12-15')
  })
  it('keeps the time of day', () => {
    expect(addMonths(d('2026-10-15T13:45:10.123Z'), 1).toISOString()).toBe('2026-11-15T13:45:10.123Z')
  })
})

describe('schedule helpers', () => {
  it('next due is one calendar month after payment', () => {
    expect(iso(nextDueAfterPayment(d('2026-10-20T09:00:00Z')))).toBe('2026-11-20')
  })
  it('invoice date is lead days before the due date', () => {
    expect(iso(invoiceDateFor(d('2026-11-20T00:00:00Z'), 7))).toBe('2026-11-13')
    expect(iso(invoiceDateFor(d('2026-11-20T00:00:00Z'), 0))).toBe('2026-11-20')
  })
  it('diffDays counts whole UTC days regardless of time of day', () => {
    expect(diffDays(d('2026-10-01T23:59:00Z'), d('2026-10-02T00:01:00Z'))).toBe(1)
    expect(diffDays(d('2026-10-05T00:00:00Z'), d('2026-10-01T12:00:00Z'))).toBe(-4)
    expect(iso(addDays(d('2026-10-30T00:00:00Z'), 3))).toBe('2026-11-02')
  })
})

describe('desiredReminderStage (max 3 emails per invoice, no nagging)', () => {
  const due = d('2026-11-20T00:00:00Z')
  const rules = { finalNoticeAfterDays: 7, lapseAfterDays: 14 }
  const at = (s: string) => desiredReminderStage(d(s), due, rules)

  it('is 0 before the due day', () => {
    expect(at('2026-11-13T12:00:00Z')).toBe(0)
    expect(at('2026-11-19T23:59:00Z')).toBe(0)
  })
  it('is 1 from the due day until the final notice', () => {
    expect(at('2026-11-20T00:30:00Z')).toBe(1)
    expect(at('2026-11-26T23:00:00Z')).toBe(1)
  })
  it('is 2 from +7 days until the lapse', () => {
    expect(at('2026-11-27T01:00:00Z')).toBe(2)
    expect(at('2026-12-03T23:00:00Z')).toBe(2)
  })
  it('is 3 (lapsed) from +14 days', () => {
    expect(at('2026-12-04T01:00:00Z')).toBe(3)
    expect(at('2027-02-01T00:00:00Z')).toBe(3)
  })
})

describe('applyPlanDiscount', () => {
  it('discounts in whole cents', () => {
    expect(applyPlanDiscount(29.99, 15)).toBe(25.49)
    expect(applyPlanDiscount(20, 15)).toBe(17)
    expect(applyPlanDiscount(100, 15)).toBe(85)
  })
  it('rounds half-cents up consistently', () => {
    expect(applyPlanDiscount(10.1, 15)).toBe(8.59)
  })
  it('handles 0%, 100% and out-of-range values', () => {
    expect(applyPlanDiscount(49.5, 0)).toBe(49.5)
    expect(applyPlanDiscount(49.5, 100)).toBe(0)
    expect(applyPlanDiscount(49.5, 250)).toBe(0)
    expect(applyPlanDiscount(49.5, -10)).toBe(49.5)
    expect(applyPlanDiscount(NaN, 15)).toBeNaN()
  })
  it('never produces floating-point noise', () => {
    for (const price of [0.01, 1.1, 19.99, 59.95, 149.9, 1234.56]) {
      const out = applyPlanDiscount(price, 15)
      expect(Math.round(out * 100) / 100).toBe(out)
    }
  })
})

describe('subscription settings', () => {
  it('defaults: off, 3/6/12 months at 15%, both payment methods', () => {
    const s = DEFAULT_SUBSCRIPTION_SETTINGS
    expect(s.enabled).toBe(false)
    expect(s.plans.map((p) => [p.months, p.discountPercent])).toEqual([[3, 15], [6, 15], [12, 15]])
    expect(allowedPaymentMethods(s)).toEqual(['authnet_bridge', 'zelle'])
    expect(findActivePlan(s, 6)?.label).toBe('6 Months')
    expect(findActivePlan(s, 5)).toBeUndefined()
  })

  it('getSubscriptionSettings never throws and returns the (disabled) defaults if the table is missing', async () => {
    const payload: any = { findGlobal: async () => { throw new Error('relation "subscription_settings" does not exist') } }
    const s = await getSubscriptionSettings(payload)
    expect(s.enabled).toBe(false)
    expect(s).toEqual(DEFAULT_SUBSCRIPTION_SETTINGS)
  })

  it('merges stored values over defaults and sanitises bad ones', async () => {
    const payload: any = {
      findGlobal: async () => ({
        enabled: true,
        plans: [
          { months: 3, label: 'Quarter', discountPercent: 20, isActive: true },
          { months: 6, label: 'Half', discountPercent: 999, isActive: false },
          { months: 0, label: 'bad' },
        ],
        invoiceLeadDays: 10,
        lapseAfterDays: -5,
        allowZelle: false,
      }),
    }
    const s = await getSubscriptionSettings(payload)
    expect(s.enabled).toBe(true)
    expect(s.plans).toHaveLength(2)
    expect(s.plans[1].discountPercent).toBe(100) // clamped
    expect(findActivePlan(s, 6)).toBeUndefined() // inactive
    expect(s.invoiceLeadDays).toBe(10)
    expect(s.lapseAfterDays).toBe(14) // invalid -> default
    expect(allowedPaymentMethods(s)).toEqual(['authnet_bridge'])
  })

  it('an unsaved (empty) global yields the defaults, still disabled', async () => {
    const payload: any = { findGlobal: async () => ({}) }
    const s = await getSubscriptionSettings(payload)
    expect(s.enabled).toBe(false)
    expect(s.plans).toHaveLength(3)
  })
})

describe('planResume: after a pause the calendar keeps running', () => {
  // month 1 was paid on Oct 20, so month 2 is due Nov 20 and its invoice goes out on Nov 13 (7 days before)
  const paid = d('2026-10-20T10:00:00Z')
  const due = d('2026-11-20T10:00:00Z')
  const plan = (now: string, over: Partial<{ scheduledDue: Date | null; lastPaidAt: Date | null; leadDays: number }> = {}) =>
    planResume({ now: d(now), scheduledDue: due, lastPaidAt: paid, leadDays: 7, ...over })

  it('a short pause: nothing is invoiced now, the month keeps its normal dates', () => {
    const p = plan('2026-10-25T09:00:00Z')
    expect(p.mode).toBe('wait')
    expect(iso(p.dueDate)).toBe('2026-11-20')
    expect(iso(p.invoiceDate)).toBe('2026-11-13')
  })

  it('works the same when no due date was stored: it follows the last payment date (+1 month)', () => {
    const p = plan('2026-10-25T09:00:00Z', { scheduledDue: null })
    expect(p).toMatchObject({ mode: 'wait' })
    expect(iso(p.dueDate)).toBe('2026-11-20')
  })

  it('a long pause (the date passed while paused): the invoice is created right away, with the full 7 days to pay', () => {
    const p = plan('2027-01-10T09:00:00Z')
    expect(p.mode).toBe('invoice_now')
    expect(iso(p.dueDate)).toBe('2027-01-17')
    expect(iso(p.invoiceDate)).toBe('2027-01-10')
  })

  it('resuming inside the 7-day lead window: invoice now, but still due on the ORIGINAL date (not pushed back)', () => {
    const p = plan('2026-11-16T09:00:00Z')
    expect(p.mode).toBe('invoice_now')
    expect(iso(p.dueDate)).toBe('2026-11-20')
  })

  it('resuming the day before it is due: never less than 2 days to pay', () => {
    const p = plan('2026-11-19T10:00:00Z')
    expect(p.mode).toBe('invoice_now')
    expect(iso(p.dueDate)).toBe('2026-11-21')
  })

  it('exactly on the invoice day counts as "time to invoice"; a minute before does not', () => {
    expect(plan('2026-11-13T10:00:00Z').mode).toBe('invoice_now')
    expect(plan('2026-11-13T09:59:00Z').mode).toBe('wait')
  })

  it('a month that was moved later by "skip" keeps that later date', () => {
    const p = plan('2026-11-25T09:00:00Z', { scheduledDue: d('2026-12-20T10:00:00Z') })
    expect(p.mode).toBe('wait')
    expect(iso(p.dueDate)).toBe('2026-12-20')
    expect(iso(p.invoiceDate)).toBe('2026-12-13')
  })

  it('a stored date EARLIER than one month after the last payment is ignored (the rule is: one month after the last payment)', () => {
    const p = plan('2026-10-25T09:00:00Z', { scheduledDue: d('2026-10-22T10:00:00Z') })
    expect(p.mode).toBe('wait')
    expect(iso(p.dueDate)).toBe('2026-11-20')
  })

  it('month-end payments clamp properly (Jan 31 -> Feb 28)', () => {
    const p = plan('2026-02-01T09:00:00Z', { scheduledDue: null, lastPaidAt: d('2026-01-31T10:00:00Z') })
    expect(iso(p.dueDate)).toBe('2026-02-28')
  })

  it('with nothing known at all it invoices now (safe fallback), 7 days to pay', () => {
    const p = planResume({ now: d('2026-10-25T09:00:00Z'), scheduledDue: null, lastPaidAt: null, leadDays: 7 })
    expect(p.mode).toBe('invoice_now')
    expect(iso(p.dueDate)).toBe('2026-11-01')
  })

  it('garbage dates are ignored instead of breaking', () => {
    const p = plan('2026-10-25T09:00:00Z', { scheduledDue: new Date('not a date') })
    expect(p.mode).toBe('wait')
    expect(iso(p.dueDate)).toBe('2026-11-20')
  })

  it('a different lead time (3 days) moves the invoice day accordingly', () => {
    const p = plan('2026-10-25T09:00:00Z', { leadDays: 3 })
    expect(p.mode).toBe('wait')
    expect(iso(p.invoiceDate)).toBe('2026-11-17')
  })

  it('lead time 0: invoiced on the due day itself', () => {
    expect(plan('2026-11-19T09:00:00Z', { leadDays: 0 }).mode).toBe('wait')
    expect(plan('2026-11-20T11:00:00Z', { leadDays: 0 }).mode).toBe('invoice_now')
  })
})
