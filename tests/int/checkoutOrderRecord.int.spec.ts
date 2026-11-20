/**
 * What checkout actually charges and writes down, end to end through the real pricing and the real order creation
 * (only the database, Stripe and the login session are faked):
 *
 * - Member discount: a logged-in customer is charged 20% less and the order record says so (discountTotal,
 *   memberDiscountTotal, memberDiscountPercent); a logged-out visitor is charged in full and the order says "none".
 * - Shipping: every order ships by Express Shipping at $20; the order records the method that was actually charged,
 *   whatever name the browser sent (a page left open from before the shipping options changed).
 * - The card payment (Stripe) is for exactly the same amount as the order.
 *
 * No real database, no network.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    loggedIn: false,
    created: [] as any[],
    stripeAmounts: [] as number[],
    methods: [{ method: 'Express Shipping', price: 2000, estimatedDays: null as number | null, minOrderAmount: null as number | null }] as any[],
    coupon: { valid: false } as any,
    products: { '1': { id: 1, name: 'BPC-157', slug: 'bpc-157', stock: 50 } } as Record<string, any>,
  }
  const payload: any = {
    find: async ({ collection }: any) => {
      if (collection === 'shippingzones') return { docs: [{ methods: state.methods }] }
      return { docs: [] }
    },
    findByID: async ({ id }: any) => state.products[String(id)] ?? null,
    findGlobal: async () => ({}),
    create: async (args: any) => {
      state.created.push(args)
      return { id: 91 }
    },
    update: async () => ({}),
  }
  return { state, payload }
})

vi.mock('stripe', () => ({
  default: class {
    paymentIntents = {
      create: async (args: any) => {
        h.state.stripeAmounts.push(args.amount)
        return { id: 'pi_test', client_secret: 'secret_test' }
      },
      retrieve: async () => ({ id: 'pi_test', status: 'requires_payment_method', metadata: {} }),
      cancel: vi.fn(),
    }
  },
}))
vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: vi.fn() }) }))
vi.mock('next-auth/next', () => ({ getServerSession: async () => null }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/access/viewer', () => ({ isLoggedIn: async () => h.state.loggedIn }))
vi.mock('@/lib/orders/orderCookie', () => ({ signOrderCookie: () => 'x', verifyOrderCookie: () => true }))
vi.mock('@/lib/payments/bridge', () => ({ buildBridgeHandoff: () => ({}) }))
vi.mock('@/lib/orders/payments', () => ({ checkStripePaymentCoversOrder: () => ({ ok: true }), STRIPE_OPEN_STATUSES: ['requires_payment_method'] }))
vi.mock('@/lib/orders/alerts', () => ({ alertAdmin: async () => undefined }))
vi.mock('@/lib/subscriptions/settings', () => ({
  getSubscriptionSettings: async () => ({ enabled: false, plans: [] }),
  findActivePlan: () => null,
  allowedPaymentMethods: () => [],
}))
vi.mock('@/lib/subscriptions/service', () => ({ createSubscriptionForCheckout: async () => ({}), syncSubscription: async () => ({}) }))
vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  verifyCoupon: async () => h.state.coupon,
  getUserMaxxPoints: async () => 0,
}))
vi.mock('@/app/(frontend)/actions/cart', () => ({ revalidateCartPrices: async (items: any[]) => items }))

import { createPayloadOrder, createPaymentIntent } from '../../src/app/(frontend)/(shop)/checkout/actions'

const line = (over: Record<string, unknown> = {}) => ({ productId: '1', variantSku: 'DEFAULT', quantity: 2, priceSnapshot: 20, ...over })
const formData = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', address: '1 Main St', city: 'Austin', state: 'TX', zip: '73301', phone: '555' }

/** Places an order paid through the card bridge (the order is left pending; no stock/email side effects run). */
const placeOrder = (shippingMethodName = 'Express Shipping', couponCode?: string) =>
  createPayloadOrder([line()], shippingMethodName, couponCode, false, formData, 'authnet_bridge', undefined, 'authnet_bridge')
const savedOrder = () => h.state.created.find((c) => c.collection === 'orders')?.data

beforeEach(() => {
  h.state.loggedIn = false
  h.state.created = []
  h.state.stripeAmounts = []
  h.state.coupon = { valid: false }
  h.state.methods = [{ method: 'Express Shipping', price: 2000, estimatedDays: null, minOrderAmount: null }]
})

