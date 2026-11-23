/**
 * The member discount: logged-in customers get 15% off an ordinary order.
 *
 * What is tested (pure code, no database, no network):
 * - The maths (src/lib/membership/discount.ts): rounding to the cent, the member discount NOT combining with any other
 *   discount (whichever saves more applies; a gift card is paid on top), nothing for a non-member, labels.
 * - The order email: a "Member discount (15%)" line, the coupon on its own line, a thank-you under the total, and an
 *   order from before the member discount existed reads EXACTLY as it always did.
 * - Affiliate commission: only the coupon's part of the discount reduces it, never the member discount.
 *
 * (The server's pricing is tested in pricing.int.spec.ts; store credit in finalizeOrder.int.spec.ts.)
 */

import { describe, it, expect, vi } from 'vitest'
import {
  MEMBER_DISCOUNT_LABEL,
  MEMBER_DISCOUNT_PERCENT,
  MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT,
  couponPartOfDiscount,
  memberDiscountAmount,
  memberDiscountLabel,
  splitDiscounts,
} from '../../src/lib/membership/discount'
import { generateOrderInvoiceHtml } from '../../src/lib/emails/generateOrderEmail'

// ─── The maths ────────────────────────────────────────────────────────────────

describe('memberDiscountAmount', () => {
  it('is 15% of the subtotal', () => {
    expect(MEMBER_DISCOUNT_PERCENT).toBe(15)
    expect(memberDiscountAmount(40)).toBe(6)
    expect(memberDiscountAmount(100)).toBe(15)
    expect(memberDiscountAmount(1234.5)).toBe(185.18) // 185.175, half a cent rounds up
  })

  it('rounds to the nearest cent', () => {
    expect(memberDiscountAmount(33.33)).toBe(5) // 4.9995 rounds up
    expect(memberDiscountAmount(0.07)).toBe(0.01) // 0.0105 rounds down to a cent
    expect(memberDiscountAmount(59.97)).toBe(9) // 8.9955 rounds up
    expect(memberDiscountAmount(10.01)).toBe(1.5) // 1.5015 rounds down
    expect(memberDiscountAmount(0.02)).toBe(0) // 0.003
  })

  it('never goes below zero, above the subtotal, or NaN', () => {
    for (const bad of [0, -5, NaN, Infinity, -Infinity]) expect(memberDiscountAmount(bad)).toBe(0)
    expect(memberDiscountAmount(40, 0)).toBe(0)
    expect(memberDiscountAmount(40, -10)).toBe(0)
    expect(memberDiscountAmount(40, NaN)).toBe(0)
    expect(memberDiscountAmount(40, 150)).toBe(40) // a percent above 100 is treated as 100
  })

  it('has no floating-point drift on awkward prices', () => {
    for (const subtotal of [0.1 + 0.2, 19.99 * 3, 144.0 + 225.0 + 189.0, 211.5, 1.005, 99.995]) {
      const discount = memberDiscountAmount(subtotal)
      expect(Math.round(discount * 100)).toBeCloseTo(discount * 100, 6) // a whole number of cents
      expect(discount).toBeLessThanOrEqual(subtotal)
    }
  })
})

