import { cookies } from 'next/headers'
import {
  buildMetaEvent,
  extractClientIp,
  getMetaConfig,
  isMetaEventName,
  sanitizeCustomData,
  sendMetaEvent,
  type MetaCustomData,
  type MetaUserInput,
} from '@/lib/analytics/meta-capi'
import { loadMetaPurchase } from '@/lib/analytics/meta-purchase'

// Never cache: every call is a one-off event.
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 8 * 1024
const EVENT_ID = /^[\w.:-]{8,100}$/

const noContent = () => new Response(null, { status: 204 })

/**
 * First-party endpoint the browser calls right after it fires the pixel, so Meta also
 * hears about the event from our server (immune to ad blockers and iOS tracking limits).
 * The browser and server events share one event ID, so Meta counts them once.
 */
export async function POST(request: Request) {
  try {
    // Do nothing unless both the pixel ID and the server token are configured.
    const config = getMetaConfig()
    if (!config) return noContent()

    // Same-origin only: another website can't use our endpoint to push events.
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin) {
      let originHost = ''
      try {
        originHost = new URL(origin).host
      } catch {
        // malformed origin: treated as a mismatch below
      }
      if (!host || originHost !== host) return new Response(null, { status: 403 })
    }

    const declaredLength = Number(request.headers.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) return new Response(null, { status: 413 })
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 })

    let body: Record<string, unknown>
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return new Response(null, { status: 400 })
      body = parsed as Record<string, unknown>
    } catch {
      return new Response(null, { status: 400 })
    }

    if (!isMetaEventName(body.event)) return new Response(null, { status: 400 })
    const eventName = body.event

    const cookieStore = await cookies()
    let eventId = typeof body.eventId === 'string' ? body.eventId : ''
    let custom: MetaCustomData
    let user: MetaUserInput | undefined

    if (eventName === 'Purchase') {
      // Purchases are rebuilt from the order itself; nothing but the order reference is trusted.
      const orderRef = typeof body.orderRef === 'string' ? body.orderRef : ''
      const purchase = orderRef
        ? await loadMetaPurchase(orderRef, cookieStore.get(`order_auth_${orderRef}`)?.value)
        : null
      if (!purchase) return noContent()
      eventId = purchase.eventId
      custom = purchase.custom
      user = purchase.user
    } else {
      if (!EVENT_ID.test(eventId)) return new Response(null, { status: 400 })
      custom = sanitizeCustomData(body.custom)
    }

    const event = buildMetaEvent({
      eventName,
      eventId,
      custom,
      user,
      ctx: {
        ip: extractClientIp(request.headers),
        userAgent: request.headers.get('user-agent') || undefined,
        fbp: cookieStore.get('_fbp')?.value,
        fbc: cookieStore.get('_fbc')?.value,
        url: typeof body.url === 'string' ? body.url : request.headers.get('referer') || undefined,
      },
    })

    const result = await sendMetaEvent(event, config)
    if (!result.ok && !result.skipped) {
      // Visible in Vercel runtime logs. The token is redacted inside sendMetaEvent.
      console.error('[meta-capi] send failed', eventName, result.status ?? '', result.error ?? '')
    }
    return noContent()
  } catch (error) {
    // Tracking must never break the shop.
    console.error('[meta-capi] route error', error instanceof Error ? error.message : error)
    return noContent()
  }
}
