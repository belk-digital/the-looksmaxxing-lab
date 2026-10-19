import { describe, it, expect, afterEach, vi } from 'vitest'
import { checkStripePaymentCoversOrder, orderTotalCents } from '@/lib/orders/payments'
import { signOrderCookie, verifyOrderCookie } from '@/lib/orders/orderCookie'
import { rejectUnauthorizedCron } from '@/lib/cron/auth'

const pi = (over: any = {}) => ({
  id: 'pi_1',
  status: 'succeeded',
  amount: 5000,
  amount_received: 5000,
  currency: 'usd',
  metadata: { orderId: '42' },
  ...over,
})
const order = (over: any = {}) => ({ id: 42, total: 50, paymentMethod: 'stripe', ...over })

describe('orderTotalCents', () => {
  it('rounds float dollars to exact cents', () => {
    expect(orderTotalCents({ total: 19.99 })).toBe(1999)
    expect(orderTotalCents({ total: 0.1 + 0.2 })).toBe(30)
    expect(orderTotalCents({ total: undefined })).toBe(0)
  })
})

describe('checkStripePaymentCoversOrder', () => {
  it('accepts an exact, bound, succeeded USD payment', () => {
    expect(checkStripePaymentCoversOrder(pi() as any, order())).toEqual({ ok: true })
  })
  it('rejects a payment smaller than the order (cheap-intent attack)', () => {
    const r: any = checkStripePaymentCoversOrder(pi({ amount: 500, amount_received: 500 }) as any, order())
    expect(r.ok).toBe(false)
  })
  it('rejects a payment bound to a different order (intent reuse)', () => {
    expect(checkStripePaymentCoversOrder(pi({ metadata: { orderId: '7' } }) as any, order()).ok).toBe(false)
    expect(checkStripePaymentCoversOrder(pi({ metadata: {} }) as any, order()).ok).toBe(false)
  })
  it('rejects non-succeeded, non-USD and non-stripe orders', () => {
    expect(checkStripePaymentCoversOrder(pi({ status: 'processing' }) as any, order()).ok).toBe(false)
    expect(checkStripePaymentCoversOrder(pi({ currency: 'eur' }) as any, order()).ok).toBe(false)
    expect(checkStripePaymentCoversOrder(pi() as any, order({ paymentMethod: 'zelle' })).ok).toBe(false)
  })
  it('handles float totals without off-by-a-cent errors', () => {
    expect(checkStripePaymentCoversOrder(pi({ amount: 1999, amount_received: 1999 }) as any, order({ total: 19.99 })).ok).toBe(true)
  })
})

describe('order cookie', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('verifies its own signature and rejects tampering / other orders / empty', () => {
    vi.stubEnv('PAYLOAD_SECRET', 'test-secret-test-secret-test-secret')
    const sig = signOrderCookie('42')
    expect(verifyOrderCookie('42', sig)).toBe(true)
    expect(verifyOrderCookie('43', sig)).toBe(false)
    expect(verifyOrderCookie('42', sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a'))).toBe(false)
    expect(verifyOrderCookie('42', 'short')).toBe(false)
    expect(verifyOrderCookie('42', undefined)).toBe(false)
  })
  it('matches the legacy inline HMAC so existing 7-day cookies keep working', async () => {
    vi.stubEnv('PAYLOAD_SECRET', 'abc-secret')
    const crypto = await import('crypto')
    const legacy = crypto.createHmac('sha256', 'abc-secret').update('order_99').digest('hex')
    expect(verifyOrderCookie('99', legacy)).toBe(true)
  })
  it('refuses to sign without PAYLOAD_SECRET instead of using a known fallback', () => {
    vi.stubEnv('PAYLOAD_SECRET', '')
    expect(() => signOrderCookie('1')).toThrow()
  })
})

describe('rejectUnauthorizedCron', () => {
  afterEach(() => vi.unstubAllEnvs())
  const req = (auth?: string) => new Request('http://x/api/cron', { headers: auth ? { authorization: auth } : {} })

  it('allows the correct bearer token', () => {
    vi.stubEnv('CRON_SECRET', 's3cret')
    expect(rejectUnauthorizedCron(req('Bearer s3cret'))).toBeNull()
  })
  it('rejects missing and wrong tokens with 401', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret')
    expect((rejectUnauthorizedCron(req()) as Response).status).toBe(401)
    expect((rejectUnauthorizedCron(req('Bearer nope')) as Response).status).toBe(401)
    expect((rejectUnauthorizedCron(req('Bearer s3cre')) as Response).status).toBe(401)
  })
  it('fails closed in production when no secret is configured, open in dev', () => {
    vi.stubEnv('CRON_SECRET', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect((rejectUnauthorizedCron(req()) as Response).status).toBe(500)
    vi.stubEnv('NODE_ENV', 'development')
    expect(rejectUnauthorizedCron(req())).toBeNull()
  })
})
