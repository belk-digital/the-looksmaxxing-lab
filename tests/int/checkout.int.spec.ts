import { describe, it, expect, beforeEach, vi } from 'vitest'
import crypto from 'crypto'

const h = vi.hoisted(() => ({
  stripe: { retrieve: vi.fn(), update: vi.fn(), create: vi.fn(), cancel: vi.fn() },
  finalize: vi.fn(),
  cookieSet: vi.fn(),
  methods: [] as any[],
  orders: {} as Record<string, any>,
  nextOrderId: 100,
  payload: null as any,
}))

vi.mock('stripe', () => ({ default: class { paymentIntents = h.stripe } }))
vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const set = h.cookieSet.mock.calls.find((c: any[]) => c[0] === name)
      return set ? { value: set[1] } : undefined
    },
    set: h.cookieSet,
  }),
  headers: async () => new Headers(),
}))
vi.mock('next-auth/next', () => ({ getServerSession: async () => null }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  verifyCoupon: async () => ({ valid: false }),
  getUserMaxxPoints: async () => 0,
}))
vi.mock('@/app/(frontend)/actions/cart', () => ({ revalidateCartPrices: async (items: any[]) => items }))
vi.mock('@/lib/orders/finalizeOrder', () => ({ finalizeOrder: h.finalize }))
vi.mock('@/lib/orders/alerts', () => ({ alertAdmin: vi.fn(async () => undefined) }))

process.env.PAYLOAD_SECRET = 'test-secret-test-secret-test-secret'
process.env.CROSS_SITE_PAYMENT_SECRET = 'bridge-secret-bridge-secret-bridge'
process.env.LONGEVIA_BEAUTY_BRIDGE_URL = 'https://longeviabeauty.com/wp-json/longevia-bridge/v1/pay'
process.env.STRIPE_SECRET_KEY = 'sk_test_x'

import { createPayloadOrder, createPaymentIntent, syncPaymentStatus, createCrossSitePaymentRedirect } from '@/app/(frontend)/(shop)/checkout/actions'

const ITEMS = [{ productId: '1', variantSku: 'DEFAULT', quantity: 2, priceSnapshot: 20, product: { id: '1', name: 'P' } }]
const FORM = { email: 'c@x.y', firstName: 'A', lastName: 'B', phone: '1', address: '1 St', city: 'C', state: 'NY', zip: '10001' }
// 2 x $20 = $40 + $5 shipping = $45 -> 4500 cents
const TOTAL_CENTS = 4500

function makePayload() {
  return {
    findByID: async ({ collection, id }: any) => {
      if (collection === 'products') return { id: 1, name: 'P', stock: 10, price: 20 }
      if (collection === 'orders') return h.orders[String(id)] ?? null
      return null
    },
    find: async ({ collection }: any) => {
      if (collection === 'shippingzones') return { docs: [{ methods: [{ method: 'Standard Shipping', price: 500 }] }] }
      return { docs: [] }
    },
    findGlobal: async () => ({ methods: h.methods }),
    create: async ({ collection, data }: any) => {
      const id = h.nextOrderId++
      const doc = { id, orderNumber: String(id), ...data }
      if (collection === 'orders') h.orders[String(id)] = doc
      return doc
    },
    update: async ({ collection, id, data }: any) => {
      if (collection === 'orders') Object.assign(h.orders[String(id)], data)
      return h.orders[String(id)]
    },
  }
}

