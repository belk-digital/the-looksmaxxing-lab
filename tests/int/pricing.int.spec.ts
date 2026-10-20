import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => ({
  coupon: { valid: false } as any,
  points: 0,
  fees: [] as any[],
  methods: [] as any[],
  products: {} as Record<string, any>,
  live: null as null | ((items: any[]) => any[]),
  settings: null as any,
}))

vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  verifyCoupon: async () => h.coupon,
  getUserMaxxPoints: async () => h.points,
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

describe('computeOrderPricing (one-time orders - must never change)', () => {
  it('subtotal + shipping', async () => {
    const r = ok(await computeOrderPricing(payload, { items: [line()], shippingMethodName: 'Standard Shipping' }))
    expect(r).toMatchObject({ subtotal: 40, finalShipping: 5, feeTotal: 0, total: 45, discountAmount: 0, pointsToRedeem: 0 })
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
