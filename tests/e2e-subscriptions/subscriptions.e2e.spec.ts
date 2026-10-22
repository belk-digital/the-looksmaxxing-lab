import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import {
  login, adminApi, runDailyJob, seedCart, cartLine, shot, sql, waitForEmail, emailCount, payLinkFrom, WP, PASSWORD, allEmails, fillAddress, resetState, go } from './helpers'

test.describe.configure({ mode: 'serial' })

const ALICE = 'alice@e2e.test'
const BOB = 'bob@e2e.test'

let bpc: { id: string; slug: string; name: string }
let tb: { id: string; slug: string; name: string }
const state: { firstOrderId?: number; subId?: number; activeSubId?: number; invoiceLinkPath?: string } = {}

// Visitors see a one-time "research use only" entry gate; a returning visitor has already accepted it.
// (the site remembers it in the browser's localStorage)
const acceptGate = () => localStorage.setItem('longevia_age_verified', 'true')
// Third-party requests (hosted images, analytics) are blocked so a slow internet connection can never make a
// test flaky; only our own site and the fake WordPress are contacted.
const prepContext = async (ctx: BrowserContext) => {
  await ctx.addInitScript(acceptGate)
  await ctx.route(/r2\.dev|googletagmanager|google-analytics|clarity\.ms|doubleclick|gstatic|googleapis/, (r) => r.abort())
}
test.beforeEach(async ({ context }) => {
  await prepContext(context)
})

test.beforeAll(async ({ playwright }) => {
  await resetState()
  const rows = await sql(`select id, slug, name from products order by id`)
  bpc = rows.find((r) => r.slug === 'bpc-157')
  tb = rows.find((r) => r.slug === 'tb-500')
  expect(bpc && tb).toBeTruthy()
  // Every run places orders, which use up stock: start each run with full shelves (an out-of-stock product correctly cannot be
  // subscribed to). Done through the admin, like a real stock edit, so the site refreshes its cached product pages.
  const api = await playwright.request.newContext({ baseURL: `http://localhost:${process.env.LM_APP_PORT || '3100'}` })
  try {
    const admin = await adminApi(api)
    await admin.setStock(bpc.id, 100)
    await admin.setStock(tb.id, 100)
  } finally {
    await api.dispose()
  }
})

/** Dismisses/accepts every browser confirm() with the given answer and remembers what it said. */
function answerDialogs(page: Page, accept: boolean) {
  const seen: string[] = []
  page.removeAllListeners('dialog')
  page.on('dialog', (d) => {
    seen.push(d.message())
    void (accept ? d.accept() : d.dismiss())
  })
  return seen
}

test('1. the product page offers "Subscribe & save" only on subscription-enabled products, and only while the admin switch is on', async ({ page, request }) => {
  await page.goto(`/products/${bpc.slug}`)
  const selector = page.getByTestId('plan-selector')
  await expect(selector).toBeVisible()
  await expect(page.getByTestId('plan-one-time')).toBeVisible()
  for (const m of [1, 3, 6]) await expect(page.getByTestId(`plan-${m}`)).toBeVisible()
  await expect(page.getByTestId('plan-12')).toHaveCount(0) // the old 12-month plan is gone
  await expect(page.getByTestId('plan-1')).toContainText('Save 25%')
  await expect(page.getByTestId('plan-1')).toContainText('$15.00') // $20 less 25%
  await expect(page.getByTestId('plan-1')).toContainText('Deliver every month')
  await expect(page.getByTestId('plan-3')).toContainText('Save 20%')
  await expect(page.getByTestId('plan-3')).toContainText('$16.00') // $20 less 20%
  await expect(page.getByTestId('plan-3')).toContainText('Deliver every 3 months')
  await expect(page.getByTestId('plan-3')).toContainText('/ order')
  await expect(page.getByTestId('plan-6')).toContainText('Save 15%')
  await expect(page.getByTestId('plan-6')).toContainText('$17.00') // $20 less 15%
  await expect(page.getByTestId('plan-6')).toContainText('Deliver every 6 months')
  await expect(page.getByTestId('plan-explainer')).toHaveCount(0) // only shown once a plan is chosen

  await page.getByTestId('plan-6').click()
  await expect(page.getByTestId('plan-explainer')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Subscribe$/ }).first()).toBeVisible() // "Buy Now" becomes "Subscribe"
  await shot(page, '01-product-plan-selected')
  await page.getByTestId('plan-one-time').click()
  await expect(page.getByRole('button', { name: /^Buy Now$/ }).first()).toBeVisible()

  // a product that isn't flagged has no plan options
  await page.goto(`/products/${tb.slug}`)
  await expect(page.getByRole('button', { name: /Buy Now/ }).first()).toBeVisible()
  await expect(page.getByTestId('plan-selector')).toHaveCount(0)

  // master switch off -> options disappear immediately (not cached into the page)
  const admin = await adminApi(request)
  await admin.setSubscriptionSettings({ enabled: false })
  await page.goto(`/products/${bpc.slug}`)
  await expect(page.getByRole('button', { name: /Buy Now/ }).first()).toBeVisible()
  await expect(page.getByTestId('plan-selector')).toHaveCount(0)
  await admin.setSubscriptionSettings({ enabled: true })
  await page.goto(`/products/${bpc.slug}`)
  await expect(page.getByTestId('plan-selector')).toBeVisible()
})