describe('the order a logged-in member places', () => {
  it('is charged 20% less, and the order record says so', async () => {
    h.state.loggedIn = true
    const res: any = await placeOrder()
    expect(res.error).toBeUndefined()
    expect(res.orderId).toBe('91')
    expect(savedOrder()).toMatchObject({
      subtotal: 40,
      discountTotal: 8,
      memberDiscountTotal: 8,
      memberDiscountPercent: 20,
      shippingTotal: 20,
      total: 52, // 40 - 8 + 20
    })
  })

  it('a code that saves LESS than the member discount is not used: only the member discount is charged, and the code is not recorded', async () => {
    h.state.loggedIn = true
    h.state.coupon = { valid: true, discount: 6, freeShipping: false, code: 'SAVE', description: '', type: 'percentage' }
    await placeOrder('Express Shipping', 'SAVE')
    expect(savedOrder()).toMatchObject({
      discountTotal: 8,
      memberDiscountTotal: 8,
      memberDiscountPercent: 20,
      couponCode: '', // it was not used, so it is not on the order (and will not be counted as used)
      total: 52, // 40 - 8 + 20
    })
  })

  it('a code that saves MORE replaces the member discount: only the code is charged and recorded, and the order says no member discount', async () => {
    h.state.loggedIn = true
    h.state.coupon = { valid: true, discount: 12, freeShipping: false, code: 'BIG', description: '', type: 'percentage' }
    await placeOrder('Express Shipping', 'BIG')
    const order = savedOrder()
    expect(order).toMatchObject({
      discountTotal: 12,
      memberDiscountTotal: 0,
      couponCode: 'BIG',
      total: 48, // 40 - 12 + 20
    })
    expect(order.memberDiscountPercent == null).toBe(true)
  })

  it('a gift card is paid on top of the member discount, and both are recorded', async () => {
    h.state.loggedIn = true
    h.state.coupon = { valid: true, discount: 6, freeShipping: false, code: 'GIFT', description: '', type: 'store_credit' }
    await placeOrder('Express Shipping', 'GIFT')
    expect(savedOrder()).toMatchObject({
      discountTotal: 14,
      memberDiscountTotal: 8,
      memberDiscountPercent: 20,
      couponCode: 'GIFT',
      total: 46, // 40 - 14 + 20
    })
  })

  it('the card payment is for the amount that applies when a code loses or wins', async () => {
    h.state.loggedIn = true
    h.state.coupon = { valid: true, discount: 6, freeShipping: false, code: 'SAVE', description: '', type: 'percentage' }
    await createPaymentIntent([line()], 'Express Shipping', 'SAVE', false)
    h.state.coupon = { valid: true, discount: 12, freeShipping: false, code: 'BIG', description: '', type: 'percentage' }
    await createPaymentIntent([line()], 'Express Shipping', 'BIG', false)
    expect(h.state.stripeAmounts).toEqual([5200, 4800])
  })

  it('the card payment is for exactly the same amount as the order', async () => {
    h.state.loggedIn = true
    const intent: any = await createPaymentIntent([line()], 'Express Shipping', undefined, false)
    expect(intent.error).toBeUndefined()
    expect(h.state.stripeAmounts).toEqual([5200])
    await placeOrder()
    expect(savedOrder().total * 100).toBe(h.state.stripeAmounts[0])
  })
})

describe('the order a logged-out visitor places', () => {
  it('is charged in full, and the order record says there was no member discount', async () => {
    const res: any = await placeOrder()
    expect(res.error).toBeUndefined()
    expect(savedOrder()).toMatchObject({
      subtotal: 40,
      discountTotal: 0,
      memberDiscountTotal: 0,
      memberDiscountPercent: null,
      shippingTotal: 20,
      total: 60,
    })
  })

  it('a coupon still works exactly as before, with no member part', async () => {
    h.state.coupon = { valid: true, discount: 6, freeShipping: false, code: 'SAVE', description: '' }
    await placeOrder('Express Shipping', 'SAVE')
    expect(savedOrder()).toMatchObject({ discountTotal: 6, memberDiscountTotal: 0, memberDiscountPercent: null, total: 54 })
  })

  it('the card payment is for the full amount', async () => {
    await createPaymentIntent([line()], 'Express Shipping', undefined, false)
    expect(h.state.stripeAmounts).toEqual([6000])
  })
})

describe('shipping: every order ships by Express Shipping ($20)', () => {
  it('charges $20 and records "Express Shipping"', async () => {
    await placeOrder()
    expect(savedOrder()).toMatchObject({ shippingMethod: 'Express Shipping', shippingTotal: 20 })
  })

  it.each(['Standard Shipping', 'Free Shipping', 'express', '', 'Teleport'])(
    'a browser that still asks for "%s" (a page left open from before the change) is charged for, and recorded as, Express Shipping',
    async (stale) => {
      await placeOrder(stale)
      expect(savedOrder()).toMatchObject({ shippingMethod: 'Express Shipping', shippingTotal: 20, total: 60 })
    },
  )

  it('the card payment for a stale shipping name is still the Express price', async () => {
    await createPaymentIntent([line()], 'Standard Shipping', undefined, false)
    expect(h.state.stripeAmounts).toEqual([6000])
  })

  it('a free-shipping coupon does not remove the $20 (free-shipping coupons have never covered Express)', async () => {
    h.state.coupon = { valid: true, discount: 0, freeShipping: true, code: 'SHIPFREE', description: '' }
    await placeOrder('Express Shipping', 'SHIPFREE')
    expect(savedOrder()).toMatchObject({ shippingMethod: 'Express Shipping', shippingTotal: 20, total: 60 })
  })

  it('the shipping minimum of a method is not involved: the one method is always available', async () => {
    h.state.loggedIn = true
    await placeOrder()
    expect(savedOrder().shippingTotal).toBe(20)
  })
})
