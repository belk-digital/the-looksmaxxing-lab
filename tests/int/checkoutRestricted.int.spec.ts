/**
 * Checkout refuses members-only orders (nasal sprays, and GLP-3RTA / Tirzepatide / Semaglutide in any format)
 * from logged-out visitors, in BOTH places an order can start:
 *  - createPaymentIntent (starts the card payment)
 *  - createPayloadOrder  (creates the order)
 * and does so before any payment or order is created.
 *
 * Everything the checkout talks to (Stripe, Payload, pricing, login) is mocked: no database, no network.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => ({
  loggedIn: false,
  pricing: null as any,
  stripeCreate: vi.fn(),
  payloadCreate: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class {
    paymentIntents = {
      create: (...args: unknown[]) => h.stripeCreate(...args),
      retrieve: async () => ({ id: 'pi_test', status: 'requires_payment_method', amount: 5000, metadata: {} }),
      cancel: vi.fn(),
    }
  },
}))
vi.mock('payload', () => ({
  getPayload: async () => ({
    find: async () => ({ docs: [] }),
    findByID: async () => null,
    findGlobal: async () => ({}),
    create: (...args: unknown[]) => h.payloadCreate(...args),
    update: async () => ({}),
  }),
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock('next-auth/next', () => ({ getServerSession: async () => null }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/access/viewer', () => ({ isLoggedIn: async () => h.loggedIn }))
vi.mock('@/lib/checkout/pricing', () => ({ computeOrderPricing: async () => h.pricing }))
vi.mock('@/lib/orders/orderCookie', () => ({ signOrderCookie: () => 'x', verifyOrderCookie: () => true }))
vi.mock('@/lib/payments/bridge', () => ({ buildBridgeHandoff: () => ({}) }))
vi.mock('@/lib/orders/payments', () => ({ checkStripePaymentCoversOrder: () => ({ ok: true }), STRIPE_OPEN_STATUSES: [] }))
vi.mock('@/lib/orders/alerts', () => ({ alertAdmin: async () => undefined }))
vi.mock('@/lib/checkout/data', () => ({ loadShippingMethods: async () => [], loadActiveProcessingFees: async () => [] }))
vi.mock('@/lib/subscriptions/settings', () => ({ getSubscriptionSettings: async () => ({}), allowedPaymentMethods: () => [] }))
vi.mock('@/lib/subscriptions/service', () => ({ createSubscriptionForCheckout: async () => ({}), syncSubscription: async () => ({}) }))

import { createPaymentIntent, createPayloadOrder } from '../../src/app/(frontend)/(shop)/checkout/actions'
import { RESTRICTED_LOGIN_MESSAGE } from '../../src/lib/access/restrictedProducts'

const pricingFor = (...slugs: string[]) => ({
  error: undefined,
  total: 50,
  subtotal: 50,
  planMonths: null,
  liveItems: [],
  productsById: new Map(slugs.map((slug, i) => [String(i + 1), { id: i + 1, slug }])),
})

const savedFlag = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS

beforeEach(() => {
  h.loggedIn = false
  h.pricing = pricingFor('bpc-157-spray')
  h.stripeCreate.mockReset()
  h.stripeCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test' })
  h.payloadCreate.mockReset()
  if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
  else process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = savedFlag
})

describe('createPaymentIntent (starting a card payment)', () => {
  it('refuses a logged-out visitor with a spray in the basket, and never contacts Stripe', async () => {
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBe(RESTRICTED_LOGIN_MESSAGE)
    expect(res.loginRequired).toBe(true)
    expect(h.stripeCreate).not.toHaveBeenCalled()
  })

  it.each(['glp-3rta', 'tirzepatide', 'semaglutide'])('refuses a logged-out visitor with %s (vial) in the basket, and never contacts Stripe', async (slug) => {
    h.pricing = pricingFor('bpc-157', slug)
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBe(RESTRICTED_LOGIN_MESSAGE)
    expect(res.loginRequired).toBe(true)
    expect(h.stripeCreate).not.toHaveBeenCalled()
  })

  it('lets a logged-in customer pay for a gated compound', async () => {
    h.loggedIn = true
    h.pricing = pricingFor('tirzepatide', 'semaglutide', 'glp-3rta')
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBeUndefined()
    expect(res.clientSecret).toBe('secret_test')
  })

  it('lets a logged-in customer pay for a spray', async () => {
    h.loggedIn = true
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBeUndefined()
    expect(res.clientSecret).toBe('secret_test')
    expect(h.stripeCreate).toHaveBeenCalledTimes(1)
  })

  it('does not get in the way of an ordinary order from a logged-out visitor', async () => {
    h.pricing = pricingFor('bpc-157', 'tb-500')
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBeUndefined()
    expect(res.clientSecret).toBe('secret_test')
  })

  it('does not hide a pricing error behind the login message', async () => {
    h.pricing = { error: 'Price changed', updatedItems: [], priceChanged: true, productsById: new Map() }
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBe('Price changed')
    expect(res.loginRequired).toBeUndefined()
  })

  it('lets everyone order sprays when the kill switch is off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const res: any = await createPaymentIntent([], 'standard', undefined, false)
    expect(res.error).toBeUndefined()
    expect(h.stripeCreate).toHaveBeenCalledTimes(1)
  })
})

describe('createPayloadOrder (creating the order)', () => {
  const place = () => createPayloadOrder([], 'standard', undefined, false, { email: 'a@b.co' }, 'pi_test')

  it('refuses a logged-out visitor with a spray in the basket, and creates nothing', async () => {
    const res: any = await place()
    expect(res.error).toBe(RESTRICTED_LOGIN_MESSAGE)
    expect(res.loginRequired).toBe(true)
    expect(h.payloadCreate).not.toHaveBeenCalled()
  })

  it.each(['glp-3rta', 'tirzepatide', 'semaglutide'])('refuses a logged-out visitor with %s (vial) in the basket, and creates nothing', async (slug) => {
    h.pricing = pricingFor('bpc-157', slug)
    const res: any = await place()
    expect(res.error).toBe(RESTRICTED_LOGIN_MESSAGE)
    expect(res.loginRequired).toBe(true)
    expect(h.payloadCreate).not.toHaveBeenCalled()
  })

  it('does not refuse a logged-in customer', async () => {
    h.loggedIn = true
    const res: any = await place()
    expect(res.loginRequired).toBeUndefined()
    expect(res.error).not.toBe(RESTRICTED_LOGIN_MESSAGE)
  })

  it('does not refuse an ordinary order from a logged-out visitor', async () => {
    h.pricing = pricingFor('bpc-157')
    const res: any = await place()
    expect(res.loginRequired).toBeUndefined()
    expect(res.error).not.toBe(RESTRICTED_LOGIN_MESSAGE)
  })
})