test('2. a subscription is never mixed into a cart that already has other items (customer is asked first)', async ({ page }) => {
  await seedCart(page, [cartLine({ id: tb.id, name: tb.name, slug: tb.slug, price: 30 })])
  await page.goto(`/products/${bpc.slug}`)
  await page.getByTestId('plan-3').click()

  const dismissed = answerDialogs(page, false)
  await page.getByRole('button', { name: /^Subscribe$/ }).first().click()
  await expect.poll(() => dismissed.length).toBe(1)
  expect(dismissed[0]).toMatch(/Your cart has other items/)
  expect(dismissed[0]).toMatch(/Replace your cart with this subscription\?/)
  expect(page.url()).not.toContain('/checkout') // cancelled: nothing happened
  const cartAfterCancel = await page.evaluate(() => JSON.parse(localStorage.getItem('longevia-cart-storage')!).state.items)
  expect(cartAfterCancel).toHaveLength(1)
  expect(cartAfterCancel[0].planMonths).toBeNull()

  const accepted = answerDialogs(page, true)
  await page.getByRole('button', { name: /^Subscribe$/ }).first().click()
  await page.waitForURL('**/checkout', { timeout: 60_000 })
  expect(accepted).toHaveLength(1)
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('longevia-cart-storage')!).state.items)
  expect(cart).toHaveLength(1)
  expect(cart[0]).toMatchObject({ planMonths: 3, priceSnapshot: 16, quantity: 1 })
})