describe('splitDiscounts (the member discount cannot be combined with another discount: whichever saves more)', () => {
  const split = (subtotal: number, coupon: { discount: number; isStoreCredit?: boolean } | null, isMember = true) =>
    splitDiscounts({ subtotal, coupon, isMember })

  it('a non-member gets exactly the coupon discount, untouched', () => {
    expect(split(40, { discount: 6 }, false)).toEqual({ memberDiscount: 0, couponDiscount: 6, totalDiscount: 6, couponDisplaced: false, memberDisplaced: false })
    expect(split(40, null, false)).toEqual({ memberDiscount: 0, couponDiscount: 0, totalDiscount: 0, couponDisplaced: false, memberDisplaced: false })
    // even an odd coupon amount is passed through as it was (this is what keeps logged-out orders unchanged)
    expect(split(40, { discount: 6.123 }, false).couponDiscount).toBe(6.123)
  })

  it('a member with no coupon gets 15%', () => {
    expect(split(40, null)).toEqual({ memberDiscount: 6, couponDiscount: 0, totalDiscount: 6, couponDisplaced: false, memberDisplaced: false })
    expect(split(40, undefined as any).memberDiscount).toBe(6)
  })

  it('a code that saves LESS than the member discount is not used: the member discount applies alone', () => {
    expect(split(40, { discount: 4 })).toEqual({ memberDiscount: 6, couponDiscount: 0, totalDiscount: 6, couponDisplaced: true, memberDisplaced: false })
  })

  it('a code that saves MORE than the member discount replaces it: the code applies alone', () => {
    expect(split(40, { discount: 12 })).toEqual({ memberDiscount: 0, couponDiscount: 12, totalDiscount: 12, couponDisplaced: false, memberDisplaced: true })
  })

  it('an exact tie goes to the member discount (the code is not used up for nothing)', () => {
    expect(split(40, { discount: 6 })).toEqual({ memberDiscount: 6, couponDiscount: 0, totalDiscount: 6, couponDisplaced: true, memberDisplaced: false })
  })

  it('never both: the two are never added together, whatever the amounts', () => {
    for (const coupon of [1, 4, 5.99, 6, 6.01, 20, 39.99, 40]) {
      const r = split(40, { discount: coupon })
      expect(r.totalDiscount).toBe(Math.max(6, coupon))
      expect(r.memberDiscount > 0 && r.couponDiscount > 0).toBe(false)
      expect(r.couponDisplaced !== r.memberDisplaced).toBe(true) // exactly one of them lost
    }
  })

  it('a free-shipping code (saves nothing on the items) does not combine either: the member discount applies and the code is not used', () => {
    expect(split(40, { discount: 0 })).toEqual({ memberDiscount: 6, couponDiscount: 0, totalDiscount: 6, couponDisplaced: true, memberDisplaced: false })
  })

  it('ignores a nonsense coupon amount (it saves nothing, so the member discount wins)', () => {
    for (const bad of [NaN, -3, Infinity * 0]) {
      expect(split(40, { discount: bad })).toMatchObject({ memberDiscount: 6, couponDiscount: 0, totalDiscount: 6, couponDisplaced: true })
    }
  })

  describe('gift cards / store credit are the exception: money the customer already holds, paid on top', () => {
    it('the member discount comes off first and the credit covers the rest', () => {
      expect(split(40, { discount: 5, isStoreCredit: true })).toEqual({ memberDiscount: 6, couponDiscount: 5, totalDiscount: 11, couponDisplaced: false, memberDisplaced: false })
    })

    it('the credit is limited so the two never take more than the subtotal (it keeps whatever it did not need)', () => {
      expect(split(40, { discount: 40, isStoreCredit: true })).toEqual({ memberDiscount: 6, couponDiscount: 34, totalDiscount: 40, couponDisplaced: false, memberDisplaced: false })
      expect(split(40, { discount: 500, isStoreCredit: true })).toMatchObject({ memberDiscount: 6, couponDiscount: 34, totalDiscount: 40 })
    })

    it('can be switched to behave like any other code', () => {
      expect(MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT).toBe(true) // the current setting
    })

    it('a non-member just uses the credit', () => {
      expect(split(40, { discount: 40, isStoreCredit: true }, false)).toMatchObject({ memberDiscount: 0, couponDiscount: 40, totalDiscount: 40 })
    })
  })

  it('an empty or tiny cart: the member discount is not in play, a code works as it always did', () => {
    expect(split(0, null)).toEqual({ memberDiscount: 0, couponDiscount: 0, totalDiscount: 0, couponDisplaced: false, memberDisplaced: false })
    // 2 cents: 15% rounds to nothing, so there is nothing to compete with
    expect(split(0.02, { discount: 0.01 })).toMatchObject({ memberDiscount: 0, couponDiscount: 0.01, totalDiscount: 0.01, couponDisplaced: false, memberDisplaced: false })
  })

  it('holds for any subtotal and code: whole cents, never above the subtotal, never both (gift cards aside)', () => {
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 2000; i++) {
      const subtotal = Math.round(random() * 100000) / 100
      const coupon = Math.round(random() * subtotal * 1.5 * 100) / 100
      const member = memberDiscountAmount(subtotal)
      const r = split(subtotal, { discount: coupon })
      if (member > 0) {
        expect(r.totalDiscount).toBeCloseTo(Math.max(member, coupon), 8)
        expect(r.memberDiscount === 0 || r.couponDiscount === 0).toBe(true)
        expect(r.memberDiscount > 0 ? r.memberDiscount : r.couponDiscount).toBeCloseTo(r.totalDiscount, 8)
      }
      // a gift card stacks, but never takes more than the subtotal and never more than it was worth
      const g = split(subtotal, { discount: coupon, isStoreCredit: true })
      expect(g.totalDiscount).toBeLessThanOrEqual(subtotal + 1e-9)
      expect(g.couponDiscount).toBeLessThanOrEqual(coupon + 1e-9)
      expect(Math.round(g.totalDiscount * 100) / 100).toBeCloseTo(g.memberDiscount + g.couponDiscount, 8)
    }
  })
})

