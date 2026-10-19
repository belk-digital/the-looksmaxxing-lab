import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({ fake: null as any }))

vi.mock('payload', () => ({ getPayload: async () => state.fake }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/affiliates/commission', () => ({ attributeOrder: vi.fn(async () => undefined) }))
vi.mock('@/lib/emails/generateOrderEmail', () => ({ generateOrderInvoiceHtml: async () => '<p>invoice</p>' }))

import { finalizeOrder } from '@/lib/orders/finalizeOrder'
import { attributeOrder } from '@/lib/affiliates/commission'

function queryText(q: any): string {
  return (q.queryChunks || []).map((c: any) => (typeof c === 'string' ? c : Array.isArray(c?.value) ? c.value.join('') : '?')).join('')
}

function makeFake(opts: { order?: any; failPaidUpdate?: number; failProductUpdate?: boolean } = {}) {
  const db: Record<string, Record<string, any>> = {
    orders: { 1: { id: 1, isFinalized: false, status: 'pending', paymentStatus: 'unpaid', owner: 5, guestEmail: 'a@b.c', orderNumber: '1001', couponCode: '', redeemedPoints: 0, discountTotal: 0, items: [{ product: 10, quantity: 2 }], notes: [], ...opts.order } },
    products: { 10: { id: 10, stock: 10 } },
    users: { 5: { id: 5, maxxPoints: 100, email: 'u@x.y' } },
    carts: { 1: { id: 1, user: 5, items: [{}] } },
    coupons: { 3: { id: 3, code: 'CREDIT', type: 'store_credit', remainingBalance: 5000, usageCount: 0 } },
  }
  const calls = { emails: 0, releases: 0, paidUpdateAttempts: 0 }
  let failPaid = opts.failPaidUpdate ?? 0
  const fake: any = {
    db: {
      drizzle: {
        execute: async (q: any) => {
          const text = queryText(q)
          const id = q.queryChunks.find((c: any) => typeof c === 'number')
          const o = db.orders[id]
          if (text.includes('"is_finalized" = true')) {
            if (o && !o.isFinalized) { o.isFinalized = true; return { rows: [{ id }] } }
            return { rows: [] }
          }
          if (text.includes('"is_finalized" = false')) { calls.releases++; if (o) o.isFinalized = false; return { rows: [] } }
          throw new Error('unexpected sql: ' + text)
        },
      },
    },
    findByID: async ({ collection, id }: any) => {
      await Promise.resolve()
      const d = db[collection]?.[id]
      if (!d) throw new Error('not found')
      return JSON.parse(JSON.stringify(d))
    },
    find: async ({ collection, where }: any) => {
      let docs = Object.values(db[collection] || {})
      if (collection === 'coupons') docs = docs.filter((c: any) => c.code === where.code.equals)
      if (collection === 'carts') docs = docs.filter((c: any) => c.user === where.user.equals)
      return { docs: JSON.parse(JSON.stringify(docs)) }
    },
    update: async ({ collection, id, data }: any) => {
      if (collection === 'orders' && data.status === 'paid') {
        calls.paidUpdateAttempts++
        if (failPaid > 0) { failPaid--; throw new Error('db blip') }
      }
      if (collection === 'products' && opts.failProductUpdate) throw new Error('product update failed')
      Object.assign(db[collection][id], data)
      return db[collection][id]
    },
    sendEmail: async () => { calls.emails++ },
  }
  return { fake, db, calls }
}

beforeEach(() => { vi.mocked(attributeOrder).mockClear(); vi.spyOn(console, 'error').mockImplementation(() => undefined); vi.spyOn(console, 'warn').mockImplementation(() => undefined) })

describe('finalizeOrder', () => {
  it('marks paid and applies side effects exactly once', async () => {
    const { fake, db, calls } = makeFake()
    state.fake = fake
    expect(await finalizeOrder(1, { affiliateId: '9' })).toBe(true)
    expect(db.orders[1]).toMatchObject({ status: 'paid', paymentStatus: 'captured', isFinalized: true })
    expect(db.products[10].stock).toBe(8)
    expect(db.users[5].maxxPoints).toBe(100)
    expect(db.carts[1].items).toEqual([])
    expect(calls.emails).toBe(1)
    expect(attributeOrder).toHaveBeenCalledTimes(1)
  })

  it('concurrent webhook + browser sync only decrement stock once (the race)', async () => {
    const { fake, db, calls } = makeFake()
    state.fake = fake
    const results = await Promise.all([finalizeOrder(1), finalizeOrder(1), finalizeOrder(1)])
    expect(results).toEqual([true, true, true])
    expect(db.products[10].stock).toBe(8)
    expect(calls.emails).toBe(1)
  })

  it('a second call after completion is a no-op', async () => {
    const { fake, db } = makeFake()
    state.fake = fake
    await finalizeOrder(1)
    await finalizeOrder(1)
    expect(db.products[10].stock).toBe(8)
  })

  it('if marking paid fails, releases the claim, returns false, and a retry then succeeds', async () => {
    const { fake, db, calls } = makeFake({ failPaidUpdate: 1 })
    state.fake = fake
    expect(await finalizeOrder(1)).toBe(false)
    expect(calls.releases).toBe(1)
    expect(db.orders[1].isFinalized).toBe(false)
    expect(db.products[10].stock).toBe(10) // nothing applied yet
    expect(await finalizeOrder(1)).toBe(true) // e.g. WordPress / Stripe retry
    expect(db.orders[1]).toMatchObject({ status: 'paid', paymentStatus: 'captured', isFinalized: true })
    expect(db.products[10].stock).toBe(8)
  })

  it('a failing side-effect step does not block the others, order stays paid, and a note is left', async () => {
    const { fake, db, calls } = makeFake({ failProductUpdate: true })
    state.fake = fake
    expect(await finalizeOrder(1)).toBe(true)
    expect(db.orders[1].paymentStatus).toBe('captured')
    expect(db.carts[1].items).toEqual([]) // later steps still ran
    expect(calls.emails).toBe(1)
    expect(db.orders[1].notes.at(-1)).toMatchObject({ type: 'internal' })
    expect(db.orders[1].notes.at(-1).note).toContain('inventory')
  })

  it('manual (Zelle) finalize leaves the order unpaid but still reserves stock', async () => {
    const { fake, db } = makeFake()
    state.fake = fake
    await finalizeOrder(1, undefined, true)
    expect(db.orders[1]).toMatchObject({ paymentStatus: 'unpaid', status: 'pending', isFinalized: true })
    expect(db.products[10].stock).toBe(8)
  })

  it('deducts store credit in cents (discountTotal is dollars, balance is cents)', async () => {
    const { fake, db } = makeFake({ order: { couponCode: 'CREDIT', discountTotal: 20 } })
    state.fake = fake
    await finalizeOrder(1)
    expect(db.coupons[3].remainingBalance).toBe(3000) // $50.00 - $20.00, was 4980 before the fix
    expect(db.coupons[3].usageCount).toBe(1)
  })

  it('deducts redeemed points', async () => {
    const { fake, db } = makeFake({ order: { redeemedPoints: 30 } })
    state.fake = fake
    await finalizeOrder(1)
    expect(db.users[5].maxxPoints).toBe(70)
  })

  it('returns false for an unknown order', async () => {
    const { fake } = makeFake()
    fake.findByID = async () => null
    state.fake = fake
    expect(await finalizeOrder(999)).toBe(false)
  })
})
