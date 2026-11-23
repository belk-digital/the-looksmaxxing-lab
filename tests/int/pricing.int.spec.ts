import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => ({
  coupon: { valid: false } as any,
  points: 0,
  fees: [] as any[],
  methods: [] as any[],
  products: {} as Record<string, any>,
  live: null as null | ((items: any[]) => any[]),
  settings: null as any,
  /** Is the person asking logged in? (The real answer comes from the request's login session.) */
  loggedIn: false,
  viewerCalls: 0,
}))

vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  verifyCoupon: async () => h.coupon,
  getUserMaxxPoints: async () => h.points,
}))
vi.mock('@/lib/access/viewer', () => ({
  isLoggedIn: async () => {
    h.viewerCalls++
    return h.loggedIn
  },
}))
vi.mock('@/app/(frontend)/actions/cart', () => ({
  revalidateCartPrices: async (items: any[]) => (h.live ? h.live(items) : items),
}))

import { computeOrderPricing } from '@/lib/checkout/pricing'

const payload: any = {
  findByID: async ({ id }: any) => h.products[String(id)] ?? null,
  findGlobal: async () => {
    if (h.settings instanceof Error) throw h.settings
    return h.settings
  },
  find: async ({ collection }: any) => {
    if (collection === 'shippingzones') return { docs: [{ methods: h.methods }] }
    if (collection === 'processing-fees') return { docs: h.fees }
    return { docs: [] }
  },
}

const line = (over: any = {}) => ({ productId: '1', variantSku: 'DEFAULT', quantity: 2, priceSnapshot: 20, ...over })

beforeEach(() => {
  h.loggedIn = false
  h.viewerCalls = 0
  h.coupon = { valid: false }
  h.points = 0
  h.fees = []
  h.live = null
  h.methods = [
    { method: 'Standard Shipping', price: 500 },
    { method: 'Express Shipping', price: 2500 },
  ]
  h.products = { '1': { id: 1, name: 'P', stock: 10, subscriptionEnabled: true } }
  h.settings = { enabled: true, plans: [{ months: 3, label: '3 Months', discountPercent: 15, isActive: true }, { months: 6, label: '6 Months', discountPercent: 15, isActive: false }] }
})

const ok = (r: any) => {
  expect(r.error).toBeUndefined()
  return r
}

