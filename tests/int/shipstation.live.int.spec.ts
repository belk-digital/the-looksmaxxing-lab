// @vitest-environment node
//
// OUR ShipStation code against the REAL ShipStation account (no database: Payload is an in-memory fake). Needs
// SHIPSTATION_API_KEY / SECRET and this site's SHIPSTATION_STORE_ID in .env.local (create the store in ShipStation first).
// Opt-in because it writes to the live ShipStation account:
//
//   SS_LIVE_TEST=yes-write-to-live-shipstation npx vitest run tests/int/shipstation.live.int.spec.ts
//
// Every order created here is clearly labelled (order number ZZ-TEST-SS-...), uses a fake address and fake
// customer, is never given a label, and is DELETED at the end (and the account is then checked for leftovers).
// ShipStation's V1 limit is 40 requests/minute, so every call is spaced out by the throttle below.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

const OPTED_IN = process.env.SS_LIVE_TEST === 'yes-write-to-live-shipstation'
const STAMP = Date.now()
const BASE_ID = Number(String(STAMP).slice(-9)) // fake order ids: orderKey "lgv-<id>" can never collide with a real order
const NUMBER = (n: number) => `ZZ-TEST-SS-${STAMP}-${n}`

let client: typeof import('@/lib/shipstation/client')
let sync: typeof import('@/lib/shipstation/sync')
const createdShipStationIds = new Set<number>()
const emails: any[] = []

const mk = (n: number, over: Record<string, any> = {}) => ({
  id: BASE_ID + n,
  orderNumber: NUMBER(n),
  status: 'paid',
  paymentStatus: 'captured',
  paymentMethod: 'zelle',
  isFinalized: true,
  shipstationSyncStatus: 'pending',
  customerFirstName: 'ZZ Test',
  customerLastName: 'Order',
  customerPhone: '5555550188',
  guestEmail: `zz-test-ss-${STAMP}@example.invalid`,
  shippingAddress: { line1: '123 Test St', line2: 'Unit 4', city: 'Charleston', state: 'South Carolina', postalCode: '29401', country: 'US' },
  billingAddress: { line1: '123 Test St', line2: 'Unit 4', city: 'Charleston', state: 'South Carolina', postalCode: '29401', country: 'US' },
  items: [
    { variant: 'ZZ-TEST-SINGLE', variantTitle: '5mg Single', price: 7.5, quantity: 2, productSnapshot: { name: 'ZZ TEST PRODUCT - do not ship', variants: [{ sku: 'ZZ-TEST-SINGLE', isKit: false }] } },
    { variant: 'ZZ-TEST-KIT', variantTitle: '5mg 10 Kit', price: 60, quantity: 1, productSnapshot: { name: 'ZZ TEST PRODUCT - do not ship', variants: [{ sku: 'ZZ-TEST-KIT', isKit: true }] } },
  ],
  total: 75,
  taxTotal: 0,
  shippingTotal: 0,
  shippingMethod: '2-4 Days Express shipping',
  customerNote: 'AUTOMATED TEST ORDER - safe to delete',
  createdAt: new Date().toISOString(),
  ...over,
})

function fakePayload(orders: any[]) {
  const store: Record<string, any> = Object.fromEntries(orders.map((o) => [String(o.id), structuredClone(o)]))
  const p: any = {
    store,
    updates: [] as any[],
    findByID: async ({ id }: any) => { const o = store[String(id)]; if (!o) throw new Error('Not Found'); return structuredClone(o) },
    update: async ({ id, data }: any) => { p.updates.push({ id: String(id), data }); Object.assign(store[String(id)], data); return structuredClone(store[String(id)]) },
    find: async (args: any) => ({ docs: p.findResult ? p.findResult(args) : [] }),
    sendEmail: async (a: any) => { emails.push(a); return {} },
    create: async () => ({}),
    logger: { info() {}, warn() {}, error() {} },
  }
  return p
}

