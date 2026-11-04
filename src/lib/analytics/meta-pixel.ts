/**
 * Meta Pixel (Facebook Pixel) event helpers for Longevia Research.
 *
 * The base pixel script is injected in (frontend)/layout.tsx via Next.js <Script>.
 * All events are no-ops in SSR / when NEXT_PUBLIC_META_PIXEL_ID is not set.
 *
 * Every event is sent twice, on purpose:
 *   1. by the browser pixel (fbq), and
 *   2. by our own server through the Conversions API (POST /api/meta/event),
 *      which survives ad blockers and iOS tracking limits.
 * Both carry the same event ID so Meta counts each event once.
 *
 * Privacy guarantee:
 *   - No PII (names, emails, addresses, payment details) is sent from the browser.
 *     On Purchase only, the server adds SHA-256-hashed customer details (see meta-capi.ts).
 *   - content_ids use product slugs (URL-safe, non-sensitive).
 *   - order IDs are non-sensitive internal identifiers.
 */

import { newEventId, purchaseEventId } from './meta-event-id'

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

/**
 * Mirrors an event to our server for the Conversions API. Fire-and-forget: it never
 * throws and never blocks the page. Skipped entirely when the pixel isn't configured.
 */
function sendToServer(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return
  try {
    void fetch('/api/meta/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, url: window.location.href }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // tracking must never break the page
  }
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
  const data = {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type ?? 'product',
  }
  const eventId = newEventId()
  fbq('track', 'ViewContent', data, { eventID: eventId })
  sendToServer({ event: 'ViewContent', eventId, custom: data })
}

/** Fire when a user adds a product to cart (maps to GA4 add_to_cart). */
export function trackAddToCart(params: {
  value: number
  currency?: string
  content_ids: string[]
  content_name?: string
  content_type?: string
}): void {
  const data = {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type ?? 'product',
  }
  const eventId = newEventId()
  fbq('track', 'AddToCart', data, { eventID: eventId })
  sendToServer({ event: 'AddToCart', eventId, custom: data })
}

/** Fire when a user starts the checkout flow (maps to GA4 begin_checkout). */
export function trackInitiateCheckout(params: {
  value: number
  currency?: string
  content_ids: string[]
  num_items?: number
}): void {
  const data = {
    value: params.value,
    currency: params.currency ?? 'USD',
    content_ids: params.content_ids,
    content_type: 'product',
    num_items: params.num_items,
  }
  const eventId = newEventId()
  fbq('track', 'InitiateCheckout', data, { eventID: eventId })
  sendToServer({ event: 'InitiateCheckout', eventId, custom: data })
}

/**
 * Fire on order confirmation page (maps to GA4 purchase).
 * `orderRef` is the confirmation-page URL id: the server uses it (plus the order cookie)
 * to rebuild the purchase from the order itself.
 */
export function trackPurchase(params: {
  value: number
  currency?: string
  content_ids: string[]
  transaction_id?: string
  num_items?: number
  orderRef?: string
}): void {
  // Same ID the server derives from the order, so Meta de-duplicates the pair.
  const eventId = params.transaction_id ? purchaseEventId(params.transaction_id) : newEventId()
  fbq(
    'track',
    'Purchase',
    {
      value: params.value,
      currency: params.currency ?? 'USD',
      content_ids: params.content_ids,
      content_type: 'product',
      transaction_id: params.transaction_id,
      num_items: params.num_items,
    },
    { eventID: eventId },
  )
  if (params.orderRef) sendToServer({ event: 'Purchase', eventId, orderRef: params.orderRef })
}