describe('computeOrderPricing (one-time orders from a logged-out visitor - must never change)', () => {
  it('subtotal + shipping', async () => {
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping' }))
    expect(r).toMatchObject({ subtotal: 40, finalShipping: 5, feeTotal: 0, total: 45, discountAmount: 0, pointsToRedeem: 0 })
    // no member discount for someone who is not logged in
    expect(r).toMatchObject({ memberDiscountAmount: 0, memberDiscountPercent: null, couponDiscountAmount: 0 })
  })

  it('applies mandatory percentage and fixed fees, skips optional ones, records cents', async () => {
    h.fees = [
      { id: 1, name: 'Card fee', type: 'percentage', amount: 3, isActive: true, isOptional: false },
      { id: 2, name: 'Handling', type: 'fixed_amount', amount: 250, isActive: true, isOptional: false },
      { id: 3, name: 'Insurance', type: 'fixed_amount', amount: 999, isActive: true, isOptional: true },
    ]
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping' }))
    expect(r.feeTotal).toBeCloseTo(1.2 + 2.5, 5)
    expect(r.appliedFees).toEqual([
      { feeId: 1, feeName: 'Card fee', amount: 120 },
      { feeId: 2, feeName: 'Handling', amount: 250 },
    ])
    expect(r.total).toBeCloseTo(40 + 5 + 3.7, 5)
  })

  it('coupon discount reduces the fee base; free-shipping coupon does not cover express', async () => {
    h.fees = [{ id: 1, name: 'Fee', type: 'percentage', amount: 10, isActive: true }]
    h.coupon = { valid: true, discount: 10, freeShipping: true }
    const std = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping', couponCode: 'X' }))
    expect(std).toMatchObject({ discountAmount: 10, finalShipping: 0 })
    expect(std.feeTotal).toBeCloseTo(3, 5) // 10% of (40 - 10)
    expect(std.total).toBeCloseTo(33, 5)
    const exp = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Express Shipping', couponCode: 'X' }))
    expect(exp.finalShipping).toBe(25)
  })

  it('an invalid coupon is ignored', async () => {
    h.coupon = { valid: false }
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping', couponCode: 'NOPE' }))
    expect(r.discountAmount).toBe(0)
  })

  it('points are capped at the total', async () => {
    h.points = 1000
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping', isRedeemingPoints: true }))
    expect(r.pointsToRedeem).toBe(45)
    expect(r.total).toBe(0)
    h.points = 10
    const r2 = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping', isRedeemingPoints: true }))
    expect(r2).toMatchObject({ pointsToRedeem: 10, total: 35 })
  })

  it('falls back to the first shipping method for an unknown name', async () => {
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Teleport' }))
    expect(r.finalShipping).toBe(5)
  })

  it('enforces a shipping method minimum order amount', async () => {
    h.methods = [{ method: 'Free Shipping', price: 0, minOrderAmount: 100 }]
    const r: any = await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Free Shipping' })
    expect(r.error).toMatch(/at least \$100/)
  })

  it('flags changed prices and returns the refreshed cart', async () => {
    h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: 25 }))
    const r: any = await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping' })
    expect(r.priceChanged).toBe(true)
    expect(r.updatedItems[0].priceSnapshot).toBe(25)
  })

  it('does not flag two NaN prices as a change', async () => {
    h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: NaN }))
    const r: any = await computeOrderPricing(payload, { items: [line({ priceSnapshot: NaN })], shippingMethodName: 'Standard Shipping' })
    expect(r.priceChanged).toBeUndefined()
  })

  it('rejects insufficient stock, unknown products and empty carts', async () => {
    h.products['1'].stock = 1
    expect(((await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'S' })) as any).error).toMatch(/Insufficient stock/)
    expect(((await computeOrderPricing(payload, { items: [line({ productId: '999' })], shippingMethodName: 'S' })) as any).error).toMatch(/not found/)
    expect(((await computeOrderPricing(payload, { items: [], shippingMethodName: 'S' })) as any).error).toMatch(/empty/)
  })

  it('subscription invoices can skip the stock and price-change checks', async () => {
    h.products['1'].stock = 0
    h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: 30 }))
    const r = ok(
      await computeOrderPricing(
        payload,
        { items: [line({ priceSnapshot: 0 })], shippingMethodName: 'Standard Shipping' },
        { checkStock: false, detectPriceChange: false },
      ),
    )
    expect(r.subtotal).toBe(60)
    expect(r.total).toBe(65)
  })
})