describe('couponPartOfDiscount (what the coupon rules - store credit, affiliate commission - care about)', () => {
  it('is the whole discount for an order from before the member discount existed', () => {
    expect(couponPartOfDiscount({ discountTotal: 12.5 })).toBe(12.5)
    expect(couponPartOfDiscount({ discountTotal: 12.5, memberDiscountTotal: null })).toBe(12.5)
    expect(couponPartOfDiscount({ discountTotal: 12.5, memberDiscountTotal: 0 })).toBe(12.5)
    expect(couponPartOfDiscount({})).toBe(0)
    expect(couponPartOfDiscount({ discountTotal: null })).toBe(0)
  })

  it('takes the member part out', () => {
    expect(couponPartOfDiscount({ discountTotal: 14, memberDiscountTotal: 8 })).toBe(6)
    expect(couponPartOfDiscount({ discountTotal: 8, memberDiscountTotal: 8 })).toBe(0)
    expect(couponPartOfDiscount({ discountTotal: 0.3, memberDiscountTotal: 0.1 })).toBe(0.2) // no float noise
  })

  it('never goes negative', () => {
    expect(couponPartOfDiscount({ discountTotal: 5, memberDiscountTotal: 8 })).toBe(0)
  })
})

describe('labels', () => {
  it('names the discount "Member discount" with its percent', () => {
    expect(MEMBER_DISCOUNT_LABEL).toBe('Member discount')
    expect(memberDiscountLabel()).toBe('Member discount (15%)')
    expect(memberDiscountLabel(15)).toBe('Member discount (15%)')
    expect(memberDiscountLabel(20)).toBe('Member discount (20%)') // an order keeps the percent it was placed at (20% before the offer became 15%)
  })

  it('falls back to the plain name when the percent is unknown', () => {
    expect(memberDiscountLabel(null)).toBe('Member discount')
    expect(memberDiscountLabel(0)).toBe('Member discount')
  })
})

// ─── The order email ──────────────────────────────────────────────────────────