const open = (over: any = {}) => ({ id: 'pi_1', status: 'requires_payment_method', amount: TOTAL_CENTS, currency: 'usd', metadata: {}, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  h.orders = {}
  h.nextOrderId = 100
  h.payload = makePayload()
  h.methods = [
    { methodId: 'stripe', isActive: true },
    { methodId: 'zelle', isActive: true },
    { methodId: 'authnet_bridge', isActive: true },
  ]
  h.finalize.mockResolvedValue(true)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

describe('createPayloadOrder - Stripe', () => {
  it('binds an exactly-matching open PaymentIntent to the new order', async () => {
    h.stripe.retrieve.mockResolvedValue(open())
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(res.orderId).toBe('100')
    expect(h.stripe.update).toHaveBeenCalledWith('pi_1', { metadata: { orderId: '100' } })
    expect(h.orders['100']).toMatchObject({ status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'stripe', total: 45 })
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('REJECTS a cheap PaymentIntent used for a bigger order (underpayment attack)', async () => {
    h.stripe.retrieve.mockResolvedValue(open({ amount: 100 }))
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(res.error).toBeTruthy()
    expect(res.orderId).toBeUndefined()
    expect(Object.keys(h.orders)).toHaveLength(0)
    expect(h.stripe.update).not.toHaveBeenCalled()
  })

  it('REJECTS an already-succeeded PaymentIntent (reuse across orders)', async () => {
    h.stripe.retrieve.mockResolvedValue(open({ status: 'succeeded', metadata: { orderId: '55' } }))
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(res.error).toBeTruthy()
    expect(Object.keys(h.orders)).toHaveLength(0)
  })

  it('rejects canceled / processing intents too', async () => {
    for (const status of ['canceled', 'processing']) {
      h.stripe.retrieve.mockResolvedValue(open({ status }))
      const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
      expect(res.error).toBeTruthy()
    }
  })

  it('rejects a real Stripe intent paired with a different payment method label', async () => {
    h.stripe.retrieve.mockResolvedValue(open())
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1', undefined, 'zelle')
    expect(res.error).toBeTruthy()
    expect(Object.keys(h.orders)).toHaveLength(0)
  })

  it('retry after a declined card: reuses the intent and cancels the superseded unpaid order', async () => {
    h.orders['77'] = { id: 77, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'stripe', isFinalized: false }
    h.stripe.retrieve.mockResolvedValue(open({ metadata: { orderId: '77' } }))
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(res.orderId).toBe('100')
    expect(h.orders['77'].status).toBe('cancelled')
    expect(h.stripe.update).toHaveBeenCalledWith('pi_1', { metadata: { orderId: '100' } })
  })

  it('never cancels a superseded order that was already paid/finalized', async () => {
    h.orders['77'] = { id: 77, status: 'paid', paymentStatus: 'captured', paymentMethod: 'stripe', isFinalized: true }
    h.stripe.retrieve.mockResolvedValue(open({ metadata: { orderId: '77' } }))
    await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(h.orders['77'].status).toBe('paid')
  })

  it('refuses when Stripe cannot verify the intent', async () => {
    h.stripe.retrieve.mockRejectedValue(new Error('network'))
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'pi_1')
    expect(res.error).toBeTruthy()
    expect(Object.keys(h.orders)).toHaveLength(0)
  })

  it('refuses a missing / garbage payment reference', async () => {
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, '')
    expect(res.error).toBeTruthy()
  })
})

describe('createPayloadOrder - other methods', () => {
  it('Zelle (manual): creates + finalizes unpaid-awaiting-funds, no Stripe involved', async () => {
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'manual', undefined, 'zelle')
    expect(res.orderId).toBe('100')
    expect(h.finalize).toHaveBeenCalledWith(100, expect.anything(), true)
    expect(h.stripe.retrieve).not.toHaveBeenCalled()
    expect(h.orders['100'].paymentMethod).toBe('zelle')
  })

  it('"manual" cannot be used to skip payment for the stripe method', async () => {
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'manual', undefined, 'stripe')
    expect(res.error).toBeTruthy()
    expect(Object.keys(h.orders)).toHaveLength(0)
  })

  it('rejects a method an admin has disabled', async () => {
    h.methods = [{ methodId: 'stripe', isActive: true }]
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'manual', undefined, 'zelle')
    expect(res.error).toBeTruthy()
  })

  it('"free_order" is refused when the order is not actually free', async () => {
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'free_order')
    expect(res.error).toBeTruthy()
    expect(Object.keys(h.orders)).toHaveLength(0)
  })

  it('a genuinely free order is created paid and finalized (even if stripe method is disabled)', async () => {
    h.methods = [{ methodId: 'zelle', isActive: true }]
    const free = [{ ...ITEMS[0], priceSnapshot: 0 }]
    h.payload.find = async ({ collection }: any) =>
      collection === 'shippingzones' ? { docs: [{ methods: [{ method: 'Standard Shipping', price: 0 }] }] } : { docs: [] }
    const res: any = await createPayloadOrder(free, 'Standard Shipping', undefined, false, FORM, 'free_order')
    expect(res.orderId).toBe('100')
    expect(h.orders['100']).toMatchObject({ status: 'paid', paymentStatus: 'captured' })
    expect(h.finalize).toHaveBeenCalled()
  })
})

