import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import type { APIRequestContext, Page } from '@playwright/test'

export const DB = process.env.LM_DB || 'lm_e2e'
export const PASSWORD = 'Passw0rd!xyz'
export const CRON_SECRET = 'local-cron-secret-0123456789abcdef'
export const WP = `http://127.0.0.1:${process.env.LM_WP_PORT || '54400'}`
const EMAIL_FILE = path.join(process.cwd(), '.local-test', 'emails.jsonl')
export const SHOTS = path.join(process.cwd(), '.local-test', 'e2e-shots')

export interface Mail { at: string; to?: string | string[]; bcc?: string | string[]; subject: string; html: string }

/** Every email the site "sent" during the run (captured to a file instead of being delivered). */
export function allEmails(): Mail[] {
  if (!fs.existsSync(EMAIL_FILE)) return []
  return fs
    .readFileSync(EMAIL_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
}
const toList = (v: unknown): string[] => (Array.isArray(v) ? v : v ? [String(v)] : []).map((x) => String(x))

export async function waitForEmail(match: { to?: string; subject: RegExp }, sinceCount = 0, timeoutMs = 45_000): Promise<Mail> {
  const start = Date.now()
  for (;;) {
    const found = allEmails().slice(sinceCount).find((m) => (!match.to || toList(m.to).includes(match.to)) && match.subject.test(m.subject))
    if (found) return found
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for email ${match.subject} to ${match.to}`)
    await new Promise((r) => setTimeout(r, 400))
  }
}
export const emailCount = () => allEmails().length

export async function sql<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const c = new Client({ host: '127.0.0.1', port: 54329, user: 'postgres', password: 'postgres', database: DB })
  await c.connect()
  try {
    return (await c.query(query, params)).rows as T[]
  } finally {
    await c.end()
  }
}

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 120_000 })
}

/** A logged-in admin API client (Payload REST), used to do what staff do in the admin panel. */
export async function adminApi(request: APIRequestContext) {
  const res = await request.post('/api/users/login', { data: { email: 'admin@e2e.test', password: PASSWORD } })
  if (!res.ok()) throw new Error('admin login failed: ' + (await res.text()))
  return {
    markOrderPaid: async (id: number | string) => {
      const r = await request.patch(`/api/orders/${id}`, { data: { status: 'paid', paymentStatus: 'captured' } })
      if (!r.ok()) throw new Error('mark paid failed: ' + (await r.text()))
    },
    /** Creates (or re-creates) a product the way staff do in the admin. */
    createProduct: async (data: Record<string, unknown>) => {
      await request.delete(`/api/products?where[slug][equals]=${encodeURIComponent(String(data.slug))}`)
      const r = await request.post('/api/products', { data })
      if (!r.ok()) throw new Error('create product failed: ' + (await r.text()))
      return (await r.json()).doc
    },
    /** Sets a product's stock the way staff do (through the admin), so the site also refreshes its cached product page. */
    setStock: async (id: number | string, stock: number) => {
      const r = await request.patch(`/api/products/${id}`, { data: { stock } })
      if (!r.ok()) throw new Error('set stock failed: ' + (await r.text()))
    },
    /** Re-creates coupons from scratch (so a re-run starts clean). */
    replaceCoupons: async (coupons: Record<string, unknown>[]) => {
      for (const c of coupons) {
        await request.delete(`/api/coupons?where[code][equals]=${encodeURIComponent(String(c.code))}`)
        const r = await request.post('/api/coupons', { data: c })
        if (!r.ok()) throw new Error('create coupon failed: ' + (await r.text()))
      }
    },
    setSubscriptionSettings: async (data: Record<string, unknown>) => {
      const r = await request.post('/api/globals/subscription-settings', { data })
      if (!r.ok()) throw new Error('settings update failed: ' + (await r.text()))
    },
  }
}

export async function runDailyJob(request: APIRequestContext) {
  const res = await request.get('/api/cron/daily-maintenance', { headers: { authorization: `Bearer ${CRON_SECRET}` } })
  return { status: res.status(), body: await res.json().catch(() => ({})) }
}

/** Puts items straight into the browser's cart storage (the same place the site keeps them). */
export async function seedCart(page: Page, items: any[]) {
  await page.goto('/')
  await page.evaluate((i) => {
    localStorage.setItem('longevia-cart-storage', JSON.stringify({ state: { items: i, couponCode: null }, version: 0 }))
  }, items)
}

export const cartLine = (o: { id: string; name: string; slug: string; price: number; planMonths?: number | null; qty?: number }) => ({
  lineId: 'l-' + Math.random().toString(36).slice(2, 8),
  productId: o.id,
  variantSku: 'DEFAULT',
  variantTitle: 'DEFAULT',
  quantity: o.qty ?? 1,
  priceSnapshot: o.price,
  planMonths: o.planMonths ?? null,
  product: { id: o.id, slug: o.slug, name: o.name, imageUrl: null },
})

export async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true })
}

export const payLinkFrom = (mail: Mail) => {
  const m = mail.html.match(/https?:\/\/[^"']+\/pay\/(\d+)\/([A-Za-z0-9_-]+)/)
  if (!m) throw new Error('no pay link in email ' + mail.subject)
  return { url: m[0], path: `/pay/${m[1]}/${m[2]}`, orderId: Number(m[1]), token: m[2] }
}

/**
 * Fills the delivery address - unless the customer already has a saved address, in which case checkout has
 * pre-selected it (that is the normal path for a returning customer, and it is tested too).
 */
export async function fillAddress(page: Page) {
  await page.getByRole('heading', { name: 'Delivery Address' }).waitFor()
  await page.waitForTimeout(2500) // saved addresses load asynchronously
  if (await page.getByText('+ Add New Address').count()) return
  await page.locator('input[name="firstName"]').fill('Alice')
  await page.locator('input[name="lastName"]').fill('Tester')
  await page.locator('input[name="address"]').fill('12 Test Street')
  await page.locator('input[name="city"]').fill('Austin')
  await page.locator('input[name="state"]').fill('TX')
  await page.locator('input[name="zip"]').fill('73301')
  await page.locator('input[name="phone"]').fill('5125550100')
}

/** Start every run from the same state: no orders, subscriptions, saved addresses or carts. */
export async function resetState() {
  await sql('delete from payload_locked_documents_rels')
  await sql('delete from affiliate_conversions')
  await sql('delete from subscriptions_items')
  await sql('delete from subscriptions')
  await sql('delete from orders')
  await sql('delete from addresses')
  await sql('delete from carts')
}

/**
 * Open a page and wait until the site has finished streaming it. While a page streams, React keeps a hidden copy of
 * the content in the page for a moment (and removes it by itself), which makes text look "doubled" to the tests.
 */
export async function go(page: Page, url: string) {
  await page.goto(url)
  await page.waitForFunction(() => document.querySelectorAll('div[hidden][id^="S:"]').length === 0, undefined, { timeout: 15_000 })
}
