import { describe, it, expect, beforeEach, vi } from 'vitest'
import crypto from 'crypto'

const h = vi.hoisted(() => {
  // Webhook modules read these at import time, so they must exist before any import runs.
  process.env.CROSS_SITE_PAYMENT_SECRET = 'bridge-secret-bridge-secret-bridge'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'
  return {
  finalize: vi.fn(),
  markPaid: vi.fn(),
  update: vi.fn(),
  alert: vi.fn(),
  order: null as any,
  sigHeader: '' as string,
  stripeSig: '' as string,
  }
})

vi.mock('payload', () => ({ getPayload: async () => ({ findByID: async () => h.order, update: h.update }) }))
vi.mock('@/lib/subscriptions/service', () => ({ markSubscriptionOrderPaid: h.markPaid }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/orders/finalizeOrder', () => ({ finalizeOrder: h.finalize }))
vi.mock('@/lib/orders/alerts', () => ({ alertAdmin: h.alert }))
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-longevia-signature': h.sigHeader, 'stripe-signature': h.stripeSig }),
}))

const SECRET = 'bridge-secret-bridge-secret-bridge'
const WHSEC = 'whsec_test_secret'

import { POST as bridgePOST } from '@/app/(frontend)/api/webhooks/cross-site-payment/route'
import { POST as stripePOST } from '@/app/(frontend)/api/webhooks/stripe/route'
import Stripe from 'stripe'

