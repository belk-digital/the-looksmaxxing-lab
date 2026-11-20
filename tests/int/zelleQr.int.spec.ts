/**
 * The Zelle QR code shown to customers who pay by Zelle.
 *
 * The image: https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/LR_Zelle.webp
 *
 * What is tested:
 * - There is ONE definition of the address, and the old QR image is not referenced anywhere any more (so no email or
 *   page can show a different code).
 * - The order confirmation page shows it for an unpaid Zelle order, and only then.
 * - The order email shows it (with a text fallback of the payment details) for an unpaid Zelle order, and only then.
 * - The subscription emails (invoice, reminder) and the subscription pay page use the same QR.
 *
 * (That the image really loads and looks right is checked in a real browser: see the report.)
 * No database, no network.
 */

import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('next/image', async () => {
  const R = await import('react')
  // keep every attribute that matters, so the test can see unoptimized / sizes
  return {
    default: ({ src, alt, width, height, unoptimized, ...rest }: any) =>
      R.createElement('img', { src, alt, width, height, 'data-unoptimized': unoptimized ? 'true' : undefined, ...rest }),
  }
})
vi.mock('next/link', async () => {
  const R = await import('react')
  return { default: ({ href, children, prefetch: _p, ...rest }: any) => R.createElement('a', { href, ...rest }, children) }
})
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => '/' }))
vi.mock('framer-motion', async () => {
  const R = await import('react')
  const cache = new Map<string, unknown>()
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            R.forwardRef((props: any, ref) => {
              const { initial, animate, exit, transition, whileHover, whileInView, viewport, variants, layout, ...rest } = props
              return R.createElement(tag, { ...rest, ref })
            }),
          )
        }
        return cache.get(tag)
      },
    },
  )
  return { motion, AnimatePresence: ({ children }: any) => children }
})
vi.mock('@/components/motion/FadeUp', () => ({ FadeUp: ({ children }: any) => children }))
vi.mock('@/lib/analytics/ecommerce', () => ({ pushPurchase: vi.fn(), claimPurchaseEvent: () => false, buildPurchaseItems: () => [] }))
vi.mock('@/lib/analytics/meta-pixel', () => ({ trackPurchase: vi.fn() }))
vi.mock('@/components/ui/InfoTip', () => ({ InfoTip: () => null }))
vi.mock('@/lib/payments/submitHandoff', () => ({ submitBridgeHandoff: vi.fn() }))
vi.mock('../../src/app/(frontend)/(shop)/pay/actions', () => ({ startInvoiceCardPayment: vi.fn() }))

import { ZELLE_QR_ALT, ZELLE_QR_PIXELS, ZELLE_QR_URL } from '../../src/lib/payments/zelleQr'
import { generateOrderInvoiceHtml } from '../../src/lib/emails/generateOrderEmail'
import { buildInvoiceEmail, buildReminderEmail } from '../../src/lib/subscriptions/emails'
import { OrderConfirmationClient } from '../../src/app/(frontend)/(shop)/order-confirmation/[id]/OrderConfirmationClient'
import { InvoiceClient } from '../../src/app/(frontend)/(shop)/pay/[orderId]/[token]/InvoiceClient'

const QR = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/LR_Zelle.webp'

// ─── One definition ───────────────────────────────────────────────────────────

describe('the QR code address', () => {
  it('is the new LR_Zelle.webp image on the site\'s image host', () => {
    expect(ZELLE_QR_URL).toBe(QR)
    expect(ZELLE_QR_URL.startsWith('https://')).toBe(true)
    expect(ZELLE_QR_URL.endsWith('.webp')).toBe(true)
    expect(ZELLE_QR_PIXELS).toBe(597)
    expect(ZELLE_QR_ALT.toLowerCase()).toContain('zelle')
  })

  it('is the only QR image in the code: the old image is referenced nowhere', () => {
    const ROOT = join(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (['node_modules', '.next', '.next-test', 'migrations'].includes(name)) continue
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(name)) files.push(full)
      }
    }
    walk(join(ROOT, 'src'))
    const offenders = files.filter((f) => /longevia-zelle-qr/.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f))
    expect(offenders).toEqual([])
    // and every file that shows a Zelle QR takes it from the shared definition, not a copy of the address
    const copies = files
      .filter((f) => /LR_Zelle\.webp/.test(readFileSync(f, 'utf8')) && !/payments[\\/]zelleQr\.ts$/.test(f))
      .map((f) => relative(ROOT, f))
    expect(copies).toEqual([])
  })
})