const ss = (path: string, init?: any) => client.shipstationRequest<any>(path, init)
const track = (r: any) => { if (r?.orderId) createdShipStationIds.add(Number(r.orderId)); return r }
const byNumber = async (n: number) => (await ss(`/orders?orderNumber=${encodeURIComponent(NUMBER(n))}&pageSize=50`)).orders.filter((o: any) => o.orderNumber === NUMBER(n))

async function cleanup() {
  const left = (await ss(`/orders?orderNumber=ZZ-TEST-SS-${STAMP}&pageSize=100`)).orders.filter((o: any) => String(o.orderNumber).startsWith(`ZZ-TEST-SS-${STAMP}`))
  for (const o of left) createdShipStationIds.add(o.orderId)
  for (const id of createdShipStationIds) await ss(`/orders/${id}`, { method: 'DELETE' }).catch((e: any) => console.log(`  could not delete ShipStation order ${id}: ${e.message}`))
  const again = (await ss(`/orders?orderNumber=ZZ-TEST-SS-${STAMP}&pageSize=100`)).orders.filter((o: any) => String(o.orderNumber).startsWith(`ZZ-TEST-SS-${STAMP}`))
  console.log(`  cleanup: deleted ${createdShipStationIds.size} test order(s) in ShipStation, ${again.length} left over`)
  return again.length
}

