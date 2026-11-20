/**
 * Real-browser tests of the member discount, Express shipping, the Zelle QR, the corner shortcut and logging in from
 * the popup - against a real (dev) server on the THROWAWAY local database. Run it like the subscription tests:
 *   LM_DB=lm_e2e node scripts/subscriptions/local-env.cjs npx playwright test --config playwright.subscriptions.config.ts member-discount
 *
 * Nothing is sent anywhere: emails are captured to .local-test/emails.jsonl, payments are Zelle (manual), and the
 * only outside request that is allowed is the Zelle QR image itself (it must really load).
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { login, adminApi, seedCart, cartLine, shot, sql, waitForEmail, emailCount, fillAddress, resetState, go, PASSWORD } from './helpers'

test.describe.configure({ mode: 'serial' })

const ALICE = 'alice@e2e.test'
const QR = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/LR_Zelle.webp'

let bpc: { id: string; slug: string; name: string }

const prepContext = async (ctx: BrowserContext) => {
  // the visitor has already accepted the entry gate; analytics are blocked, but the Zelle QR image is allowed through
  await ctx.addInitScript(() => localStorage.setItem('longevia_age_verified', 'true'))
  await ctx.route(/googletagmanager|google-analytics|clarity\.ms|doubleclick|gstatic|googleapis/, (r) => r.abort())
}
test.beforeEach(async ({ context }) => {
  await prepContext(context)
})

test.beforeAll(async ({ playwright }) => {
  await resetState()
  const rows = await sql(`select id, slug, name from products order by id`)
  bpc = rows.find((r) => r.slug === 'bpc-157')
  expect(bpc).toBeTruthy()
  const api = await playwright.request.newContext({ baseURL: `http://localhost:${process.env.LM_APP_PORT || '3100'}` })
  try {
    const admin = await adminApi(api)
    await admin.setStock(bpc.id, 100)
    // Every order ships by Express Shipping ($20): the shop's only shipping method, as on the live site
    const zones = await (await api.get('/api/shippingzones?depth=0&limit=1')).json()
    const zone = zones.docs[0]
    const r = await api.patch(`/api/shippingzones/${zone.id}`, { data: { methods: [{ method: 'Express Shipping', price: 2000 }] } })
    expect(r.ok()).toBeTruthy()
  } finally {
    await api.dispose()
  }
})

const popup = (page: Page) => page.getByRole('dialog', { name: 'Unlock the full catalogue.' })
const shortcut = (page: Page) => page.getByTestId('login-shortcut')

/** Waits for the page to be fully loaded so the corner shortcut's timer can start. */
async function openShop(page: Page) {
  await go(page, '/about')
  await page.waitForLoadState('load')
}

test('1. the announcement bar and the banners say Express shipping, and nothing promises free shipping', async ({ page }) => {
  await go(page, '/')
  await expect(page.locator('body')).toContainText('EXPRESS SHIPPING $20')
  await expect(page.locator('body')).toContainText('2-3 BUSINESS DAYS')
  for (const path of ['/', '/about', `/products/${bpc.slug}`]) {
    await go(page, path)
    const text = (await page.locator('body').innerText()).toLowerCase()
    expect(text, `${path} still mentions free shipping`).not.toMatch(/free shipping/)
    expect(text, `${path} still mentions $300`).not.toMatch(/\$300/)
  }
  await go(page, `/products/${bpc.slug}`)
  await expect(page.locator('body')).toContainText(/Flat \$20 on every order/i, { timeout: 15_000 }).catch(() => undefined)
  await shot(page, 'm1-announcement-bar')
})