// ─── The order confirmation page ──────────────────────────────────────────────

const confirmationOrder = (over: Record<string, unknown> = {}) => ({
  id: '1077',
  orderRef: '77',
  customerName: 'Ada Lovelace',
  email: 'ada@example.com',
  shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
  estimatedDelivery: '2-3 Business Days',
  items: [{ id: '1', productId: '1', name: 'BPC-157', variant: 'DEFAULT', price: 20, quantity: 2, image: '/x.png' }],
  subtotal: 40,
  shipping: 20,
  processingFee: 0,
  total: 60,
  discountTotal: 0,
  redeemedPoints: 0,
  couponCode: '',
  paymentMethod: 'zelle',
  paymentStatus: 'unpaid',
  subscription: null,
  ...over,
})

describe('the order confirmation page', () => {
  afterEach(cleanup)
  const open = (over: Record<string, unknown>) => render(React.createElement(OrderConfirmationClient, { order: confirmationOrder(over) as any }))

  it('shows the new QR code for an unpaid Zelle order, as the original, unprocessed image', () => {
    open({})
    const qr = screen.getByTestId('zelle-qr')
    expect(qr.getAttribute('src')).toBe(QR)
    expect(qr.getAttribute('alt')).toBe(ZELLE_QR_ALT)
    expect(qr.getAttribute('width')).toBe('200')
    expect(qr.getAttribute('height')).toBe('200')
    // served untouched: re-compressing a QR code can make it harder to scan
    expect(qr.getAttribute('data-unoptimized')).toBe('true')
  })

  it('shows the payment details next to it: amount, where to send it, the order number to quote', () => {
    open({})
    const t = (document.body.textContent ?? '').replace(/\s+/g, ' ')
    expect(t).toContain('Please pay $60.00 via Zelle to:')
    expect(t).toContain('support@longeviaresearch.com')
    expect(t).toContain('Order Number (#1077)')
  })

  it.each([
    ['a card order', { paymentMethod: 'stripe', paymentStatus: 'captured' }],
    ['a card order awaiting payment', { paymentMethod: 'authnet_bridge', paymentStatus: 'unpaid' }],
    ['a Zelle order that is already paid', { paymentMethod: 'zelle', paymentStatus: 'captured' }],
    ['an Apple Pay order', { paymentMethod: 'apple_pay', paymentStatus: 'unpaid' }],
  ])('shows no QR code for %s', (_label, over) => {
    open(over)
    expect(screen.queryByTestId('zelle-qr')).toBeNull()
  })
})

// ─── The order email ──────────────────────────────────────────────────────────

