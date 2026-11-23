// @vitest-environment node
//
// ShipStation integration, unit level (ported from 99 Purity): no network, no database. ShipStation's HTTP API is
// replaced by a recording stub and Payload by an in-memory fake.
// Every branch (success, retries, guards, security checks) is driven deterministically.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const h = vi.hoisted(() => ({ payload: null as any }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => h.payload), APIError: class APIError extends Error {} }))
vi.mock('@payload-config', () => ({ default: {} }))

import { buildShipStationOrder, estimateWeightOunces, orderIdFromKey, orderKeyFor, KIT_OZ, MIN_PACKAGE_OZ, PACKAGING_OZ, VIAL_OZ } from '@/lib/shipstation/order'
import { trackingUrlFor } from '@/lib/shipstation/tracking'
import { assertShipStationUrl, ShipStationError, shipstationRequest } from '@/lib/shipstation/client'
import { shipstationWebhookToken, verifyShipstationWebhookToken } from '@/lib/shipstation/webhookAuth'
import { MAX_ATTEMPTS, applyShipmentToOrder, cancelInShipStation, pushOrderToShipStation, runShipStationCron, STAFF_EMAIL } from '@/lib/shipstation/sync'
import { POST as webhookPOST } from '@/app/api/webhooks/shipstation/route'
import { GET as cronGET } from '@/app/api/cron/shipstation-sync/route'
import { Orders } from '@/collections/Orders'
import { SHIPSTATION_CONFIG } from '@/lib/shipstation/config'

// Longevia keeps its order beforeChange logic inline in the Orders collection (no exported beforeOrderChange), and that
// hook mutates `data` in place without returning it.
const beforeOrderChange = async (args: any) => {
  await (Orders.hooks as any).beforeChange[0](args)
  return args.data
}

// ---------------------------------------------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------------------------------------------
const order = (over: Record<string, any> = {}) => ({
  id: 101,
  orderNumber: '7101',
  status: 'paid',
  paymentStatus: 'captured',
  paymentMethod: 'zelle',
  isFinalized: true,
  shipstationSyncStatus: 'pending',
  customerFirstName: 'Ada',
  customerLastName: 'Lovelace',
  customerPhone: '5555550188',
  guestEmail: 'zz-test@example.invalid',
  shippingAddress: { line1: '1 Main St', line2: 'Apt 2', city: 'Charleston', state: 'South Carolina', postalCode: '29401', country: 'US' },
  billingAddress: { line1: '1 Main St', line2: 'Apt 2', city: 'Charleston', state: 'South Carolina', postalCode: '29401', country: 'US' },
  items: [{ variant: 'BPC-5MG', variantTitle: '5mg Single', price: 40, quantity: 2, productSnapshot: { name: 'BPC-157', variants: [{ sku: 'BPC-5MG', isKit: false }] } }],
  total: 80,
  taxTotal: 0,
  shippingTotal: 0,
  shippingMethod: '2-4 Days Express shipping',
  createdAt: '2026-11-13T10:00:00.000Z',
  ...over,
})

function makePayload(orders: any[]) {
  const store: Record<string, any> = Object.fromEntries(orders.map((o) => [String(o.id), structuredClone(o)]))
  const updates: Array<{ id: string; data: any; req?: any }> = []
  const emails: any[] = []
  const finds: any[] = []
  const p: any = {
    store, updates, emails, finds,
    findByID: async ({ id }: any) => {
      const o = store[String(id)]
      if (!o) throw new Error('Not Found')
      return structuredClone(o)
    },
    update: async ({ id, data, req }: any) => {
      updates.push({ id: String(id), data: structuredClone(data), req })
      Object.assign(store[String(id)], data)
      return structuredClone(store[String(id)])
    },
    find: async (args: any) => {
      finds.push(args)
      return { docs: p.findResult ? p.findResult(args) : [] }
    },
    sendEmail: async (a: any) => { emails.push(a); return {} },
    create: async () => ({}),
    logger: { info() {}, warn() {}, error() {} },
  }
  return p
}

type Call = { url: string; method: string; body: any; headers: Record<string, string> }
let calls: Call[]
let router: (c: Call) => Response | Promise<Response>
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

