import { normalizeStateCode } from './states'
import { SHIPSTATION_CONFIG } from './config'

// Pure functions only (no network, no database): turn one of our orders into the body ShipStation's
// POST /orders/createorder expects. Everything that can go wrong with an address is decided here, so it can be
// unit-tested exhaustively.

// Package weight is an ESTIMATE used for ShipStation's rate shopping and automation rules. Product weights in the
// catalogue are not filled in (2 of 123 products), so it is derived from what is in the box. Staff weigh the real
// package before buying the label. Tune these four numbers if the estimates drift from reality.
export const PACKAGING_OZ = SHIPSTATION_CONFIG.weights.packagingOz // padded mailer / box, packing material
export const VIAL_OZ = SHIPSTATION_CONFIG.weights.vialOz // one single item (e.g. a vial + its box)
export const KIT_OZ = SHIPSTATION_CONFIG.weights.kitOz // one kit variant (several items in one box)
export const MIN_PACKAGE_OZ = SHIPSTATION_CONFIG.weights.minPackageOz

// ShipStation can email customers about shipments, but our own "has shipped" email (house design, tracking link)
// is the one customers should get. Leaving customerEmail off the order means ShipStation has nobody to email, so
// no duplicate can ever go out. Flip this only if ShipStation's branded tracking emails are wanted instead.
export const SEND_CUSTOMER_EMAIL_TO_SHIPSTATION = false

const PAYMENT_LABELS = SHIPSTATION_CONFIG.paymentLabels