describe('createPaymentIntent', () => {
  it('creates an intent without null metadata keys and cancels the obsolete unbound one', async () => {
    h.stripe.create.mockResolvedValue({ id: 'pi_new', client_secret: 'secret_new' })
    h.stripe.retrieve.mockResolvedValue(open({ id: 'pi_old' }))
    const res: any = await createPaymentIntent(ITEMS, 'Standard Shipping', undefined, false, 'pi_old')
    expect(res).toMatchObject({ clientSecret: 'secret_new', paymentIntentId: 'pi_new', amount: 45 })
    expect(h.stripe.create).toHaveBeenCalledWith(expect.objectContaining({ amount: TOTAL_CENTS, metadata: {} }))
    expect(h.stripe.cancel).toHaveBeenCalledWith('pi_old')
  })
  it('does not cancel an intent that is already bound to an order', async () => {
    h.stripe.create.mockResolvedValue({ id: 'pi_new', client_secret: 's' })
    h.stripe.retrieve.mockResolvedValue(open({ id: 'pi_old', metadata: { orderId: '9' } }))
    await createPaymentIntent(ITEMS, 'Standard Shipping', undefined, false, 'pi_old')
    expect(h.stripe.cancel).not.toHaveBeenCalled()
  })
  it('works with no previous intent (first load)', async () => {
    h.stripe.create.mockResolvedValue({ id: 'pi_new', client_secret: 's' })
    const res: any = await createPaymentIntent(ITEMS, 'Standard Shipping', undefined, false)
    expect(res.paymentIntentId).toBe('pi_new')
    expect(h.stripe.cancel).not.toHaveBeenCalled()
  })
})

describe('syncPaymentStatus', () => {
  const pi = (over: any = {}) => ({ id: 'pi_1', status: 'succeeded', amount: TOTAL_CENTS, amount_received: TOTAL_CENTS, currency: 'usd', metadata: { orderId: '100' }, ...over })
  beforeEach(() => { h.orders['100'] = { id: 100, total: 45, paymentMethod: 'stripe', status: 'pending' } })

  it('finalizes a fully-paid, correctly-bound order', async () => {
    h.stripe.retrieve.mockResolvedValue(pi())
    expect(await syncPaymentStatus('pi_1', '100')).toEqual({ success: true })
    expect(h.finalize).toHaveBeenCalledWith('100', expect.anything())
  })
  it('does NOT finalize when the paid amount is short', async () => {
    h.stripe.retrieve.mockResolvedValue(pi({ amount: 100, amount_received: 100 }))
    const res: any = await syncPaymentStatus('pi_1', '100')
    expect(res.error).toBeTruthy()
    expect(h.finalize).not.toHaveBeenCalled()
  })
  it('does NOT finalize an order the intent is not bound to', async () => {
    h.stripe.retrieve.mockResolvedValue(pi({ metadata: { orderId: '5' } }))
    expect(((await syncPaymentStatus('pi_1', '100')) as any).error).toBeTruthy()
    expect(h.finalize).not.toHaveBeenCalled()
  })
  it('reports failure (not success) when finalize fails', async () => {
    h.stripe.retrieve.mockResolvedValue(pi())
    h.finalize.mockResolvedValue(false)
    expect(((await syncPaymentStatus('pi_1', '100')) as any).error).toBeTruthy()
  })
})