test('3. checkout asks a guest to log in, shows the plan clearly, and offers only card or Zelle', async ({ page }) => {
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  await page.goto('/checkout')
  await expect(page.getByTestId('subscription-notice')).toBeVisible()
  await expect(page.getByTestId('subscription-notice')).toContainText('Subscription · delivered every 3 months')
  await expect(page.getByTestId('subscription-notice')).toContainText('It continues until you pause it')
  await expect(page.getByTestId('subscription-login-required')).toBeVisible()
  await expect(page.getByTestId('plan-line-badge').first()).toContainText('Delivered every 3 months')
  await expect(page.getByTestId('subscription-due-today')).toContainText('This is your first order')
  await expect(page.getByTestId('subscription-due-today')).toContainText('every 3 months')
  await expect(page.getByText('Due today').first()).toBeVisible()
  // payment methods: no Stripe card form for plans
  await expect(page.getByText('Credit Card (via Longevia Beauty)')).toBeVisible()
  await expect(page.getByText('Zelle', { exact: true })).toBeVisible()
  await expect(page.getByText('Credit / Debit Card', { exact: true })).toHaveCount(0)
  // the guest is told at the TOP (before typing anything) and again next to the payment button
  const banner = page.getByTestId('subscription-login-banner')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('Log in to start your subscription')
  await expect(banner.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login?next=%2Fcheckout')
  await expect(banner.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/register?next=%2Fcheckout')
  // the pay button is not silently greyed out: it says what is needed, and clicking it points at the login box
  await page.getByText('Zelle', { exact: true }).click()
  const payBtn = page.getByRole('button', { name: 'Log in to continue' })
  await expect(payBtn).toBeVisible()
  await expect(payBtn).toBeEnabled()
  await payBtn.click()
  await expect(page.getByText('Please log in or create an account to start a subscription.')).toBeVisible() // toast
  await expect(page.getByTestId('subscription-login-required')).toBeInViewport()
  await shot(page, '03-checkout-guest')
})

test('3b. "Log in" from checkout brings the customer straight back to checkout with the cart intact (only same-site return addresses are accepted)', async ({ page }) => {
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  await page.goto('/checkout')
  await page.getByTestId('subscription-login-banner').getByRole('link', { name: 'Log in' }).click()
  await page.waitForURL(/\/login\?next=%2Fcheckout/)
  await page.locator('input[type="email"]').fill(ALICE)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => u.pathname === '/checkout', { timeout: 120_000 })
  await expect(page.getByTestId('subscription-notice')).toBeVisible()
  await expect(page.getByTestId('plan-line-badge').first()).toContainText('Delivered every 3 months')
  await expect(page.getByTestId('subscription-login-banner')).toHaveCount(0) // logged in now

  // a crafted address pointing to another website is ignored
  const ctx = await page.context().browser()!.newContext()
  await prepContext(ctx)
  const other = await ctx.newPage()
  await other.goto('/login?next=https%3A%2F%2Fevil.example%2Fsteal')
  await other.locator('input[type="email"]').fill(ALICE)
  await other.locator('input[type="password"]').fill(PASSWORD)
  await other.locator('button[type="submit"]').click()
  await other.waitForURL((u) => u.pathname === '/account', { timeout: 120_000 })
  expect(new URL(other.url()).hostname).not.toContain('evil')
  await ctx.close()
})

test('4. a logged-in customer starts a subscription by Zelle: terms are required, then the confirmation explains what happens next', async ({ page }) => {
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  await page.goto('/checkout')
  await expect(page.getByTestId('subscription-login-required')).toHaveCount(0)

  await fillAddress(page)
  await page.getByText('Zelle', { exact: true }).click()

  // the agreement is a clearly marked, required box - and the button says what is missing instead of being greyed out
  const card = page.getByTestId('subscription-terms-card')
  await expect(card).toContainText('Please read and agree')
  await expect(card).toContainText('Required')
  const waiting = page.getByRole('button', { name: 'Tick the agreement above to continue' })
  await expect(waiting).toBeVisible()
  await expect(waiting).toBeEnabled()
  await waiting.click() // nothing is created; the customer is shown the box that needs ticking
  await expect(page.getByTestId('subscription-terms-error')).toContainText('Please tick the box above to continue.')
  await expect(page.getByTestId('subscription-terms-card')).toBeInViewport()
  await expect(page.getByText(/\/order-confirmation\//)).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe('/checkout')

  await page.getByTestId('subscription-terms').click()
  await expect(card).toContainText('Agreed')
  await expect(page.getByTestId('subscription-terms-error')).toHaveCount(0)
  const placeBtn = page.getByRole('button', { name: /Place Zelle Order/ })
  await expect(placeBtn).toBeEnabled()
  await shot(page, '04-checkout-ready')
  const before = emailCount()
  await placeBtn.click()

  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  state.firstOrderId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
  const banner = page.getByTestId('subscription-confirmation')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('Subscription · First order')
  await expect(banner).toContainText('Your subscription has started')
  await expect(page.getByText('Action Required: Complete Your Payment')).toBeVisible() // Zelle instructions
  await shot(page, '04-order-confirmation')

  const mail = await waitForEmail({ to: ALICE, subject: /Subscription Order Confirmation/ }, before)
  expect(mail.subject).toContain('First order')
  const rows = await sql(`select o.order_type, o.cycles_total, o.status, s.id as sub_id, s.status as sub_status from orders o join subscriptions s on s.id = o.subscription_id where o.id = $1`, [state.firstOrderId])
  expect(rows[0]).toMatchObject({ order_type: 'subscription_first', status: 'pending', sub_status: 'pending_payment' })
  state.subId = rows[0].sub_id
})

test('5. before the first payment the subscription page says so, and offers no risky buttons', async ({ page }) => {
  await login(page, ALICE)
  await go(page, '/account/subscriptions')
  await expect(page.getByText('Waiting for first payment').first()).toBeVisible()
  await expect(page.getByText(/Delivered every 3 months/).first()).toBeVisible()
  await shot(page, '05-list-pending')
  await go(page, `/account/subscriptions/${state.subId}`)
  await expect(page.getByRole('heading', { name: /BPC-157/ })).toBeVisible()
  await expect(page.getByText('0', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Pause subscription|Skip next delivery|Order next delivery now/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /View my first payment/ })).toBeVisible()
  // the order list labels it clearly
  await page.goto('/account/orders')
  await expect(page.getByText(/Subscription · Order 1/).first()).toBeVisible()
})

test('6. staff mark the Zelle payment as paid -> the subscription becomes Active with all options', async ({ page, request }) => {
  const admin = await adminApi(request)
  const before = emailCount()
  await admin.markOrderPaid(state.firstOrderId!)
  await login(page, ALICE)
  await go(page, `/account/subscriptions/${state.subId}`)
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/1 order\s*paid/).first()).toBeVisible()
  await expect(page.getByText(/a new order every 3 months/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Order next delivery now', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip next delivery', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause subscription', exact: true })).toBeVisible()
  await expect(page.getByText('Paid - preparing to ship').locator('visible=true')).toHaveCount(1)
  await shot(page, '06-detail-active')
  const mail = await waitForEmail({ to: ALICE, subject: /Payment received/ }, before)
  expect(mail.subject).toContain('(Order 1)')
})

test('7. the daily job emails the month-2 invoice; the customer opens the link WITHOUT logging in and pays by card through the bridge', async ({ browser, request }) => {
  await sql(`update subscriptions set next_invoice_date = now() - interval '1 hour' where id = $1`, [state.subId])
  const before = emailCount()
  const run = await runDailyJob(request)
  expect(run.status).toBe(200)
  expect(run.body.subscriptions.result.invoicesCreated).toBeGreaterThanOrEqual(1)

  const mail = await waitForEmail({ to: ALICE, subject: /^Subscription invoice #\d+ - Order 2/ }, before)
  const link = payLinkFrom(mail)
  state.invoiceLinkPath = link.path
  expect(mail.html).toContain('Zelle') // alice's default is Zelle

  // a stranger's browser: no login, no cookies
  const ctx: BrowserContext = await browser.newContext()
  await prepContext(ctx)
  const page = await ctx.newPage()
  await go(page, link.path)
  await expect(page.getByRole('heading', { name: 'Your invoice' })).toBeVisible()
  await expect(page.getByText('Subscription · Order 2')).toBeVisible()
  await expect(page.getByTestId('invoice-explainer')).toContainText('an order delivered every 3 months')
  await expect(page.getByText('$21.00').first()).toBeVisible() // 1 x $16 + $5 shipping
  await expect(page.getByText('Pay with Zelle')).toBeVisible()
  await expect(page.getByText(/Main St|Test Street|5125550100|alice@e2e/)).toHaveCount(0) // no personal details
  await shot(page, '07-pay-page-zelle')

  await page.getByRole('button', { name: /by card/ }).click() // switch to card for this invoice
  await page.waitForURL(`${WP}/**`, { timeout: 60_000 })
  await expect(page.getByTestId('fake-wordpress')).toBeVisible()
  await expect(page.getByTestId('wp-amount')).toContainText('$21.00')
  await expect(page.getByTestId('wp-order')).toContainText('Longevia Research Order #')
  await page.locator('#pay').click() // customer pays with the test card; WordPress confirms to the site

  await page.waitForURL(/\/pay\/\d+\/.*returned=1/, { timeout: 60_000 })
  await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('Thank you - this invoice is paid.')).toBeVisible()
  await shot(page, '07-pay-page-paid')
  await ctx.close()

  const rows = await sql(`select o.status, o.payment_status, o.payment_method, o.payment_txn_id, o.cycle_number, s.cycles_completed, s.status as sub_status, s.open_invoice_id from orders o join subscriptions s on s.id = o.subscription_id where o.id = $1`, [link.orderId])
  expect(rows[0]).toMatchObject({ status: 'paid', payment_status: 'captured', payment_method: 'authnet_bridge', cycle_number: '2', cycles_completed: '2', sub_status: 'active', open_invoice_id: null })
  expect(rows[0].payment_txn_id).toMatch(/^FAKE-/)
  await waitForEmail({ to: ALICE, subject: /Payment received - Subscription order #\d+ \(Order 2\)/ }, before)
})

test('8. a slow confirmation shows "Confirming your payment" and flips to Paid by itself - the customer is never told to pay twice', async ({ page, request }) => {
  await login(page, ALICE)
  await go(page, `/account/subscriptions/${state.subId}`)
  await request.post(`${WP}/__config`, { data: { webhookDelayMs: 9000 } })

  answerDialogs(page, true)
  await page.getByRole('button', { name: 'Order next delivery now', exact: true }).click()
  await page.waitForURL(/\/pay\/\d+\//, { timeout: 60_000 }) // taken straight to the new invoice
  await expect(page.getByText('Subscription · Order 3')).toBeVisible()
  await page.getByRole('button', { name: /by card/ }).click()
  await page.waitForURL(`${WP}/**`)
  await page.locator('#pay').click()

  await page.waitForURL(/returned=1/)
  await expect(page.getByText('Confirming your payment...')).toBeVisible()
  await shot(page, '08-confirming')
  await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible({ timeout: 90_000 }) // updates with no reload
  await request.post(`${WP}/__config`, { data: { webhookDelayMs: 0 } })

  const sub = (await sql(`select status, cycles_completed from subscriptions where id = $1`, [state.subId]))[0]
  expect(sub).toMatchObject({ status: 'active', cycles_completed: '3' }) // a subscription never finishes by itself
  await go(page, `/account/subscriptions/${state.subId}`)
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Completed', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Ended', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/3 orders\s*paid/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip next delivery', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause subscription', exact: true })).toBeVisible()
  await shot(page, '08-still-active')
})

test('9. the customer pauses, resumes, skips, edits the address and changes how they pay', async ({ page, request }) => {
  // a fresh active 6-month subscription for this test
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 17, planMonths: 6 })])
  await page.goto('/checkout')
  await fillAddress(page)
  await page.getByText('Zelle', { exact: true }).click()
  await page.getByTestId('subscription-terms').click()
  await page.getByRole('button', { name: /Place Zelle Order/ }).click()
  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  const firstId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
  const subId = (await sql(`select subscription_id from orders where id = $1`, [firstId]))[0].subscription_id as number
  state.activeSubId = subId
  await (await adminApi(request)).markOrderPaid(firstId)

  await go(page, `/account/subscriptions/${subId}`)
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  const dueBefore = (await sql(`select next_due_date from subscriptions where id = $1`, [subId]))[0].next_due_date as Date

  // ---- skip
  const skipDialogs = answerDialogs(page, true)
  await page.getByRole('button', { name: 'Skip next delivery', exact: true }).click()
  await expect.poll(async () => String((await sql(`select next_due_date from subscriptions where id = $1`, [subId]))[0].next_due_date)).not.toBe(String(dueBefore))
  expect(skipDialogs[0]).toMatch(/Skip next delivery\? Your next order moves from .* to .*\(one full interval, every 6 months\)/)
  const moved = ((await sql(`select next_due_date from subscriptions where id = $1`, [subId]))[0].next_due_date as Date).getTime() - new Date(dueBefore).getTime()
  expect(moved / 86400000).toBeGreaterThanOrEqual(181) // one full 6-month interval
  expect(moved / 86400000).toBeLessThanOrEqual(184)
  expect((await sql(`select cycles_completed from subscriptions where id = $1`, [subId]))[0].cycles_completed).toBe('1')

  // ---- pause (nothing owed yet)
  answerDialogs(page, true)
  await page.getByRole('button', { name: 'Pause subscription', exact: true }).click()
  await expect(page.getByText('Paused', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume subscription', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Skip next delivery|Pause subscription|Order next delivery now/ })).toHaveCount(0)
  await expect(page.getByTestId('status-help')).toContainText('your next order keeps its normal date') // the paused page explains it
  await shot(page, '09-paused')

  // ---- resume -> the calendar keeps running: no invoice is created now, the customer is told when it will be emailed
  const ordersBefore = Number((await sql(`select count(*)::int as n from orders where subscription_id = $1`, [subId]))[0].n)
  await page.getByRole('button', { name: 'Resume subscription', exact: true }).click()
  await expect(page.getByText(/Welcome back! Your next invoice will be emailed on/)).toBeVisible()
  expect(page.url()).toContain(`/account/subscriptions/${subId}`) // stays on the page, no jump to a pay page
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/Your next invoice will be emailed on/).first()).toBeVisible()
  const resumed = (await sql(`select open_invoice_id, next_invoice_date, next_due_date from subscriptions where id = $1`, [subId]))[0]
  expect(resumed.open_invoice_id).toBeNull()
  expect(resumed.next_invoice_date).toBeTruthy()
  expect(Number((await sql(`select count(*)::int as n from orders where subscription_id = $1`, [subId]))[0].n)).toBe(ordersBefore)
  // the invoice day is a week before the (skipped, i.e. later) due date, exactly as before the pause
  expect(Math.round((new Date(resumed.next_due_date).getTime() - new Date(resumed.next_invoice_date).getTime()) / 86400000)).toBe(7)

  // ---- "Order next month now" is still there for a customer who does not want to wait -> goes straight to the invoice
  answerDialogs(page, true)
  await page.getByRole('button', { name: 'Order next delivery now', exact: true }).click()
  await page.waitForURL(/\/pay\/\d+\//, { timeout: 60_000 })
  await expect(page.getByText('Subscription · Order 2')).toBeVisible()
  await go(page, `/account/subscriptions/${subId}`)
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Pay \$22\.00 now/ })).toBeVisible()
  await expect(page.getByText('Awaiting payment')).toBeVisible()

  // ---- change the address
  await page.getByLabel('Street address').fill('99 New Road')
  await page.getByLabel('City').fill('Dallas')
  await page.getByRole('button', { name: /Save address/ }).click()
  await expect.poll(async () => (await sql(`select shipping_address_line1 from subscriptions where id = $1`, [subId]))[0].shipping_address_line1)
    .toBe('99 New Road')
  // the unpaid invoice follows right after the subscription itself, so wait for it instead of reading it at once
  await expect.poll(async () => (await sql(`select shipping_address_city from orders where subscription_id = $1 and order_type = 'subscription_cycle' and status = 'pending'`, [subId]))[0]?.shipping_address_city).toBe('Dallas')

  // ---- change how future invoices are paid
  await page.getByText('Credit / debit card', { exact: true }).click()
  await page.getByRole('button', { name: /^Save$/ }).click()
  await expect.poll(async () => (await sql(`select payment_method from subscriptions where id = $1`, [subId]))[0].payment_method).toBe('authnet_bridge')
  await shot(page, '09-detail-with-invoice')
})

