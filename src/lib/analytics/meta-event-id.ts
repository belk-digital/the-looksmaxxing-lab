/**
 * Event IDs shared by the browser pixel and the server-side Conversions API.
 *
 * Meta de-duplicates a pixel event and a server event when they carry the same
 * event name AND the same event ID, so both sides must derive the ID the same way.
 * This file has no browser or Node-only imports, so both can use it.
 */

/** Deterministic ID for a purchase: the same order always produces the same ID. */
export function purchaseEventId(orderNumberOrId: string): string {
  return `purchase_${orderNumberOrId}`
}

/** Random ID for one-off funnel events (ViewContent, AddToCart, InitiateCheckout). */
export function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through to the fallback below
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