// ---- Authorize.net bridge ------------------------------------------------------------
describe('Authorize.net bridge', () => {
  it('createPayloadOrder leaves a bridge order pending/unpaid, untouched by Stripe, with a signed cookie', async () => {
    const res: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'authnet_bridge', undefined, 'authnet_bridge')
    expect(res.orderId).toBe('100')
    expect(h.orders['100']).toMatchObject({ status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'authnet_bridge', total: 45 })
    expect(h.stripe.retrieve).not.toHaveBeenCalled()
    expect(h.stripe.update).not.toHaveBeenCalled()
    expect(h.finalize).not.toHaveBeenCalled()
    expect(h.cookieSet).toHaveBeenCalledWith('order_auth_100', expect.any(String), expect.objectContaining({ httpOnly: true }))
  })

  it('refuses the bridge sentinel with a non-bridge method, or when the bridge is disabled', async () => {
    expect(((await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'authnet_bridge', undefined, 'stripe')) as any).error).toBeTruthy()
    h.methods = [{ methodId: 'stripe', isActive: true }]
    expect(((await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'authnet_bridge', undefined, 'authnet_bridge')) as any).error).toBeTruthy()
  })

  it('FULL ROUND TRIP: checkout -> signed hand-off -> WordPress verification (PHP logic) -> signed callback -> order finalized', async () => {
    // 1. customer clicks "Continue to Payment"
    const created: any = await createPayloadOrder(ITEMS, 'Standard Shipping', undefined, false, FORM, 'authnet_bridge', undefined, 'authnet_bridge')
    const redirect: any = await createCrossSitePaymentRedirect(created.orderId)
    expect(redirect.redirectUrl).toBe(process.env.LONGEVIA_BEAUTY_BRIDGE_URL)

    // 2. WordPress plugin (longevia_bridge_handle_pay_request), re-implemented from the PHP
    const { payload: encoded, sig } = redirect.fields
    const expectedSig = crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(encoded).digest('hex')
    expect(sig).toBe(expectedSig) // hash_equals($expected_signature, $signature)
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) // json_decode(base64url_decode)
    for (const k of ['orderId', 'orderNumber', 'amountCents', 'currency', 'returnUrl', 'cancelUrl', 'nonce', 'ts']) {
      expect(decoded[k], `required field ${k}`).toBeTruthy() // isset && !== ''
    }
    expect(Math.abs(Date.now() / 1000 - decoded.ts / 1000)).toBeLessThan(600)
    expect(decoded.currency.toUpperCase()).toBe('USD')
    expect(decoded.amountCents).toBe(TOTAL_CENTS)
    expect(decoded.returnUrl).toContain(`/order-confirmation/${created.orderId}`)

    // 3. After Authorize.net succeeds the plugin posts exactly this body, signed over the raw body
    const body = JSON.stringify({ orderId: decoded.orderId, amountCents: decoded.amountCents, status: 'succeeded', txnId: 'TXN1', affiliateId: null, clickId: null })
    const callbackSig = crypto.createHmac('sha256', process.env.CROSS_SITE_PAYMENT_SECRET!).update(body).digest('hex')

    vi.resetModules()
    vi.doMock('next/headers', () => ({ headers: async () => new Headers({ 'x-longevia-signature': callbackSig }) }))
    const { POST } = await import('@/app/(frontend)/api/webhooks/cross-site-payment/route')
    const resp = await POST(new Request('http://x/api/webhooks/cross-site-payment', { method: 'POST', body }))
    expect(resp.status).toBe(200)
    expect(h.finalize).toHaveBeenCalledWith(created.orderId, expect.objectContaining({ source: 'authnet_bridge', txnId: 'TXN1' }))
  })
})

describe('bridge hand-off access control', () => {
  it('refuses to hand off an order the caller did not place (no cookie, not the owner)', async () => {
    h.orders['300'] = { id: 300, orderNumber: '1300', total: 45, paymentMethod: 'authnet_bridge', paymentStatus: 'unpaid', guestEmail: 'victim@example.com', customerFirstName: 'Vic', customerLastName: 'Tim' }
    const res: any = await createCrossSitePaymentRedirect('300')
    expect(res.error).toBeTruthy()
    expect(res.fields).toBeUndefined() // nothing containing the customer's name/email is returned
  })
})