export interface ShipStationAddress {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export interface ShipStationOrderPayload {
  orderNumber: string
  orderKey: string
  orderDate: string
  paymentDate: string
  orderStatus: 'awaiting_shipment'
  customerEmail?: string
  billTo: ShipStationAddress
  shipTo: ShipStationAddress
  items: Array<{ lineItemKey: string; sku: string; name: string; quantity: number; unitPrice: number }>
  amountPaid: number
  taxAmount: number
  shippingAmount: number
  customerNotes?: string
  internalNotes: string
  paymentMethod: string
  requestedShippingService: string
  weight: { value: number; units: 'ounces' }
  advancedOptions: { storeId?: number; warehouseId?: number; customField1: string; customField2: string }
}

export type BuildResult =
  | { ok: true; payload: ShipStationOrderPayload; weightOz: number }
  | { ok: false; reason: 'international' | 'address'; message: string }

/** Stable idempotency key: createorder with the same orderKey updates the existing ShipStation order instead of duplicating it. */
export function orderKeyFor(orderId: number | string): string {
  return `${SHIPSTATION_CONFIG.orderKeyPrefix}-${orderId}`
}

/**
 * Inverse of orderKeyFor; returns null for keys that did not come from us. Also accepts the "-r<id>" form given to
 * an order that was cancelled in ShipStation and then re-sent (a cancelled ShipStation order cannot be revived).
 */
export function orderIdFromKey(key: unknown): string | null {
  const m = typeof key === 'string' ? new RegExp(`^${SHIPSTATION_CONFIG.orderKeyPrefix}-(\\d+)(?:-r\\d+)?$`).exec(key) : null
  return m ? m[1] : null
}

export function normalizeCountry(raw: unknown): string {
  const c = String(raw ?? '').trim().toUpperCase()
  if (!c || ['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(c)) return 'US'
  return c
}

const money = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100
const clip = (s: unknown, max: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

function variantOf(item: any): any {
  const variants = item?.productSnapshot?.variants
  return Array.isArray(variants) ? variants.find((v: any) => v?.sku && v.sku === item.variant) : undefined
}

export function estimateWeightOunces(items: any[]): number {
  let oz = PACKAGING_OZ
  for (const item of items || []) {
    const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1))
    oz += qty * (variantOf(item)?.isKit ? KIT_OZ : VIAL_OZ)
  }
  return Math.max(MIN_PACKAGE_OZ, Math.round(oz * 10) / 10)
}

function itemName(item: any): string {
  const product = clip(item?.productSnapshot?.name, 120)
  const variant = clip(item?.variantTitle, 80)
  return clip([product, variant].filter(Boolean).join(' - ') || 'Item', 200)
}

export function buildShipStationOrder(
  order: any,
  opts: { storeId?: number; warehouseId?: number; now?: Date } = {},
): BuildResult {
  const addr = order?.shippingAddress || {}
  const country = normalizeCountry(addr.country)
  if (country !== 'US') {
    return { ok: false, reason: 'international', message: `International order (${country}): ship manually.` }
  }

  const name = clip([order?.customerFirstName, order?.customerLastName].filter(Boolean).join(' '), 100)
  const street1 = clip(addr.line1, 100)
  const city = clip(addr.city, 60)
  const state = normalizeStateCode(clip(addr.state, 40)).toUpperCase()
  const postalCode = clip(addr.postalCode, 12)

  const problems: string[] = []
  if (!name) problems.push('recipient name')
  if (!street1) problems.push('street address')
  if (!city) problems.push('city')
  if (!/^[A-Z]{2}$/.test(state)) problems.push(`state ("${clip(addr.state, 40)}" is not a US state)`)
  if (!postalCode) problems.push('ZIP code')
  if (problems.length) {
    return { ok: false, reason: 'address', message: `Address needs fixing, missing or invalid: ${problems.join(', ')}.` }
  }

  const phone = clip(order?.customerPhone, 30) || undefined
  const shipTo: ShipStationAddress = { name, street1, street2: clip(addr.line2, 100) || undefined, city, state, postalCode, country: 'US', phone }

  // The billing address is a copy of the shipping address unless the customer entered a different one.
  const bill = order?.billingAddress || {}
  const billState = normalizeStateCode(clip(bill.state, 40)).toUpperCase()
  const billTo: ShipStationAddress =
    bill.line1 && bill.city && /^[A-Z]{2}$/.test(billState) && normalizeCountry(bill.country) === 'US'
      ? { name, street1: clip(bill.line1, 100), street2: clip(bill.line2, 100) || undefined, city: clip(bill.city, 60), state: billState, postalCode: clip(bill.postalCode, 12) || postalCode, country: 'US', phone }
      : shipTo

  const rawItems: any[] = Array.isArray(order?.items) ? order.items : []
  const items = rawItems.map((item, i) => ({
    lineItemKey: `${order.id}-${i + 1}`,
    sku: clip(item?.variant, 100),
    name: itemName(item),
    quantity: Math.max(1, Math.floor(Number(item?.quantity) || 1)),
    unitPrice: money(item?.price),
  }))
  if (items.length === 0) {
    return { ok: false, reason: 'address', message: 'The order has no items.' }
  }

  const weightOz = estimateWeightOunces(rawItems)
  const orderNumber = String(order.orderNumber || order.id)
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || String(order.paymentMethod || 'Unknown')
  const source = clip(order.orderSource, 80)
  const now = opts.now ?? new Date()

  const payload: ShipStationOrderPayload = {
    orderNumber,
    orderKey: orderKeyFor(order.id),
    orderDate: new Date(order.createdAt || now).toISOString(),
    paymentDate: now.toISOString(),
    orderStatus: 'awaiting_shipment',
    ...(SEND_CUSTOMER_EMAIL_TO_SHIPSTATION && order.guestEmail ? { customerEmail: clip(order.guestEmail, 200) } : {}),
    billTo,
    shipTo,
    items,
    amountPaid: money(order.total),
    taxAmount: money(order.taxTotal),
    shippingAmount: money(order.shippingTotal),
    ...(order.customerNote ? { customerNotes: clip(order.customerNote, 1000) } : {}),
    internalNotes: clip(
      `${SHIPSTATION_CONFIG.brandName} order #${orderNumber}. Paid by ${paymentLabel}. Customer chose: ${order.shippingMethod || 'n/a'}.${source ? ` Source: ${source}.` : ''}`,
      500,
    ),
    paymentMethod: paymentLabel,
    requestedShippingService: clip(order.shippingMethod, 100),
    weight: { value: weightOz, units: 'ounces' },
    advancedOptions: {
      ...(opts.storeId ? { storeId: opts.storeId } : {}),
      ...(opts.warehouseId ? { warehouseId: opts.warehouseId } : {}),
      customField1: source || SHIPSTATION_CONFIG.sourceLabel,
      customField2: paymentLabel,
    },
  }
  return { ok: true, payload, weightOz }
}
