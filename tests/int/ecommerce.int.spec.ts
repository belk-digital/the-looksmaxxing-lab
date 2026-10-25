/**
 * Unit tests for the GA4 ecommerce analytics module.
 *
 * What is tested:
 * - Correct event name and payload shape for all five events.
 * - ecommerce: null clear push precedes every event push.
 * - No-op behaviour when window is undefined (SSR guard).
 * - claimPurchaseEvent deduplication via localStorage.
 * - Analytics functions never throw when given edge-case inputs.
 * - No PII fields in any payload.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  pushViewItem,
  pushAddToCart,
  pushRemoveFromCart,
  pushViewCart,
  pushBeginCheckout,
  pushPurchase,
  claimPurchaseEvent,
  buildPurchaseItems,
  type EcomItem,
} from '../../src/lib/analytics/ecommerce'

// ─── dataLayer mock ───────────────────────────────────────────────────────────

function setupDataLayer() {
  const dl: Record<string, unknown>[] = []
  ;(globalThis as any).window = { dataLayer: dl }
  return dl
}

function clearWindow() {
  delete (globalThis as any).window
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const ITEM: EcomItem = {
  item_id: 'tirzepatide-5mg',
  item_name: 'Tirzepatide',
  item_variant: '5mg',
  price: 149.99,
  quantity: 1,
}

function getEvents(dl: Record<string, unknown>[]) {
  // Strip the ecommerce:null clears; return only the real event pushes.
  return dl.filter((e) => e.event !== undefined)
}

function getClearCount(dl: Record<string, unknown>[]) {
  return dl.filter((e) => 'ecommerce' in e && e.ecommerce === null).length
}

// ─── view_item ────────────────────────────────────────────────────────────────

describe('pushViewItem', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name view_item', () => {
    pushViewItem({ value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('view_item')
  })

  it('pushes ecommerce:null clear before the event', () => {
    pushViewItem({ value: 149.99, items: [ITEM] })
    expect(getClearCount(dl)).toBe(1)
    expect(dl[0]).toEqual({ ecommerce: null })
  })

  it('includes correct items and value', () => {
    pushViewItem({ value: 149.99, items: [ITEM] })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBe(149.99)
    expect(ecom.items[0].item_id).toBe('tirzepatide-5mg')
  })

  it('defaults currency to USD', () => {
    pushViewItem({ value: 99, items: [ITEM] })
    expect((getEvents(dl)[0] as any).ecommerce.currency).toBe('USD')
  })

  it('no-ops when window is undefined', () => {
    clearWindow()
    expect(() => pushViewItem({ value: 99, items: [ITEM] })).not.toThrow()
  })
})

// ─── add_to_cart ──────────────────────────────────────────────────────────────

describe('pushAddToCart', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name add_to_cart', () => {
    pushAddToCart({ value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('add_to_cart')
  })

  it('carries item_variant', () => {
    pushAddToCart({ value: 149.99, items: [ITEM] })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.items[0].item_variant).toBe('5mg')
  })

  it('does not include PII fields', () => {
    pushAddToCart({ value: 149.99, items: [ITEM] })
    const payload = JSON.stringify(getEvents(dl)[0])
    expect(payload).not.toMatch(/email|phone|name.*@|address/)
  })
})

// ─── remove_from_cart ─────────────────────────────────────────────────────────

describe('pushRemoveFromCart', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name remove_from_cart', () => {
    pushRemoveFromCart({ value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('remove_from_cart')
  })
})

// ─── view_cart ────────────────────────────────────────────────────────────────

describe('pushViewCart', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name view_cart', () => {
    pushViewCart({ value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('view_cart')
  })

  it('handles an empty items array without throwing', () => {
    expect(() => pushViewCart({ value: 0, items: [] })).not.toThrow()
  })
})

// ─── begin_checkout ───────────────────────────────────────────────────────────

describe('pushBeginCheckout', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name begin_checkout', () => {
    pushBeginCheckout({ value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('begin_checkout')
  })

  it('includes coupon when provided', () => {
    pushBeginCheckout({ value: 149.99, coupon: 'SAVE10', items: [ITEM] })
    expect((getEvents(dl)[0] as any).ecommerce.coupon).toBe('SAVE10')
  })

  it('omits coupon key when not provided', () => {
    pushBeginCheckout({ value: 149.99, items: [ITEM] })
    expect((getEvents(dl)[0] as any).ecommerce).not.toHaveProperty('coupon')
  })
})

// ─── purchase ─────────────────────────────────────────────────────────────────

describe('pushPurchase', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes event name purchase', () => {
    pushPurchase({ transaction_id: 'ORD-001', value: 149.99, items: [ITEM] })
    expect(getEvents(dl)[0]?.event).toBe('purchase')
  })

  it('includes transaction_id', () => {
    pushPurchase({ transaction_id: 'ORD-001', value: 149.99, items: [ITEM] })
    expect((getEvents(dl)[0] as any).ecommerce.transaction_id).toBe('ORD-001')
  })

  it('includes shipping and tax', () => {
    pushPurchase({ transaction_id: 'ORD-001', value: 159.99, shipping: 5.99, tax: 3.50, items: [ITEM] })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.shipping).toBe(5.99)
    expect(ecom.tax).toBe(3.50)
  })

  it('defaults shipping and tax to 0', () => {
    pushPurchase({ transaction_id: 'ORD-001', value: 149.99, items: [ITEM] })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.shipping).toBe(0)
    expect(ecom.tax).toBe(0)
  })

  it('omits coupon key when not provided', () => {
    pushPurchase({ transaction_id: 'ORD-001', value: 149.99, items: [ITEM] })
    expect((getEvents(dl)[0] as any).ecommerce).not.toHaveProperty('coupon')
  })

  it('does not include any PII fields', () => {
    pushPurchase({
      transaction_id: 'ORD-001',
      value: 149.99,
      items: [{ item_id: 'slug', item_name: 'Product', price: 149.99, quantity: 1 }],
    })
    const payload = JSON.stringify(getEvents(dl)[0])
    // transaction_id is the order number, not a user identifier
    expect(payload).not.toMatch(/email|phone|address|customer/)
  })

  it('no-ops when window is undefined (SSR)', () => {
    clearWindow()
    expect(() =>
      pushPurchase({ transaction_id: 'ORD-001', value: 149.99, items: [ITEM] })
    ).not.toThrow()
  })
})

// ─── claimPurchaseEvent ───────────────────────────────────────────────────────

describe('claimPurchaseEvent', () => {
  beforeEach(() => {
    // Ensure localStorage is clean for each test
    localStorage.clear()
    // Ensure window is available
    if (!(globalThis as any).window) {
      ;(globalThis as any).window = {}
    }
  })

  it('returns true on first call for an order', () => {
    expect(claimPurchaseEvent('ORDER-1')).toBe(true)
  })

  it('returns false on second call for same order (deduplication)', () => {
    claimPurchaseEvent('ORDER-2')
    expect(claimPurchaseEvent('ORDER-2')).toBe(false)
  })

  it('returns true for a different order ID', () => {
    claimPurchaseEvent('ORDER-3')
    expect(claimPurchaseEvent('ORDER-4')).toBe(true)
  })

  it('writes key with lv_ecom_p_ prefix to localStorage', () => {
    claimPurchaseEvent('ORDER-5')
    expect(localStorage.getItem('lv_ecom_p_ORDER-5')).toBe('1')
  })

  it('returns true (fail open) when localStorage throws', () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('storage blocked') }
    try {
      expect(claimPurchaseEvent('ORDER-X')).toBe(true)
    } finally {
      Storage.prototype.getItem = orig
    }
  })
})

// ─── ecommerce: null clear guarantee ─────────────────────────────────────────

describe('ecommerce object clearing', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('pushes ecommerce:null before every event', () => {
    pushViewItem({ value: 10, items: [ITEM] })
    pushAddToCart({ value: 10, items: [ITEM] })
    pushBeginCheckout({ value: 10, items: [ITEM] })
    pushPurchase({ transaction_id: 'ORD-X', value: 10, items: [ITEM] })
    expect(getClearCount(dl)).toBe(4)
  })

  it('dataLayer has interleaved clear + event pairs in correct order', () => {
    pushViewItem({ value: 10, items: [ITEM] })
    expect(dl[0]).toEqual({ ecommerce: null })
    expect((dl[1] as any)?.event).toBe('view_item')
  })
})

// ─── Phase 38 regressions: GA4 value convention ───────────────────────────────
// These tests document and enforce the GA4 ecommerce recommended convention:
// `value` = items revenue (sum of item.price × item.quantity).
// Shipping and processing fee (tax) are reported in separate fields and must
// NOT be included in `value`. The OrderConfirmationClient bug was
// `value: order.total` (included shipping + processingFee); the fix is
// `value: order.total - order.shipping - order.processingFee`.

describe('GA4 purchase value convention (Phase 38 regressions)', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('value equals items revenue — shipping and tax are separate fields', () => {
    const item: EcomItem = { item_id: 'sku-a', item_name: 'Product A', price: 100.00, quantity: 2 }
    const itemsRevenue = 200.00   // 100 × 2
    const shipping = 9.99
    const tax = 3.50
    pushPurchase({ transaction_id: 'ORD-CONV-1', value: itemsRevenue, shipping, tax, items: [item] })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBe(itemsRevenue)
    expect(ecom.shipping).toBe(shipping)
    expect(ecom.tax).toBe(tax)
    // value must NOT equal value + shipping + tax
    expect(ecom.value).not.toBe(itemsRevenue + shipping + tax)
  })

  it('value equals multi-item revenue sum', () => {
    const items: EcomItem[] = [
      { item_id: 'sku-b', item_name: 'Tirzepatide 5mg', price: 149.99, quantity: 1 },
      { item_id: 'sku-c', item_name: 'BPC-157',         price: 79.00,  quantity: 2 },
    ]
    const expectedRevenue = 149.99 + 79.00 * 2  // 307.99
    pushPurchase({ transaction_id: 'ORD-CONV-2', value: expectedRevenue, shipping: 0, tax: 5.99, items })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(expectedRevenue, 2)
    expect(ecom.tax).toBe(5.99)
    expect(ecom.value).not.toBeCloseTo(expectedRevenue + 5.99, 2)
  })

  it('value is zero when all item prices are zero (free order)', () => {
    const items: EcomItem[] = [
      { item_id: 'promo', item_name: 'Free Sample', price: 0, quantity: 1 },
    ]
    pushPurchase({ transaction_id: 'ORD-FREE-1', value: 0, items })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBe(0)
    expect(ecom.shipping).toBe(0)
    expect(ecom.tax).toBe(0)
  })
})

// ─── Phase 38 regressions: purchase deduplication edge cases ─────────────────

describe('claimPurchaseEvent deduplication edge cases (Phase 38 regressions)', () => {
  beforeEach(() => {
    localStorage.clear()
    if (!(globalThis as any).window) {
      ;(globalThis as any).window = {}
    }
  })

  it('claim persists in localStorage independent of dataLayer availability', () => {
    // Simulates the scenario where claimPurchaseEvent writes localStorage
    // but the subsequent dataLayer.push() silently fails.
    // Result: order is "claimed" but event was never delivered to GA4.
    // This is a known fail-open limitation documented in Phase 38.
    claimPurchaseEvent('DEDUP-FAILOPEN-1')
    // Even if we now delete window.dataLayer, the claim is already in storage
    expect(localStorage.getItem('lv_ecom_p_DEDUP-FAILOPEN-1')).toBe('1')
    // A second call (e.g., page refresh) correctly returns false — event won't re-fire
    expect(claimPurchaseEvent('DEDUP-FAILOPEN-1')).toBe(false)
  })

  it('storage key includes order ID verbatim — no cross-order collision', () => {
    claimPurchaseEvent('ORD-AAA')
    claimPurchaseEvent('ORD-BBB')
    expect(localStorage.getItem('lv_ecom_p_ORD-AAA')).toBe('1')
    expect(localStorage.getItem('lv_ecom_p_ORD-BBB')).toBe('1')
    // Different order → not yet claimed
    expect(claimPurchaseEvent('ORD-CCC')).toBe(true)
  })
})
// ─── Phase 40 regressions: revenue reconciliation & discount allocation ───────
//
// GA4 requirement (developers.google.com/analytics/devguides/collection/ga4/ecommerce):
//   purchase.value  = Σ (items[].price − items[].discount) × items[].quantity
//   i.e. value excludes shipping, tax, and processing fees.
//
// Longevia model:
//   order.subtotal     = Σ(priceSnapshot × qty)   — pre-coupon
//   order.discountTotal = order-level coupon discount
//   order.redeemedPoints = loyalty points (payment method, NOT price reduction)
//   order.feeTotal / 100 = processingFee (handling surcharge, NOT statutory tax)
//   order.taxTotal      = 0 always (Longevia collects no sales tax)
//
// Correct purchase event:
//   value            = subtotal − discountTotal
//   tax              = 0
//   processing_fee   = processingFee  (custom event-level param)
//   items[].discount = (item.price / subtotal) × discountTotal  (per unit, 2dp)

describe('Phase 40: GA4 purchase revenue reconciliation', () => {
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  // ── Scenario A: no coupon, no points ─────────────────────────────────────
  it('A — no coupon: value = sum(price × qty), no discount on items', () => {
    const items: EcomItem[] = [
      { item_id: 'glut-5g', item_name: 'Glutathione 5g', price: 89.00, quantity: 1 },
      { item_id: 'bpc-5mg', item_name: 'BPC-157 5mg',    price: 49.00, quantity: 2 },
    ]
    const subtotal = 89 + 49 * 2   // 187.00
    pushPurchase({
      transaction_id: 'ORD-P40-A',
      value: subtotal,
      shipping: 9.99,
      tax: 0,
      items,
    })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(187.00, 2)
    expect(ecom.tax).toBe(0)
    // Items carry no discount field
    expect(ecom.items[0].discount).toBeUndefined()
    expect(ecom.items[1].discount).toBeUndefined()
    // value equals sum of price × qty
    const sumRevenue = ecom.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
    expect(ecom.value).toBeCloseTo(sumRevenue, 2)
  })

  // ── Scenario B: flat $20 coupon, single item ──────────────────────────────
  it('B — flat $20 coupon, 1 item: value = subtotal − coupon; price is post-coupon', () => {
    // GA4 convention (Phase 41): price = post-coupon per-unit price; GA4 does NOT
    // auto-subtract discount. So price=80 (not 100) and value = price × qty = 80.
    const subtotal = 100.00
    const coupon   = 20.00
    const items: EcomItem[] = [
      // price is post-coupon: 100 - 20 = 80; discount is informational
      { item_id: 'tmt-10', item_name: 'Tirzepatide 10mg', price: 80.00, quantity: 1, discount: 20.00 },
    ]
    pushPurchase({
      transaction_id: 'ORD-P40-B',
      value: subtotal - coupon,   // 80.00
      shipping: 0,
      tax: 0,
      coupon: 'SAVE20',
      items,
    })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(80.00, 2)
    expect(ecom.coupon).toBe('SAVE20')
    expect(ecom.items[0].price).toBeCloseTo(80.00, 2)     // post-coupon price
    expect(ecom.items[0].discount).toBeCloseTo(20.00, 2)  // informational
    // value = price × qty (GA4 does not auto-subtract discount)
    const itemRevenue = ecom.items[0].price * ecom.items[0].quantity
    expect(ecom.value).toBeCloseTo(itemRevenue, 2)
  })

  // ── Scenario C: percentage coupon, multi-item (proportional allocation) ──
  it('C — $30 coupon across 2 items: discount allocated proportionally, value reconciles', () => {
    // GA4 convention (Phase 41): price is post-coupon per-unit price.
    // Item A: priceSnap=$150 × 1  → discA=150/300×30=$15 → postPrice=135
    // Item B: priceSnap=$75  × 2  → discB= 75/300×30=$7.50/unit → postPrice=67.50
    // value = 135×1 + 67.50×2 = 270.00
    const subtotal = 300.00
    const coupon   = 30.00
    const discA    = Math.round((150 / 300) * 30 * 100) / 100   // 15.00
    const discB    = Math.round((75  / 300) * 30 * 100) / 100   // 7.50
    const postPriceA = Math.round((150.00 - discA) * 100) / 100  // 135.00
    const postPriceB = Math.round((75.00  - discB) * 100) / 100  // 67.50
    const items: EcomItem[] = [
      // price is post-coupon; discount is informational
      { item_id: 'rta-5', item_name: 'Retatrutide 5mg', price: postPriceA, discount: discA, quantity: 1 },
      { item_id: 'nad-10', item_name: 'NAD+ 10mg',      price: postPriceB, discount: discB, quantity: 2 },
    ]
    pushPurchase({
      transaction_id: 'ORD-P40-C',
      value: subtotal - coupon,   // 270.00
      shipping: 9.99,
      tax: 0,
      coupon: 'TENOFF',
      items,
    })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(270.00, 2)
    // Sum of price × qty must equal value (GA4 does NOT auto-subtract discount)
    const sumRevenue = ecom.items.reduce(
      (s: number, i: any) => s + i.price * i.quantity,
      0,
    )
    expect(ecom.value).toBeCloseTo(sumRevenue, 2)
    // Post-coupon prices are correct
    expect(ecom.items[0].price).toBeCloseTo(135.00, 2)
    expect(ecom.items[1].price).toBeCloseTo(67.50,  2)
    // Informational discount fields are correct
    expect(ecom.items[0].discount).toBeCloseTo(15.00, 2)
    expect(ecom.items[1].discount).toBeCloseTo(7.50,  2)
    // Total allocated discount = coupon
    const totalAllocated = ecom.items.reduce((s: number, i: any) => s + (i.discount ?? 0) * i.quantity, 0)
    expect(totalAllocated).toBeCloseTo(coupon, 1)
  })

  // ── Scenario D: loyalty points — NOT deducted from value ─────────────────
  it('D — loyalty points redeemed: value = subtotal (points are payment, not revenue reduction)', () => {
    // order.total would be subtotal + shipping − points
    // GA4 value must NOT be reduced by redeemed points
    const subtotal    = 200.00
    const shipping    = 9.99
    const points      = 15.00   // $15 in Maxx Points
    const orderTotal  = subtotal + shipping - points   // 194.99
    const items: EcomItem[] = [
      { item_id: 'glp3', item_name: 'GLP-3', price: 200.00, quantity: 1 },
    ]
    // Correct: value = subtotal, not orderTotal − shipping
    pushPurchase({
      transaction_id: 'ORD-P40-D',
      value: subtotal,         // correct: 200.00
      shipping,
      tax: 0,
      items,
    })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(200.00, 2)
    // value must NOT equal orderTotal − shipping (which subtracts points)
    expect(ecom.value).not.toBeCloseTo(orderTotal - shipping, 2)
  })

  // ── Scenario E: processing fee — tax=0, custom processing_fee param ──────
  it('E — processing fee: tax=0; processing_fee at event level, not inside ecommerce', () => {
    const items: EcomItem[] = [
      { item_id: 'sku-x', item_name: 'Product X', price: 50.00, quantity: 1 },
    ]
    pushPurchase({
      transaction_id: 'ORD-P40-E',
      value: 50.00,
      shipping: 0,
      tax: 0,
      processing_fee: 3.50,
      items,
    })
    const event = getEvents(dl)[0] as any
    const ecom  = event.ecommerce
    // tax must be 0 — processingFee is NOT statutory tax
    expect(ecom.tax).toBe(0)
    // processing_fee lives at event level, not inside ecommerce
    expect(event.processing_fee).toBeCloseTo(3.50, 2)
    expect(ecom.processing_fee).toBeUndefined()
    // value unaffected by fee
    expect(ecom.value).toBeCloseTo(50.00, 2)
  })

  // ── Scenario F: free order (subtotal = 0) — no division-by-zero ──────────
  it('F — free order (subtotal=0): value=0, no discount field on items', () => {
    const items: EcomItem[] = [
      { item_id: 'sample', item_name: 'Free Sample', price: 0, quantity: 1 },
    ]
    pushPurchase({ transaction_id: 'ORD-P40-F', value: 0, tax: 0, items })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBe(0)
    expect(ecom.items[0].discount).toBeUndefined()
  })
})
describe('Phase 41: GA4 discount payload convention — price is post-coupon', () => {
  // Verifies that items[].price is the actual charged per-unit price AFTER coupon discount,
  // and that Σ(price × qty) = purchase.value. GA4 does NOT auto-subtract `discount` from `price`.
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  it('single item with flat coupon: price = priceSnapshot − discount', () => {
    // priceSnapshot=$120, coupon=$24 → postPrice=$96
    const priceSnapshot = 120.00
    const couponDiscount = 24.00
    const postPrice = Math.round((priceSnapshot - couponDiscount) * 100) / 100  // 96.00
    const items: EcomItem[] = [
      { item_id: 'motsc-2', item_name: 'MOTS-c 2mg', price: postPrice, discount: couponDiscount, quantity: 1 },
    ]
    pushPurchase({
      transaction_id: 'ORD-P41-A',
      value: postPrice * 1,  // 96.00
      shipping: 0,
      tax: 0,
      coupon: 'SAVE20PCT',
      items,
    })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    // price must be post-coupon (96, not 120)
    expect(ecom.items[0].price).toBeCloseTo(96.00, 2)
    expect(ecom.items[0].discount).toBeCloseTo(24.00, 2)
    // value = price × qty (reconciliation)
    expect(ecom.value).toBeCloseTo(ecom.items[0].price * ecom.items[0].quantity, 2)
    expect(ecom.value).toBeCloseTo(96.00, 2)
  })

  it('multi-item with proportional coupon: Σ(price × qty) = value exactly', () => {
    // Item A: priceSnap=200, qty=1; Item B: priceSnap=100, qty=2
    // subtotal=400; coupon=40; discA=(200/400)*40=20; discB=(100/400)*40=10
    const snapA = 200.00, snapB = 100.00
    const coupon = 40.00
    const subtotal = snapA * 1 + snapB * 2  // 400.00
    const discA = Math.round((snapA / subtotal) * coupon * 100) / 100  // 20.00
    const discB = Math.round((snapB / subtotal) * coupon * 100) / 100  // 10.00
    const postA = Math.round((snapA - discA) * 100) / 100  // 180.00
    const postB = Math.round((snapB - discB) * 100) / 100  // 90.00
    const items: EcomItem[] = [
      { item_id: 'glut-10', item_name: 'Glutathione 10g', price: postA, discount: discA, quantity: 1 },
      { item_id: 'bpc-10',  item_name: 'BPC-157 10mg',    price: postB, discount: discB, quantity: 2 },
    ]
    const value = postA * 1 + postB * 2  // 180 + 180 = 360.00
    pushPurchase({ transaction_id: 'ORD-P41-B', value, shipping: 9.99, tax: 0, coupon: 'FLAT40', items })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(360.00, 2)
    // Critical reconciliation: GA4 sees price × qty, not (price - discount) × qty
    const sumRevenue = ecom.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
    expect(ecom.value).toBeCloseTo(sumRevenue, 2)
    expect(ecom.items[0].price).toBeCloseTo(180.00, 2)
    expect(ecom.items[1].price).toBeCloseTo(90.00,  2)
  })

  it('no coupon: price = priceSnapshot, no discount field, value = Σ(price × qty)', () => {
    const items: EcomItem[] = [
      { item_id: 'trt-5', item_name: 'Tirzepatide 5mg', price: 149.99, quantity: 2 },
    ]
    pushPurchase({ transaction_id: 'ORD-P41-C', value: 149.99 * 2, tax: 0, items })
    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.items[0].discount).toBeUndefined()
    const sumRevenue = ecom.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
    expect(ecom.value).toBeCloseTo(sumRevenue, 2)
  })

  it('processing_fee is at event level, not in ecommerce; tax remains 0', () => {
    const items: EcomItem[] = [
      { item_id: 'nad-5', item_name: 'NAD+ 5mg', price: 75.00, quantity: 1 },
    ]
    pushPurchase({ transaction_id: 'ORD-P41-D', value: 75.00, tax: 0, processing_fee: 4.25, items })
    const event = (getEvents(dl)[0] as any)
    expect(event.processing_fee).toBeCloseTo(4.25, 2)
    expect(event.ecommerce.processing_fee).toBeUndefined()
    expect(event.ecommerce.tax).toBe(0)
  })
})

describe('Phase 42: discount rounding & revenue invariant audit', () => {
  // Verifies that buildPurchaseItems guarantees Σ(price × qty) === value exactly
  // via integer-cent allocation with last-line remainder strategy.
  // The Phase 41 per-item round-to-2dp approach can drift by up to (n-1) × $0.005.
  let dl: Record<string, unknown>[]
  beforeEach(() => { dl = setupDataLayer() })

  // ── Helper: assert integer-cent invariant ────────────────────────────────────
  function assertInvariant(items: EcomItem[], value: number): void {
    // Phase 43 correction: use raw-float sum rounded to cents (Check B').
    // The integer-cent check (Check A: Σ(Math.round(price×100)×qty)) incorrectly
    // fails for indivisible cases (lineRevCents % qty ≠ 0), which occur for
    // ~54% of Longevia multi-unit lines with proportional coupons.
    // Check B' is what GA4 effectively computes after receiving the float payload.
    const valueCents = Math.round(value * 100)
    const rawSum     = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const sumCents   = Math.round(rawSum * 100)
    expect(sumCents).toBe(valueCents)
  }

  // ── Worked rounding example: 3-item equal-price order ────────────────────────
  //
  // Phase 41 drift proof:
  //   items: $33.33 / $33.33 / $33.34, qty=1 each, subtotal=$100.00, coupon=$10.00
  //   perUnitDisc_A = round(33.33/100 × 10, 2dp) = $3.33
  //   perUnitDisc_B = $3.33
  //   perUnitDisc_C = round(33.34/100 × 10, 2dp) = $3.33   ← should be $3.34
  //   Σ allocated   = $9.99 ≠ $10.00 coupon
  //   postPrice_C   = $30.01 instead of $30.00
  //   Σ(price×qty)  = $90.01 ≠ value=$90.00   → +1 cent DRIFT
  //
  // Phase 42 fix (buildPurchaseItems):
  //   lineDiscCents_A = round(3333/10000 × 1000) = 333
  //   lineDiscCents_B = 333
  //   lineDiscCents_C (last) = 1000 − 333 − 333 = 334  ← absorbs remainder
  //   postPrice_A = (3333−333)/100 = $30.00
  //   postPrice_B = $30.00
  //   postPrice_C = (3334−334)/100 = $30.00
  //   Σ(price×qty) = $90.00 = value  → EXACT ✓
  it('3-item equal-price order: Phase 41 would drift +1 cent; Phase 42 is exact', () => {
    const items = buildPurchaseItems(
      [
        { id: 'a', name: 'Product A', quantity: 1, price: 33.33 },
        { id: 'b', name: 'Product B', quantity: 1, price: 33.33 },
        { id: 'c', name: 'Product C', quantity: 1, price: 33.34 },
      ],
      100.00,
      10.00,
    )
    expect(items).toHaveLength(3)
    // All three items post-coupon price = $30.00
    expect(items[0].price).toBeCloseTo(30.00, 2)
    expect(items[1].price).toBeCloseTo(30.00, 2)
    expect(items[2].price).toBeCloseTo(30.00, 2)
    // Last item absorbs the extra cent in discount ($3.34 vs $3.33 for first two)
    expect(items[0].discount).toBeCloseTo(3.33, 2)
    expect(items[1].discount).toBeCloseTo(3.33, 2)
    expect(items[2].discount).toBeCloseTo(3.34, 2)
    // Integer-cent invariant: Σ(round(price×100) × qty) === round(value×100)
    assertInvariant(items as EcomItem[], 90.00)
  })

  // ── High-quantity item: qty=6 ─────────────────────────────────────────────────
  it('high-quantity item (qty=6): line-level allocation remains exact', () => {
    // subtotal = $50×6 + $70×1 = $370; 10% coupon = $37
    const items = buildPurchaseItems(
      [
        { id: 'x', name: 'Item X', quantity: 6, price: 50.00 },
        { id: 'y', name: 'Item Y', quantity: 1, price: 70.00 },
      ],
      370.00,
      37.00,
    )
    // lineDiscX = round(30000/37000 × 3700) = 3000 → postPrice = 45.00/unit
    // lineDiscY (last) = 3700 − 3000 = 700 → postPrice = 63.00
    expect(items[0].price).toBeCloseTo(45.00, 2)
    expect(items[1].price).toBeCloseTo(63.00, 2)
    expect(items[0].discount).toBeCloseTo(5.00, 2)  // 3000c / 6 units
    expect(items[1].discount).toBeCloseTo(7.00, 2)
    assertInvariant(items as EcomItem[], 333.00)
  })

  // ── 100% coupon: all prices zero ─────────────────────────────────────────────
  it('100% coupon: all item prices are zero, Σ(price×qty) = 0', () => {
    // subtotal=$100, coupon=$100 → value=0
    const items = buildPurchaseItems(
      [
        { id: 'p', name: 'Product P', quantity: 1, price: 49.00 },
        { id: 'q', name: 'Product Q', quantity: 2, price: 25.50 },
      ],
      100.00,
      100.00,
    )
    expect(items[0].price).toBeCloseTo(0.00, 5)
    expect(items[1].price).toBeCloseTo(0.00, 5)
    const sumRevenue = items.reduce((s, i) => s + i.price * i.quantity, 0)
    expect(sumRevenue).toBeCloseTo(0.00, 5)
    assertInvariant(items as EcomItem[], 0.00)
  })

  // ── No coupon: prices unchanged, no discount field ────────────────────────────
  it('no coupon: prices unchanged, discount field omitted', () => {
    const items = buildPurchaseItems(
      [{ id: 'r', name: 'Product R', quantity: 2, price: 75.00 }],
      150.00,
      0,
    )
    expect(items[0].price).toBeCloseTo(75.00, 2)
    expect(items[0].discount).toBeUndefined()
    assertInvariant(items as EcomItem[], 150.00)
  })

  // ── Single item, zero subtotal guard ─────────────────────────────────────────
  it('zero subtotal: no division-by-zero, no discount allocated', () => {
    const items = buildPurchaseItems(
      [{ id: 'free', name: 'Free Sample', quantity: 1, price: 0 }],
      0,
      0,
    )
    expect(items[0].price).toBe(0)
    expect(items[0].discount).toBeUndefined()
  })

  // ── Full integration: buildPurchaseItems feeds pushPurchase ──────────────────
  it('pushPurchase with buildPurchaseItems: dataLayer event reconciles exactly', () => {
    // 3-product order, 10% coupon, tests the full path through pushPurchase
    // subtotal = $89 + $49×2 + $75 = $262; coupon = $26.20; value = $235.80
    const subtotal      = 262.00
    const couponDiscount = 26.20
    const value          = subtotal - couponDiscount   // 235.80
    const builtItems = buildPurchaseItems(
      [
        { id: 'glut', name: 'Glutathione 10g', quantity: 1, price: 89.00 },
        { id: 'bpc',  name: 'BPC-157 10mg',    quantity: 2, price: 49.00 },
        { id: 'nad',  name: 'NAD+ 500mg',       quantity: 1, price: 75.00 },
      ],
      subtotal,
      couponDiscount,
    ) as [EcomItem, ...EcomItem[]]

    pushPurchase({
      transaction_id: 'ORD-P42-INT',
      value,
      shipping: 9.99,
      tax: 0,
      coupon: 'SAVE10',
      items: builtItems,
    })

    const ecom = (getEvents(dl)[0] as any).ecommerce
    expect(ecom.value).toBeCloseTo(235.80, 2)
    // Integer-cent invariant: each item has discount, sum reconciles
    const sumRevenue = (ecom.items as any[]).reduce(
      (s: number, i: any) => s + i.price * i.quantity, 0,
    )
    expect(Math.abs(sumRevenue - ecom.value)).toBeLessThan(0.005)
    // Phase 43: use Check B' (rounded raw-float sum) — not Check A
    const valueCents = Math.round(ecom.value * 100)
    const rawSumFloat = (ecom.items as any[]).reduce(
      (s: number, i: any) => s + i.price * i.quantity, 0,
    )
    expect(Math.round(rawSumFloat * 100)).toBe(valueCents)
    // Every item should have a discount field (coupon was applied)
    ;(ecom.items as any[]).forEach((i: any) => {
      expect(i.discount).toBeGreaterThan(0)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Phase 43 — Sub-cent price invariant (indivisible lineRevenueCents)
  // ══════════════════════════════════════════════════════════════════════════════
  //
  // When lineRevenueCents % quantity ≠ 0, there is no two-decimal per-unit price
  // that represents the true per-unit share.  buildPurchaseItems emits a sub-cent
  // float — the only representation that keeps Σ(price×qty) = lineRevenueCents/100.
  //
  // Invariant (Check B'): Math.round(Σ(price × qty) × 100) === valueCents
  //   PASSES for ALL cases including indivisible (0/10000 failures in stress test).
  //
  // Wrong formula (Check A): Σ(Math.round(price×100) × qty) === valueCents
  //   FAILS for ~54% of Longevia multi-unit lines with proportional coupons.
  // ──────────────────────────────────────────────────────────────────────────────
  describe('Phase 43 — Sub-cent (indivisible lineRevenueCents)', () => {
    // ── TC1: 3 units, $100 line revenue — sub-cent price ────────────────────────
    // lineRevCents = 10000, qty = 3, 10000 % 3 ≠ 0
    // price = 10000 / 3 / 100 = 33.333...
    // Check A: Math.round(33.333...×100)×3 = 3333×3 = 9999 ≠ 10000  → FAILS
    // Check B': Math.round(33.333...×3×100) = Math.round(100.0×100) = 10000 → PASSES
    it("TC1: 3 units — coupon allocation creates indivisible lineRevCents → sub-cent price", () => {
      // 2-item order, $0.10 coupon.
      // Item 0: qty=3, linePriceCents=3000
      //   lineDiscountCents = Math.round(3000/4000 * 10) = Math.round(7.5) = 8
      //   lineRevCents = 3000 - 8 = 2992; 2992 % 3 = 1 → indivisible
      //   price = 2992/3/100 = 9.97333... (sub-cent float, cannot be 2dp)
      // Check A: Math.round(9.973...*100)*3 = 997*3 = 2991 ≠ 2992 → FAILS
      // Check B': Math.round(9.973...*3*100) = Math.round(2992) = 2992 → PASSES
      const items = buildPurchaseItems(
        [
          { id: 'tc1a', name: 'TC1 Item A', quantity: 3, price: 10.00 },
          { id: 'tc1b', name: 'TC1 Item B', quantity: 1, price: 10.00 },
        ],
        40.00,
        0.10,
      )
      const item = items[0]
      expect(item.quantity).toBe(3)
      // price must be sub-cent — not equal to its own 2dp-rounded form
      expect(item.price).not.toBe(Math.round(item.price * 100) / 100)
      assertInvariant(items as EcomItem[], 39.90)
    })

    // ── TC2: 6 units, $50.01 line revenue — indivisible ─────────────────────────
    // lineRevCents = 5001, qty = 6, 5001 % 6 = 3 (not divisible)
    // price = 5001 / 6 / 100 = 8.335
    // Check A: Math.round(8.335×100)×6 = 834×6 = 5004 ≠ 5001 → FAILS
    // Check B': Math.round(8.335×6×100) = Math.round(5001×10^-2×100) → PASSES
    it('TC2: 6 units — coupon allocation creates indivisible lineRevCents → sub-cent price', () => {
      // 2-item order, $0.10 coupon.
      // Item 0: qty=6, linePriceCents=6000
      //   lineDiscountCents = Math.round(6000/7000 * 10) = Math.round(8.5714) = 9
      //   lineRevCents = 6000 - 9 = 5991; 5991 % 6 = 3 → indivisible
      //   price = 5991/6/100 = 9.985 (3dp, cannot be 2dp)
      // Check A: Math.round(9.985*100)*6 = Math.round(998.5)*6 = 999*6 = 5994 ≠ 5991 → FAILS
      // Check B': Math.round(9.985*6*100) = Math.round(5991) = 5991 → PASSES
      const items = buildPurchaseItems(
        [
          { id: 'tc2a', name: 'TC2 Item A', quantity: 6, price: 10.00 },
          { id: 'tc2b', name: 'TC2 Item B', quantity: 1, price: 10.00 },
        ],
        70.00,
        0.10,
      )
      const item = items[0]
      expect(item.quantity).toBe(6)
      // price must be sub-cent — not equal to its own 2dp-rounded form
      expect(item.price).not.toBe(Math.round(item.price * 100) / 100)
      assertInvariant(items as EcomItem[], 69.90)
    })

    // ── TC3: Real Longevia scenario — Glutathione 5g × 2 + $10 coupon ──────────
    // Glutathione 5g list price = $133.50/unit
    // subtotal = $133.50 × 2 = $267.00
    // coupon = $10.00 (couponCents = 1000)
    // Single item, so isLast = true → lineDiscountCents = 1000 (full coupon)
    // linePriceCents = Math.round(133.50×100) × 2 = 13350 × 2 = 26700
    // lineRevenueCents = 26700 − 1000 = 25700
    // qty = 2, 25700 % 2 = 0 → divisible (price = $128.50, whole cents)
    //
    // Phase 43 discovered: ~54% of Longevia multi-unit lines WITH multi-item orders
    // produce indivisible lineRevCents.  The single-item Glutathione case happens
    // to be divisible (25700 % 2 = 0).  See TC3b for the 2-item indivisible case.
    it('TC3: Glutathione×2 + $10 coupon — single-item order (divisible, price=$128.50)', () => {
      const items = buildPurchaseItems(
        [{ id: 'glut', name: 'Glutathione 5g', quantity: 2, price: 133.50 }],
        267.00,
        10.00,
      )
      const item = items[0]
      // lineRevCents = 26700 − 1000 = 25700; 25700 / 2 = 12850 → $128.50
      expect(item.price).toBeCloseTo(128.50, 2)
      expect(item.quantity).toBe(2)
      assertInvariant(items as EcomItem[], 257.00)
    })

    // ── TC3b: 2-item order with coupon → indivisible lineRevCents ───────────────
    // Glutathione 5g ($133.50) × 2  +  BPC-157 ($133.50) × 1  +  $10 coupon
    // subtotal = $133.50×2 + $133.50×1 = $400.50
    // Item 0 (Glutathione, not last):
    //   linePriceCents = 26700
    //   lineDiscountCents = Math.round((26700/40050) × 1000) = Math.round(666.666…) = 667
    //   lineRevCents = 26700 − 667 = 26033; 26033 % 2 = 1 → INDIVISIBLE
    //   price = 26033 / 2 / 100 = 130.165 (sub-cent)
    // Check A would give Math.round(130.165×100)×2 = 13017×2 = 26034 ≠ 26033 → FAILS
    // Check B': Math.round(130.165×2×100) = Math.round(26033) = 26033 → PASSES
    it('TC3b: 2-item order with coupon — item 0 gets indivisible lineRevCents (sub-cent price)', () => {
      const subtotal = 133.50 * 2 + 133.50  // = 400.50
      const coupon   = 10.00
      const items = buildPurchaseItems(
        [
          { id: 'glut', name: 'Glutathione 5g', quantity: 2, price: 133.50 },
          { id: 'bpc',  name: 'BPC-157 10mg',   quantity: 1, price: 133.50 },
        ],
        subtotal,
        coupon,
      )
      const glut = items[0]
      // lineRevCents = 26033; indivisible by 2 → price is a sub-cent float
      expect(glut.price).not.toBe(Math.round(glut.price * 100) / 100)  // not 2dp
      expect(glut.price).toBeCloseTo(130.165, 2)
      assertInvariant(items as EcomItem[], subtotal - coupon)
    })

    // ── TC4: High-quantity fractional-cent ────────────────────────────────────
    // 100 units × $1.00 each; no coupon → lineRevCents = 10000, divisible
    // 7 units × $1.00; no coupon → lineRevCents = 700, divisible
    // 7 units × $1.01 each, $0.03 coupon (3¢) → lineRevCents = 707−3=704, 704%7=11 → indivisible
    it('TC4: 7 units with $0.03 coupon — lineRevCents 704¢ indivisible by 7', () => {
      const subtotal = 7.07   // $1.01 × 7
      const coupon   = 0.03   // 3¢
      const items = buildPurchaseItems(
        [{ id: 'tc4', name: 'TC4 Product', quantity: 7, price: 1.01 }],
        subtotal,
        coupon,
      )
      const item = items[0]
      expect(item.quantity).toBe(7)
      // lineRevCents = 707 − 3 = 704; 704 / 7 = 100.571... → sub-cent
      expect(item.price).toBeCloseTo(1.00571, 4)
      assertInvariant(items as EcomItem[], subtotal - coupon)
    })

    // ── Stress test: 200 random multi-unit, multi-item orders ────────────────
    // Verifies Check B' never fails; confirms Check A failures are common.
    it("stress: Check B' passes for 200 random multi-unit orders (Check A would fail many)", () => {
      const prices   = [133.50, 149.00, 89.00, 75.00, 49.00, 33.00, 25.00]
      const coupons  = [0, 5, 10, 15, 20, 25, 30]
      const qtys     = [1, 2, 3, 4, 5, 6]
      let checkAFails = 0
      for (let i = 0; i < 200; i++) {
        const nItems = 1 + (i % 4)
        const rawItems = Array.from({ length: nItems }, (_, j) => ({
          id:       `prod${j}`,
          name:     `Product ${j}`,
          quantity: qtys[(i * (j + 1)) % qtys.length],
          price:    prices[(i + j * 3) % prices.length],
        }))
        const subtotal = rawItems.reduce((s, x) => s + x.price * x.quantity, 0)
        const coupon   = coupons[i % coupons.length]
        if (coupon > subtotal) continue
        const items    = buildPurchaseItems(rawItems, subtotal, coupon)
        const value    = subtotal - coupon
        const valueCents = Math.round(value * 100)
        // Check B' (correct invariant)
        const rawSum = items.reduce((s, x) => s + x.price * x.quantity, 0)
        expect(Math.round(rawSum * 100)).toBe(valueCents)
        // Track Check A failures (expected for indivisible cases)
        const checkACents = items.reduce((s, x) => s + Math.round(x.price * 100) * x.quantity, 0)
        if (checkACents !== valueCents) checkAFails++
      }
      // Check A must fail at least once in 200 iterations for the test to be meaningful
      expect(checkAFails).toBeGreaterThan(0)
    })
  })

})
