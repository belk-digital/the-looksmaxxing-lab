import { sql } from '@payloadcms/db-postgres'

// Minimal HTML escaping for the staff alert (this site has no shared email helpers).
const escapeHtml = (v: unknown): string =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
import { ShipStationError, assertShipStationUrl, isShipStationConfigured, shipstationRequest } from './client'
import { buildShipStationOrder, orderIdFromKey, orderKeyFor } from './order'
import { trackingUrlFor } from './tracking'
import { SHIPSTATION_CONFIG } from './config'

// Orchestration between our orders and ShipStation. Everything exported here NEVER throws into its caller:
// a ShipStation outage must not break checkout, payment webhooks or the admin panel. Failures are written to the
// order (shipstationSyncStatus / shipstationSyncError) and retried by the cron; the ones a human has to act on
// also email support.
//
// shipstationSyncStatus: pending -> synced -> (cancelled);  pending -> failed -> (retried) -> synced;
//                        manual (international / bad address, ship by hand);  skipped (already shipped or voided).

export const STAFF_EMAIL = SHIPSTATION_CONFIG.staffEmail
export const MAX_ATTEMPTS = 6
const VOID_STATUSES = new Set(['refunded', 'cancelled'])
const DONE_STATUSES = new Set(['shipped', 'fulfilled', 'completed'])
const MAY_BECOME_SHIPPED = new Set(['pending', 'paid', 'fulfilled'])