test('10. another customer cannot see or open this subscription, and made-up pay links are just "not found"', async ({ page }) => {
  await login(page, BOB)
  await go(page, '/account/subscriptions')
  await expect(page.getByText('No subscriptions yet')).toBeVisible()
  // What matters is what the visitor sees: the site's 404 page and none of the other customer's data.
  // (The HTTP status line can read 200 inside the account area because a loading screen streams first - the same as order pages.)
  const stays404 = async (url: string) => {
    await page.goto(url)
    await expect(page.getByText('Page Not Found.')).toBeVisible()
    await expect(page.getByText(/Alice Tester|12 Test Street|Austin|SUB-|alice@e2e/)).toHaveCount(0)
  }
  await stays404(`/account/subscriptions/${state.subId}`)
  await stays404('/pay/1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  await stays404(state.invoiceLinkPath!.replace(/\/[^/]+$/, '/tampered-token-tampered-token-xx'))
})

test('11. one-time orders are unchanged and clearly labelled as one-time', async ({ page }) => {
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: tb.id, name: tb.name, slug: tb.slug, price: 30 })])
  await page.goto('/checkout')
  await expect(page.getByTestId('subscription-notice')).toHaveCount(0)
  await expect(page.getByTestId('subscription-terms')).toHaveCount(0)
  await fillAddress(page)
  await page.getByText('Zelle', { exact: true }).click()
  await page.getByRole('button', { name: /Place Zelle Order/ }).click()
  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  await expect(page.getByTestId('subscription-confirmation')).toHaveCount(0)
  await page.goto('/account/orders')
  await expect(page.getByText('One-time order').first()).toBeVisible()
  await shot(page, '11-orders-list')
  const mail = allEmails().filter((m) => String(m.to).includes(ALICE)).pop()!
  expect(mail.subject).toMatch(/^Order Confirmation #\d+$/)
  expect(mail.html).not.toContain('Subscription &middot;')
})

