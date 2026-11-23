// @vitest-environment node
//
// Order hook -> ShipStation wiring (no network, no database). In this app finalizeOrder also runs for UNPAID orders (to reserve
// stock), so the hand-off is triggered by the payment becoming "captured" in afterOrderChange instead. These tests pin that:
// every way an order becomes paid hands it over exactly when it should, and nothing else does.
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ push: vi.fn(), cancel: vi.fn() }))
vi.mock('@/lib/shipstation/sync', () => ({ pushOrderToShipStation: h.push, cancelInShipStation: h.cancel }))
vi.mock('@/lib/google/sheets', () => ({ appendOrderToSheet: vi.fn(async () => undefined) }))

import { afterOrderChange } from '@/hooks/orders'

const settle = () => new Promise((r) => setTimeout(r, 40)) // the hand-off is deliberately not awaited by the hook

function makeReq(context: Record<string, any> = {}) {
  const logs: any[] = []
  return {
    logs,
    req: {
      context,
      payload: {
        find: async () => ({ docs: [] }),
        update: async () => ({}),
        findByID: async () => null,
        sendEmail: async () => ({}),
        logger: { info() {}, warn() {}, error: (...a: any[]) => logs.push(a) },
      },
    } as any,
  }
}
const run = (args: { doc: any; previousDoc?: any; operation?: string; context?: Record<string, any> }) => {
  const { req, logs } = makeReq(args.context)
  return afterOrderChange({ doc: args.doc, previousDoc: args.previousDoc, operation: (args.operation || 'update') as any, req } as any).then(async (r: any) => { await settle(); return { r, req, logs } })
}

// The hook loads the module with a dynamic import; do the (slow) first load up front so timing never decides a test.
beforeAll(async () => { await import('@/lib/shipstation/sync') })

beforeEach(() => {
  h.push.mockReset().mockResolvedValue({ outcome: 'synced' })
  h.cancel.mockReset().mockResolvedValue('cancelled')
})

describe('afterOrderChange: hand a paid order to ShipStation', () => {
  it('payment becomes captured (card webhook, or an admin marking a manual order paid) -> handed over once', async () => {
    const { req } = await run({ previousDoc: { paymentStatus: 'unpaid', status: 'pending' }, doc: { id: 5, paymentStatus: 'captured', status: 'paid' } })
    expect(h.push).toHaveBeenCalledTimes(1)
    expect(h.push).toHaveBeenCalledWith(req.payload, 5)
  })

  it('an unpaid order that merely reserves stock (finalizeOrder for Zelle / a subscription invoice) is NOT handed over', async () => {
    await run({ previousDoc: { paymentStatus: 'unpaid', status: 'pending' }, doc: { id: 5, paymentStatus: 'unpaid', status: 'pending', isFinalized: true } })
    expect(h.push).not.toHaveBeenCalled()
  })

  it('later edits of an order that was already captured do not hand it over again', async () => {
    await run({ previousDoc: { paymentStatus: 'captured', status: 'paid' }, doc: { id: 5, paymentStatus: 'captured', status: 'shipped' } })
    expect(h.push).not.toHaveBeenCalled()
  })

  it('a free order created already captured is handed over on creation', async () => {
    await run({ operation: 'create', previousDoc: undefined, doc: { id: 9, paymentStatus: 'captured', status: 'paid' } })
    expect(h.push).toHaveBeenCalledTimes(1)
    expect(h.push.mock.calls[0][1]).toBe(9)
  })

  it('a subscription renewal that was invoiced unpaid and is paid later is handed over when it is paid', async () => {
    await run({ previousDoc: { paymentStatus: 'unpaid', status: 'pending', orderType: 'subscription_cycle' }, doc: { id: 12, paymentStatus: 'captured', status: 'paid', orderType: 'subscription_cycle' } })
    expect(h.push).toHaveBeenCalledTimes(1)
  })

  it('"Send to ShipStation again" sends a paid order right away, but never an unpaid one', async () => {
    await run({ previousDoc: { paymentStatus: 'captured', status: 'paid' }, doc: { id: 5, paymentStatus: 'captured', status: 'paid' }, context: { retryShipStation: true } })
    expect(h.push).toHaveBeenCalledTimes(1)
    h.push.mockClear()
    await run({ previousDoc: { paymentStatus: 'unpaid', status: 'pending' }, doc: { id: 5, paymentStatus: 'unpaid', status: 'pending' }, context: { retryShipStation: true } })
    expect(h.push).not.toHaveBeenCalled()
  })

  it('a hand-off that fails never breaks the order save; it is logged and left to the cron', async () => {
    h.push.mockRejectedValue(new Error('ShipStation is down'))
    const { logs } = await run({ previousDoc: { paymentStatus: 'unpaid' }, doc: { id: 5, paymentStatus: 'captured', status: 'paid' } })
    expect(logs.some((l: any[]) => String(l[1]).includes('ShipStation hand-off failed for order 5'))).toBe(true)
  })
})

describe('afterOrderChange: pull a refunded / cancelled order back out of ShipStation', () => {
  const sent = { shipstationOrderId: '555', shipstationSyncStatus: 'synced' }

  it.each(['refunded', 'cancelled'])('an order that is %s while still waiting in ShipStation is cancelled there (joining the save transaction)', async (status) => {
    const { req } = await run({ previousDoc: { status: 'paid', paymentStatus: 'captured' }, doc: { id: 5, status, paymentStatus: 'captured', ...sent } })
    expect(h.cancel).toHaveBeenCalledTimes(1)
    expect(h.cancel.mock.calls[0][0]).toBe(req.payload)
    expect(h.cancel.mock.calls[0][1]).toMatchObject({ id: 5, ...sent })
    expect(h.cancel.mock.calls[0][2]).toEqual({ req })
  })

  it.each([
    ['never sent to ShipStation', { id: 5, status: 'cancelled' }],
    ['its hand-off had failed', { id: 5, status: 'cancelled', shipstationOrderId: '1', shipstationSyncStatus: 'failed' }],
    ['already cancelled in ShipStation', { id: 5, status: 'cancelled', shipstationOrderId: '1', shipstationSyncStatus: 'cancelled' }],
  ])('does not call ShipStation when the order was %s', async (_l, doc) => {
    await run({ previousDoc: { status: 'paid' }, doc })
    expect(h.cancel).not.toHaveBeenCalled()
  })

  it('an order that was already cancelled before this save does not cancel again', async () => {
    await run({ previousDoc: { status: 'cancelled' }, doc: { id: 5, status: 'cancelled', ...sent } })
    expect(h.cancel).not.toHaveBeenCalled()
  })

  it('a cancel that throws is logged and does not break the save', async () => {
    h.cancel.mockRejectedValue(new Error('boom'))
    const { logs } = await run({ previousDoc: { status: 'paid' }, doc: { id: 5, status: 'refunded', ...sent } })
    expect(logs.some((l: any[]) => String(l[1]).includes('Failed to cancel ShipStation order for order 5'))).toBe(true)
  })
})
