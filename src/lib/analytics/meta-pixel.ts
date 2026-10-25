/**
 * Meta Pixel (Facebook Pixel) event helpers for Longevia Research.
 *
 * The base pixel script is injected in (frontend)/layout.tsx via Next.js <Script>.
 * All events are no-ops in SSR / when NEXT_PUBLIC_META_PIXEL_ID is not set.
 *
 * Privacy guarantee:
 *   - No PII (names, emails, addresses, payment details) is sent in any payload.
 *   - content_ids use product slugs (URL-safe, non-sensitive).
 *   - order IDs are non-sensitive internal identifiers.
 */

// Make TypeScript aware of the global fbq function injected by the base pixel script.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
  }
}

/** Safely call fbq. No-op when fbq is not loaded or not in a browser. */
function fbq(...args: Parameters<NonNullable<Window['fbq']>>): void {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  window.fbq(...args)
}

// ─── Standard events ──────────────────────────────────────────────────────────

/** Fire on product detail page mount (maps to GA4 view_item). */
export function trackViewContent(params: {
  value: number
  currency?: string
  content_ids: string[]
  content_name?: string
  content_type?: string
}): void {
  fbq('track', 'ViewContent', {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type ?? 'product',
  })
}

/** Fire when a user adds a product to cart (maps to GA4 add_to_cart). */
export function trackAddToCart(params: {
  value: number
  currency?: string
  content_ids: string[]
  content_name?: string
  content_type?: string
}): void {
  fbq('track', 'AddToCart', {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type ?? 'product',
  })
}

/** Fire when a user starts the checkout flow (maps to GA4 begin_checkout). */
export function trackInitiateCheckout(params: {
  value: number
  currency?: string
  content_ids: string[]
  num_items?: number
}): void {
  fbq('track', 'InitiateCheckout', {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    num_items: params.num_items,
  })
}

/** Fire on order confirmation page (maps to GA4 purchase). */
export function trackPurchase(params: {
  value: number
  currency?: string
  content_ids: string[]
  transaction_id?: string
  num_items?: number
}): void {
  fbq('track', 'Purchase', {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    transaction_id: params.transaction_id,
    num_items: params.num_items,
  })
}