test('12. staff can tell one-time orders from subscription months in the admin', async ({ page }) => {
  // staff sign in to the admin panel with its own login screen
  await page.goto('/admin/login')
  await page.locator('#field-email').fill('admin@e2e.test')
  await page.locator('#field-password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL((u) => u.pathname.startsWith('/admin') && !u.pathname.includes('/login'), { timeout: 120_000 })
  await page.goto('/admin/collections/orders')
  await expect(page.getByText('One-time order').first()).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText('Subscription - first order').first()).toBeVisible()
  await expect(page.getByText('Subscription - repeat order').first()).toBeVisible()
  await shot(page, '12-admin-orders')
  await page.goto('/admin/collections/subscriptions')
  await expect(page.getByText('SUB-').first()).toBeVisible({ timeout: 120_000 })
  await shot(page, '12-admin-subscriptions')
  await page.goto('/admin/globals/subscription-settings')
  await expect(page.getByText('Master switch for NEW subscriptions').first()).toBeVisible({ timeout: 120_000 })
  await shot(page, '12-admin-settings')
})


// ------------------------------------------------------------------------------------------------------------
// Explanations ("i" icons and plain help text) - customers must be able to understand every option
// ------------------------------------------------------------------------------------------------------------
test('13. every important thing is explained in plain words (hover/keyboard on desktop)', async ({ page }) => {
  // product page
  await page.goto(`/products/${bpc.slug}`)
  const tip = page.getByRole('button', { name: 'What is a subscription?' })
  await tip.hover()
  await expect(page.getByRole('tooltip')).toContainText('every 3 months')
  await expect(page.getByRole('tooltip')).toContainText('never in advance')
  await page.keyboard.press('Escape')

  // checkout
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'How does subscription billing work?' }).click()
  await expect(page.getByRole('tooltip')).toContainText('never charge your card')
  await page.getByRole('button', { name: 'What is due today?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('You only pay your first order now')
  await page.getByRole('button', { name: 'How often will I be invoiced?' }).first().hover()
  await expect(page.getByRole('tooltip').last()).toContainText('one order at a time')
  await shot(page, '13-checkout-help')

  // the subscription page: status, progress, each option, each section
  await go(page, `/account/subscriptions/${state.activeSubId}`)
  await expect(page.getByTestId('options-help')).toBeVisible()
  await page.getByTestId('options-help').locator('summary').click()
  for (const term of ['Pay now', 'Skip next delivery', 'Pause subscription', 'Will you charge my card automatically?']) {
    await expect(page.getByTestId('options-help').getByText(term, { exact: true })).toBeVisible()
  }
  await expect(page.getByTestId('options-help')).toContainText('one full interval')
  await expect(page.getByTestId('options-help')).toContainText('Nothing is due while paused')

  await page.getByRole('button', { name: 'What does Skip next delivery do?' }).hover()
  await expect(page.getByRole('tooltip')).toContainText('Moves your next delivery back by one full interval')
  await page.getByRole('button', { name: 'What does Pause do?' }).focus()
  await expect(page.getByRole('tooltip').last()).toContainText('Stops all invoices until you resume')
  await page.getByRole('button', { name: 'What does this status mean?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('Your subscription is running normally')
  await page.getByRole('button', { name: 'How often will I get an order?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('fixed schedule')
  await page.getByRole('button', { name: 'Will my card be charged automatically?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('never charge automatically')
  await page.getByRole('button', { name: 'Which orders use this address?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('Future orders ship to this address')
  await page.getByRole('button', { name: 'What is the plan discount?' }).hover()
  await expect(page.getByRole('tooltip').last()).toContainText('locked in on the day you subscribe')
  await shot(page, '13-detail-help')

  // the list
  await go(page, '/account/subscriptions')
  await page.getByRole('button', { name: 'What does this status mean?' }).first().hover()
  await expect(page.getByRole('tooltip').last()).toBeVisible()

  // the pay page (opened from the emailed link, no login): plain-words intro + amount explained
  const link = await sql(`select id, invoice_token from orders where subscription_id = $1 and order_type = 'subscription_cycle' and status = 'pending'`, [state.activeSubId])
  const ctx = await page.context().browser()!.newContext()
  await prepContext(ctx)
  const pay = await ctx.newPage()
  await go(pay, `/pay/${link[0].id}/${link[0].invoice_token}`)
  await expect(pay.getByTestId('invoice-explainer')).toContainText('We never charge your card automatically')
  await pay.getByRole('button', { name: 'What does the amount include?' }).hover()
  await expect(pay.getByRole('tooltip')).toContainText('the same as a normal order'.replace('the same as a normal order', 'worked out the same way as a normal order'))
  await pay.getByRole('button', { name: 'Is card payment safe?' }).hover()
  await expect(pay.getByRole('tooltip').last()).toContainText('We never see or store your card number')
  await shot(pay, '13-pay-page-help')
  await ctx.close()
})

test('14. on a phone the "i" icons open by tapping and stay fully on screen', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  await prepContext(ctx)
  const page = await ctx.newPage()
  await login(page, ALICE)

  const insideScreen = async () => {
    const box = await page.getByRole('tooltip').last().boundingBox()
    expect(box).toBeTruthy()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  }

  await page.goto(`/products/${bpc.slug}`)
  await page.getByRole('button', { name: 'What is a subscription?' }).tap()
  await expect(page.getByRole('tooltip')).toContainText('every 3 months')
  await insideScreen()
  await page.getByRole('button', { name: 'What is a subscription?' }).tap() // tap again closes
  await expect(page.getByRole('tooltip')).toHaveCount(0)

  await go(page, `/account/subscriptions/${state.activeSubId}`)
  for (const name of ['What does Skip next delivery do?', 'What does Pause do?', 'What does this status mean?', 'How often will I get an order?']) {
    await page.getByRole('button', { name }).tap()
    await expect(page.getByRole('tooltip').last()).toBeVisible()
    await insideScreen()
    await page.getByRole('button', { name }).tap()
  }
  // the always-visible help list works on a phone too
  await page.getByTestId('options-help').locator('summary').tap()
  await expect(page.getByTestId('options-help')).toContainText('Skip next delivery')
  await shot(page, '14-mobile-detail')
  await ctx.close()
})

// ------------------------------------------------------------------------------------------------------------
// Products with size variants (most of the real catalogue, e.g. BPC-157 5mg / 10mg)
// ------------------------------------------------------------------------------------------------------------
test('15. a product with sizes: the plan price follows the chosen size, and the cart and checkout carry that size', async ({ page, request }) => {
  const admin = await adminApi(request)
  await admin.createProduct({
    name: 'Peptide Sizes',
    slug: 'peptide-sizes',
    price: 90,
    stock: 100,
    status: 'active',
    isVisible: true,
    hasVariants: true,
    subscriptionEnabled: true,
    variants: [
      { sku: 'SIZE-5MG', price: 90, stock: 50, options: [{ key: 'Size', value: '5mg' }] },
      { sku: 'SIZE-10MG', price: 99, stock: 50, options: [{ key: 'Size', value: '10mg' }] },
    ],
  })

  // start from a clean cart (browser and server copy), so earlier scenarios cannot leak into this one
  await sql('delete from carts_items')
  await sql('delete from carts')
  await login(page, ALICE)
  await seedCart(page, [])
  await go(page, '/products/peptide-sizes')
  await expect(page.getByTestId('plan-3')).toContainText('$72.00') // 5mg: $90 less 20%
  await page.getByRole('button', { name: '10mg', exact: true }).click()
  await expect(page.getByTestId('plan-3')).toContainText('$79.20') // 10mg: $99 less 20%
  await expect(page.getByTestId('plan-6')).toContainText('$84.15') // 10mg: $99 less 15%
  await expect(page.getByTestId('plan-3')).toContainText('Deliver every 3 months')
  await expect(page.getByTestId('plan-3')).toContainText('Subscription · pay one order at a time · pause anytime') // the words are spaced properly
  await shot(page, '15-variant-plan-prices')

  await page.getByTestId('plan-3').click()
  await page.getByRole('button', { name: /^Subscribe$/ }).first().click()
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('longevia-cart-storage') || '{}').state?.items || []).length === 1)
  const line = await page.evaluate(() => JSON.parse(localStorage.getItem('longevia-cart-storage') || '{}').state.items[0])
  expect(line).toMatchObject({ variantSku: 'SIZE-10MG', planMonths: 3, priceSnapshot: 79.2 })
  // the cart is also saved on the server (so it follows the customer to other devices)
  await expect.poll(async () => (await sql("select 1 from carts_items where variant_sku = 'SIZE-10MG' and plan_months = 3")).length).toBe(1)

  await go(page, '/checkout')
  await expect(page.getByTestId('subscription-notice')).toBeVisible()
  await expect(page.getByText('$79.20').first()).toBeVisible()
  await expect(page.getByTestId('subscription-due-today')).toBeVisible()
  await shot(page, '15-variant-checkout')
})

// ------------------------------------------------------------------------------------------------------------
// The "i" inside the scrolling order summary (it used to flicker and make scrollbars appear)
// ------------------------------------------------------------------------------------------------------------
test('16. the "i" in the order summary opens steadily: no flicker, no scrollbars, text fully readable', async ({ page }) => {
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  await go(page, '/checkout')
  const list = page.locator('div[data-lenis-prevent="true"]').filter({ has: page.getByTestId('plan-line-badge') }).last()
  await expect(list).toBeVisible()
  const sizes = () => list.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }))
  const before = await sizes()

  const icon = list.getByRole('button', { name: 'How often will I be invoiced?' })
  await icon.hover()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()
  await expect(tip).toContainText('one order at a time')

  // stays open, in the same place, for a good while (a flickering box would disappear/reappear)
  const box1 = await tip.boundingBox()
  let seenHidden = false
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(150)
    if (!(await tip.isVisible())) seenHidden = true
  }
  expect(seenHidden).toBe(false)
  const box2 = await tip.boundingBox()
  expect(box2!.x).toBeCloseTo(box1!.x, 0)
  expect(box2!.y).toBeCloseTo(box1!.y, 0)

  // the list did not grow scrollbars because of the box
  const during = await sizes()
  expect(during).toEqual(before)

  // fully on screen, and floating above the page (not clipped by the list)
  const vp = page.viewportSize()!
  expect(box1!.x).toBeGreaterThanOrEqual(0)
  expect(box1!.x + box1!.width).toBeLessThanOrEqual(vp.width)
  expect(box1!.y + box1!.height).toBeLessThanOrEqual(vp.height)
  await shot(page, '16-summary-tip')

  await page.mouse.move(5, 5)
  await expect(tip).toHaveCount(0)
})

