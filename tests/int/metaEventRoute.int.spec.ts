// @vitest-environment node
/**
 * Tests for POST /api/meta/event (the server side of the Conversions API).
 *
 * No database and no network: next/headers cookies, the order loader and fetch are mocked.
 *
 * What is tested:
 * - Does nothing (204) unless the pixel id and token are configured.
 * - Rejects cross-origin callers, bad JSON, unknown events, bad event ids, oversized bodies.
 * - Funnel events: forwards IP / user agent / _fbp with sanitised custom data and the client's event id.
 * - Purchase: rebuilt from the order, never from browser-supplied values; raw PII never leaves.
 * - A Meta outage or an unverifiable order never breaks the shop (always 204).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHash } from 'node:crypto'

const { cookieJar, loadMock } = vi.hoisted(() => ({
  cookieJar: {} as Record<string, string>,
  loadMock: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined),
  }),
}))
vi.mock('@/lib/analytics/meta-purchase', () => ({ loadMetaPurchase: loadMock }))

const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const FBP = 'fb.1.1596403881668.1116446470'

const fetchMock = vi.fn()
const savedEnv = { ...process.env }

function makeRequest(body: unknown, headers: Record<string, string> = {}, rawBody?: string) {
  return new Request('https://longeviaresearch.com/api/meta/event', {
    method: 'POST',
    headers: {
      host: 'longeviaresearch.com',
      origin: 'https://longeviaresearch.com',
      'content-type': 'application/json',
      'user-agent': 'TestAgent/1.0',
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      ...headers,
    },
    body: rawBody ?? JSON.stringify(body),
  })
}

async function callRoute(body: unknown, headers?: Record<string, string>, rawBody?: string) {
  const { POST } = await import('../../src/app/(frontend)/api/meta/event/route')
  return POST(makeRequest(body, headers, rawBody))
}

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body)

beforeEach(() => {
  for (const k of Object.keys(cookieJar)) Reflect.deleteProperty(cookieJar, k)
  fetchMock.mockReset()
  loadMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{"events_received":1,"fbtrace_id":"t"}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  process.env.NEXT_PUBLIC_META_PIXEL_ID = '1687642449588965'
  process.env.META_CAPI_ACCESS_TOKEN = 'TOKEN_SECRET_VALUE'
  delete process.env.META_CAPI_TEST_EVENT_CODE
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  process.env = { ...savedEnv }
})

describe('POST /api/meta/event: guards', () => {
  it('does nothing when Meta is not configured', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN
    const res = await callRoute({ event: 'ViewContent', eventId: 'abcdef12-evt' })
    expect(res.status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects another website calling the endpoint', async () => {
    const res = await callRoute({ event: 'ViewContent', eventId: 'abcdef12-evt' }, { origin: 'https://evil.example' })
    expect(res.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects bad JSON, unknown events and bad event ids', async () => {
    expect((await callRoute(null, undefined, '{not json')).status).toBe(400)
    expect((await callRoute({ event: 'PageView', eventId: 'abcdef12-evt' })).status).toBe(400)
    expect((await callRoute({ event: 'ViewContent', eventId: 'x' })).status).toBe(400)
    expect((await callRoute({ event: 'ViewContent', eventId: '<script>alert(1)</script>' })).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects oversized bodies', async () => {
    const res = await callRoute({ event: 'ViewContent', eventId: 'abcdef12-evt', pad: 'x'.repeat(10_000) })
    expect(res.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/meta/event: funnel events', () => {
  it('forwards the visitor context and sanitised custom data under the client event id', async () => {
    cookieJar._fbp = FBP
    const res = await callRoute({
      event: 'AddToCart',
      eventId: 'abcdef12-evt',
      url: 'https://longeviaresearch.com/products/bpc-157',
      custom: { value: 40, currency: 'USD', content_ids: ['bpc-157'], content_name: 'BPC-157', evil: 'x' },
    })
    expect(res.status).toBe(204)

    const sent = sentBody()
    expect(sent.access_token).toBe('TOKEN_SECRET_VALUE')
    const ev = sent.data[0]
    expect(ev).toMatchObject({
      event_name: 'AddToCart',
      event_id: 'abcdef12-evt',
      action_source: 'website',
      event_source_url: 'https://longeviaresearch.com/products/bpc-157',
      user_data: { client_ip_address: '203.0.113.7', client_user_agent: 'TestAgent/1.0', fbp: FBP },
      custom_data: { value: 40, currency: 'USD', content_ids: ['bpc-157'], content_type: 'product', content_name: 'BPC-157' },
    })
    expect(ev.custom_data.evil).toBeUndefined()
    // funnel events carry no hashed customer details
    expect(ev.user_data.em).toBeUndefined()
  })

  it('includes the test event code when set', async () => {
    process.env.META_CAPI_TEST_EVENT_CODE = 'TEST123'
    await callRoute({ event: 'ViewContent', eventId: 'abcdef12-evt' })
    expect(sentBody().test_event_code).toBe('TEST123')
  })
})

describe('POST /api/meta/event: Purchase', () => {
  const purchase = {
    eventId: 'purchase_1001',
    custom: { value: 120.5, currency: 'USD', content_ids: ['bpc-157', 'tb-500'], content_type: 'product', num_items: 3 },
    user: { email: 'Jane@Example.com', phone: '5551234567', firstName: 'Jane', lastName: 'Doe', city: 'Austin', state: 'TX', zip: '73301', country: 'US' },
  }

  it('rebuilds the purchase from the order and ignores browser-supplied values', async () => {
    cookieJar['order_auth_57'] = 'cookie-proof'
    loadMock.mockResolvedValue(purchase)

    const res = await callRoute({
      event: 'Purchase',
      eventId: 'attacker-chosen-id',
      orderRef: '57',
      custom: { value: 999999, content_ids: ['fake'] },
    })
    expect(res.status).toBe(204)
    expect(loadMock).toHaveBeenCalledWith('57', 'cookie-proof')

    const ev = sentBody().data[0]
    expect(ev.event_id).toBe('purchase_1001')
    expect(ev.custom_data).toMatchObject({ value: 120.5, content_ids: ['bpc-157', 'tb-500'], num_items: 3 })
    expect(ev.user_data.em).toEqual([sha('jane@example.com')])
    expect(ev.user_data.ph).toEqual([sha('15551234567')])
    expect(ev.user_data.country).toEqual([sha('us')])

    const json = JSON.stringify(sentBody().data)
    for (const raw of ['Jane', 'jane@example.com', '5551234567', 'Austin', '73301', '999999']) {
      expect(json).not.toContain(raw)
    }
  })

  it('sends nothing when the order cannot be verified as the caller\'s paid order', async () => {
    loadMock.mockResolvedValue(null)
    const res = await callRoute({ event: 'Purchase', eventId: 'abcdef12-evt', orderRef: '57' })
    expect(res.status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing when there is no order reference', async () => {
    const res = await callRoute({ event: 'Purchase', eventId: 'abcdef12-evt' })
    expect(res.status).toBe(204)
    expect(loadMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/meta/event: resilience', () => {
  it('still answers 204 when Meta returns an error, and logs it without the token', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":{"message":"bad TOKEN_SECRET_VALUE"}}', { status: 400 }))
    const res = await callRoute({ event: 'ViewContent', eventId: 'abcdef12-evt' })
    expect(res.status).toBe(204)
    const logged = JSON.stringify((console.error as any).mock.calls)
    expect(logged).toContain('send failed')
    expect(logged).not.toContain('TOKEN_SECRET_VALUE')
  })

  it('still answers 204 when the order lookup throws', async () => {
    loadMock.mockRejectedValue(new Error('db down'))
    const res = await callRoute({ event: 'Purchase', eventId: 'abcdef12-evt', orderRef: '57' })
    expect(res.status).toBe(204)
  })
})