describe('the order email', () => {
  const baseOrder = (over: Record<string, unknown> = {}) => ({
    id: 77,
    orderNumber: '1077',
    createdAt: '2026-11-20T10:00:00.000Z',
    customerFirstName: 'Ada',
    customerLastName: 'Lovelace',
    guestEmail: 'ada@example.com',
    shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
    items: [{ productSnapshot: { name: 'BPC-157' }, variant: 'DEFAULT', price: 20, quantity: 2 }],
    subtotal: 40,
    discountTotal: 0,
    redeemedPoints: 0,
    shippingTotal: 5,
    taxTotal: 0,
    feeTotal: 0,
    total: 45,
    shippingMethod: 'Standard Shipping',
    paymentMethod: 'stripe',
    paymentStatus: 'captured',
    ...over,
  })
  const render = (order: any) => generateOrderInvoiceHtml(order)
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  it('shows the member discount on its own, labelled, with the amount', async () => {
    const html = await render(baseOrder({ discountTotal: 6, memberDiscountTotal: 6, memberDiscountPercent: 15, total: 39 }))
    expect(text(html)).toContain('Member discount (15%) -$6.00')
    expect(html).not.toContain('Discount ()') // no empty coupon line
    expect(text(html)).toContain('Total $39.00')
  })

  it('thanks the customer for the saving under the total', async () => {
    const html = await render(baseOrder({ discountTotal: 6, memberDiscountTotal: 6, memberDiscountPercent: 15, total: 39 }))
    expect(text(html)).toContain('You saved $6.00 with your member discount.')
  })

  it('shows the member discount and a coupon as two separate lines', async () => {
    const html = await render(
      baseOrder({ discountTotal: 11, memberDiscountTotal: 6, memberDiscountPercent: 15, couponCode: 'SAVE', total: 34 }),
    )
    const t = text(html)
    expect(t).toContain('Member discount (15%) -$6.00')
    expect(t).toContain('Discount (SAVE) -$5.00')
    expect(t).toContain('You saved $6.00 with your member discount.')
    expect(t.indexOf('Member discount')).toBeLessThan(t.indexOf('Discount (SAVE)')) // member first, like at checkout
  })

  it('keeps the percent the order was placed at, even though the offer is 15% now (an order placed at 20% still says 20%)', async () => {
    const html = await render(baseOrder({ discountTotal: 8, memberDiscountTotal: 8, memberDiscountPercent: 20, total: 37 }))
    expect(text(html)).toContain('Member discount (20%) -$8.00')
    expect(text(html)).not.toContain('(15%)')
    expect(text(html)).toContain('Total $37.00')
  })

  it('an order from BEFORE the member discount existed reads exactly as it always did', async () => {
    const legacy = baseOrder({ discountTotal: 6, couponCode: 'SAVE', total: 39 }) // no member fields at all
    const html = await render(legacy)
    const t = text(html)
    expect(t).toContain('Discount (SAVE) -$6.00')
    expect(t).not.toContain('Member discount')
    expect(t).not.toContain('You saved')
    // identical when the new fields are present but empty (what the migration gives every old order)
    const withEmptyFields = await render({ ...legacy, memberDiscountTotal: 0, memberDiscountPercent: null })
    expect(withEmptyFields).toBe(html)
  })

  it('an order with no discount at all has no discount lines', async () => {
    const html = await render(baseOrder())
    expect(text(html)).not.toMatch(/Member discount|Discount \(/)
    expect(text(html)).not.toContain('You saved')
  })
})

// ─── Affiliate commission ─────────────────────────────────────────────────────

describe('affiliate commission', () => {
  const state = vi.hoisted(() => ({ affiliate: {} as any, settings: {} as any }))

  vi.mock('payload', () => ({
    getPayload: async () => ({
      findByID: async () => state.affiliate,
      findGlobal: async () => state.settings,
    }),
  }))
  vi.mock('@payload-config', () => ({ default: {} }))
  vi.mock('@/lib/emails/generateAdminAffiliateConversionEmail', () => ({ generateAdminAffiliateConversionEmail: async () => '' }))

  const commission = async (order: any) => {
    const { computeCommission } = await import('../../src/lib/affiliates/commission')
    state.affiliate = { id: 1, couponCode: 'AFF10', commissionRate: 10, commissionType: 'percentage', commissionOn: 'subtotal_after_coupon' }
    state.settings = {}
    return computeCommission(order, 1)
  }

  it('is unchanged for an order with no member discount (the affiliate coupon reduces it as before)', async () => {
    expect(await commission({ subtotal: 100, discountTotal: 10, couponCode: 'AFF10' })).toBe(900) // 10% of 90.00, in cents
  })

  it('is NOT reduced by a member discount the customer also got (that discount is the store\'s own)', async () => {
    // $100 order, member 15 + affiliate coupon 10 = 25 off: commission is on 100 - 10 (the coupon), not 100 - 25
    expect(await commission({ subtotal: 100, discountTotal: 25, memberDiscountTotal: 15, couponCode: 'AFF10' })).toBe(900)
  })

  it('a member order with no affiliate coupon earns on the full subtotal', async () => {
    expect(await commission({ subtotal: 100, discountTotal: 15, memberDiscountTotal: 15, couponCode: '' })).toBe(1000)
    expect(await commission({ subtotal: 100, discountTotal: 15, memberDiscountTotal: 15, couponCode: 'OTHERCODE' })).toBe(1000)
  })
})
