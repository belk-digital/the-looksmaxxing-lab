/**
 * Shipping: every order ships by Express Shipping ($20, 2-3 business days). This file is the single place that wording
 * and the fallback price live, so the checkout, the order pages and the emails always say the same thing.
 *
 * The shipping methods themselves are managed in the admin (Shipping Zones). The live zone currently holds exactly one
 * method, "Express Shipping" at $20.00 (2000 cents). The values here are used only
 *  - as the fallback when no shipping zone exists at all (a fresh database), and
 *  - for the wording shown to customers (the admin's "estimated days" is a single number, which cannot say "2-3").
 *
 * Pure code: no server or browser access.
 */

export const EXPRESS_SHIPPING_NAME = 'Express Shipping'
/** Price in cents, the way shipping zones store it. */
export const EXPRESS_SHIPPING_PRICE_CENTS = 2000
/** What customers are told wherever the delivery time is shown. */
export const EXPRESS_DELIVERY_TIME = '2-3 business days'

/** The single method a database with no shipping zone falls back to. */
export const FALLBACK_SHIPPING_METHODS: ReadonlyArray<{ method: string; price: number; estimatedDays: number }> = [
  { method: EXPRESS_SHIPPING_NAME, price: EXPRESS_SHIPPING_PRICE_CENTS, estimatedDays: 2 },
]

/** Is this the express method? Matches "Express Shipping", "express", "Express (2-3 days)"... in any letter case. */
export function isExpressShippingName(name: unknown): boolean {
  return typeof name === 'string' && name.toLowerCase().includes('express')
}

/**
 * The delivery time to show next to a shipping method, e.g. "2-3 business days", or null when there is nothing to say.
 * Express is always "2-3 business days" (the admin's single "estimated days" number cannot express a range, and it may
 * be empty). Any other method uses its estimated days as before ("5" on Standard Shipping reads "5-7").
 */
export function deliveryTimeLabel(method: { method?: unknown; estimatedDays?: unknown } | null | undefined): string | null {
  if (!method) return null
  if (isExpressShippingName(method.method)) return EXPRESS_DELIVERY_TIME
  const days = Number(method.estimatedDays)
  if (!Number.isFinite(days) || days <= 0) return null
  return `${days === 5 && method.method === 'Standard Shipping' ? '5-7' : days} business days`
}

/**
 * "2-3 Business Days" for the order confirmation page, from the shipping method name stored on the order.
 * Express (what every order uses now) reads 2-3; older orders placed with another method keep the 5-7 they always showed.
 */
export function estimatedDeliveryText(shippingMethodName: unknown): string {
  return isExpressShippingName(shippingMethodName) ? '2-3 Business Days' : '5-7 Business Days'
}