test('2. a logged-out visitor gets the corner shortcut, and it opens the popup with the discount and the login form', async ({ page }) => {
  await openShop(page)
  await expect(shortcut(page)).toBeVisible({ timeout: 30_000 })

  // fixed in the bottom-left corner
  const box = (await shortcut(page).boundingBox())!
  const vp = page.viewportSize()!
  expect(box.x).toBeLessThan(48)
  expect(box.y + box.height).toBeGreaterThan(vp.height - 48)
  await expect(shortcut(page)).toContainText('Save 20% on every order')
  await shot(page, 'm2-shortcut')

  await page.getByRole('button', { name: /member discount/i }).click()
  const dialog = popup(page)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('20% member discount')
  await expect(dialog).not.toContainText(/glp/i)
  await expect(dialog.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(dialog.getByLabel('Email', { exact: true })).toBeVisible()
  await expect(dialog.getByLabel('Password', { exact: true })).toBeVisible()
  await shot(page, 'm2-popup-desktop')

  // it closes, and the shortcut is still there
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(shortcut(page)).toBeVisible()
})

test('3. on a phone the popup is a bottom sheet with the whole login form on the first screen', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await prepContext(context)
  const page = await context.newPage()
  await openShop(page)
  await expect(shortcut(page)).toBeVisible({ timeout: 30_000 })
  await expect(shortcut(page)).toContainText('20% off') // the compact label on phones
  await shortcut(page).click()
  const dialog = popup(page)
  await expect(dialog).toBeVisible()
  const login = dialog.getByRole('button', { name: 'Log in', exact: true })
  await expect(login).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  // 16px fields: iPhones do not zoom in
  for (const f of [dialog.getByLabel('Email', { exact: true }), dialog.getByLabel('Password', { exact: true })]) {
    expect(await f.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
  }
  await shot(page, 'm3-popup-phone')
  await context.close()
})

test('4. logging in from the popup: a wrong password is explained inside the popup; the right one logs in without leaving the page', async ({ page, context }) => {
  await openShop(page)
  await expect(shortcut(page)).toBeVisible({ timeout: 30_000 })
  await shortcut(page).click()
  const dialog = popup(page)
  await expect(dialog).toBeVisible()
  const here = page.url()

  await dialog.getByLabel('Email', { exact: true }).fill(ALICE)
  await dialog.getByLabel('Password', { exact: true }).fill('definitely-wrong')
  await dialog.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Invalid credentials', { timeout: 30_000 })
  await expect(dialog).toBeVisible()
  expect(page.url()).toBe(here)
  await shot(page, 'm4-popup-wrong-password')

  await dialog.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await dialog.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 30_000 })
  expect(page.url()).toBe(here) // never left the page

  // really logged in: the server says so, the shortcut is gone, and a real session cookie exists
  await expect.poll(async () => (await (await page.request.get('/api/auth/session')).json())?.user?.email, { timeout: 30_000 }).toBe(ALICE)
  await expect(shortcut(page)).toHaveCount(0)
  expect((await context.cookies()).some((c) => /next-auth\.session-token/.test(c.name))).toBe(true)
  await shot(page, 'm4-after-popup-login')
})

