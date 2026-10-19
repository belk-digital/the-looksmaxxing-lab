import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => ({
  conversions: [] as any[],
  orders: {} as Record<string, any>,
  updates: [] as any[],
  stripeSearch: vi.fn(),
  finalize: vi.fn(),
  payload: null as any,
}))

vi.mock('stripe', () => ({ default: class { paymentIntents = { search: h.stripeSearch } } }))
vi.mock('payload', () => ({ getPayload: async () => h.payload }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/affiliates/stats', () => ({ updateAffiliateStats: vi.fn(async () => undefined) }))
vi.mock('@/lib/orders/finalizeOrder', () => ({ finalizeOrder: h.finalize }))

process.env.STRIPE_SECRET_KEY = 'sk_test_x'

import { processPendingCommissions } from '@/lib/affiliates/processPending'
import { expirePendingOrders } from '@/lib/orders/expirePending'

beforeEach(() => {
  vi.clearAllMocks()
  h.updates = []
  h.finalize.mockResolvedValue(true)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  h.payload = {
    find: async ({ collection }: any) => {
      if (collection === 'affiliate-conversions') return { docs: h.conversions }
      if (collection === 'orders') return { docs: Object.values(h.orders) }
      return { docs: [] }
    },
    findByID: async ({ id }: any) => h.orders[String(id)] ?? null,
    update: async (args: any) => { h.updates.push(args); return {} },
  }
})

describe('processPendingCommissions', () => {
  it('approves only paid, unflagged conversions; leaves unpaid / cancelled / flagged ones pending', async () => {
    h.orders = {
      '1': { id: 1, paymentStatus: 'captured', status: 'paid' },
      '2': { id: 2, paymentStatus: 'unpaid', status: 'pending' }, // Zelle never paid
      '3': { id: 3, paymentStatus: 'captured', status: 'cancelled' },
      '4': { id: 4, paymentStatus: 'captured', status: 'paid' },
    }
    h.conversions = [
      { id: 'a', order: 1, affiliate: 9 },
      { id: 'b', order: 2, affiliate: 9 },
      { id: 'c', order: 3, affiliate: 9 },
      { id: 'd', order: 4, affiliate: 9, flaggedForReview: true },
    ]
    const res = await processPendingCommissions()
    expect(res).toMatchObject({ processed: 4, success: 1, skipped: 3, failed: 0 })
    expect(h.updates).toHaveLength(1)
    expect(h.updates[0]).toMatchObject({ id: 'a', data: { status: 'approved' } })
    expect(h.updates[0].data.approvedAt).toBeTruthy()
  })

  it('handles populated order relationships and a missing order', async () => {
    h.orders = { '1': { id: 1, paymentStatus: 'captured', status: 'paid' } }
    h.conversions = [{ id: 'a', order: { id: 1 }, affiliate: { id: 9 } }, { id: 'b', order: 404, affiliate: 9 }]
    const res = await processPendingCommissions()
    expect(res).toMatchObject({ success: 1, skipped: 1 })
  })
})

describe('expirePendingOrders', () => {
  const stale = (over: any) => ({ id: 1, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'stripe', notes: [], ...over })

  it('cancels an abandoned stripe order with no successful payment in Stripe', async () => {
    h.orders = { '1': stale({}) }
    h.stripeSearch.mockResolvedValue({ data: [{ id: 'pi_1', status: 'requires_payment_method' }] })
    const res = await expirePendingOrders()
    expect(res).toMatchObject({ found: 1, cancelled: 1, recovered: 0 })
    expect(h.updates[0]).toMatchObject({ id: 1, data: { status: 'cancelled' } })
  })

  it('RECOVERS (finalizes) a stripe order that was actually paid but missed by the webhook', async () => {
    h.orders = { '1': stale({ total: 45 }) }
    h.stripeSearch.mockResolvedValue({ data: [{ id: 'pi_1', status: 'succeeded', amount: 4500, amount_received: 4500, currency: 'usd', metadata: { orderId: '1' } }] })
    const res = await expirePendingOrders()
    expect(res).toMatchObject({ recovered: 1, cancelled: 0 })
    expect(h.finalize).toHaveBeenCalledWith(1, expect.anything())
    expect(h.updates).toHaveLength(0)
  })

  it('never cancels when it cannot ask Stripe', async () => {
    h.orders = { '1': stale({}) }
    h.stripeSearch.mockRejectedValue(new Error('stripe down'))
    const res = await expirePendingOrders()
    expect(res).toMatchObject({ cancelled: 0, skipped: 1 })
    expect(h.updates).toHaveLength(0)
  })

  it('never cancels a paid-in-Stripe order it cannot finalize automatically', async () => {
    h.orders = { '1': stale({ total: 45 }) }
    h.stripeSearch.mockResolvedValue({ data: [{ id: 'pi_1', status: 'succeeded', amount: 100, amount_received: 100, currency: 'usd', metadata: { orderId: '1' } }] })
    const res = await expirePendingOrders()
    expect(res).toMatchObject({ cancelled: 0, skipped: 1 })
    expect(h.updates).toHaveLength(0)
  })

  it('cancels abandoned bridge orders without calling Stripe', async () => {
    h.orders = { '1': stale({ paymentMethod: 'authnet_bridge' }) }
    const res = await expirePendingOrders()
    expect(res.cancelled).toBe(1)
    expect(h.stripeSearch).not.toHaveBeenCalled()
  })
})