describe('computeOrderPricing - subscription plans', () => {
  const planLine = (over: any = {}) => line({ planMonths: 3, priceSnapshot: 17, ...over })
  beforeEach(() => {
    h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: 20 })) // live base price is $20
  })

  it('prices plan lines at the live price minus the plan discount', async () => {
    const r = ok(await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'Standard Shipping' }))
    expect(r).toMatchObject({ planMonths: 3, planDiscountPercent: 15, subtotal: 34, finalShipping: 5, total: 39 })
    expect(r.liveItems[0].priceSnapshot).toBe(17)
  })

  it('a client that sends the undiscounted price is told prices changed', async () => {
    const r: any = await computeOrderPricing(payload, { items: [planLine({ priceSnapshot: 20 })], shippingMethodName: 'Standard Shipping' })
    expect(r.priceChanged).toBe(true)
    expect(r.updatedItems[0].priceSnapshot).toBe(17)
  })

  it('coupons and fees work on a plan order like any other', async () => {
    h.fees = [{ id: 1, name: 'Fee', type: 'percentage', amount: 10, isActive: true }]
    h.coupon = { valid: true, discount: 4, freeShipping: false }
    const r = ok(await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'Standard Shipping', couponCode: 'X' }))
    expect(r.discountAmount).toBe(4)
    expect(r.feeTotal).toBeCloseTo(3, 5) // 10% of (34 - 4)
    expect(r.total).toBeCloseTo(34 - 4 + 5 + 3, 5)
  })

  it('rejects plan lines mixed with one-time lines, or with different plan lengths', async () => {
    const mixed: any = await computeOrderPricing(payload, { items: [planLine(), line()], shippingMethodName: 'S' })
    expect(mixed.error).toMatch(/on its own/)
    const lengths: any = await computeOrderPricing(payload, { items: [planLine(), planLine({ productId: '1', planMonths: 6 })], shippingMethodName: 'S' })
    expect(lengths.error).toMatch(/same plan length/)
  })

  it('rejects when subscriptions are switched off, the plan is inactive/unknown, or settings cannot be read', async () => {
    h.settings = { enabled: false, plans: [] }
    expect(((await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'S' })) as any).error).toMatch(/not available right now/)
    h.settings = { enabled: true, plans: [{ months: 3, label: '3', discountPercent: 15, isActive: false }] }
    expect(((await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'S' })) as any).error).toMatch(/no longer available/)
    h.settings = { enabled: true, plans: [{ months: 3, label: '3', discountPercent: 15, isActive: true }] }
    expect(((await computeOrderPricing(payload, { items: [planLine({ planMonths: 9 })], shippingMethodName: 'S' })) as any).error).toMatch(/no longer available/)
    h.settings = new Error('table missing') // e.g. migration not run yet: fails closed, never discounts
    expect(((await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'S' })) as any).error).toMatch(/not available right now/)
  })

  it('rejects products that are not subscription-enabled and bulk-bundle SKUs', async () => {
    h.products['1'].subscriptionEnabled = false
    expect(((await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'S' })) as any).error).toMatch(/not available as a subscription/)
    h.products['1'].subscriptionEnabled = true
    h.products['1'].bulkBundles = [{ name: 'Kit of 5' }]
    expect(((await computeOrderPricing(payload, { items: [planLine({ variantSku: '10mg - Kit of 5' })], shippingMethodName: 'S' })) as any).error).toMatch(/Bulk bundles/)
    expect(((await computeOrderPricing(payload, { items: [planLine({ variantSku: 'Kit of 5' })], shippingMethodName: 'S' })) as any).error).toMatch(/Bulk bundles/)
    ok(await computeOrderPricing(payload, { items: [planLine({ variantSku: '10mg' })], shippingMethodName: 'Standard Shipping' }))
  })

  it('monthly invoices (forced plan) use the locked-in discount, ignore current settings/eligibility, and skip stock+price checks', async () => {
    h.settings = { enabled: false, plans: [] } // feature switched off must not stop existing subscriptions
    h.products['1'].subscriptionEnabled = false
    h.products['1'].stock = 0
    const r = ok(
      await computeOrderPricing(
        payload,
        { items: [line({ priceSnapshot: 0, planMonths: 6 })], shippingMethodName: 'Standard Shipping' },
        { plan: { months: 6, discountPercent: 20 }, checkStock: false, detectPriceChange: false },
      ),
    )
    expect(r).toMatchObject({ planMonths: 6, planDiscountPercent: 20, subtotal: 32, total: 37 })
  })

  it('lenient shipping falls back when the free-shipping minimum is no longer met (invoices never get stuck)', async () => {
    h.methods = [{ method: 'Free Shipping', price: 0, minOrderAmount: 100 }, { method: 'Standard Shipping', price: 500 }]
    const strict: any = await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'Free Shipping' })
    expect(strict.error).toMatch(/at least/)
    const r = ok(await computeOrderPricing(payload, { items: [planLine()], shippingMethodName: 'Free Shipping' }, { lenientShipping: true }))
    expect(r.shippingMethodName).toBe('Standard Shipping')
    expect(r.finalShipping).toBe(5)
  })
})

// ─── Member discount ──────────────────────────────────────────────────────────

