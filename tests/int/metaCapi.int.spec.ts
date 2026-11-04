/**
 * Unit tests for the Meta Conversions API helpers and the browser pixel mirror.
 *
 * Pure tests: no database, no network. fetch is stubbed.
 *
 * What is tested:
 * - Customer details are normalised the way Meta requires, then SHA-256 hashed.
 * - Raw PII never appears in a built event.
 * - IP / user agent / _fbp / _fbc handling, and rejection of malformed cookies.
 * - Browser-supplied custom data is whitelisted and bounded.
 * - sendMetaEvent: URL, body, test code, skip rules, failure handling, token redaction.
 * - The browser pixel passes eventID to fbq and mirrors to /api/meta/event with the same ID.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHash } from 'node:crypto'
import {
  buildMetaEvent,
  extractClientIp,
  getMetaConfig,
  hashUserData,
  isMetaEventName,
  normalizeCountry,
  normalizePhone,
  normalizeZip,
  sanitizeCustomData,
  sendMetaEvent,
  type MetaConfig,
} from '../../src/lib/analytics/meta-capi'
import { purchaseEventId, newEventId } from '../../src/lib/analytics/meta-event-id'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

const CONFIG: MetaConfig = {
  pixelId: '1687642449588965',
  accessToken: 'TOKEN_SECRET_VALUE',
  apiVersion: 'v23.0',
}

const FBP = 'fb.1.1596403881668.1116446470'
const FBC = 'fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890'

describe('normalisation + hashing', () => {
  it('lower-cases and trims email before hashing', () => {
    expect(hashUserData({ email: '  Test@Example.COM ' }).em).toEqual([sha('test@example.com')])
  })

  it('reduces phone to digits and adds the US country code to 10-digit numbers', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('15551234567')
    expect(normalizePhone('+1 555 123 4567')).toBe('15551234567')
    expect(normalizePhone('12')).toBe('')
  })

  it('normalises names, city, state, zip and country', () => {
    const h = hashUserData({
      firstName: "  Mary-Jane ",
      lastName: "O'Brien",
      city: 'New York',
      state: 'NY',
      zip: '10001-1234',
      country: 'United States',
    })
    expect(h.fn).toEqual([sha('maryjane')])
    expect(h.ln).toEqual([sha('obrien')])
    expect(h.ct).toEqual([sha('newyork')])
    expect(h.st).toEqual([sha('ny')])
    expect(h.zp).toEqual([sha('10001')])
    expect(h.country).toEqual([sha('us')])
  })

  it('omits empty and unusable fields instead of hashing blanks', () => {
    const h = hashUserData({ email: '', phone: null, firstName: '   ', country: 'Narnia' })
    expect(h).toEqual({})
  })

  it('zip / country edge cases', () => {
    expect(normalizeZip('SW1A 1AA')).toBe('sw1a1aa')
    expect(normalizeCountry('us')).toBe('us')
    expect(normalizeCountry('USA')).toBe('us')
  })
})

describe('buildMetaEvent', () => {
  it('never contains raw PII, only hashes', () => {
    const event = buildMetaEvent({
      eventName: 'Purchase',
      eventId: 'purchase_1001',
      ctx: { ip: '203.0.113.7', userAgent: 'UA/1.0', fbp: FBP, fbc: FBC, url: 'https://longeviaresearch.com/order-confirmation/5' },
      user: { email: 'jane@example.com', phone: '5551234567', firstName: 'Jane', lastName: 'Doe', city: 'Austin', zip: '73301' },
      custom: { value: 100, currency: 'USD', content_ids: ['bpc-157'] },
    })
    const json = JSON.stringify(event)
    for (const raw of ['jane@example.com', '5551234567', 'Jane', 'Doe', 'Austin', '73301']) {
      expect(json).not.toContain(raw)
    }
    expect(event.user_data.em).toEqual([sha('jane@example.com')])
  })

  it('sends IP, user agent, fbp and fbc unhashed, and sets the standard fields', () => {
    const event = buildMetaEvent({
      eventName: 'AddToCart',
      eventId: 'abcdef12-evt',
      eventTime: 1793745534,
      ctx: { ip: '203.0.113.7', userAgent: 'UA/1.0', fbp: FBP, fbc: FBC, url: 'https://longeviaresearch.com/products/x' },
    })
    expect(event).toMatchObject({
      event_name: 'AddToCart',
      event_id: 'abcdef12-evt',
      event_time: 1793745534,
      action_source: 'website',
      event_source_url: 'https://longeviaresearch.com/products/x',
      user_data: { client_ip_address: '203.0.113.7', client_user_agent: 'UA/1.0', fbp: FBP, fbc: FBC },
    })
  })

  it('drops malformed fbp/fbc and non-http source URLs', () => {
    const event = buildMetaEvent({
      eventName: 'ViewContent',
      eventId: 'abcdef12-evt',
      ctx: { userAgent: 'UA', fbp: 'not-a-cookie', fbc: '<script>', url: 'javascript:alert(1)' },
    })
    expect(event.user_data.fbp).toBeUndefined()
    expect(event.user_data.fbc).toBeUndefined()
    expect(event.event_source_url).toBeUndefined()
  })

  it('omits custom_data when empty', () => {
    const event = buildMetaEvent({ eventName: 'ViewContent', eventId: 'abcdef12-evt', ctx: { userAgent: 'UA' }, custom: {} })
    expect(event.custom_data).toBeUndefined()
  })
})

describe('extractClientIp', () => {
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null })

  it('takes the first x-forwarded-for address', () => {
    expect(extractClientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
  })
  it('falls back to x-real-ip and accepts IPv6', () => {
    expect(extractClientIp(headers({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8::1')
  })
  it('rejects junk', () => {
    expect(extractClientIp(headers({ 'x-forwarded-for': 'drop table;' }))).toBeUndefined()
    expect(extractClientIp(headers({}))).toBeUndefined()
  })
})

describe('sanitizeCustomData', () => {
  it('keeps valid fields', () => {
    expect(
      sanitizeCustomData({ value: 49.999, currency: 'USD', content_ids: ['a', 'b'], content_name: 'BPC-157', num_items: 2 }),
    ).toEqual({ value: 50, currency: 'USD', content_ids: ['a', 'b'], content_type: 'product', content_name: 'BPC-157', num_items: 2 })
  })

  it('drops unknown keys, negative or absurd values, and non-string ids', () => {
    const out = sanitizeCustomData({ value: -5, evil: 'x', content_ids: [1, null, '  ', 'ok'], num_items: 1.5 })
    expect(out).toEqual({ content_ids: ['ok'], content_type: 'product' })
    expect(sanitizeCustomData({ value: 1e12 })).toEqual({})
  })

  it('caps list length and string length', () => {
    const out = sanitizeCustomData({ content_ids: Array.from({ length: 80 }, (_, i) => `id${i}`), content_name: 'x'.repeat(500) })
    expect(out.content_ids).toHaveLength(50)
    expect(out.content_name).toHaveLength(200)
  })

  it('tolerates garbage input', () => {
    expect(sanitizeCustomData(null)).toEqual({})
    expect(sanitizeCustomData('str')).toEqual({})
    expect(sanitizeCustomData(undefined)).toEqual({})
  })
})

describe('isMetaEventName + event ids', () => {
  it('only allows the four tracked events', () => {
    expect(isMetaEventName('Purchase')).toBe(true)
    expect(isMetaEventName('PageView')).toBe(false)
    expect(isMetaEventName(42)).toBe(false)
  })
  it('purchase ids are deterministic, random ids are unique', () => {
    expect(purchaseEventId('1001')).toBe('purchase_1001')
    expect(newEventId()).not.toBe(newEventId())
    expect(newEventId()).toMatch(/^[\w.:-]{8,100}$/)
  })
})

describe('getMetaConfig', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('is null unless both the pixel id and the token are set', () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    delete process.env.META_CAPI_ACCESS_TOKEN
    expect(getMetaConfig()).toBeNull()
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1687642449588965'
    expect(getMetaConfig()).toBeNull()
    process.env.META_CAPI_ACCESS_TOKEN = 'tok'
    expect(getMetaConfig()).toMatchObject({ pixelId: '1687642449588965', accessToken: 'tok', apiVersion: 'v23.0' })
  })

  it('rejects a non-numeric pixel id and a malformed api version', () => {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = 'abc'
    process.env.META_CAPI_ACCESS_TOKEN = 'tok'
    expect(getMetaConfig()).toBeNull()
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1687642449588965'
    process.env.META_GRAPH_API_VERSION = '../evil'
    expect(getMetaConfig()?.apiVersion).toBe('v23.0')
  })
})

describe('sendMetaEvent', () => {
  const event = buildMetaEvent({ eventName: 'ViewContent', eventId: 'abcdef12-evt', ctx: { userAgent: 'UA/1.0' } })
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts to the dataset events endpoint with the token in the body, not the URL', async () => {
    fetchMock.mockResolvedValue(new Response('{"events_received":1,"fbtrace_id":"abc"}', { status: 200 }))
    const result = await sendMetaEvent(event, CONFIG)
    expect(result).toEqual({ ok: true, status: 200, eventsReceived: 1, fbtraceId: 'abc' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://graph.facebook.com/v23.0/1687642449588965/events')
    expect(url).not.toContain('TOKEN_SECRET_VALUE')
    const sent = JSON.parse(init.body)
    expect(sent.access_token).toBe('TOKEN_SECRET_VALUE')
    expect(sent.data).toHaveLength(1)
    expect(sent.data[0].event_id).toBe('abcdef12-evt')
    expect(sent.test_event_code).toBeUndefined()
  })

  it('includes the test event code when configured', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await sendMetaEvent(event, { ...CONFIG, testEventCode: 'TEST123' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).test_event_code).toBe('TEST123')
  })

  it('skips without calling Meta when not configured or when there is nothing to match on', async () => {
    expect(await sendMetaEvent(event, null)).toEqual({ ok: false, skipped: 'not-configured' })
    const empty = buildMetaEvent({ eventName: 'ViewContent', eventId: 'abcdef12-evt', ctx: {} })
    expect(await sendMetaEvent(empty, CONFIG)).toEqual({ ok: false, skipped: 'no-user-data' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns failures instead of throwing, with the token redacted', async () => {
    fetchMock.mockResolvedValue(new Response('{"error":"bad TOKEN_SECRET_VALUE"}', { status: 400 }))
    const bad = await sendMetaEvent(event, CONFIG)
    expect(bad.ok).toBe(false)
    expect(bad.status).toBe(400)
    expect(bad.error).not.toContain('TOKEN_SECRET_VALUE')

    fetchMock.mockRejectedValue(new Error('network down TOKEN_SECRET_VALUE'))
    const down = await sendMetaEvent(event, CONFIG)
    expect(down.ok).toBe(false)
    expect(down.error).not.toContain('TOKEN_SECRET_VALUE')
  })
})

describe('browser pixel mirror', () => {
  const fbqMock = vi.fn()
  const fetchMock = vi.fn()
  const savedPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID

  beforeEach(() => {
    fbqMock.mockReset()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    ;(window as any).fbq = fbqMock
    vi.stubGlobal('fetch', fetchMock)
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1687642449588965'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (window as any).fbq
    if (savedPixel === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = savedPixel
  })

  it('AddToCart: the pixel and the server mirror share one event id', async () => {
    const { trackAddToCart } = await import('../../src/lib/analytics/meta-pixel')
    trackAddToCart({ value: 40, content_ids: ['bpc-157'], content_name: 'BPC-157' })

    const [, name, data, opts] = fbqMock.mock.calls[0]
    expect(name).toBe('AddToCart')
    expect(data).toMatchObject({ value: 40, currency: 'USD', content_ids: ['bpc-157'], content_type: 'product' })
    expect(opts.eventID).toMatch(/^[\w.:-]{8,100}$/)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/meta/event')
    expect(init.keepalive).toBe(true)
    const sent = JSON.parse(init.body)
    expect(sent).toMatchObject({ event: 'AddToCart', eventId: opts.eventID })
    expect(sent.url).toContain('http')
  })

  it('Purchase: deterministic event id, and the server call carries only the order reference', async () => {
    const { trackPurchase } = await import('../../src/lib/analytics/meta-pixel')
    trackPurchase({ value: 100, content_ids: ['a'], transaction_id: '1001', num_items: 2, orderRef: '57' })

    expect(fbqMock.mock.calls[0][1]).toBe('Purchase')
    expect(fbqMock.mock.calls[0][3]).toEqual({ eventID: 'purchase_1001' })
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toMatchObject({ event: 'Purchase', eventId: 'purchase_1001', orderRef: '57' })
    // value / products / customer details are NOT trusted from the browser for Purchase
    expect(sent.custom).toBeUndefined()
    expect(JSON.stringify(sent)).not.toContain('"value"')
  })

  it('Purchase without an order reference only fires the pixel', async () => {
    const { trackPurchase } = await import('../../src/lib/analytics/meta-pixel')
    trackPurchase({ value: 100, content_ids: ['a'], transaction_id: '1001' })
    expect(fbqMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call the server when the pixel is not configured, and never throws', async () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    const { trackViewContent } = await import('../../src/lib/analytics/meta-pixel')
    expect(() => trackViewContent({ value: 1, content_ids: ['a'] })).not.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a failing server call does not throw into the page', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    const { trackInitiateCheckout } = await import('../../src/lib/analytics/meta-pixel')
    expect(() => trackInitiateCheckout({ value: 5, content_ids: ['a'], num_items: 1 })).not.toThrow()
    await Promise.resolve()
  })
})