const asNumber = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
const clip = (s: unknown, max: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const errMsg = (e: unknown) => clip(e instanceof Error ? e.message : e, 280)

async function updateOrder(payload: any, id: number | string, data: Record<string, unknown>, req?: any) {
  return payload.update({ collection: 'orders', id, data, overrideAccess: true, depth: 0, ...(req ? { req } : {}) })
}

// ---------------------------------------------------------------------------------------------------------------
// Staff alerts
// ---------------------------------------------------------------------------------------------------------------

export async function alertStaff(payload: any, order: any, subject: string, message: string): Promise<void> {
  try {
    const serverUrl = SHIPSTATION_CONFIG.siteUrl
    const orderNumber = order?.orderNumber || order?.id
    const html = `
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0A0A0A; font-weight: 800;">${escapeHtml(subject)}</h2>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #2A2A2A; line-height: 1.6;">${escapeHtml(message)}</p>
        <p style="margin: 0; font-size: 14px; color: #2A2A2A; line-height: 1.6;">Order #${escapeHtml(String(orderNumber))}:
          <a href="${escapeHtml(serverUrl)}${escapeHtml(SHIPSTATION_CONFIG.adminPath)}/collections/orders/${escapeHtml(String(order?.id))}" style="color: #0b6b78;">open in the admin</a></p>`
    await payload.sendEmail({
      to: STAFF_EMAIL,
      subject: `ShipStation: ${subject} (order #${orderNumber})`,
      html,
    })
  } catch (err) {
    console.error('ShipStation: could not send staff alert:', err)
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Push: our order -> ShipStation
// ---------------------------------------------------------------------------------------------------------------

/**
 * Waits until any open transaction that has changed this order has committed, so the read that follows sees what was
 * just saved. The hand-off can start from inside an order's own save (the admin's "Send to ShipStation again"), while
 * that save's transaction is still open; reading then would return the OLD row (old address, old status) and the
 * result would be written back over the save. A shared row lock waits exactly as long as needed and is released at
 * once. Best effort: if it cannot be taken, carry on.
 */
async function waitForPendingWrites(payload: any, id: number | string): Promise<void> {
  const numeric = Number(id)
  if (!Number.isFinite(numeric)) return
  try {
    await payload.db.drizzle.execute(sql`SELECT "id" FROM "orders" WHERE "id" = ${numeric} FOR SHARE`)
  } catch {
    /* no database handle (tests) or lock not available: proceed */
  }
}

export type PushOutcome = 'synced' | 'manual' | 'skipped' | 'failed' | 'noop' | 'not-configured'
export interface PushResult { outcome: PushOutcome; detail?: string }

/**
 * Sends one paid order to ShipStation as "awaiting shipment". Idempotent and safe to call twice: the order's
 * orderKey makes ShipStation update instead of duplicate, and an already-synced order is a no-op.
 */
export async function pushOrderToShipStation(payload: any, orderId: number | string): Promise<PushResult> {
  if (!isShipStationConfigured()) return { outcome: 'not-configured' }
  try {
    await waitForPendingWrites(payload, orderId)
    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
    if (!order) return { outcome: 'noop', detail: 'order not found' }

    const state = order.shipstationSyncStatus
    if (order.paymentStatus !== 'captured') return { outcome: 'noop', detail: 'not paid' }
    if (state === 'synced' || state === 'skipped' || state === 'cancelled') return { outcome: 'noop', detail: `already ${state}` }

    // Never queue something for shipping that no longer should ship, or that was shipped by hand already.
    if (VOID_STATUSES.has(order.status)) {
      await updateOrder(payload, order.id, { shipstationSyncStatus: 'skipped', shipstationSyncError: `Not sent: the order is ${order.status}.` })
      return { outcome: 'skipped', detail: order.status }
    }
    if (DONE_STATUSES.has(order.status)) {
      await updateOrder(payload, order.id, { shipstationSyncStatus: 'skipped', shipstationSyncError: `Not sent: the order was already marked ${order.status} before it reached ShipStation.` })
      return { outcome: 'skipped', detail: order.status }
    }

    const built = buildShipStationOrder(order, {
      storeId: asNumber(process.env.SHIPSTATION_STORE_ID),
      warehouseId: asNumber(process.env.SHIPSTATION_WAREHOUSE_ID),
    })
    if (!built.ok) {
      await updateOrder(payload, order.id, { shipstationSyncStatus: 'manual', shipstationSyncError: built.message })
      await alertStaff(
        payload,
        order,
        built.reason === 'international' ? 'International order, ship manually' : 'Order needs an address fix before it can go to ShipStation',
        `${built.message} It was NOT sent to ShipStation, so it will not appear in your shipping queue. After fixing the address, set "ShipStation sync" on the order back to "Waiting to send" to retry.`,
      )
      return { outcome: 'manual', detail: built.message }
    }

    // A previously cancelled ShipStation order cannot be revived (ShipStation ignores status changes on it), so a
    // re-sent order gets a fresh key derived from the old ShipStation id: deterministic, so a retry never duplicates.
    const priorId = clip(order.shipstationOrderId, 30)
    if (priorId) {
      const prior = await shipstationRequest(`/orders/${encodeURIComponent(priorId)}`).catch((e) => {
        if (e instanceof ShipStationError && e.status === 404) return null
        throw e
      })
      if (prior && prior.orderStatus !== 'cancelled') {
        // The earlier ShipStation order is still live (someone reset the status by hand): do not create a twin.
        await updateOrder(payload, order.id, { shipstationSyncStatus: 'synced', shipstationSyncError: null })
        return { outcome: 'noop', detail: 'existing ShipStation order is still live' }
      }
      built.payload.orderKey = `${orderKeyFor(order.id)}-r${priorId}`
    }

    const attempts = (Number(order.shipstationSyncAttempts) || 0) + 1
    // Marker so the cron can find an order whose push never finished (function killed mid-call).
    if (!state) await updateOrder(payload, order.id, { shipstationSyncStatus: 'pending' })

    try {
      const created = await shipstationRequest('/orders/createorder', { method: 'POST', body: built.payload })
      if (!created?.orderId) throw new ShipStationError('ShipStation did not return an order id.', 0)
      if (created.orderStatus && created.orderStatus !== 'awaiting_shipment') {
        throw new ShipStationError(`ShipStation kept the order as "${created.orderStatus}" instead of awaiting shipment.`, 400)
      }
      await updateOrder(payload, order.id, {
        shipstationSyncStatus: 'synced',
        shipstationOrderId: String(created.orderId),
        shipstationSyncError: null,
        shipstationSyncedAt: new Date().toISOString(),
        shipstationSyncAttempts: attempts,
      })
      return { outcome: 'synced', detail: String(created.orderId) }
    } catch (err) {
      const permanent = err instanceof ShipStationError && err.isPermanent
      const recorded = permanent ? MAX_ATTEMPTS : attempts
      await updateOrder(payload, order.id, { shipstationSyncStatus: 'failed', shipstationSyncError: errMsg(err), shipstationSyncAttempts: recorded }).catch(() => undefined)
      if (recorded >= MAX_ATTEMPTS) {
        await alertStaff(payload, order, 'Order could not be sent to ShipStation', `${errMsg(err)} It has stopped retrying. Fix the cause, then set "ShipStation sync" on the order back to "Waiting to send".`)
      }
      return { outcome: 'failed', detail: errMsg(err) }
    }
  } catch (err) {
    console.error(`ShipStation: push of order ${orderId} crashed:`, err)
    return { outcome: 'failed', detail: errMsg(err) }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Cancel: a refunded / cancelled order must leave the shipping queue
// ---------------------------------------------------------------------------------------------------------------

const CREATE_ORDER_FIELDS = [
  'orderNumber', 'orderKey', 'orderDate', 'paymentDate', 'shipByDate', 'customerEmail', 'billTo', 'shipTo', 'items',
  'amountPaid', 'taxAmount', 'shippingAmount', 'customerNotes', 'internalNotes', 'paymentMethod',
  'requestedShippingService', 'weight', 'advancedOptions',
]

/**
 * Cancels the ShipStation order of a refunded/cancelled order. Called from the order's afterChange hook, so the
 * database write joins the hook's transaction via `req` (a separate write to the same row would deadlock).
 * If a label was already bought the order cannot be cancelled: support is emailed to void it by hand.
 */
export async function cancelInShipStation(payload: any, order: any, opts: { req?: any } = {}): Promise<'cancelled' | 'nothing' | 'alerted'> {
  try {
    const ssId = clip(order?.shipstationOrderId, 30)
    if (!isShipStationConfigured() || !ssId || order.shipstationSyncStatus !== 'synced') return 'nothing'

    let ss: any
    try {
      ss = await shipstationRequest(`/orders/${encodeURIComponent(ssId)}`)
    } catch (e) {
      if (e instanceof ShipStationError && e.status === 404) {
        await updateOrder(payload, order.id, { shipstationSyncStatus: 'cancelled', shipstationSyncError: 'The ShipStation order no longer exists.' }, opts.req)
        return 'cancelled'
      }
      throw e
    }

    if (ss.orderStatus === 'shipped') {
      await alertStaff(payload, order, 'Refunded or cancelled order has already shipped', `This order was refunded/cancelled, but ShipStation says it has already shipped. ShipStation will not cancel a shipped order: void the label there if it can still be voided, or contact the customer.`)
      return 'alerted'
    }
    if (ss.orderStatus !== 'cancelled') {
      const body: Record<string, unknown> = { orderStatus: 'cancelled' }
      for (const f of CREATE_ORDER_FIELDS) if (ss[f] !== undefined && ss[f] !== null) body[f] = ss[f]
      const res = await shipstationRequest('/orders/createorder', { method: 'POST', body })
      if (res?.orderStatus !== 'cancelled') {
        await alertStaff(payload, order, 'Could not cancel the order in ShipStation', `ShipStation left this order as "${res?.orderStatus}". Cancel it by hand so it is not shipped.`)
        return 'alerted'
      }
    }
    await updateOrder(payload, order.id, { shipstationSyncStatus: 'cancelled', shipstationSyncError: null }, opts.req)
    return 'cancelled'
  } catch (err) {
    console.error(`ShipStation: cancel of order ${order?.id} failed:`, err)
    await alertStaff(payload, order, 'Could not cancel the order in ShipStation', `${errMsg(err)} Cancel it there by hand so it is not shipped.`)
    return 'alerted'
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Pull: shipment from ShipStation -> our order
// ---------------------------------------------------------------------------------------------------------------

export interface ShipStationShipment {
  orderKey?: string
  orderNumber?: string
  trackingNumber?: string | null
  carrierCode?: string | null
  shipDate?: string | null
  voided?: boolean
  isReturnLabel?: boolean
}

/**
 * Records a shipment on our order: carrier, tracking number and link, shipped status, and the customer's
 * "has shipped" email. Idempotent: the same tracking number twice changes nothing and emails nobody twice.
 */
export async function applyShipmentToOrder(payload: any, order: any, shipment: ShipStationShipment): Promise<'updated' | 'noop' | 'alerted'> {
  if (shipment.voided || shipment.isReturnLabel) return 'noop'
  const tracking = clip(shipment.trackingNumber, 100)
  const isNewTracking = !!tracking && tracking !== order.trackingNumber

  if (VOID_STATUSES.has(order.status)) {
    if (isNewTracking) {
      await alertStaff(payload, order, 'A refunded or cancelled order was shipped', `ShipStation reports tracking ${tracking} for an order that is ${order.status}. The order was left untouched and the customer was not emailed. Check whether the package should be stopped.`)
    }
    return isNewTracking ? 'alerted' : 'noop'
  }
  if (!isNewTracking && (DONE_STATUSES.has(order.status) || order.shippedAt)) return 'noop'

  const data: Record<string, unknown> = { fulfillmentStatus: 'fulfilled' }
  if (isNewTracking) {
    const link = trackingUrlFor(shipment.carrierCode, tracking)
    data.carrier = clip(shipment.carrierCode, 60) || null
    data.trackingNumber = tracking
    if (link) data.trackingLink = link
    // beforeOrderChange turns this into the customer email once the save succeeds.
    if (link && SHIPSTATION_CONFIG.emailCustomerOnShipment) data.sendTrackingEmail = true
  }
  const shipped = shipment.shipDate ? new Date(shipment.shipDate) : null
  data.shippedAt = (shipped && !isNaN(shipped.getTime()) ? shipped : new Date()).toISOString()
  if (MAY_BECOME_SHIPPED.has(order.status)) data.status = 'shipped'

  await updateOrder(payload, order.id, data)
  return 'updated'
}

async function findOurOrder(payload: any, orderKey: unknown): Promise<any | null> {
  const id = orderIdFromKey(orderKey)
  if (!id) return null // not one of ours (ShipStation also holds orders from other sources)
  try {
    return await payload.findByID({ collection: 'orders', id: Number(id), depth: 0, overrideAccess: true })
  } catch {
    return null
  }
}

/** Fetches every page (max 5) of a ShipStation /shipments listing. */
async function fetchShipments(url: string): Promise<ShipStationShipment[]> {
  const first = assertShipStationUrl(url)
  if (first.pathname !== '/shipments') throw new ShipStationError(`Unexpected ShipStation resource path: ${first.pathname}`, 0)
  const all: ShipStationShipment[] = []
  let pages = 1
  for (let page = 1; page <= Math.min(pages, 5); page++) {
    const u = new URL(first.toString())
    if (page > 1) u.searchParams.set('page', String(page))
    const json = await shipstationRequest<{ shipments?: ShipStationShipment[]; pages?: number }>(u.toString())
    all.push(...(json?.shipments || []))
    pages = Number(json?.pages) || 1
  }
  return all
}

/** The SHIP_NOTIFY webhook handler: the body only names a resource; the data is fetched from ShipStation itself. */
export async function handleShipNotify(payload: any, resourceUrl: string): Promise<{ shipments: number; updated: number; alerted: number }> {
  const shipments = await fetchShipments(resourceUrl)
  let updated = 0
  let alerted = 0
  for (const shipment of shipments) {
    const order = await findOurOrder(payload, shipment.orderKey)
    if (!order) continue
    const result = await applyShipmentToOrder(payload, order, shipment)
    if (result === 'updated') updated++
    if (result === 'alerted') alerted++
  }
  return { shipments: shipments.length, updated, alerted }
}

// ---------------------------------------------------------------------------------------------------------------
// Cron safety net
// ---------------------------------------------------------------------------------------------------------------

// ShipStation reads/writes naive timestamps as Pacific time. A generous margin (extra day) makes the exact zone irrelevant.
const shipstationTimestamp = (d: Date) => d.toISOString().slice(0, 19)

export interface CronSummary { retried: number; synced: number; stillFailing: number; reconciled: number; markedShippedNoTracking: number }

/**
 * 1. Retries orders whose push failed, or never finished.
 * 2. Catches shipments the webhook missed (or labels staff created while the site was down), and orders staff
 *    marked shipped in ShipStation without buying a label (no tracking exists for those).
 */
export async function runShipStationCron(payload: any, opts: { maxRetries?: number; onlyOrderIds?: Array<number | string> } = {}): Promise<CronSummary> {
  // `onlyOrderIds` restricts both queries to those orders (used by the automated tests so they never touch real orders).
  const onlyIds = opts.onlyOrderIds ? [{ id: { in: opts.onlyOrderIds } }] : []
  const summary: CronSummary = { retried: 0, synced: 0, stillFailing: 0, reconciled: 0, markedShippedNoTracking: 0 }
  if (!isShipStationConfigured()) return summary

  // --- 1. retries
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { docs: toRetry } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        ...onlyIds,
        { paymentStatus: { equals: 'captured' } },
        // No "isFinalized" condition on purpose: a paid order that is still waiting after 10 idle minutes must be sent
        // even if its finalized flag is missing (finalization cut short, or an older save reset it).
        { or: [
          { and: [{ shipstationSyncStatus: { equals: 'pending' } }, { updatedAt: { less_than: tenMinutesAgo } }] },
          { and: [{ shipstationSyncStatus: { equals: 'failed' } }, { shipstationSyncAttempts: { less_than: MAX_ATTEMPTS } }] },
        ] },
      ],
    },
    sort: 'createdAt',
    limit: opts.maxRetries ?? 10,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  for (const o of toRetry) {
    summary.retried++
    const r = await pushOrderToShipStation(payload, o.id)
    if (r.outcome === 'synced') summary.synced++
    else if (r.outcome === 'failed') {
      summary.stillFailing++
      if (/returned 429/.test(r.detail || '')) break // rate limited: stop and let the next run continue
    }
  }

  // --- 2. reconcile shipments
  const { docs: waiting } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        ...onlyIds,
        { shipstationSyncStatus: { equals: 'synced' } },
        { status: { in: ['paid', 'fulfilled'] } },
        { shippedAt: { exists: false } },
      ],
    },
    sort: 'shipstationSyncedAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  if (waiting.length === 0) return summary

  const oldest = waiting
    .map((o: any) => new Date(o.shipstationSyncedAt || o.createdAt).getTime())
    .reduce((a: number, b: number) => Math.min(a, b), Date.now())
  const since = new Date(Math.max(oldest - 24 * 3600e3, Date.now() - 30 * 24 * 3600e3))
  // Keyed by OUR order id (parsed from the orderKey), so re-sent orders with an "-r<id>" key match too.
  const waitingById = new Map<string, any>(waiting.map((o: any) => [String(o.id), o]))

  const shipments = await fetchShipments(`https://ssapi.shipstation.com/shipments?createDateStart=${shipstationTimestamp(since)}&includeShipmentItems=false&pageSize=500`)
  const handled = new Set<string>()
  for (const s of shipments) {
    const id = orderIdFromKey(s.orderKey)
    const o = id ? waitingById.get(id) : undefined
    if (!o || s.voided) continue
    if ((await applyShipmentToOrder(payload, o, s)) === 'updated') {
      summary.reconciled++
      handled.add(id as string)
    }
  }

  // Orders staff marked shipped without a label have no shipment record at all, only a "shipped" order.
  if (waitingById.size > handled.size) {
    const shippedOrders = await shipstationRequest<{ orders?: Array<{ orderKey?: string; shipDate?: string | null }> }>(
      `/orders?orderStatus=shipped&modifyDateStart=${shipstationTimestamp(since)}&pageSize=500`,
    )
    for (const so of shippedOrders?.orders || []) {
      const id = orderIdFromKey(so.orderKey)
      const o = id && !handled.has(id) ? waitingById.get(id) : undefined
      if (!o) continue
      if ((await applyShipmentToOrder(payload, o, { orderKey: so.orderKey, shipDate: so.shipDate, trackingNumber: null })) === 'updated') {
        summary.markedShippedNoTracking++
        handled.add(id as string)
      }
    }
  }
  return summary
}
