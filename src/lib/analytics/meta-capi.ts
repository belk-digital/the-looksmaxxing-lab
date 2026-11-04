/**
 * Meta Conversions API (server-side events) for Longevia Research.
 *
 * SERVER ONLY. This file reads META_CAPI_ACCESS_TOKEN and must never be imported
 * from a client component. The browser pixel (meta-pixel.ts) and this module send the
 * same events with the same event ID, and Meta de-duplicates them.
 *
 * Privacy:
 *   - Email, phone, name and address values are SHA-256 hashed after Meta's
 *     normalisation rules, and only on Purchase. Raw values are never sent.
 *   - client IP, user agent, _fbp and _fbc are sent as-is (Meta requires them unhashed).
 */

import { createHash } from 'node:crypto'

export const META_EVENT_NAMES = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'] as const
export type MetaEventName = (typeof META_EVENT_NAMES)[number]

export function isMetaEventName(value: unknown): value is MetaEventName {
  return typeof value === 'string' && (META_EVENT_NAMES as readonly string[]).includes(value)
}

// ─── Config ───────────────────────────────────────────────────────────────────

export type MetaConfig = {
  pixelId: string
  accessToken: string
  testEventCode?: string
  apiVersion: string
}

/** Returns null when the pixel ID or the token is missing, so every caller no-ops safely. */
export function getMetaConfig(): MetaConfig | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  if (!pixelId || !/^\d{5,20}$/.test(pixelId) || !accessToken) return null

  const version = process.env.META_GRAPH_API_VERSION?.trim()
  return {
    pixelId,
    accessToken,
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined,
    apiVersion: version && /^v\d+\.\d+$/.test(version) ? version : 'v23.0',
  }
}

// ─── Hashing and normalisation (Meta's customer-information rules) ────────────

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

export function normalizeEmail(v: unknown): string {
  return clean(v).toLowerCase()
}

/** Digits only, with the US country code added to bare 10-digit numbers. */
export function normalizePhone(v: unknown): string {
  const digits = clean(v).replace(/\D/g, '')
  if (digits.length === 10) return `1${digits}`
  return digits.length >= 8 && digits.length <= 15 ? digits : ''
}

export function normalizeName(v: unknown): string {
  return clean(v).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

export function normalizeCity(v: unknown): string {
  return clean(v).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export function normalizeState(v: unknown): string {
  return clean(v).toLowerCase().replace(/[^\p{L}]/gu, '')
}

/** US ZIP: first five digits. Anything else: lower-case, no spaces or dashes. */
export function normalizeZip(v: unknown): string {
  const raw = clean(v).toLowerCase().replace(/[\s-]/g, '')
  return /^\d{5}\d{4}$/.test(raw) ? raw.slice(0, 5) : raw
}

export function normalizeCountry(v: unknown): string {
  const raw = clean(v).toLowerCase()
  if (/^[a-z]{2}$/.test(raw)) return raw
  if (raw === 'usa' || raw === 'united states' || raw === 'united states of america') return 'us'
  return ''
}

export type MetaUserInput = {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

/** Hashed customer-information fields, each as a one-item array; empty fields are omitted. */
export function hashUserData(input: MetaUserInput): Record<string, string[]> {
  const fields: Array<[string, string]> = [
    ['em', normalizeEmail(input.email)],
    ['ph', normalizePhone(input.phone)],
    ['fn', normalizeName(input.firstName)],
    ['ln', normalizeName(input.lastName)],
    ['ct', normalizeCity(input.city)],
    ['st', normalizeState(input.state)],
    ['zp', normalizeZip(input.zip)],
    ['country', normalizeCountry(input.country)],
  ]
  const out: Record<string, string[]> = {}
  for (const [key, value] of fields) {
    if (value) out[key] = [sha256Hex(value)]
  }
  return out
}

// ─── Request context ──────────────────────────────────────────────────────────

export type MetaRequestContext = {
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
  url?: string
}

/** First address in x-forwarded-for, else x-real-ip. Returns undefined if it doesn't look like an IP. */
export function extractClientIp(headers: { get(name: string): string | null }): string | undefined {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const candidate = forwarded || headers.get('x-real-ip')?.trim() || ''
  return /^[0-9a-fA-F:.]{3,45}$/.test(candidate) ? candidate : undefined
}

const FB_COOKIE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_-]{1,200}$/

/** Keeps only well-formed _fbp / _fbc cookie values. */
export function validFbCookie(value: unknown): string | undefined {
  return typeof value === 'string' && FB_COOKIE.test(value) ? value : undefined
}

function validSourceUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 1000) return undefined
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined
  } catch {
    return undefined
  }
}