describe('computeOrderPricing - member discount (logged-in customers get 15% off)', () => {
  const price = (over: any = {}, input: any = {}, options?: any) =>
    computeOrderPricing(payload, { items: [line(over)], shippingMethodName: 'Standard Shipping', ...input }, options)

  it('takes 15% off the subtotal for a logged-in customer, and the total follows', async () => {
    h.loggedIn = true
    const r = ok(await price())
    // subtotal 40 -> 6.00 off; shipping 5
    expect(r).toMatchObject({
      subtotal: 40,
      discountAmount: 6,
      memberDiscountAmount: 6,
      memberDiscountPercent: 15,
      couponDiscountAmount: 0,
      finalShipping: 5,
      total: 39,
    })
  })

  it('gives nothing to a logged-out visitor', async () => {
    h.loggedIn = false
    const r = ok(await price())
    expect(r).toMatchObject({ discountAmount: 0, memberDiscountAmount: 0, memberDiscountPercent: null, total: 45 })
  })

  it('is decided on the server: nothing the browser sends can switch it on', async () => {
    h.loggedIn = false
    const r = ok(await price({}, { isMember: true, memberDiscount: 15, memberDiscountPercent: 99 }))
    expect(r.memberDiscountAmount).toBe(0)
    expect(r.total).toBe(45)
    // and it asked the login session, once
    expect(h.viewerCalls).toBe(1)
  })

  it('rounds to the nearest cent', async () => {
    h.loggedIn = true
    // 33.33 x 15% = 4.9995 -> 5.00 ; 0.07 x 15% = 0.0105 -> 0.01 ; 10.01 x 15% = 1.5015 -> 1.50
    expect(ok(await price({ quantity: 1, priceSnapshot: 33.33 })).memberDiscountAmount).toBe(5)
    expect(ok(await price({ quantity: 1, priceSnapshot: 0.07 })).memberDiscountAmount).toBe(0.01)
    expect(ok(await price({ quantity: 1, priceSnapshot: 10.01 })).memberDiscountAmount).toBe(1.5)
    expect(ok(await price({ quantity: 3, priceSnapshot: 19.99 })).memberDiscountAmount).toBe(9) // 59.97 x 15% = 8.9955
  })

  it('applies to the whole subtotal of a multi-line cart', async () => {
    h.loggedIn = true
    h.products['2'] = { id: 2, name: 'Q', stock: 10 }
    const r = ok(
      await computeOrderPricing(payload, {
        items: [line(), line({ productId: '2', quantity: 1, priceSnapshot: 60 })],
        shippingMethodName: 'Standard Shipping',
      }),
    )
    expect(r.subtotal).toBe(100)
    expect(r.memberDiscountAmount).toBe(15)
  })

  it('the processing fee is charged on the subtotal AFTER the member discount', async () => {
    h.loggedIn = true
    h.fees = [{ id: 1, name: 'Fee', type: 'percentage', amount: 10, isActive: true }]
    const r = ok(await price())
    expect(r.feeTotal).toBeCloseTo(3.4, 5) // 10% of (40 - 6)
    expect(r.total).toBeCloseTo(34 + 5 + 3.4, 5)
  })

  it('points come off after the discount', async () => {
    h.loggedIn = true
    h.points = 10
    const r = ok(await price({}, { isRedeemingPoints: true }))
    expect(r).toMatchObject({ memberDiscountAmount: 6, pointsToRedeem: 10, total: 29 }) // 34 + 5 - 10
  })

  it('always satisfies subtotal - discount + shipping + fees - points = total', async () => {
    h.loggedIn = true
    h.fees = [
      { id: 1, name: 'Fee', type: 'percentage', amount: 3, isActive: true },
      { id: 2, name: 'Handling', type: 'fixed_amount', amount: 250, isActive: true },
    ]
    h.points = 7
    // a gift card is the one thing that is paid ON TOP of the member discount, so both parts are non-zero here
    h.coupon = { valid: true, discount: 5, freeShipping: false, code: 'GIFT', description: '', type: 'store_credit' }
    const r = ok(await price({}, { couponCode: 'GIFT', isRedeemingPoints: true }))
    expect(r.subtotal - r.discountAmount + r.finalShipping + r.feeTotal - r.pointsToRedeem).toBeCloseTo(r.total, 8)
    expect(r.discountAmount).toBeCloseTo(r.memberDiscountAmount + r.couponDiscountAmount, 8)
    expect(r.memberDiscountAmount).toBe(6)
    expect(r.couponDiscountAmount).toBe(5)
  })

  describe('the member discount cannot be combined with another discount: whichever saves more applies', () => {
    const code = (discount: number, over: Record<string, unknown> = {}) => ({ valid: true, discount, freeShipping: false, code: 'SAVE', description: '', type: 'percentage', ...over })

    it('a code that saves LESS (4 < 6): the member discount applies alone and the code is not used', async () => {
      h.loggedIn = true
      h.coupon = code(4)
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r).toMatchObject({
        memberDiscountAmount: 6,
        memberDiscountPercent: 15,
        couponDiscountAmount: 0,
        discountAmount: 6, // (what the order stores as discountTotal)
        couponApplied: false,
        appliedCouponCode: null,
        couponDisplacedByMember: true,
        total: 39, // 40 - 6 + 5
      })
    })

    it('a code that saves MORE (12 > 6): the code applies alone and the member discount does not', async () => {
      h.loggedIn = true
      h.coupon = code(12)
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r).toMatchObject({
        memberDiscountAmount: 0,
        memberDiscountPercent: null, // the order records no member discount
        couponDiscountAmount: 12,
        discountAmount: 12,
        couponApplied: true,
        appliedCouponCode: 'SAVE',
        couponDisplacedByMember: false,
        total: 33, // 40 - 12 + 5
      })
    })

    it('an exact tie (6 = 6) goes to the member discount', async () => {
      h.loggedIn = true
      h.coupon = code(6)
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r).toMatchObject({ memberDiscountAmount: 6, couponDiscountAmount: 0, couponApplied: false, couponDisplacedByMember: true, total: 39 })
    })

    it('never both, whatever the code is worth', async () => {
      h.loggedIn = true
      for (const discount of [1, 5, 5.99, 6, 6.01, 15, 30, 40]) {
        h.coupon = code(discount)
        const r = ok(await price({}, { couponCode: 'SAVE' }))
        expect(r.discountAmount).toBe(Math.max(6, discount))
        expect(r.memberDiscountAmount === 0 || r.couponDiscountAmount === 0).toBe(true)
      }
    })

    it('a free-shipping code does not combine either: the member discount applies and the code (and its free shipping) is not used', async () => {
      h.loggedIn = true
      h.coupon = code(0, { freeShipping: true, code: 'SHIPFREE', type: 'free_shipping' })
      const r = ok(await price({}, { couponCode: 'SHIPFREE' }))
      expect(r).toMatchObject({ memberDiscountAmount: 6, couponApplied: false, couponDisplacedByMember: true, freeShipping: false, finalShipping: 5, total: 39 })
    })

    it('a free-shipping code still works for a logged-out visitor, exactly as before', async () => {
      h.loggedIn = false
      h.coupon = code(0, { freeShipping: true, code: 'SHIPFREE', type: 'free_shipping' })
      const r = ok(await price({}, { couponCode: 'SHIPFREE' }))
      expect(r).toMatchObject({ memberDiscountAmount: 0, couponApplied: true, couponDisplacedByMember: false, freeShipping: true, finalShipping: 0, total: 40 })
    })

    it('a code that lost is not recorded as used on the subscription either way: no subscription scope is kept', async () => {
      h.loggedIn = true
      h.coupon = code(4, { subscriptionScope: 'every_month' })
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r.couponSubscriptionScope).toBeNull()
    })

    it('an invalid code is ignored and the member discount applies as normal (nothing was displaced)', async () => {
      h.loggedIn = true
      h.coupon = { valid: false }
      const r = ok(await price({}, { couponCode: 'NOPE' }))
      expect(r).toMatchObject({ memberDiscountAmount: 6, couponDiscountAmount: 0, couponApplied: false, couponDisplacedByMember: false, total: 39 })
    })

    it('a logged-out visitor with a code is exactly as before (no member discount, the code applies)', async () => {
      h.loggedIn = false
      h.coupon = code(6)
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r).toMatchObject({ memberDiscountAmount: 0, couponDiscountAmount: 6, discountAmount: 6, couponApplied: true, couponDisplacedByMember: false, total: 39 })
    })

    it('the fee is charged on whichever discount applied', async () => {
      h.loggedIn = true
      h.fees = [{ id: 1, name: 'Fee', type: 'percentage', amount: 10, isActive: true }]
      h.coupon = code(20)
      const r = ok(await price({}, { couponCode: 'SAVE' }))
      expect(r.feeTotal).toBeCloseTo(2, 5) // 10% of (40 - 20): the code won
    })

    describe('gift cards / store credit are the exception: paid on top of the member discount', () => {
      it('the member discount comes off first and the credit covers what is left, never more', async () => {
        h.loggedIn = true
        h.coupon = code(40, { code: 'GIFT', type: 'store_credit' }) // a card worth at least the whole $40
        const r = ok(await price({}, { couponCode: 'GIFT' }))
        expect(r).toMatchObject({
          memberDiscountAmount: 6,
          couponDiscountAmount: 34, // 40 - 6: the card keeps the rest of its balance
          discountAmount: 40,
          couponApplied: true,
          appliedCouponCode: 'GIFT',
          couponDisplacedByMember: false,
          total: 5,
        })
      })

      it('a small card is added to the member discount', async () => {
        h.loggedIn = true
        h.coupon = code(5, { code: 'GIFT', type: 'store_credit' })
        const r = ok(await price({}, { couponCode: 'GIFT' }))
        expect(r).toMatchObject({ memberDiscountAmount: 6, couponDiscountAmount: 5, discountAmount: 11, couponApplied: true, total: 34 })
      })

      it('a logged-out visitor just uses the card', async () => {
        h.loggedIn = false
        h.coupon = code(40, { code: 'GIFT', type: 'store_credit' })
        const r = ok(await price({}, { couponCode: 'GIFT' }))
        expect(r).toMatchObject({ memberDiscountAmount: 0, couponDiscountAmount: 40, total: 5 })
      })
    })
  })

  describe('never on a subscription plan (plans have their own discount)', () => {
    it('a logged-in customer buying a plan gets the plan discount only', async () => {
      h.loggedIn = true
      h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: 20 })) // live base price $20; the plan line carries the 15%-off price
      const r = ok(await computeOrderPricing(payload, { items: [line({ planMonths: 3, priceSnapshot: 17 })], shippingMethodName: 'Standard Shipping' }))
      expect(r.planMonths).toBe(3)
      expect(r).toMatchObject({ memberDiscountAmount: 0, memberDiscountPercent: null, discountAmount: 0 })
      expect(r.subtotal).toBe(34) // 40 less the 15% plan discount
      expect(h.viewerCalls).toBe(0) // not even asked
    })

    it('later invoices of a subscription (a plan is passed in) are priced without a member discount, and without a session', async () => {
      h.loggedIn = true
      const r = ok(
        await computeOrderPricing(
          payload,
          { items: [line()], shippingMethodName: 'Standard Shipping' },
          { plan: { months: 3, discountPercent: 15 }, lenientShipping: true, detectPriceChange: false },
        ),
      )
      expect(r.memberDiscountAmount).toBe(0)
      expect(h.viewerCalls).toBe(0)
    })
  })

  describe('the caller can state membership explicitly (code with no request, and tests)', () => {
    it('isMember: true applies it without asking the session', async () => {
      h.loggedIn = false
      const r = ok(await price({}, {}, { isMember: true }))
      expect(r.memberDiscountAmount).toBe(6)
      expect(h.viewerCalls).toBe(0)
    })

    it('isMember: false switches it off even when logged in', async () => {
      h.loggedIn = true
      const r = ok(await price({}, {}, { isMember: false }))
      expect(r.memberDiscountAmount).toBe(0)
    })
  })

  it('a price change still stops the order first (the discount is never worked out on stale prices)', async () => {
    h.loggedIn = true
    h.live = (items) => items.map((i) => ({ ...i, priceSnapshot: 25 }))
    const r: any = await price()
    expect(r.priceChanged).toBe(true)
  })

  it('the shipping minimum is checked against the subtotal before discounts', async () => {
    h.loggedIn = true
    h.methods = [{ method: 'Free Shipping', price: 0, minOrderAmount: 40 }]
    const r = ok(await price({}, { shippingMethodName: 'Free Shipping' }))
    expect(r).toMatchObject({ subtotal: 40, memberDiscountAmount: 6, finalShipping: 0, total: 34 })
  })
})
