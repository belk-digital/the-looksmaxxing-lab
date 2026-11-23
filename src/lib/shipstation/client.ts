// Thin client for the ShipStation V1 API (https://ssapi.shipstation.com, HTTP Basic auth, 40 requests/min).
//
// V1 is used rather than V2 because its order endpoints are fully documented (upsert by orderKey, cancel,
// SHIP_NOTIFY webhook). V1 is marked deprecated by ShipStation with no removal date, so everything that talks
// to ShipStation lives in this folder; moving to V2 later means rewriting client.ts and the payload builder only.
//
// Security: the Basic-auth credentials are only ever sent to SHIPSTATION_HOST over https. Webhook bodies are not
// trusted; the receiver fetches the resource itself through this client, which refuses any other host.

export const SHIPSTATION_HOST = 'ssapi.shipstation.com'
const BASE_URL = `https://${SHIPSTATION_HOST}`

export class ShipStationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'ShipStationError'
  }
  /** A 4xx other than rate limiting means the request itself is wrong; retrying the same request cannot help. */
  get isPermanent(): boolean {
    return this.status >= 400 && this.status < 500 && this.status !== 429 && this.status !== 408
  }
}

export function isShipStationConfigured(): boolean {
  return !!(process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET)
}

function authHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY
  const secret = process.env.SHIPSTATION_API_SECRET
  if (!key || !secret) throw new ShipStationError('ShipStation credentials are not configured (SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET).', 0)
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64')
}

/**
 * Returns a normalised absolute URL, or throws if it is not an https ShipStation API URL. Used for both our own
 * paths and for resource_url values that arrive in webhooks (which an attacker could forge).
 */
export function assertShipStationUrl(pathOrUrl: string): URL {
  const url = pathOrUrl.startsWith('/') ? new URL(BASE_URL + pathOrUrl) : new URL(pathOrUrl)
  if (url.protocol !== 'https:' || url.hostname !== SHIPSTATION_HOST || url.port || url.username || url.password) {
    throw new ShipStationError(`Refusing to call a non-ShipStation URL (${url.hostname}).`, 0)
  }
  return url
}

export async function shipstationRequest<T = any>(
  pathOrUrl: string,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  const url = assertShipStationUrl(pathOrUrl)
  const method = init.method || 'GET'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 10_000)
  let res: Response
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: authHeader(),
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      redirect: 'error', // never follow a redirect with credentials attached
    })
  } catch (err: any) {
    throw new ShipStationError(`ShipStation ${method} ${url.pathname} failed: ${err?.name === 'AbortError' ? 'timed out' : err?.message || err}`, 0)
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  if (!res.ok) {
    const reset = Number(res.headers.get('x-rate-limit-reset'))
    throw new ShipStationError(
      `ShipStation ${method} ${url.pathname} returned ${res.status}: ${text.replace(/\s+/g, ' ').slice(0, 300)}`,
      res.status,
      Number.isFinite(reset) && reset > 0 ? reset : undefined,
    )
  }
  if (!text) return null as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ShipStationError(`ShipStation ${method} ${url.pathname} returned a non-JSON body.`, res.status)
  }
}