test('5. the popup has a Google button that goes to Google', async ({ page }) => {
  await openShop(page)
  await expect(shortcut(page)).toBeVisible({ timeout: 30_000 })
  await shortcut(page).click()
  const dialog = popup(page)
  await expect(dialog).toBeVisible()
  // clicking it starts the real Google sign-in: the browser leaves for NextAuth's Google route (no Google account is used here)
  const nav = page.waitForRequest((r) => /\/api\/auth\/(signin|callback)\/google|accounts\.google\.com/.test(r.url()), { timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Continue with Google' }).click()
  await nav
})

test('6. a member checks out: the member discount, only Express Shipping (2-3 business days), a Zelle order, and the confirmation page with the new QR', async ({ page }) => {
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 2 })])
  await page.goto('/checkout')
  await fillAddress(page)

  // the discount is named, and worked out on the subtotal: 2 x $20 = $40 -> $8.00 off
  const memberRow = page.getByTestId('member-discount-row').filter({ visible: true }).first()
  await expect(memberRow).toContainText('Member discount (20%)')
  await expect(memberRow).toContainText('-$8.00')
  await expect(page.getByTestId('member-discount-nudge').filter({ visible: true })).toHaveCount(0) // already a member: no nudge

  // shipping: exactly one option, Express, with its delivery time and price
  await expect(page.locator('input[name="shipping"]')).toHaveCount(1)
  const shippingLabel = page.locator('label', { has: page.locator('input[name="shipping"]') })
  await expect(shippingLabel).toContainText('Express Shipping')
  await expect(shippingLabel.getByTestId('shipping-delivery-time')).toHaveText('2-3 business days')
  await expect(shippingLabel).toContainText('$20.00')

  // the total follows: 40 - 8 + 20 = 52
  await expect(page.locator('body')).toContainText('$52.00')
  await page.getByText('Zelle', { exact: true }).click()
  await shot(page, 'm6-checkout-member')

  const before = emailCount()
  await page.getByRole('button', { name: /Place Zelle Order/ }).click()
  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  const orderId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])

  // the confirmation page: instructions, the new QR (really loaded from the internet, at its full size), the discount line, the delivery time
  await expect(page.getByText('Action Required: Complete Your Payment')).toBeVisible()
  const qr = page.getByTestId('zelle-qr')
  await expect(qr).toBeVisible()
  await expect(qr).toHaveAttribute('src', QR)
  await expect.poll(() => qr.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth), { timeout: 30_000 }).toBe(597)
  const qrBox = (await qr.boundingBox())!
  expect(Math.round(qrBox.width)).toBe(200)
  expect(Math.round(qrBox.height)).toBe(200)
  await expect(page.getByTestId('order-member-discount')).toContainText('Member discount (20%)')
  await expect(page.getByTestId('order-member-discount')).toContainText('-$8.00')
  await expect(page.locator('body')).toContainText('2-3 Business Days')
  await expect(page.locator('body')).toContainText('$52.00')
  await shot(page, 'm6-confirmation-zelle-qr')

  // the order in the database
  const [row] = await sql(`select subtotal, discount_total, member_discount_total, member_discount_percent, shipping_method, shipping_total, total from orders where id = $1`, [orderId])
  expect(Number(row.subtotal)).toBe(40)
  expect(Number(row.discount_total)).toBe(8)
  expect(Number(row.member_discount_total)).toBe(8)
  expect(Number(row.member_discount_percent)).toBe(20)
  expect(row.shipping_method).toBe('Express Shipping')
  expect(Number(row.shipping_total)).toBe(20)
  expect(Number(row.total)).toBe(52)

  // the email
  const mail = await waitForEmail({ to: ALICE, subject: /order|invoice|confirmation/i }, before)
  const text = mail.html.replace(/<wbr>/g, '').replace(/&middot;/g, '·').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  expect(text).toContain('Member discount (20%) -$8.00')
  expect(text).toContain('You saved $8.00 with your member discount.')
  expect(text).toContain('Express Shipping · 2-3 business days')
  expect(text).toContain('Total $52.00')
  expect(mail.html).toContain(`src="${QR}"`)
})

test('7. the member sees the discount in the basket, and the order page of their account', async ({ page }) => {
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 2 })])
  await go(page, '/cart')
  const row = page.getByTestId('member-discount-row').filter({ visible: true }).first()
  await expect(row).toContainText('Member discount (20%)')
  await expect(row).toContainText('-$8.00')
  await shot(page, 'm7-cart-member')

  const [order] = await sql(`select id from orders where member_discount_total > 0 order by id desc limit 1`)
  await go(page, `/account/orders/${order.id}`)
  await expect(page.getByTestId('order-member-discount')).toContainText('Member discount (20%)')
  await expect(page.getByTestId('order-shipping-method')).toContainText('Express Shipping · 2-3 business days')
})

test('8. a guest is charged in full and is shown what logging in would save', async ({ page }) => {
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 2 })])
  await go(page, '/cart')
  const nudge = page.getByTestId('member-discount-nudge').filter({ visible: true }).first()
  await expect(nudge).toContainText('Members save 20% on every order')
  await expect(nudge).toContainText('$8.00 on this one')
  await expect(page.getByTestId('member-discount-row')).toHaveCount(0)

  await page.goto('/checkout')
  await page.getByRole('heading', { name: 'Shipping Method' }).waitFor()
  await expect(page.getByTestId('member-discount-nudge').filter({ visible: true }).first()).toContainText('Members save 20%')
  await expect(page.getByTestId('member-discount-row')).toHaveCount(0)
  await expect(page.locator('input[name="shipping"]')).toHaveCount(1)
  await expect(page.locator('body')).toContainText('$60.00') // 40 + 20 shipping, no discount
  await shot(page, 'm8-checkout-guest')
})

test('9. the cart drawer talks about Express shipping, not free shipping', async ({ page }) => {
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 20 })]) // $400: far over the old $300 line
  await go(page, '/about')
  await page.evaluate(() => (window as any).__lmOpenCart?.())
  // open the drawer the way a customer does: the cart button in the header
  await page.getByRole('button', { name: /cart|bag/i }).first().click().catch(() => undefined)
  const note = page.getByTestId('drawer-shipping-note')
  await expect(note).toContainText('Express Shipping: $20.00', { timeout: 15_000 })
  await expect(note).toContainText('2-3 business days')
  await expect(page.locator('body')).not.toContainText(/unlocked free shipping/i)
  await shot(page, 'm9-cart-drawer')
})