describe.skipIf(!OPTED_IN)('our ShipStation code against the REAL ShipStation (self-cleaning, throttled)', () => {
  let calls = 0
  beforeAll(async () => {
    dotenv.config({ path: '.env.local', override: true })
    expect(process.env.SHIPSTATION_API_KEY).toBeTruthy()
    // space real calls out to stay well under 40/minute
    const realFetch = globalThis.fetch
    let last = 0
    vi.stubGlobal('fetch', async (url: any, init?: any) => {
      const wait = Math.max(0, last + 1700 - Date.now())
      if (wait) await new Promise((r) => setTimeout(r, wait))
      last = Date.now(); calls++
      return realFetch(url, init)
    })
    client = await import('@/lib/shipstation/client')
    sync = await import('@/lib/shipstation/sync')
    const leftovers = (await ss('/orders?orderNumber=ZZ-TEST-SS&pageSize=100')).orders.filter((o: any) => String(o.orderNumber).startsWith('ZZ-TEST-SS'))
    console.log(`BASELINE  leftover ZZ-TEST-SS orders from earlier runs: ${leftovers.length}`)
    for (const o of leftovers) await ss(`/orders/${o.orderId}`, { method: 'DELETE' })
  }, 120_000)

  afterAll(async () => {
    try { expect(await cleanup()).toBe(0) } finally { vi.unstubAllGlobals() }
    console.log(`  total ShipStation API calls this run: ${calls}`)
  }, 300_000)

  it('authenticates and sees the expected store, warehouse and carriers (read only)', async () => {
    const stores = await ss('/stores')
    const mine = Number(process.env.SHIPSTATION_STORE_ID)
    expect(mine, 'set SHIPSTATION_STORE_ID in .env.local to this site\'s ShipStation store id').toBeGreaterThan(0)
    expect(stores.some((s: any) => s.storeId === mine), 'SHIPSTATION_STORE_ID is not a store on this account').toBe(true)
    const warehouses = await ss('/warehouses')
    expect(warehouses.some((w: any) => w.isDefault || w.warehouseId)).toBe(true)
    const carriers = await ss('/carriers')
    expect(carriers.length).toBeGreaterThan(0)
  }, 60_000)

  describe('push -> idempotent -> cancel -> re-send', () => {
    const order1 = mk(1)
    const p = fakePayload([order1])
    let firstShipStationId: number

    it('the REAL builder output is accepted: order lands in ShipStation as awaiting_shipment with every field mapped', async () => {
      const r = await sync.pushOrderToShipStation(p, order1.id)
      expect(r.outcome).toBe('synced')
      firstShipStationId = Number(r.detail)
      createdShipStationIds.add(firstShipStationId)
      expect(p.store[String(order1.id)]).toMatchObject({ shipstationSyncStatus: 'synced', shipstationOrderId: String(firstShipStationId), shipstationSyncAttempts: 1 })

      const o = await ss(`/orders/${firstShipStationId}`)
      expect(o.orderStatus).toBe('awaiting_shipment')
      expect(o.orderKey).toBe(`lgv-${order1.id}`)
      expect(o.orderNumber).toBe(order1.orderNumber)
      expect(o.customerEmail).toBeNull() // so ShipStation can never email the customer
      expect(o.shipTo).toMatchObject({ name: 'ZZ Test Order', street1: '123 Test St', street2: 'Unit 4', city: 'Charleston', state: 'SC', postalCode: '29401', country: 'US', phone: '5555550188' })
      expect(o.billTo).toMatchObject({ name: 'ZZ Test Order', state: 'SC' })
      expect(o.items).toHaveLength(2)
      expect(o.items.map((i: any) => [i.sku, i.quantity, i.unitPrice]).sort()).toEqual([['ZZ-TEST-KIT', 1, 60], ['ZZ-TEST-SINGLE', 2, 7.5]])
      expect(o.items[0].name).toContain('ZZ TEST PRODUCT')
      expect(o.amountPaid).toBe(75)
      expect(o.shippingAmount).toBe(0)
      expect(o.requestedShippingService).toBe('2-4 Days Express shipping')
      expect(o.paymentMethod).toBe('Zelle')
      expect(o.weight).toMatchObject({ value: 3 + 2 * 1 + 6, units: 'ounces' }) // packaging + 2 vials + 1 kit
      expect(o.advancedOptions.storeId).toBe(Number(process.env.SHIPSTATION_STORE_ID)) // the order landed in THIS site's store
      expect(o.advancedOptions).toMatchObject({ customField1: 'Longevia Research website', customField2: 'Zelle' })
      expect(o.internalNotes).toContain(`order #${order1.orderNumber}`)
      expect(o.customerNotes).toBe('AUTOMATED TEST ORDER - safe to delete')
      expect(o.holdUntilDate).toBeNull()
    }, 120_000)

    it('a lost database write (order looks unsent) re-pushes the SAME ShipStation order, never a twin', async () => {
      p.store[String(order1.id)].shipstationSyncStatus = 'pending'
      delete p.store[String(order1.id)].shipstationOrderId
      const r = await sync.pushOrderToShipStation(p, order1.id)
      expect(r.outcome).toBe('synced')
      expect(Number(r.detail)).toBe(firstShipStationId)
      expect(await byNumber(1)).toHaveLength(1)
    }, 120_000)

    it('cancel: the real ShipStation order is cancelled through the status (re-posting only documented fields)', async () => {
      const o = { ...p.store[String(order1.id)], status: 'refunded' }
      p.store[String(order1.id)].status = 'refunded'
      expect(await sync.cancelInShipStation(p, o)).toBe('cancelled')
      expect((await ss(`/orders/${firstShipStationId}`)).orderStatus).toBe('cancelled')
      expect(p.store[String(order1.id)].shipstationSyncStatus).toBe('cancelled')
      expect(emails).toHaveLength(0)
    }, 120_000)

    it('cancelling again is a harmless no-op', async () => {
      const o = { ...p.store[String(order1.id)] }
      expect(await sync.cancelInShipStation(p, o)).toBe('nothing') // status is "cancelled" now, not "synced"
    }, 60_000)

    it('reinstated order: re-sent under a new key; old one stays cancelled; no deletion needed', async () => {
      // what beforeOrderChange does when an admin flips refunded -> paid
      Object.assign(p.store[String(order1.id)], { status: 'paid', shipstationSyncStatus: 'pending', shipstationSyncAttempts: 0, shipstationSyncError: null })
      const r = await sync.pushOrderToShipStation(p, order1.id)
      expect(r.outcome).toBe('synced')
      const secondId = Number(r.detail)
      createdShipStationIds.add(secondId)
      expect(secondId).not.toBe(firstShipStationId)
      const live = await ss(`/orders/${secondId}`)
      expect(live.orderStatus).toBe('awaiting_shipment')
      expect(live.orderKey).toBe(`lgv-${order1.id}-r${firstShipStationId}`)
      const all = await byNumber(1)
      expect(all.map((o: any) => o.orderStatus).sort()).toEqual(['awaiting_shipment', 'cancelled'])
    }, 120_000)

    it('an order marked shipped in ShipStation without a label is picked up by the cron reconcile (real queries, real timestamp format)', async () => {
      const row = p.store[String(order1.id)]
      await ss('/orders/markasshipped', { method: 'POST', body: { orderId: Number(row.shipstationOrderId), carrierCode: 'stamps_com', shipDate: new Date().toISOString().slice(0, 10), trackingNumber: `ZZTEST${STAMP}`, notifyCustomer: false, notifySalesChannel: false } })
      row.shipstationSyncedAt = new Date().toISOString()
      p.findResult = (a: any) => (JSON.stringify(a.where).includes('shippedAt') ? [structuredClone(row)] : [])
      const summary = await sync.runShipStationCron(p)
      expect(summary).toMatchObject({ retried: 0, reconciled: 0, markedShippedNoTracking: 1 })
      expect(row).toMatchObject({ status: 'shipped', fulfillmentStatus: 'fulfilled' })
      expect(row.trackingNumber).toBeUndefined() // markasshipped creates no shipment record, so there is nothing to track
    }, 180_000)
  })

  describe('reading real shipments', () => {
    it('parses the account\'s real shipment list (2 sample shipments from other sources), ignores them all, and follows real pagination', async () => {
      const p = fakePayload([])
      const url = 'https://ssapi.shipstation.com/shipments?createDateStart=2026-01-01T00:00:00&includeShipmentItems=False&pageSize=1'
      const result = await sync.handleShipNotify(p, url)
      expect(result.shipments).toBeGreaterThanOrEqual(2) // pageSize=1 forced several pages: every page was fetched
      expect(result.updated).toBe(0) // none of them is ours (their orderKeys are ShipStation UUIDs)
      expect(p.updates).toHaveLength(0)
    }, 120_000)

    it('a real shipment record with a real tracking number is applied correctly (record shape captured from the account)', async () => {
      const list = await ss('/shipments?pageSize=1&includeShipmentItems=false&sortBy=CreateDate&sortDir=DESC')
      const real = list.shipments[0]
      expect(real).toBeTruthy()
      const o = mk(7)
      const p = fakePayload([o])
      const result = await sync.applyShipmentToOrder(p, p.store[String(o.id)], { ...real, orderKey: `lgv-${o.id}` })
      expect(result).toBe('updated')
      const u = p.store[String(o.id)]
      expect(u.trackingNumber).toBe(real.trackingNumber)
      expect(u.carrier).toBe(real.carrierCode)
      expect(u.trackingLink).toMatch(/^https:\/\//)
      expect(u.trackingLink).toContain(encodeURIComponent(real.trackingNumber))
      expect(u.status).toBe('shipped')
      expect(new Date(u.shippedAt).toISOString().slice(0, 10)).toBe(real.shipDate.slice(0, 10))
    }, 120_000)
  })

  it('a REAL rejection (wrong secret -> HTTP 401) is recorded as a permanent failure, support is emailed, and nothing is written to ShipStation', async () => {
    const o = mk(9)
    const p = fakePayload([o])
    emails.length = 0
    const good = process.env.SHIPSTATION_API_SECRET
    process.env.SHIPSTATION_API_SECRET = 'definitely-not-the-secret'
    let r
    try { r = await sync.pushOrderToShipStation(p, o.id) } finally { process.env.SHIPSTATION_API_SECRET = good }
    expect(r.outcome).toBe('failed')
    expect(p.store[String(o.id)]).toMatchObject({ shipstationSyncStatus: 'failed', shipstationSyncAttempts: sync.MAX_ATTEMPTS })
    expect(p.store[String(o.id)].shipstationSyncError).toMatch(/401/)
    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe(sync.STAFF_EMAIL)
    expect(await byNumber(9)).toHaveLength(0)
  }, 120_000)
})