// ------------------------------------------------------------------------------------------------------------
// Coupons on subscriptions: OFF by default, only switched-on coupons work, and the customer is told how long they last
// ------------------------------------------------------------------------------------------------------------
test('17. coupons on subscriptions: off by default; only coupons switched on for subscriptions work; the customer is told how long the discount lasts', async ({ page, request }) => {
  const base = { type: 'percentage', value: 10, applicableProductTypes: 'all', appliesTo: 'all' }
  const admin = await adminApi(request)
  await admin.replaceCoupons([
    { ...base, code: 'PLAIN-E2E' }, // created WITHOUT the new settings, like every existing coupon
    { ...base, code: 'FIRST-E2E', allowOnSubscriptions: true, subscriptionDiscountScope: 'first_month' },
    { ...base, code: 'EVERY-E2E', allowOnSubscriptions: true, subscriptionDiscountScope: 'every_month' },
  ])
  expect((await sql(`select allow_on_subscriptions, subscription_discount_scope from coupons where code = 'PLAIN-E2E'`))[0]).toMatchObject({ allow_on_subscriptions: false, subscription_discount_scope: 'first_month' })

  await sql('delete from carts_items')
  await sql('delete from carts')
  await login(page, ALICE)
  const planCart = () => seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 16, planMonths: 3 })])
  const NOT_ALLOWED = "This coupon can't be used on subscriptions."

  // ---- the cart page
  await planCart()
  await go(page, '/cart')
  await page.getByPlaceholder('Enter code...').fill('PLAIN-E2E')
  await page.getByPlaceholder('Enter code...').press('Enter')
  await expect(page.getByText(NOT_ALLOWED)).toBeVisible()

  // ---- checkout: a normal coupon is refused, switched-on coupons are accepted and say how long they last
  await planCart()
  await go(page, '/checkout')
  const codeBox = page.getByPlaceholder('Discount code or gift card').locator('visible=true').first()
  await codeBox.fill('PLAIN-E2E')
  await codeBox.press('Enter')
  await expect(page.getByText(NOT_ALLOWED)).toBeVisible()
  await expect(page.getByTestId('coupon-scope-note')).toHaveCount(0)

  await codeBox.fill('FIRST-E2E')
  await codeBox.press('Enter')
  await expect(page.getByTestId('coupon-scope-note').locator('visible=true').first()).toHaveText('Applies to your first payment only.')
  await expect(page.getByText('$20.00').locator('visible=true').first()).toBeVisible() // $16 - $1 (10%, whole dollars) + $5 shipping
  await shot(page, '17-checkout-first-month-coupon')
  await page.getByRole('button', { name: 'Remove' }).locator('visible=true').first().click()

  await codeBox.fill('EVERY-E2E')
  await codeBox.press('Enter')
  await expect(page.getByTestId('coupon-scope-note').locator('visible=true').first()).toHaveText('Applies to every order of your subscription.')
  await page.addStyleTag({ content: '[data-sonner-toaster] { display: none !important; }' }) // hide the pop-up messages so the picture shows the page itself
  await shot(page, '17-checkout-every-month-coupon')

  // ---- place the order with the every-month coupon
  await fillAddress(page)
  await page.getByText('Zelle', { exact: true }).click()
  await page.getByTestId('subscription-terms').click()
  await page.getByRole('button', { name: /Place Zelle Order/ }).click()
  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  const firstId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
  const row = (await sql(`select s.id as sub_id, s.recurring_coupon_code, o.coupon_code, o.discount_total, o.total from orders o join subscriptions s on s.id = o.subscription_id where o.id = $1`, [firstId]))[0]
  expect(row).toMatchObject({ recurring_coupon_code: 'EVERY-E2E', coupon_code: 'EVERY-E2E' })
  expect(Number(row.discount_total)).toBe(1)
  expect(Number(row.total)).toBe(20)
  await admin.markOrderPaid(firstId)

  // ---- the customer's subscription page and the next invoice show the coupon
  await go(page, `/account/subscriptions/${row.sub_id}`)
  await expect(page.getByTestId('recurring-coupon-note')).toContainText('Coupon EVERY-E2E is applied to every order.')
  answerDialogs(page, true)
  await page.getByRole('button', { name: 'Order next delivery now', exact: true }).click()
  await page.waitForURL(/\/pay\/\d+\//, { timeout: 60_000 })
  await expect(page.getByTestId('invoice-coupon-row')).toContainText('Coupon (EVERY-E2E)')
  await expect(page.getByTestId('invoice-coupon-row')).toContainText('-$1.00')
  await expect(page.getByText('$20.00').first()).toBeVisible() // order 2: the same $20.00
  await shot(page, '17-pay-page-coupon')

  // ---- the same normal coupon still works on a normal purchase
  await sql('delete from carts_items')
  await sql('delete from carts')
  await seedCart(page, [cartLine({ id: tb.id, name: tb.name, slug: tb.slug, price: 30 })])
  await go(page, '/checkout')
  const box2 = page.getByPlaceholder('Discount code or gift card').locator('visible=true').first()
  await box2.fill('PLAIN-E2E')
  await box2.press('Enter')
  await expect(page.getByText('PLAIN-E2E').locator('visible=true').first()).toBeVisible()
  await expect(page.getByTestId('coupon-scope-note')).toHaveCount(0)
})

