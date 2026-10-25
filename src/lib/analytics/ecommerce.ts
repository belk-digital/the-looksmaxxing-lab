/**
 * GA4 ecommerce dataLayer helpers for Longevia Research.
 *
 * Every event is pushed through window.dataLayer → GTM → GA4.
 * The ecommerce object is cleared before each push, as recommended by Google,
 * to prevent stale data from previous events bleeding into subsequent ones.
 *
 * Privacy guarantee:
 *   - No PII (names, emails, addresses, payment details) is sent in any payload.
 *   - item_id uses the product slug (URL-safe, non-sensitive).
 *   - transaction_id uses the Payload order number / order ID (non-sensitive).
 */

// Make TypeScript aware of the global dataLayer array.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { dataLayer: Record<string, unknown>[] }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

/** Safely push an ecommerce event to the dataLayer. No-op when not in a browser. */
function pushEcommerce(event: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  // GA4 best practice: clear the previous ecommerce object first.
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push(event)
}

// ─── Shared item type ─────────────────────────────────────────────────────────

/** A single line item in a GA4 ecommerce payload. */
export type EcomItem = {
  /** Non-sensitive stable identifier — prefer product slug. */
  item_id: string
  item_name: string
  /** Variant label, e.g. "5mg" or "10mg/10mg". */
  item_variant?: string
  /**
   * Actual per-unit price in USD after all applicable discounts (post-coupon, dollars not cents).
   * GA4 item revenue = price × quantity. GA4 does NOT auto-subtract `discount` from `price`,
   * so `price` must already reflect any coupon reduction before being sent.
   */
  price: number
  /**
   * Per-unit coupon discount allocated to this item (USD) — informational only.
   * Distributed proportionally by (priceSnapshot / subtotal) × couponDiscount, then divided by quantity.
   * Omitted when no coupon applies.
   * NOTE: GA4 does NOT subtract this from `price` automatically.
   */
  discount?: number
  quantity: number
}

// ─── view_item ────────────────────────────────────────────────────────────────

export type ViewItemParams = {
  currency?: string
  value: number
  items: [EcomItem, ...EcomItem[]]
}

/** Fire when a product detail page is viewed. Call once on mount. */
export function pushViewItem(params: ViewItemParams): void {
  pushEcommerce({
    event: 'view_item',
    ecommerce: { currency: params.currency ?? 'USD', value: params.value, items: params.items },
  })
}

// ─── add_to_cart ──────────────────────────────────────────────────────────────

export type AddToCartParams = {
  currency?: string
  value: number
  items: [EcomItem, ...EcomItem[]]
}

/** Fire once after a user-initiated add-to-cart succeeds. */
export function pushAddToCart(params: AddToCartParams): void {
  pushEcommerce({
    event: 'add_to_cart',
    ecommerce: { currency: params.currency ?? 'USD', value: params.value, items: params.items },
  })
}

// ─── remove_from_cart ─────────────────────────────────────────────────────────

export type RemoveFromCartParams = {
  currency?: string
  value: number
  items: [EcomItem, ...EcomItem[]]
}

/** Fire when a user explicitly removes an item. Do NOT fire during hydration. */
export function pushRemoveFromCart(params: RemoveFromCartParams): void {
  pushEcommerce({
    event: 'remove_from_cart',
    ecommerce: { currency: params.currency ?? 'USD', value: params.value, items: params.items },
  })
}

// ─── view_cart ────────────────────────────────────────────────────────────────

export type ViewCartParams = {
  currency?: string
  value: number
  items: EcomItem[]
}

/** Fire when the cart drawer/page is explicitly opened by the user. */
export function pushViewCart(params: ViewCartParams): void {
  pushEcommerce({
    event: 'view_cart',
    ecommerce: { currency: params.currency ?? 'USD', value: params.value, items: params.items },
  })
}

// ─── begin_checkout ───────────────────────────────────────────────────────────

export type BeginCheckoutParams = {
  currency?: string
  value: number
  coupon?: string
  items: [EcomItem, ...EcomItem[]]
}

/**
 * Fire when the user genuinely starts the checkout flow.
 * Guard with a useRef flag to prevent Strict Mode / rerender duplicates.
 */
export function pushBeginCheckout(params: BeginCheckoutParams): void {
  pushEcommerce({
    event: 'begin_checkout',
    ecommerce: {
      currency: params.currency ?? 'USD',
      value: params.value,
      ...(params.coupon ? { coupon: params.coupon } : {}),
      items: params.items,
    },
  })
}

// ─── purchase ─────────────────────────────────────────────────────────────────

export type PurchaseParams = {
  transaction_id: string
  currency?: string
  value: number
  shipping?: number
  /**
   * Statutory tax (USD). Set to 0 — Longevia currently collects no sales tax.
   * Do NOT pass a processing surcharge here; use `processing_fee` instead.
   */
  tax?: number
  /**
   * Processing / handling surcharge (USD). Reported as a custom event parameter
   * at the GTM dataLayer level (not inside the GA4 `ecommerce` object).
   * This is NOT a statutory tax and must not be mapped to `tax`.
   */
  processing_fee?: number
  coupon?: string
  items: [EcomItem, ...EcomItem[]]
}