const sign = (body: string) => crypto.createHmac('sha256', SECRET).update(body).digest('hex')
const bridgeReq = (event: any, opts: { sig?: string } = {}) => {
  const body = JSON.stringify(event)
  h.sigHeader = opts.sig ?? sign(body)
  return new Request('http://x/api/webhooks/cross-site-payment', { method: 'POST', body })
}
const ev = (over: any = {}) => ({ orderId: '100', amountCents: 4500, status: 'succeeded', txnId: 'T1', affiliateId: null, clickId: null, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'pending' }
  h.finalize.mockResolvedValue(true)
  h.markPaid.mockResolvedValue(true)
  h.update.mockResolvedValue({})
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

describe('cross-site (Authorize.net bridge) webhook', () => {
  it('finalizes on a correctly signed success for the exact amount', async () => {
    const res = await bridgePOST(bridgeReq(ev()))
    expect(res.status).toBe(200)
    expect(h.finalize).toHaveBeenCalledWith('100', { source: 'authnet_bridge', txnId: 'T1', affiliateId: null, clickId: null })
  })

  it('passes affiliate attribution through to finalize', async () => {
    await bridgePOST(bridgeReq(ev({ affiliateId: '9', clickId: '55' })))
    expect(h.finalize).toHaveBeenCalledWith('100', expect.objectContaining({ affiliateId: '9', clickId: '55' }))
  })

  it('still finalizes when WooCommerce reports a slightly higher total (surcharge) - and alerts', async () => {
    const res = await bridgePOST(bridgeReq(ev({ amountCents: 4635 })))
    expect(res.status).toBe(200)
    expect(h.finalize).toHaveBeenCalled()
    expect(h.alert).toHaveBeenCalled()
  })

  it('rejects an underpayment, alerts, and does not finalize', async () => {
    const res = await bridgePOST(bridgeReq(ev({ amountCents: 100 })))
    expect(res.status).toBe(400)
    expect(h.finalize).not.toHaveBeenCalled()
    expect(h.alert).toHaveBeenCalled()
  })

  it('rejects a bad signature, and does not leak the expected signature into logs', async () => {
    const res = await bridgePOST(bridgeReq(ev(), { sig: 'deadbeef' }))
    expect(res.status).toBe(400)
    expect(h.finalize).not.toHaveBeenCalled()
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).not.toContain(sign(JSON.stringify(ev())))
    expect(logged).not.toContain('"orderId"')
  })

  it('rejects a body modified after signing', async () => {
    const good = sign(JSON.stringify(ev()))
    const res = await bridgePOST(bridgeReq(ev({ amountCents: 1 }), { sig: good }))
    expect(res.status).toBe(400)
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('404s for an unknown order, 400s for a non-bridge order', async () => {
    h.order = null
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(404)
    h.order = { id: 100, total: 45, paymentMethod: 'stripe' }
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(400)
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('returns 500 when finalize fails so WordPress retries (and 200 once it works)', async () => {
    h.finalize.mockResolvedValueOnce(false)
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(500)
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(200)
  })

  it('is idempotent: a duplicate delivery is acknowledged', async () => {
    await bridgePOST(bridgeReq(ev()))
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(200)
  })

  it('ignores failed payments without touching the order', async () => {
    const res = await bridgePOST(bridgeReq(ev({ status: 'failed' })))
    expect(res.status).toBe(200)
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('400s on a malformed JSON body (with a valid signature)', async () => {
    const body = '{not json'
    h.sigHeader = sign(body)
    expect((await bridgePOST(new Request('http://x', { method: 'POST', body }))).status).toBe(400)
  })
})

describe('Stripe webhook', () => {
  const stripe = new Stripe('sk_test_x')
  const send = (pi: any) => {
    const body = JSON.stringify({ id: 'evt_1', object: 'event', type: 'payment_intent.succeeded', data: { object: pi } })
    h.stripeSig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WHSEC })
    return stripePOST(new Request('http://x/api/webhooks/stripe', { method: 'POST', body }))
  }
  const pi = (over: any = {}) => ({ id: 'pi_1', object: 'payment_intent', status: 'succeeded', amount: 4500, amount_received: 4500, currency: 'usd', metadata: { orderId: '100', affiliateId: '9' }, ...over })
  beforeEach(() => { h.order = { id: 100, total: 45, paymentMethod: 'stripe', status: 'pending' } })

  it('finalizes a valid, fully-paid, bound payment', async () => {
    expect((await send(pi())).status).toBe(200)
    expect(h.finalize).toHaveBeenCalledWith('100', expect.objectContaining({ affiliateId: '9' }))
  })
  it('does not finalize a short payment, alerts, but still acks with 200', async () => {
    const res = await send(pi({ amount: 100, amount_received: 100 }))
    expect(res.status).toBe(200)
    expect(h.finalize).not.toHaveBeenCalled()
    expect(h.alert).toHaveBeenCalled()
  })
  it('acks (and alerts) for an unknown order without finalizing', async () => {
    h.order = null
    expect((await send(pi())).status).toBe(200)
    expect(h.finalize).not.toHaveBeenCalled()
    expect(h.alert).toHaveBeenCalled()
  })
  it('returns 500 so Stripe retries when finalize fails', async () => {
    h.finalize.mockResolvedValueOnce(false)
    expect((await send(pi())).status).toBe(500)
  })
  it('ignores a payment with no orderId (e.g. intent never bound to an order)', async () => {
    expect((await send(pi({ metadata: {} }))).status).toBe(200)
    expect(h.finalize).not.toHaveBeenCalled()
  })
  it('rejects a bad Stripe signature', async () => {
    h.stripeSig = 't=1,v1=bad'
    const res = await stripePOST(new Request('http://x', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(400)
  })
})

describe('cross-site webhook - subscriptions', () => {
  it('a monthly invoice is marked paid through the subscription path (no generic finalize, no cart clearing)', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'pending', paymentStatus: 'unpaid', orderType: 'subscription_cycle' }
    const res = await bridgePOST(bridgeReq(ev()))
    expect(res.status).toBe(200)
    expect(h.markPaid).toHaveBeenCalledWith(expect.anything(), 100, { txnId: 'T1' })
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('the first month of a plan uses the normal finalize path', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'pending', paymentStatus: 'unpaid', orderType: 'subscription_first' }
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(200)
    expect(h.finalize).toHaveBeenCalled()
    expect(h.markPaid).not.toHaveBeenCalled()
  })

  it('a Zelle subscriber paying a monthly invoice by card is accepted (method switched to card first)', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'zelle', status: 'pending', paymentStatus: 'unpaid', orderType: 'subscription_cycle' }
    const res = await bridgePOST(bridgeReq(ev()))
    expect(res.status).toBe(200)
    expect(h.update).toHaveBeenCalledWith(expect.objectContaining({ id: 100, data: { paymentMethod: 'authnet_bridge' } }))
    expect(h.markPaid).toHaveBeenCalled()
  })

  it('a ONE-TIME Zelle order is still refused (only subscriptions may switch method)', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'zelle', status: 'pending', paymentStatus: 'unpaid', orderType: 'one_time' }
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(400)
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('an already-paid invoice is acknowledged; a DIFFERENT card transaction raises a duplicate-payment alert', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'paid', paymentStatus: 'captured', isFinalized: true, paymentTxnId: 'T1', orderType: 'subscription_cycle' }
    expect((await bridgePOST(bridgeReq(ev({ txnId: 'T1' })))).status).toBe(200)
    expect(h.alert).not.toHaveBeenCalled() // same transaction delivered again: just a retry
    expect((await bridgePOST(bridgeReq(ev({ txnId: 'T2' })))).status).toBe(200)
    expect(h.alert).toHaveBeenCalledTimes(1)
    expect(h.markPaid).not.toHaveBeenCalled()
    expect(h.finalize).not.toHaveBeenCalled()
  })

  it('remembers the card transaction id on normal orders, and a failure storing it never breaks the payment', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'pending', paymentStatus: 'unpaid', orderType: 'one_time' }
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(200)
    expect(h.update).toHaveBeenCalledWith(expect.objectContaining({ data: { paymentTxnId: 'T1' } }))
    h.update.mockRejectedValue(new Error('db blip'))
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(200)
  })

  it('returns 500 (so WordPress retries) when marking a monthly invoice paid fails', async () => {
    h.order = { id: 100, total: 45, paymentMethod: 'authnet_bridge', status: 'pending', paymentStatus: 'unpaid', orderType: 'subscription_cycle' }
    h.markPaid.mockResolvedValueOnce(false)
    expect((await bridgePOST(bridgeReq(ev()))).status).toBe(500)
  })
})