describe('the order email', () => {
  const order = (over: Record<string, unknown> = {}) => ({
    id: 77,
    orderNumber: '1077',
    createdAt: '2026-11-20T10:00:00.000Z',
    customerFirstName: 'Ada',
    customerLastName: 'Lovelace',
    guestEmail: 'ada@example.com',
    shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
    items: [{ productSnapshot: { name: 'BPC-157' }, variant: 'DEFAULT', price: 20, quantity: 2 }],
    subtotal: 40,
    shippingTotal: 20,
    total: 60,
    shippingMethod: 'Express Shipping',
    paymentMethod: 'zelle',
    paymentStatus: 'unpaid',
    ...over,
  })
  const imgs = (html: string) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  const qrImg = (html: string) => imgs(html).find((tag) => tag.includes('LR_Zelle'))

  it('shows the new QR code for an unpaid Zelle order', async () => {
    const html = await generateOrderInvoiceHtml(order())
    const tag = qrImg(html)
    expect(tag).toBeTruthy()
    expect(tag).toContain(`src="${QR}"`)
    expect(tag).toContain(`alt="${ZELLE_QR_ALT}"`)
    // explicit size attributes, so email clients lay it out at 200 x 200 before the image has loaded
    expect(tag).toContain('width="200"')
    expect(tag).toContain('height="200"')
    expect(tag).toContain('width: 200px')
  })

  it('also spells the payment out in text, so it still works where WebP images are not shown (classic Outlook)', async () => {
    const html = await generateOrderInvoiceHtml(order())
    // (the address has an invisible line-break point after the @ so it wraps on a phone instead of forcing a sideways scroll)
    expect(html).toContain('support@<wbr>longeviaresearch.com')
    const t = html.replace(/<wbr>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(t).toContain('please send $60.00 via Zelle to:')
    expect(t).toContain('support@longeviaresearch.com')
    expect(t).toMatch(/Order Number \(\s*#1077\s*\)/)
  })

  it('never uses the old image', async () => {
    expect(await generateOrderInvoiceHtml(order())).not.toContain('longevia-zelle-qr')
  })

  it.each([
    ['a card order', { paymentMethod: 'stripe', paymentStatus: 'captured' }],
    ['a card order awaiting payment', { paymentMethod: 'stripe', paymentStatus: 'unpaid' }],
    ['a Zelle order that is already paid', { paymentMethod: 'zelle', paymentStatus: 'captured' }],
    ['an Apple Pay order (instructions, but no QR)', { paymentMethod: 'apple_pay', paymentStatus: 'unpaid' }],
  ])('has no QR code for %s', async (_label, over) => {
    expect(qrImg(await generateOrderInvoiceHtml(order(over)))).toBeUndefined()
  })

  it('the QR is the only image beyond the product pictures', async () => {
    const html = await generateOrderInvoiceHtml(order())
    // one product (no picture on record -> a grey box) + the QR
    expect(imgs(html).filter((tag) => !tag.includes('LR_Zelle'))).toHaveLength(0)
  })
})

// ─── Subscription emails and pay page ─────────────────────────────────────────

describe('subscription invoices paid by Zelle', () => {
  const sub = (over: Record<string, unknown> = {}) => ({
    id: 5,
    orderNumber: '2001',
    cycleNumber: 2,
    invoiceToken: 'tok',
    invoiceDueDate: '2026-12-01T00:00:00.000Z',
    customerFirstName: 'Ada',
    paymentMethod: 'zelle',
    total: 51,
    subtotal: 34,
    shippingTotal: 20,
    items: [],
    ...over,
  })

  it('the invoice email shows the new QR, and no QR for a card invoice', () => {
    const zelle = buildInvoiceEmail({ order: sub(), subscriptionId: 9, reason: 'scheduled' }).html
    expect(zelle).toContain(`src="${QR}"`)
    expect(zelle).toContain('width="180"')
    expect(zelle).toContain('height="180"')
    expect(zelle).not.toContain('longevia-zelle-qr')
    expect(buildInvoiceEmail({ order: sub({ paymentMethod: 'authnet_bridge' }), subscriptionId: 9, reason: 'scheduled' }).html).not.toContain('LR_Zelle')
  })

  it('the reminder emails show the new QR too', () => {
    for (const stage of [1, 2] as const) {
      expect(buildReminderEmail({ order: sub(), subscriptionId: 9, stage }).html).toContain(`src="${QR}"`)
    }
  })

  const invoice = (over: Record<string, unknown> = {}) => ({
    orderId: '2001',
    token: 'tok',
    orderNumber: '2001',
    state: 'open' as const,
    returnedFromPayment: false,
    order: 2,
    intervalMonths: 1,
    discountPercent: 25,
    paymentMethod: 'zelle' as const,
    cardAvailable: true,
    total: 51,
    subtotal: 34,
    discount: 0,
    couponCode: null,
    shipping: 20,
    fees: 0,
    dueDate: '2026-12-01T00:00:00.000Z',
    paidAt: null,
    subscriptionId: '9',
    nextDueDate: null,
    items: [{ name: 'BPC-157', variant: 'DEFAULT', quantity: 1, lineTotal: 34 }],
    ...over,
  })

  it('the pay page shows the new QR for a Zelle invoice, untouched, and none for a card invoice', () => {
    render(React.createElement(InvoiceClient, { invoice: invoice() as any }))
    const qr = screen.getByTestId('zelle-qr')
    expect(qr.getAttribute('src')).toBe(QR)
    expect(qr.getAttribute('data-unoptimized')).toBe('true')
    expect(qr.getAttribute('alt')).toBe(ZELLE_QR_ALT)
    cleanup()
    render(React.createElement(InvoiceClient, { invoice: invoice({ paymentMethod: 'authnet_bridge' }) as any }))
    expect(screen.queryByTestId('zelle-qr')).toBeNull()
    cleanup()
  })
})