/**
 * Fire once after payment is confirmed and the order is finalized.
 * Must be guarded by claimPurchaseEvent() to prevent duplicates on page revisit.
 */
export function pushPurchase(params: PurchaseParams): void {
  pushEcommerce({
    event: 'purchase',
    // processing_fee is a custom event parameter — it is a handling surcharge,
    // not statutory tax, and lives at the event level for GTM custom variable mapping.
    ...(params.processing_fee !== undefined ? { processing_fee: params.processing_fee } : {}),
    ecommerce: {
      transaction_id: params.transaction_id,
      currency: params.currency ?? 'USD',
      value: params.value,
      shipping: params.shipping ?? 0,
      tax: params.tax ?? 0,
      ...(params.coupon ? { coupon: params.coupon } : {}),
      items: params.items,
    },
  })
}

// ─── Deduplication helper ─────────────────────────────────────────────────────

const PURCHASE_KEY_PREFIX = 'lv_ecom_p_'

/**
 * Returns true (and records the claim) if this is the first time a purchase
 * event is being fired for this order in this browser. Returns false if already fired.
 *
 * Uses localStorage so the guard survives page refreshes and tab closes.
 * Falls back to true (fire the event) if localStorage is unavailable.
 */
export function claimPurchaseEvent(orderId: string): boolean {
  try {
    const key = PURCHASE_KEY_PREFIX + orderId
    if (localStorage.getItem(key)) return false
    localStorage.setItem(key, '1')
    return true
  } catch {
    return true // fail open
  }
}

// ─── Purchase item builder ─────────────────────────────────────────────────────

/**
 * Builds a GA4-ready items array with correct revenue reconciliation.
 *
 * **Phase 43 invariant**: Math.round(Σ(items[].price × items[].quantity) × 100) === valueCents.
 *
 * The Phase 41 approach rounded `perUnitDiscount` to 2dp per item.  For orders
 * where `(item.price / subtotal) × coupon` is not a whole cent, those per-item
 * rounding errors accumulate and can cause Σ(price × qty) to diverge from
 * `value` by up to (n−1) × $0.005, where n is the item count (proved: 3-item
 * equal-price order with $10 coupon drifts +$0.01).
 *
 * Fix: allocate the coupon at the **line level** in integer cents (proportional
 * by extended line price), with the last line absorbing any remainder cent.
 * This guarantees Σ(lineRevenueCents) = valueCents by construction.
 *
 * **Sub-cent per-unit prices**: when lineRevenueCents is not divisible by quantity
 * (which occurs for ~54% of Longevia multi-unit lines with proportional coupons),
 * `price` will be a sub-cent float (e.g. $85.665 for 17133¢ ÷ 2 units).
 * GA4 receives and multiplies the full float: price × qty = lineRevenueCents / 100,
 * so `Math.round(rawSum × 100) === valueCents` is guaranteed.  A two-decimal-only
 * per-unit price is impossible without introducing intra-line drift in those cases.
 *
 * @param rawItems  Order line items; `price` is the pre-coupon per-unit priceSnapshot (dollars)
 * @param subtotal  Pre-coupon merchandise subtotal (dollars) = Σ(price × qty)
 * @param couponDiscount  Total coupon discount applied to the order (dollars); 0 if none
 */
export function buildPurchaseItems(
  rawItems: ReadonlyArray<{
    readonly id: string
    readonly name: string
    readonly variant?: string | null
    readonly quantity: number
    readonly price: number        // pre-coupon per-unit priceSnapshot (dollars)
    readonly productId?: string | null
  }>,
  subtotal: number,
  couponDiscount: number,
): EcomItem[] {
  if (rawItems.length === 0) return []

  const subtotalCents = Math.round(subtotal * 100)
  const couponCents   = Math.round(couponDiscount * 100)

  let allocatedCents = 0

  return rawItems.map((item, idx) => {
    const isLast = idx === rawItems.length - 1
    // Extended line price in integer cents
    const linePriceCents = Math.round(item.price * 100) * item.quantity

    // Line-level coupon allocation in integer cents.
    // Last line absorbs any remainder so Σ(lineDiscountCents) === couponCents exactly.
    let lineDiscountCents = 0
    if (couponCents > 0 && subtotalCents > 0) {
      if (isLast) {
        lineDiscountCents = couponCents - allocatedCents
      } else {
        lineDiscountCents = Math.round((linePriceCents / subtotalCents) * couponCents)
        allocatedCents += lineDiscountCents
      }
    }

    // Post-discount line revenue in integer cents → per-unit price.
    // price × quantity = lineRevenueCents / 100 exactly (integer arithmetic).
    const lineRevenueCents = linePriceCents - lineDiscountCents
    const postUnitPrice    = lineRevenueCents / item.quantity / 100

    // Per-unit discount (informational, nearest cent per unit)
    const perUnitDiscountCents =
      lineDiscountCents > 0 ? Math.round(lineDiscountCents / item.quantity) : 0

    return {
      item_id:   item.productId ?? item.id,
      item_name: item.name,
      ...(item.variant ? { item_variant: item.variant } : {}),
      price:     postUnitPrice,
      ...(perUnitDiscountCents > 0 ? { discount: perUnitDiscountCents / 100 } : {}),
      quantity:  item.quantity,
    }
  })
}