// ─── Custom data ──────────────────────────────────────────────────────────────

export type MetaCustomData = {
  value?: number
  currency?: string
  content_ids?: string[]
  content_name?: string
  content_type?: string
  num_items?: number
}

/**
 * Whitelists and bounds the custom_data a browser may supply for funnel events.
 * Anything unknown, oversized or malformed is dropped.
 */
export function sanitizeCustomData(raw: unknown): MetaCustomData {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const out: MetaCustomData = {}

  if (typeof r.value === 'number' && Number.isFinite(r.value) && r.value >= 0 && r.value <= 1_000_000) {
    out.value = Math.round(r.value * 100) / 100
    out.currency = typeof r.currency === 'string' && /^[A-Z]{3}$/.test(r.currency) ? r.currency : 'USD'
  }
  if (Array.isArray(r.content_ids)) {
    const ids = r.content_ids
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter((x) => x.length > 0 && x.length <= 100)
      .slice(0, 50)
    if (ids.length) out.content_ids = ids
  }
  if (typeof r.content_name === 'string' && r.content_name.trim()) {
    out.content_name = r.content_name.trim().slice(0, 200)
  }
  if (out.content_ids) {
    out.content_type = r.content_type === 'product_group' ? 'product_group' : 'product'
  }
  if (typeof r.num_items === 'number' && Number.isInteger(r.num_items) && r.num_items >= 1 && r.num_items <= 1000) {
    out.num_items = r.num_items
  }
  return out
}

// ─── Event building and sending ───────────────────────────────────────────────

export type MetaServerEvent = {
  event_name: MetaEventName
  event_time: number
  event_id: string
  event_source_url?: string
  action_source: 'website'
  user_data: Record<string, string | string[]>
  custom_data?: MetaCustomData
}

export function buildMetaEvent(args: {
  eventName: MetaEventName
  eventId: string
  ctx: MetaRequestContext
  user?: MetaUserInput
  custom?: MetaCustomData
  /** Unix seconds; defaults to now. */
  eventTime?: number
}): MetaServerEvent {
  const userData: Record<string, string | string[]> = args.user ? hashUserData(args.user) : {}
  if (args.ctx.ip) userData.client_ip_address = args.ctx.ip
  if (args.ctx.userAgent) userData.client_user_agent = args.ctx.userAgent.slice(0, 500)
  const fbp = validFbCookie(args.ctx.fbp)
  const fbc = validFbCookie(args.ctx.fbc)
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc

  const sourceUrl = validSourceUrl(args.ctx.url)
  return {
    event_name: args.eventName,
    event_time: args.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: args.eventId,
    ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
    action_source: 'website',
    user_data: userData,
    ...(args.custom && Object.keys(args.custom).length ? { custom_data: args.custom } : {}),
  }
}

export type MetaSendResult = {
  ok: boolean
  status?: number
  skipped?: 'not-configured' | 'no-user-data'
  /** From Meta's success response: how many events it accepted. */
  eventsReceived?: number
  /** Meta's trace id, useful when asking Meta support about a request. */
  fbtraceId?: string
  error?: string
}

/** Posts one event to the Conversions API. Never throws; failures come back in the result. */
export async function sendMetaEvent(
  event: MetaServerEvent,
  config: MetaConfig | null = getMetaConfig(),
): Promise<MetaSendResult> {
  if (!config) return { ok: false, skipped: 'not-configured' }
  if (Object.keys(event.user_data).length === 0) return { ok: false, skipped: 'no-user-data' }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`
  const body = {
    data: [event],
    access_token: config.accessToken,
    ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
  }
  const redact = (text: string) => text.split(config.accessToken).join('[redacted]').slice(0, 300)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, status: res.status, error: redact(text) }
    }
    const json = (await res.json().catch(() => null)) as { events_received?: number; fbtrace_id?: string } | null
    return { ok: true, status: res.status, eventsReceived: json?.events_received, fbtraceId: json?.fbtrace_id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? redact(`${e.name}: ${e.message}`) : 'unknown error' }
  } finally {
    clearTimeout(timer)
  }
}