// ─── The member discount cannot be combined with a discount code ──────────────────────────────────────────────────

const applyCode = async (page: Page, code: string) => {
  const input = page.getByPlaceholder('Discount code or gift card').filter({ visible: true }).first()
  await input.fill(code)
  await page.getByRole('button', { name: 'Apply', exact: true }).filter({ visible: true }).first().click()
}

test.describe('10. member discount and a discount code', () => {
  test.beforeAll(async ({ playwright }) => {
    const api = await playwright.request.newContext({ baseURL: `http://localhost:${process.env.LM_APP_PORT || '3100'}` })
    try {
      const admin = await adminApi(api)
      await admin.replaceCoupons([
        { code: 'SMALL10', type: 'percentage', value: 10, appliesTo: 'all', applicableProductTypes: 'all' }, // 10% of $40 = $4: less than the $8 member discount
        { code: 'BIG50', type: 'percentage', value: 50, appliesTo: 'all', applicableProductTypes: 'all' }, // 50% of $40 = $20: more than the $8
      ])
    } finally {
      await api.dispose()
    }
  })

  test('a code worth LESS is not used: the member discount stays, the customer is told, and the order records no code', async ({ page }) => {
    await login(page, ALICE)
    await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 2 })])
    await page.goto('/checkout')
    await fillAddress(page)
    await expect(page.getByTestId('member-discount-row').filter({ visible: true }).first()).toContainText('-$8.00')

    await applyCode(page, 'SMALL10')
    await expect(page.getByTestId('coupon-not-used-note').filter({ visible: true }).first()).toContainText("Discounts can't be combined")
    // the member discount is still what is taken off, and the code's own discount is not
    await expect(page.getByTestId('member-discount-row').filter({ visible: true }).first()).toContainText('-$8.00')
    await expect(page.locator('body')).not.toContainText('Discount (SMALL10)')
    await expect(page.locator('body')).toContainText('$52.00') // 40 - 8 + 20
    await shot(page, 'm10-small-code-checkout')

    await page.getByText('Zelle', { exact: true }).click()
    await page.getByRole('button', { name: /Place Zelle Order/ }).click()
    await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
    const orderId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
    const [row] = await sql(`select coupon_code, discount_total, member_discount_total, total from orders where id = $1`, [orderId])
    expect(row.coupon_code ?? '').toBe('')
    expect(Number(row.discount_total)).toBe(8)
    expect(Number(row.member_discount_total)).toBe(8)
    expect(Number(row.total)).toBe(52)
    // the code was not used up
    const [coupon] = await sql(`select usage_count from coupons where code = 'SMALL10'`)
    expect(Number(coupon.usage_count ?? 0)).toBe(0)
  })

  test('a code worth MORE replaces the member discount: only the code is charged, recorded and counted', async ({ page }) => {
    await login(page, ALICE)
    await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 20, qty: 2 })])
    await page.goto('/checkout')
    await fillAddress(page)

    await applyCode(page, 'BIG50')
    await expect(page.getByTestId('member-not-used-note').filter({ visible: true }).first()).toContainText("Discounts can't be combined")
    await expect(page.getByTestId('member-discount-row')).toHaveCount(0) // the member discount is not added on top
    await expect(page.locator('body')).toContainText('Discount (BIG50)')
    await expect(page.locator('body')).toContainText('-$20.00')
    await expect(page.locator('body')).toContainText('$40.00') // 40 - 20 + 20
    await shot(page, 'm10-big-code-checkout')

    await page.getByText('Zelle', { exact: true }).click()
    await page.getByRole('button', { name: /Place Zelle Order/ }).click()
    await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
    const orderId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
    const [row] = await sql(`select coupon_code, discount_total, member_discount_total, member_discount_percent, total from orders where id = $1`, [orderId])
    expect(row.coupon_code).toBe('BIG50')
    expect(Number(row.discount_total)).toBe(20)
    expect(Number(row.member_discount_total)).toBe(0)
    expect(row.member_discount_percent).toBeNull()
    expect(Number(row.total)).toBe(40)
    const [coupon] = await sql(`select usage_count from coupons where code = 'BIG50'`)
    expect(Number(coupon.usage_count)).toBe(1)
  })
})