beforeEach(() => {
  calls = []
  router = () => json({}, 404)
  process.env.SHIPSTATION_API_KEY = 'test-key'
  process.env.SHIPSTATION_API_SECRET = 'test-secret'
  process.env.PAYLOAD_SECRET = 'payload-secret-for-tests'
  process.env.CRON_SECRET = 'cron-secret-for-tests'
  delete process.env.SHIPSTATION_STORE_ID
  delete process.env.SHIPSTATION_WAREHOUSE_ID
  vi.stubGlobal('fetch', async (url: any, init: any = {}) => {
    const c: Call = { url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers || {} }
    calls.push(c)
    return router(c)
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------------------------------------------
describe('order payload builder (pure)', () => {
  it('maps a normal order: names, address, items, amounts, notes, weight, fields staff need', () => {
    const r = buildShipStationOrder(order(), { now: new Date('2026-11-13T12:00:00Z') })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const p = r.payload
    expect(p.orderNumber).toBe('7101')
    expect(p.orderKey).toBe('lgv-101')
    expect(p.orderStatus).toBe('awaiting_shipment')
    expect(p.orderDate).toBe('2026-11-13T10:00:00.000Z')
    expect(p.paymentDate).toBe('2026-11-13T12:00:00.000Z')
    expect(p.shipTo).toEqual({ name: 'Ada Lovelace', street1: '1 Main St', street2: 'Apt 2', city: 'Charleston', state: 'SC', postalCode: '29401', country: 'US', phone: '5555550188' })
    expect(p.billTo.state).toBe('SC')
    expect(p.items).toEqual([{ lineItemKey: '101-1', sku: 'BPC-5MG', name: 'BPC-157 - 5mg Single', quantity: 2, unitPrice: 40 }])
    expect(p.amountPaid).toBe(80)
    expect(p.shippingAmount).toBe(0)
    expect(p.requestedShippingService).toBe('2-4 Days Express shipping')
    expect(p.paymentMethod).toBe('Zelle')
    expect(p.internalNotes).toContain('order #7101')
    expect(p.advancedOptions).toEqual({ customField1: 'Longevia Research website', customField2: 'Zelle' })
    expect(p.weight).toEqual({ value: PACKAGING_OZ + 2 * VIAL_OZ, units: 'ounces' })
  })

  it('never sends the customer email, so ShipStation cannot send its own tracking email', () => {
    const r = buildShipStationOrder(order({ guestEmail: 'someone@example.com' }))
    expect(r.ok && 'customerEmail' in r.payload).toBe(false)
    expect(JSON.stringify(r)).not.toContain('someone@example.com')
  })

  it('passes optional store / warehouse ids and the order source (GLP storefront) through', () => {
    const r = buildShipStationOrder(order({ orderSource: 'glp.belkbodylab.com' }), { storeId: 214914, warehouseId: 1260974 })
    expect(r.ok && r.payload.advancedOptions).toEqual({ storeId: 214914, warehouseId: 1260974, customField1: 'glp.belkbodylab.com', customField2: 'Zelle' })
    expect(r.ok && r.payload.internalNotes).toContain('Source: glp.belkbodylab.com')
  })

  it.each([
    ['South Carolina', 'SC'], ['south carolina', 'SC'], ['sc', 'SC'], ['  FL ', 'FL'], ['Florida', 'FL'], ['North Carolina', 'NC'],
    ['district of columbia', 'DC'], ['Puerto Rico', 'PR'], ['AE', 'AE'],
  ])('normalises the state "%s" to %s', (given, expected) => {
    const r = buildShipStationOrder(order({ shippingAddress: { ...order().shippingAddress, state: given } }))
    expect(r.ok && r.payload.shipTo.state).toBe(expected)
  })

  it.each(['Floridaa', 'Ontario', '', 'ZZZ'])('flags an unusable state "%s" for manual handling instead of guessing', (given) => {
    const r = buildShipStationOrder(order({ shippingAddress: { ...order().shippingAddress, state: given } }))
    expect(r.ok).toBe(false)
    if (!r.ok) { expect(r.reason).toBe('address'); expect(r.message).toMatch(/state/i) }
  })

  it.each([['CA'], ['GB'], ['AU'], ['IT'], ['PR']])('holds an international order (country %s) for manual shipping', (country) => {
    const r = buildShipStationOrder(order({ shippingAddress: { ...order().shippingAddress, country } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('international')
  })

  it.each([['US'], ['us'], ['USA'], ['United States'], ['']])('treats country "%s" as the US', (country) => {
    expect(buildShipStationOrder(order({ shippingAddress: { ...order().shippingAddress, country } })).ok).toBe(true)
  })

  it.each([
    ['recipient name', { customerFirstName: '', customerLastName: '' }],
    ['street address', { shippingAddress: { ...order().shippingAddress, line1: '' } }],
    ['city', { shippingAddress: { ...order().shippingAddress, city: ' ' } }],
    ['ZIP code', { shippingAddress: { ...order().shippingAddress, postalCode: '' } }],
  ])('flags a missing %s', (what, over) => {
    const r = buildShipStationOrder(order(over))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message.toLowerCase()).toContain(what.toLowerCase())
  })

  it('refuses an order with no items', () => {
    expect(buildShipStationOrder(order({ items: [] })).ok).toBe(false)
  })

  it('falls back to the shipping address when the billing address is empty or not a US address', () => {
    const empty = buildShipStationOrder(order({ billingAddress: {} }))
    expect(empty.ok && empty.payload.billTo).toEqual(empty.ok && empty.payload.shipTo)
    const foreign = buildShipStationOrder(order({ billingAddress: { line1: 'x', city: 'y', state: 'Ontario', postalCode: 'A1A', country: 'CA' } }))
    expect(foreign.ok && foreign.payload.billTo.country).toBe('US')
  })

  it('cleans odd values: trims, collapses whitespace, caps lengths, drops an empty line2/phone', () => {
    const r = buildShipStationOrder(order({
      customerPhone: '',
      customerFirstName: '  Ada   ',
      shippingAddress: { line1: '  1   Main\nSt ', line2: '', city: 'Charleston', state: 'SC', postalCode: ' 29401 ', country: 'US' },
      items: [{ variant: 'X', variantTitle: 'v'.repeat(500), price: '12.345', quantity: '3', productSnapshot: { name: 'n'.repeat(500) } }],
    }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.payload.shipTo.name).toBe('Ada Lovelace')
    expect(r.payload.shipTo.street1).toBe('1 Main St')
    expect(r.payload.shipTo.street2).toBeUndefined()
    expect(r.payload.shipTo.phone).toBeUndefined()
    expect(r.payload.shipTo.postalCode).toBe('29401')
    expect(r.payload.items[0].name.length).toBeLessThanOrEqual(200)
    expect(r.payload.items[0].unitPrice).toBe(12.35)
    expect(r.payload.items[0].quantity).toBe(3)
  })

  it('estimates weight from what is in the box: packaging + vials, kits heavier, never below the minimum', () => {
    const single = (q: number) => ({ variant: 'S', quantity: q, productSnapshot: { variants: [{ sku: 'S', isKit: false }] } })
    const kit = (q: number) => ({ variant: 'K', quantity: q, productSnapshot: { variants: [{ sku: 'K', isKit: true }] } })
    expect(estimateWeightOunces([single(1)])).toBe(Math.max(MIN_PACKAGE_OZ, PACKAGING_OZ + VIAL_OZ))
    expect(estimateWeightOunces([single(3)])).toBe(PACKAGING_OZ + 3 * VIAL_OZ)
    expect(estimateWeightOunces([kit(2)])).toBe(PACKAGING_OZ + 2 * KIT_OZ)
    expect(estimateWeightOunces([single(1), kit(1)])).toBe(PACKAGING_OZ + VIAL_OZ + KIT_OZ)
    expect(estimateWeightOunces([{ quantity: 1 }])).toBeGreaterThanOrEqual(MIN_PACKAGE_OZ) // no snapshot at all
    expect(estimateWeightOunces([])).toBe(MIN_PACKAGE_OZ)
  })

  it('order keys round-trip, including the re-sent form, and reject keys that are not ours', () => {
    expect(orderKeyFor(5)).toBe('lgv-5')
    expect(orderIdFromKey('lgv-5')).toBe('5')
    expect(orderIdFromKey('lgv-5-r1027780982')).toBe('5')
    for (const bad of ['504f212a-518a-4bc1-9c5b-c931e55bb1a8', '100001', 'lgv-', 'lgv-5x', 'lgv-5-r', 'xlgv-5', '', null, undefined, 5]) {
      expect(orderIdFromKey(bad as any)).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('tracking links', () => {
  it.each([
    ['stamps_com', 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490'],
    ['usps', 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490'],
    ['ups_walleted', 'https://www.ups.com/track?tracknum=9400111899223197428490'],
    ['ups', 'https://www.ups.com/track?tracknum=9400111899223197428490'],
    ['fedex_walleted', 'https://www.fedex.com/fedextrack/?trknbr=9400111899223197428490'],
    ['dhl_express', 'https://www.dhl.com/en/express/tracking.html?AWB=9400111899223197428490'],
    ['globalpost', 'https://www.google.com/search?q=9400111899223197428490'],
    ['', 'https://www.google.com/search?q=9400111899223197428490'],
  ])('carrier "%s"', (carrier, url) => {
    expect(trackingUrlFor(carrier, '9400111899223197428490')).toBe(url)
  })
  it('returns null without a tracking number and encodes odd characters', () => {
    expect(trackingUrlFor('usps', '')).toBeNull()
    expect(trackingUrlFor('usps', null)).toBeNull()
    expect(trackingUrlFor('usps', 'a b&c')).toContain('a%20b%26c')
  })
  it('only ever produces https links (the shipped email renders them as href)', () => {
    for (const c of ['usps', 'ups', 'fedex', 'dhl', 'zzz', 'javascript:alert(1)']) expect(trackingUrlFor(c, '1Z999')).toMatch(/^https:\/\//)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('client security', () => {
  it('only accepts https URLs on ShipStation\'s own API host', () => {
    expect(assertShipStationUrl('/orders').hostname).toBe('ssapi.shipstation.com')
    expect(assertShipStationUrl('https://ssapi.shipstation.com/shipments?batchId=1').pathname).toBe('/shipments')
    for (const bad of [
      'http://ssapi.shipstation.com/shipments',
      'https://evil.example/shipments',
      'https://ssapi.shipstation.com.evil.example/shipments',
      'https://evil.example/ssapi.shipstation.com',
      'https://user:pw@ssapi.shipstation.com/shipments',
      'https://ssapi.shipstation.com:8443/shipments',
      'https://ssapi.shipstation.com@evil.example/shipments',
      'ftp://ssapi.shipstation.com/x',
    ]) {
      expect(() => assertShipStationUrl(bad), bad).toThrow(ShipStationError)
    }
  })

  it('never makes a request (so never sends credentials) to a non-ShipStation host', async () => {
    await expect(shipstationRequest('https://evil.example/shipments')).rejects.toThrow()
    expect(calls).toHaveLength(0)
  })

  it('sends Basic auth built from the key and secret, only to ShipStation', async () => {
    router = () => json({ ok: true })
    await shipstationRequest('/stores')
    expect(calls).toHaveLength(1)
    expect(new URL(calls[0].url).hostname).toBe('ssapi.shipstation.com')
    expect(calls[0].headers.Authorization).toBe('Basic ' + Buffer.from('test-key:test-secret').toString('base64'))
  })

  it('reports HTTP errors with status and a trimmed body, and classifies permanent vs retryable', async () => {
    router = () => json({ Message: 'bad' }, 400)
    const e400 = await shipstationRequest('/x').catch((e) => e)
    expect(e400).toBeInstanceOf(ShipStationError)
    expect(e400.status).toBe(400)
    expect(e400.isPermanent).toBe(true)
    router = () => json({}, 429)
    expect((await shipstationRequest('/x').catch((e) => e)).isPermanent).toBe(false)
    router = () => json({}, 500)
    expect((await shipstationRequest('/x').catch((e) => e)).isPermanent).toBe(false)
    router = () => json({}, 401)
    expect((await shipstationRequest('/x').catch((e) => e)).isPermanent).toBe(true)
  })

  it('turns a timeout / network failure into a retryable ShipStationError', async () => {
    router = () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }) }
    const e = await shipstationRequest('/x').catch((x) => x)
    expect(e).toBeInstanceOf(ShipStationError)
    expect(e.message).toMatch(/timed out/)
    expect(e.isPermanent).toBe(false)
  })

  it('webhook tokens verify only for the exact secret', () => {
    const t = shipstationWebhookToken('s1')
    expect(verifyShipstationWebhookToken(t, 's1')).toBe(true)
    expect(verifyShipstationWebhookToken(t, 's2')).toBe(false)
    expect(verifyShipstationWebhookToken(t + 'x', 's1')).toBe(false)
    expect(verifyShipstationWebhookToken('', 's1')).toBe(false)
    expect(verifyShipstationWebhookToken(null, 's1')).toBe(false)
    expect(verifyShipstationWebhookToken(t, '')).toBe(false)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('pushOrderToShipStation', () => {
  const created = (extra: Record<string, any> = {}) => json({ orderId: 555, orderStatus: 'awaiting_shipment', ...extra })

  it('sends a paid order once, stores the ShipStation id, and marks it synced', async () => {
    const p = makePayload([order()]); router = () => created()
    const r = await pushOrderToShipStation(p, 101)
    expect(r).toEqual({ outcome: 'synced', detail: '555' })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('POST')
    expect(new URL(calls[0].url).pathname).toBe('/orders/createorder')
    expect(calls[0].body.orderKey).toBe('lgv-101')
    expect(calls[0].body.orderNumber).toBe('7101')
    const last = p.updates.at(-1)!.data
    expect(last).toMatchObject({ shipstationSyncStatus: 'synced', shipstationOrderId: '555', shipstationSyncError: null, shipstationSyncAttempts: 1 })
    expect(typeof last.shipstationSyncedAt).toBe('string')
    expect(p.emails).toHaveLength(0)
  })

  it('is a no-op when called again for an already-synced order (no duplicate in ShipStation)', async () => {
    const p = makePayload([order({ shipstationSyncStatus: 'synced', shipstationOrderId: '555' })]); router = () => created()
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('noop')
    expect(calls).toHaveLength(0)
    expect(p.updates).toHaveLength(0)
  })

  it.each(['skipped', 'cancelled'])('leaves a "%s" order alone until someone resets it', async (state) => {
    const p = makePayload([order({ shipstationSyncStatus: state })])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('noop')
    expect(calls).toHaveLength(0)
  })

  it('does nothing for an unpaid order (Zelle waiting for confirmation)', async () => {
    const p = makePayload([order({ paymentStatus: 'unpaid', status: 'pending' })])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('noop')
    expect(calls).toHaveLength(0)
    expect(p.updates).toHaveLength(0)
  })

  it.each(['refunded', 'cancelled'])('does not queue a %s order for shipping', async (status) => {
    const p = makePayload([order({ status })])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('skipped')
    expect(calls).toHaveLength(0)
    expect(p.store['101'].shipstationSyncStatus).toBe('skipped')
  })

  it.each(['shipped', 'fulfilled', 'completed'])('does not create a second shipment for an order already marked %s by hand', async (status) => {
    const p = makePayload([order({ status })])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('skipped')
    expect(calls).toHaveLength(0)
    expect(p.store['101'].shipstationSyncStatus).toBe('skipped')
    expect(p.store['101'].shipstationSyncError).toMatch(/already marked/)
  })

  it('holds an international order for manual shipping and emails support', async () => {
    const p = makePayload([order({ shippingAddress: { ...order().shippingAddress, country: 'GB' } })])
    const r = await pushOrderToShipStation(p, 101)
    expect(r.outcome).toBe('manual')
    expect(calls).toHaveLength(0)
    expect(p.store['101'].shipstationSyncStatus).toBe('manual')
    expect(p.store['101'].shipstationSyncError).toMatch(/International/)
    expect(p.emails).toHaveLength(1)
    expect(p.emails[0].to).toBe(STAFF_EMAIL)
    expect(p.emails[0].subject).toContain('#7101')
    expect(p.emails[0].subject).toMatch(/ShipStation/)
  })

  it('holds an order with an unusable address for manual shipping and emails support', async () => {
    const p = makePayload([order({ shippingAddress: { ...order().shippingAddress, state: 'Atlantis' } })])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('manual')
    expect(calls).toHaveLength(0)
    expect(p.emails).toHaveLength(1)
    expect(p.store['101'].shipstationSyncError).toMatch(/state/i)
  })

  it('transient failure (HTTP 500): marks failed with the reason, counts the attempt, does NOT email yet', async () => {
    const p = makePayload([order()]); router = () => json({ Message: 'boom' }, 500)
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('failed')
    expect(p.store['101']).toMatchObject({ shipstationSyncStatus: 'failed', shipstationSyncAttempts: 1 })
    expect(p.store['101'].shipstationSyncError).toMatch(/500/)
    expect(p.emails).toHaveLength(0)
  })

  it('a retry after a failure succeeds and clears the error', async () => {
    const p = makePayload([order()]); router = () => json({}, 503)
    await pushOrderToShipStation(p, 101)
    router = () => created()
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('synced')
    expect(p.store['101']).toMatchObject({ shipstationSyncStatus: 'synced', shipstationOrderId: '555', shipstationSyncError: null, shipstationSyncAttempts: 2 })
  })

  it('retries are idempotent: every attempt carries the same orderKey', async () => {
    const p = makePayload([order()]); router = () => json({}, 500)
    await pushOrderToShipStation(p, 101); await pushOrderToShipStation(p, 101)
    expect(new Set(calls.map((c) => c.body.orderKey))).toEqual(new Set(['lgv-101']))
  })

  it('emails support exactly when the retry budget is used up', async () => {
    const p = makePayload([order()]); router = () => json({}, 500)
    for (let i = 1; i < MAX_ATTEMPTS; i++) { await pushOrderToShipStation(p, 101); expect(p.emails).toHaveLength(0) }
    await pushOrderToShipStation(p, 101)
    expect(p.store['101'].shipstationSyncAttempts).toBe(MAX_ATTEMPTS)
    expect(p.emails).toHaveLength(1)
    expect(p.emails[0].to).toBe(STAFF_EMAIL)
  })

  it('a permanent rejection (HTTP 400) stops retrying immediately and emails support', async () => {
    const p = makePayload([order()]); router = () => json({ Message: 'invalid state' }, 400)
    await pushOrderToShipStation(p, 101)
    expect(p.store['101']).toMatchObject({ shipstationSyncStatus: 'failed', shipstationSyncAttempts: MAX_ATTEMPTS })
    expect(p.emails).toHaveLength(1)
  })

  it('a network failure is retryable, not permanent', async () => {
    const p = makePayload([order()]); router = () => { throw new Error('socket hang up') }
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('failed')
    expect(p.store['101'].shipstationSyncAttempts).toBe(1)
    expect(p.emails).toHaveLength(0)
  })

  it('treats a ShipStation answer that is not "awaiting_shipment" as a failure instead of pretending it worked', async () => {
    const p = makePayload([order()]); router = () => created({ orderStatus: 'cancelled' })
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('failed')
    expect(p.store['101'].shipstationSyncStatus).toBe('failed')
  })

  it('treats a response without an order id as a failure', async () => {
    const p = makePayload([order()]); router = () => json({ orderStatus: 'awaiting_shipment' })
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('failed')
  })

  it('does nothing and touches nothing when ShipStation is not configured (dev, preview)', async () => {
    delete process.env.SHIPSTATION_API_KEY
    const p = makePayload([order()])
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('not-configured')
    expect(calls).toHaveLength(0)
    expect(p.updates).toHaveLength(0)
  })

  it('never throws, even when the database call itself blows up', async () => {
    const p = makePayload([order()]); p.findByID = async () => { throw new Error('db down') }
    await expect(pushOrderToShipStation(p, 101)).resolves.toMatchObject({ outcome: 'failed' })
  })

  it('an order with no stored state (placed before the integration, paid later) is still sent, and gets a pending marker first', async () => {
    const p = makePayload([order({ shipstationSyncStatus: null })]); router = () => created()
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('synced')
    expect(p.updates[0].data).toEqual({ shipstationSyncStatus: 'pending' })
  })

  it('re-sends a reinstated order under a NEW key derived from the cancelled ShipStation order (cancelled orders cannot be revived)', async () => {
    const p = makePayload([order({ shipstationOrderId: '111' })])
    router = (c) => (c.method === 'GET' ? json({ orderId: 111, orderStatus: 'cancelled' }) : created({ orderId: 222 }))
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('synced')
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.body.orderKey).toBe('lgv-101-r111')
    expect(orderIdFromKey(post.body.orderKey)).toBe('101')
    expect(p.store['101'].shipstationOrderId).toBe('222')
  })

  it('a reinstated order retried after a failure reuses the same new key (no twin orders)', async () => {
    const p = makePayload([order({ shipstationOrderId: '111' })])
    router = (c) => (c.method === 'GET' ? json({ orderId: 111, orderStatus: 'cancelled' }) : json({}, 500))
    await pushOrderToShipStation(p, 101); await pushOrderToShipStation(p, 101)
    expect(new Set(calls.filter((c) => c.method === 'POST').map((c) => c.body.orderKey))).toEqual(new Set(['lgv-101-r111']))
  })

  it('does not create a twin when the earlier ShipStation order is still live (status reset by hand)', async () => {
    const p = makePayload([order({ shipstationOrderId: '111' })])
    router = (c) => (c.method === 'GET' ? json({ orderId: 111, orderStatus: 'awaiting_shipment' }) : created())
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('noop')
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0)
    expect(p.store['101'].shipstationSyncStatus).toBe('synced')
  })

  it('re-sends when the earlier ShipStation order was deleted there (404)', async () => {
    const p = makePayload([order({ shipstationOrderId: '111' })])
    router = (c) => (c.method === 'GET' ? json({}, 404) : created({ orderId: 333 }))
    expect((await pushOrderToShipStation(p, 101)).outcome).toBe('synced')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('cancelInShipStation', () => {
  const synced = (over: Record<string, any> = {}) => order({ status: 'refunded', shipstationSyncStatus: 'synced', shipstationOrderId: '555', ...over })
  const ssOrder = (status: string) => ({
    orderId: 555, orderNumber: '7101', orderKey: 'lgv-101', orderDate: '2026-11-13T02:00:00.0000000', orderStatus: status,
    billTo: { name: 'Ada', street1: '1 Main St', city: 'Charleston', state: 'SC', postalCode: '29401', country: 'US', addressVerified: 'Address not yet validated' },
    shipTo: { name: 'Ada', street1: '1 Main St', city: 'Charleston', state: 'SC', postalCode: '29401', country: 'US' },
    items: [{ lineItemKey: '101-1', sku: 'X', name: 'X', quantity: 1, unitPrice: 5 }], amountPaid: 80, taxAmount: 0, shippingAmount: 0,
    createDate: 'x', modifyDate: 'y', userId: 'u', labelMessages: null, advancedOptions: { storeId: 1 },
  })

  it('cancels an awaiting-shipment order, re-sending only documented fields, and records it (joining the hook transaction)', async () => {
    const o = synced(); const p = makePayload([o]); const req = { transactionID: 'tx1' }
    router = (c) => (c.method === 'GET' ? json(ssOrder('awaiting_shipment')) : json({ ...ssOrder('cancelled') }))
    expect(await cancelInShipStation(p, o, { req })).toBe('cancelled')
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.body.orderStatus).toBe('cancelled')
    expect(post.body.orderKey).toBe('lgv-101')
    expect(post.body).not.toHaveProperty('createDate')
    expect(post.body).not.toHaveProperty('userId')
    expect(post.body).not.toHaveProperty('labelMessages')
    expect(p.updates.at(-1)).toMatchObject({ id: '101', data: { shipstationSyncStatus: 'cancelled' } })
    expect(p.updates.at(-1)!.req).toBe(req) // same transaction => no deadlock on the row the hook holds
    expect(p.emails).toHaveLength(0)
  })

  it('also cancels an on-hold order', async () => {
    const o = synced(); const p = makePayload([o])
    router = (c) => (c.method === 'GET' ? json(ssOrder('on_hold')) : json(ssOrder('cancelled')))
    expect(await cancelInShipStation(p, o)).toBe('cancelled')
  })

  it('a label was already bought (ShipStation says shipped): does NOT touch it, emails support', async () => {
    const o = synced(); const p = makePayload([o])
    router = () => json(ssOrder('shipped'))
    expect(await cancelInShipStation(p, o)).toBe('alerted')
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0)
    expect(p.emails).toHaveLength(1)
    expect(p.emails[0].subject).toMatch(/already shipped/i)
    expect(p.updates).toHaveLength(0)
  })

  it('already cancelled in ShipStation: just records it, no POST', async () => {
    const o = synced(); const p = makePayload([o])
    router = () => json(ssOrder('cancelled'))
    expect(await cancelInShipStation(p, o)).toBe('cancelled')
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0)
    expect(p.updates.at(-1)!.data.shipstationSyncStatus).toBe('cancelled')
  })

  it('order deleted in ShipStation (404): nothing left to cancel, recorded', async () => {
    const o = synced(); const p = makePayload([o])
    router = () => json({}, 404)
    expect(await cancelInShipStation(p, o)).toBe('cancelled')
    expect(p.emails).toHaveLength(0)
  })

  it('ShipStation silently keeps the order live after the cancel POST: emails support', async () => {
    const o = synced(); const p = makePayload([o])
    router = (c) => json(ssOrder('awaiting_shipment'))
    expect(await cancelInShipStation(p, o)).toBe('alerted')
    expect(p.emails).toHaveLength(1)
    expect(p.updates).toHaveLength(0)
  })

  it('ShipStation down during the cancel: emails support, never throws', async () => {
    const o = synced(); const p = makePayload([o])
    router = () => json({}, 500)
    await expect(cancelInShipStation(p, o)).resolves.toBe('alerted')
    expect(p.emails).toHaveLength(1)
  })

  it.each([
    ['never sent (no ShipStation id)', synced({ shipstationOrderId: null })],
    ['not synced yet (failed)', synced({ shipstationSyncStatus: 'failed' })],
    ['from before the integration', synced({ shipstationSyncStatus: null, shipstationOrderId: null })],
  ])('does nothing for an order that was %s', async (_label, o) => {
    const p = makePayload([o])
    expect(await cancelInShipStation(p, o)).toBe('nothing')
    expect(calls).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('applyShipmentToOrder', () => {
  const shipment = (over: Record<string, any> = {}) => ({ orderKey: 'lgv-101', orderNumber: '7101', trackingNumber: '9400111899223197428490', carrierCode: 'stamps_com', shipDate: '2026-11-13', voided: false, isReturnLabel: false, ...over })

  it('records carrier, tracking number and link, marks shipped, and queues the customer email', async () => {
    const p = makePayload([order()])
    expect(await applyShipmentToOrder(p, p.store['101'], shipment())).toBe('updated')
    const d = p.updates[0].data
    expect(d).toMatchObject({
      carrier: 'stamps_com', trackingNumber: '9400111899223197428490', status: 'shipped', fulfillmentStatus: 'fulfilled', ...(SHIPSTATION_CONFIG.emailCustomerOnShipment ? { sendTrackingEmail: true } : {}),
      trackingLink: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490',
    })
    expect(d.shippedAt).toBe(new Date('2026-11-13').toISOString())
  })

  it('the same tracking number again changes nothing and emails nobody twice', async () => {
    const p = makePayload([order()])
    await applyShipmentToOrder(p, p.store['101'], shipment())
    expect(await applyShipmentToOrder(p, p.store['101'], shipment())).toBe('noop')
    expect(p.updates).toHaveLength(1)
  })

  it('a NEW tracking number (label re-bought) updates the link and emails again', async () => {
    const p = makePayload([order()])
    await applyShipmentToOrder(p, p.store['101'], shipment())
    expect(await applyShipmentToOrder(p, p.store['101'], shipment({ trackingNumber: '9400111899223197428999' }))).toBe('updated')
    expect(p.updates[1].data).toMatchObject({ trackingNumber: '9400111899223197428999', ...(SHIPSTATION_CONFIG.emailCustomerOnShipment ? { sendTrackingEmail: true } : {}) })
    expect(p.updates[1].data).not.toHaveProperty('status') // already shipped
  })

  it('ignores a voided label and a return label', async () => {
    const p = makePayload([order()])
    expect(await applyShipmentToOrder(p, p.store['101'], shipment({ voided: true }))).toBe('noop')
    expect(await applyShipmentToOrder(p, p.store['101'], shipment({ isReturnLabel: true }))).toBe('noop')
    expect(p.updates).toHaveLength(0)
  })

  it.each(['paid', 'fulfilled', 'pending'])('moves a "%s" order to shipped', async (status) => {
    const p = makePayload([order({ status })])
    await applyShipmentToOrder(p, p.store['101'], shipment())
    expect(p.updates[0].data.status).toBe('shipped')
  })

  it('does not change the status of a completed order (completed -> shipped is not a legal transition) but still records tracking', async () => {
    const p = makePayload([order({ status: 'completed' })])
    expect(await applyShipmentToOrder(p, p.store['101'], shipment())).toBe('updated')
    expect(p.updates[0].data).not.toHaveProperty('status')
    expect(p.updates[0].data.trackingNumber).toBe('9400111899223197428490')
  })

  it.each(['refunded', 'cancelled'])('a shipment for a %s order is NOT recorded and the customer is NOT emailed; support is told', async (status) => {
    const p = makePayload([order({ status })])
    expect(await applyShipmentToOrder(p, p.store['101'], shipment())).toBe('alerted')
    expect(p.updates).toHaveLength(0)
    expect(p.emails).toHaveLength(1)
    expect(p.emails[0].to).toBe(STAFF_EMAIL)
  })

  it('no tracking number (marked shipped in ShipStation without a label): marks shipped, no link, no customer email', async () => {
    const p = makePayload([order()])
    expect(await applyShipmentToOrder(p, p.store['101'], shipment({ trackingNumber: null }))).toBe('updated')
    const d = p.updates[0].data
    expect(d).toMatchObject({ status: 'shipped', fulfillmentStatus: 'fulfilled' })
    expect(d).not.toHaveProperty('sendTrackingEmail')
    expect(d).not.toHaveProperty('trackingLink')
  })

  it('uses "now" when ShipStation gives no usable ship date', async () => {
    const p = makePayload([order()])
    await applyShipmentToOrder(p, p.store['101'], shipment({ shipDate: 'garbage' }))
    expect(new Date(p.updates[0].data.shippedAt).getTime()).toBeGreaterThan(Date.now() - 5000)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('webhook route /api/webhooks/shipstation', () => {
  const token = () => shipstationWebhookToken(process.env.SHIPSTATION_API_SECRET!)
  const post = (body: unknown, tok: string | null = token()) =>
    webhookPOST(new Request(`https://shop.example/api/webhooks/shipstation${tok === null ? '' : `?token=${tok}`}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
  const notify = (url = 'https://ssapi.shipstation.com/shipments?batchId=99&includeShipmentItems=False') => ({ resource_url: url, resource_type: 'SHIP_NOTIFY' })
  const shipmentsResponse = (shipments: any[], extra: any = {}) => json({ shipments, total: shipments.length, page: 1, pages: 1, ...extra })

  it('rejects a missing, wrong or truncated token with 403 and never calls ShipStation', async () => {
    h.payload = makePayload([order()])
    for (const t of [null, 'nope', token().slice(0, -1), token() + 'a']) {
      expect((await post(notify(), t)).status).toBe(403)
    }
    expect(calls).toHaveLength(0)
  })

  it('the token depends only on the ShipStation API secret (not PAYLOAD_SECRET), and a token made with another secret is rejected', async () => {
    delete process.env.PAYLOAD_SECRET
    h.payload = makePayload([order()])
    router = () => json({ shipments: [], pages: 0 })
    expect((await post(notify())).status).toBe(200)
    expect((await post(notify(), shipstationWebhookToken('some-other-secret'))).status).toBe(403)
  })

  it('rejects malformed JSON with 400', async () => {
    h.payload = makePayload([order()])
    expect((await post('not json')).status).toBe(400)
  })

  it('ignores event types it does not handle with 200 and no ShipStation call', async () => {
    h.payload = makePayload([order()])
    const res = await post({ resource_url: 'https://ssapi.shipstation.com/orders?importBatch=1', resource_type: 'ORDER_NOTIFY' })
    expect(res.status).toBe(200)
    expect(calls).toHaveLength(0)
  })

  it.each([
    'https://evil.example/shipments',
    'http://ssapi.shipstation.com/shipments',
    'https://ssapi.shipstation.com.evil.example/shipments',
    'https://ssapi.shipstation.com@evil.example/shipments',
    'https://169.254.169.254/latest/meta-data',
    'file:///etc/passwd',
    'javascript:alert(1)',
    '',
  ])('a forged resource_url "%s" is rejected with 400 and our credentials are NEVER sent anywhere', async (url) => {
    h.payload = makePayload([order()])
    expect((await post(notify(url))).status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('rejects a body with no resource_url and a resource path that is not /shipments', async () => {
    h.payload = makePayload([order()])
    expect((await post({ resource_type: 'SHIP_NOTIFY' })).status).toBe(400)
    router = () => shipmentsResponse([])
    const res = await post(notify('https://ssapi.shipstation.com/orders/1'))
    expect(res.status).toBe(500) // fetchShipments refuses it before any request is made
    expect(calls).toHaveLength(0)
  })

  it('end to end: fetches the shipments from ShipStation, finds OUR order by key, records tracking, ignores everyone else\'s shipments', async () => {
    const p = makePayload([order(), order({ id: 102, orderNumber: '7102' })]); h.payload = p
    router = () => shipmentsResponse([
      { orderKey: 'lgv-101', orderNumber: '7101', trackingNumber: '9400111899223197428490', carrierCode: 'stamps_com', shipDate: '2026-11-13', voided: false },
      { orderKey: '504f212a-518a-4bc1-9c5b-c931e55bb1a8', orderNumber: '7102', trackingNumber: '1Z3XK2240300016810', carrierCode: 'ups_walleted', shipDate: '2026-11-13', voided: false }, // someone else's order that happens to share a number with ours
      { orderKey: 'lgv-999999', orderNumber: '1', trackingNumber: 'T', carrierCode: 'ups', voided: false }, // ours by format, but no such order
      { orderKey: 'lgv-102', orderNumber: '7102', trackingNumber: 'VOIDED', carrierCode: 'ups', voided: true },
    ])
    const res = await post(notify())
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, shipments: 4, updated: 1 })
    expect(p.store['101']).toMatchObject({ status: 'shipped', trackingNumber: '9400111899223197428490', carrier: 'stamps_com' })
    expect(p.store['102'].trackingNumber).toBeUndefined() // matched by number only -> must NOT be touched
    expect(calls.every((c) => new URL(c.url).hostname === 'ssapi.shipstation.com')).toBe(true)
  })

  it('a redelivery of the same webhook changes nothing (idempotent)', async () => {
    const p = makePayload([order()]); h.payload = p
    router = () => shipmentsResponse([{ orderKey: 'lgv-101', trackingNumber: '94001', carrierCode: 'usps', shipDate: '2026-11-13', voided: false }])
    await post(notify()); const afterFirst = p.updates.length
    await post(notify())
    expect(p.updates.length).toBe(afterFirst)
  })

  it('follows ShipStation pagination (up to 5 pages)', async () => {
    const p = makePayload([order(), order({ id: 102, orderNumber: '7102' })]); h.payload = p
    router = (c) => {
      const page = new URL(c.url).searchParams.get('page') || '1'
      return shipmentsResponse([{ orderKey: page === '1' ? 'lgv-101' : 'lgv-102', trackingNumber: `TRK${page}`, carrierCode: 'ups', shipDate: '2026-11-13', voided: false }], { pages: 2, page: Number(page) })
    }
    await post(notify())
    expect(p.store['101'].trackingNumber).toBe('TRK1')
    expect(p.store['102'].trackingNumber).toBe('TRK2')
  })

  it('answers 500 when ShipStation cannot be reached, so ShipStation redelivers', async () => {
    h.payload = makePayload([order()])
    router = () => json({}, 503)
    expect((await post(notify())).status).toBe(500)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('cron /api/cron/shipstation-sync', () => {
  const get = (auth?: string) => cronGET(new Request('https://shop.example/api/cron/shipstation-sync', { headers: auth ? { authorization: auth } : {} }))

  it('refuses without the cron secret, with a wrong one, and when CRON_SECRET is not configured', async () => {
    h.payload = makePayload([])
    expect((await get()).status).toBe(401)
    expect((await get('Bearer wrong')).status).toBe(401)
    delete process.env.CRON_SECRET
    expect((await get('Bearer undefined')).status).toBe(500)
    expect(calls).toHaveLength(0)
  })

  it('runs with the right secret', async () => {
    h.payload = makePayload([])
    const res = await get('Bearer cron-secret-for-tests')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, retried: 0 })
  })
})

describe('runShipStationCron', () => {
  const isRetryQuery = (a: any) => JSON.stringify(a.where).includes('"pending"')

  it('retries failed/pending orders and reports how many went through', async () => {
    const p = makePayload([order({ id: 1, orderNumber: '7001', shipstationSyncStatus: 'failed', shipstationSyncAttempts: 2 }), order({ id: 2, orderNumber: '7002', shipstationSyncStatus: 'pending' })])
    p.findResult = (a: any) => (isRetryQuery(a) ? [p.store['1'], p.store['2']] : [])
    router = () => json({ orderId: 900, orderStatus: 'awaiting_shipment' })
    const s = await runShipStationCron(p)
    expect(s).toMatchObject({ retried: 2, synced: 2, stillFailing: 0 })
    expect(p.store['1'].shipstationSyncStatus).toBe('synced')
    expect(p.store['2'].shipstationSyncStatus).toBe('synced')
  })

  it('only selects paid orders that are pending (and idle 10+ minutes) or failed with attempts left; does not depend on the finalized flag', async () => {
    const p = makePayload([]); await runShipStationCron(p)
    const q = JSON.stringify(p.finds[0].where)
    expect(q).toContain('"paymentStatus":{"equals":"captured"}')
    expect(q).not.toContain('isFinalized')
    expect(q).toContain('"shipstationSyncAttempts":{"less_than":' + MAX_ATTEMPTS + '}')
    expect(q).toContain('updatedAt')
    expect(q).not.toContain('manual')
  })

  it('stops at the first rate-limit response and leaves the rest for the next run', async () => {
    const p = makePayload([order({ id: 1, orderNumber: '7001' }), order({ id: 2, orderNumber: '7002' }), order({ id: 3, orderNumber: '7003' })])
    p.findResult = (a: any) => (isRetryQuery(a) ? [p.store['1'], p.store['2'], p.store['3']] : [])
    router = () => json({}, 429)
    const s = await runShipStationCron(p)
    expect(s.retried).toBe(1)
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1)
  })

  it('does not call ShipStation at all when nothing is waiting for a shipment', async () => {
    const p = makePayload([]); await runShipStationCron(p)
    expect(calls).toHaveLength(0)
  })

  it('reconcile: records a shipment the webhook missed, matching re-sent keys too', async () => {
    const waiting = [order({ id: 1, orderNumber: '7001', shipstationSyncStatus: 'synced', shipstationSyncedAt: '2026-11-13T10:00:00Z' }), order({ id: 2, orderNumber: '7002', shipstationSyncStatus: 'synced', shipstationSyncedAt: '2026-11-13T11:00:00Z' })]
    const p = makePayload(waiting)
    p.findResult = (a: any) => (JSON.stringify(a.where).includes('shippedAt') ? [p.store['1'], p.store['2']] : [])
    router = (c) => {
      if (c.url.includes('/shipments')) return json({ shipments: [
        { orderKey: 'lgv-1', trackingNumber: 'TRK1', carrierCode: 'stamps_com', shipDate: '2026-11-13', voided: false },
        { orderKey: 'lgv-2-r777', trackingNumber: 'TRK2', carrierCode: 'ups_walleted', shipDate: '2026-11-13', voided: false },
        { orderKey: 'someone-elses-uuid', trackingNumber: 'ZZZ', carrierCode: 'ups', voided: false },
      ], pages: 1 })
      return json({ orders: [] })
    }
    const s = await runShipStationCron(p)
    expect(s.reconciled).toBe(2)
    expect(p.store['1'].trackingNumber).toBe('TRK1')
    expect(p.store['2'].trackingNumber).toBe('TRK2')
    expect(calls.every((c) => new URL(c.url).hostname === 'ssapi.shipstation.com')).toBe(true)
    expect(calls.filter((c) => c.url.includes('/orders?orderStatus=shipped'))).toHaveLength(0) // everything matched, no second query
  })

  it('reconcile: an order marked shipped in ShipStation without a label becomes shipped here (no tracking, no email)', async () => {
    const p = makePayload([order({ id: 1, orderNumber: '7001', shipstationSyncStatus: 'synced', shipstationSyncedAt: '2026-11-13T10:00:00Z' })])
    p.findResult = (a: any) => (JSON.stringify(a.where).includes('shippedAt') ? [p.store['1']] : [])
    router = (c) => (c.url.includes('/shipments') ? json({ shipments: [], pages: 0 }) : json({ orders: [{ orderKey: 'lgv-1', shipDate: '2026-11-13' }, { orderKey: 'foreign', shipDate: '2026-11-13' }] }))
    const s = await runShipStationCron(p)
    expect(s.markedShippedNoTracking).toBe(1)
    expect(p.store['1']).toMatchObject({ status: 'shipped', fulfillmentStatus: 'fulfilled' })
    expect(p.store['1'].sendTrackingEmail).toBeUndefined()
  })

  it('does nothing when ShipStation is not configured', async () => {
    delete process.env.SHIPSTATION_API_SECRET
    const p = makePayload([]); const s = await runShipStationCron(p)
    expect(s).toEqual({ retried: 0, synced: 0, stillFailing: 0, reconciled: 0, markedShippedNoTracking: 0 })
    expect(p.finds).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('order hook: reinstating a voided order', () => {
  const run = (originalDoc: any, data: any) => beforeOrderChange({ operation: 'update', originalDoc, data, req: { payload: {}, context: {} } } as any)

  it.each(['cancelled', 'skipped'])('refunded -> paid puts a "%s" order back to "pending" so it is re-sent', async (state) => {
    const d: any = await run({ status: 'refunded', shipstationSyncStatus: state }, { status: 'paid' })
    expect(d).toMatchObject({ shipstationSyncStatus: 'pending', shipstationSyncAttempts: 0, shipstationSyncError: null })
  })

  it.each([
    ['not void before', { status: 'paid', shipstationSyncStatus: 'synced' }, { status: 'shipped' }],
    ['was synced when voided but not cancelled yet', { status: 'refunded', shipstationSyncStatus: 'synced' }, { status: 'paid' }],
    ['status not changing', { status: 'refunded', shipstationSyncStatus: 'cancelled' }, { customerNote: 'x' }],
  ])('leaves the sync state alone when %s', async (_l, orig, data) => {
    const d: any = await run(orig, data)
    expect(d.shipstationSyncStatus).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('order hook: "Send to ShipStation again" tickbox', () => {
  const run = (data: any, context: any = {}) => beforeOrderChange({ operation: 'update', originalDoc: { status: 'paid', shipstationSyncStatus: 'manual' }, data, req: { payload: {}, context } } as any)

  it('resets the hand-off to waiting, clears the tick so it never repeats, and flags the save so afterChange sends it now', async () => {
    const context: any = {}
    const d: any = await run({ shipstationRetry: true }, context)
    expect(d).toMatchObject({ shipstationSyncStatus: 'pending', shipstationSyncAttempts: 0, shipstationSyncError: null, shipstationRetry: null })
    expect(context.retryShipStation).toBe(true)
  })

  it.each([[false], [null], [undefined]])('does nothing when the tick is %s', async (v) => {
    const context: any = {}
    const d: any = await run({ shipstationRetry: v, customerNote: 'x' }, context)
    expect(d.shipstationSyncStatus).toBeUndefined()
    expect(context.retryShipStation).toBeUndefined()
  })
})

describe('Orders collection: system-owned fields cannot be written from the admin form', () => {
  const field = (name: string) => (Orders.fields as any[]).find((f) => f.name === name)
  // The admin form re-submits every field it loaded, so any field the integration writes must be protected by field-level
  // update access, otherwise a stale page overwrites it on the next Save (the bug seen on the first real orders).
  it.each([
    'shipstationSyncStatus', 'shipstationOrderId', 'shipstationSyncError', 'shipstationSyncAttempts', 'shipstationSyncedAt',
    'carrier', 'trackingNumber', 'shippedAt', 'isFinalized',
  ])('%s: update access is denied for everyone (the integration writes it through the local API, which bypasses field access)', (name) => {
    const f = field(name)
    expect(f, `field ${name} exists`).toBeTruthy()
    expect(typeof f.access?.update).toBe('function')
    expect(f.access.update({ req: { user: { role: 'admin' } } })).toBe(false)
  })

  it('the retry tickbox stays editable by admins', () => {
    const f = field('shipstationRetry')
    expect(f.type).toBe('checkbox')
    expect(f.access?.update).toBeUndefined()
  })

  it('fields staff DO edit by hand are not locked (tracking link, send-tracking tickbox, status, notes)', () => {
    for (const name of ['trackingLink', 'sendTrackingEmail', 'status', 'paymentStatus', 'customerNote']) expect(field(name)?.access?.update, name).toBeUndefined()
  })
})