test('18. the coupon form in the admin: "Can be used on subscriptions" is clear, and the "how long" choice only appears once it is ticked', async ({ page }) => {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill('admin@e2e.test')
  await page.locator('#field-password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL((u) => u.pathname.startsWith('/admin') && !u.pathname.includes('/login'), { timeout: 120_000 })
  await page.goto('/admin/collections/coupons/create')
  await expect(page.getByText('Can be used on subscriptions').first()).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText(/OFF \(default\): customers cannot use this coupon when their cart is a subscription/)).toBeVisible()
  await expect(page.getByText('On a subscription, the discount applies to')).toHaveCount(0) // hidden until the box is ticked
  await page.getByText('Can be used on subscriptions').first().click()
  await expect(page.getByText('On a subscription, the discount applies to').first()).toBeVisible()
  await expect(page.getByText(/Every order/).first()).toBeVisible()
  await shot(page, '18-admin-coupon-form')
})

// ------------------------------------------------------------------------------------------------------------
// The three plans: an order every month, every 3 months, every 6 months - the length is how often an order comes
// ------------------------------------------------------------------------------------------------------------
test('19. a monthly plan: 25% off, an order every month, and the next order is due one month after payment', async ({ page, request }) => {
  await sql('delete from carts_items')
  await sql('delete from carts')
  await login(page, ALICE)
  await seedCart(page, [cartLine({ id: bpc.id, name: bpc.name, slug: bpc.slug, price: 15, planMonths: 1 })])
  await go(page, '/checkout')
  await expect(page.getByTestId('subscription-notice')).toContainText('Subscription · delivered every month')
  await expect(page.getByTestId('plan-line-badge').first()).toContainText('Delivered every month')
  await expect(page.getByTestId('subscription-due-today')).toContainText('every month')
  await fillAddress(page)
  await page.getByText('Zelle', { exact: true }).click()
  await page.getByTestId('subscription-terms').click()
  await page.getByRole('button', { name: /Place Zelle Order/ }).click()
  await page.waitForURL(/\/order-confirmation\/\d+/, { timeout: 120_000 })
  const firstId = Number(page.url().match(/order-confirmation\/(\d+)/)![1])
  const row = (await sql(`select s.id as sub_id, s.plan_months, s.discount_percent, o.total from orders o join subscriptions s on s.id = o.subscription_id where o.id = $1`, [firstId]))[0]
  expect(Number(row.plan_months)).toBe(1)
  expect(Number(row.discount_percent)).toBe(25)
  expect(Number(row.total)).toBe(20) // $15 (= $20 less 25%) + $5 shipping
  await (await adminApi(request)).markOrderPaid(firstId)

  const due = (await sql(`select next_due_date, next_invoice_date from subscriptions where id = $1`, [row.sub_id]))[0]
  const gap = (new Date(due.next_due_date).getTime() - Date.now()) / 86400000
  expect(gap).toBeGreaterThanOrEqual(27) // about one month away
  expect(gap).toBeLessThanOrEqual(31)

  await go(page, '/account/subscriptions')
  await expect(page.getByText(/Delivered every month · 25% off/).first()).toBeVisible()
  await go(page, `/account/subscriptions/${row.sub_id}`)
  await expect(page.getByText(/a new order every month/).first()).toBeVisible()
  await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip next delivery', exact: true })).toBeVisible()
  await shot(page, '19-monthly-plan')
})
