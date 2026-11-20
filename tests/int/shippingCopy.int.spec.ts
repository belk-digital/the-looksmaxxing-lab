/**
 * Every order ships by Express Shipping ($20, 2-3 business days), so nothing on the site may still promise
 * "free shipping over $300", "2-day shipping on orders $300+" or "standard shipping 3-5 days".
 *
 * - A scan of the site's own text (announcement bar, banners, product page, About, FAQs, search-engine copy,
 *   llms.txt) that fails if an old promise comes back.
 * - The cart drawer: with only Express on offer it states the shipping price and time instead of inventing a
 *   free-shipping goal; a shop that DOES have a free-shipping method still gets its progress bar.
 *
 * No database, no network.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { render, screen, cleanup, waitFor } from '@testing-library/react'

// ─── The site's own text ──────────────────────────────────────────────────────

const ROOT = join(__dirname, '..', '..')
const SKIP_DIRS = new Set(['node_modules', '.next', '.next-test', 'migrations'])

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

const FILES = [...sourceFiles(join(ROOT, 'src')), join(ROOT, 'public', 'llms.txt')]

// Old promises that must not come back. (Coupons of the type "free shipping" are a different thing and are not matched.)
const OLD_PROMISES: Array<[string, RegExp]> = [
  ['"free shipping on/over/above orders over $300"', /free shipping[^.\n]{0,40}\$\s?300|\$\s?300[^.\n]{0,40}free shipping/i],
  ['"2-day shipping/delivery on orders $300+"', /2-day (shipping|delivery)[^.\n]{0,30}\$\s?300|\$\s?300\+?[^.\n]{0,30}2-day/i],
  ['"orders over/above $300"', /(over|above) \$300/i],
  ['"standard shipping (3-5 business days)"', /standard (shipping|delivery)[^.\n]{0,25}3\s?[-–]\s?5/i],
  ['"expedited 2-day"', /expedited 2-day/i],
]

describe('the site no longer promises free or standard shipping', () => {
  for (const [label, pattern] of OLD_PROMISES) {
    it(`has no ${label}`, () => {
      const offenders = FILES.filter((file) => pattern.test(readFileSync(file, 'utf8'))).map((file) => relative(ROOT, file))
      expect(offenders).toEqual([])
    })
  }

  it('says Express Shipping, $20, 2-3 business days in the announcement bar and the banner', () => {
    const header = readFileSync(join(ROOT, 'src/components/shared/ClientHeader.tsx'), 'utf8')
    expect(header).toContain('EXPRESS SHIPPING $20')
    expect(header).toContain('2-3 BUSINESS DAYS')
    expect(header).not.toMatch(/FREE SHIPPING/)
    const marquee = readFileSync(join(ROOT, 'src/components/shared/Marquee.tsx'), 'utf8')
    expect(marquee).toContain('EXPRESS SHIPPING')
    expect(marquee).toContain('2-3 BUSINESS DAYS')
  })

  it('says the same thing on the product page, the FAQs and llms.txt', () => {
    const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
    expect(read('src/app/(frontend)/(shop)/products/[slug]/ProductClient.tsx')).toContain('Flat $20 on every order')
    expect(read('src/app/(frontend)/(shop)/products/[slug]/ProductClient.tsx')).toContain('2-3 Business Days')
    for (const file of ['src/app/(frontend)/page.tsx', 'src/components/home/FaqSection.tsx', 'src/app/(frontend)/about/AboutClient.tsx']) {
      expect(read(file)).toMatch(/Express Shipping for a flat \$20, with delivery in 2–3 business days/)
    }
    expect(read('src/app/(frontend)/about/page.tsx')).toContain('Every order ships Express for a flat $20, delivered in 2-3 business days.')
    expect(read('public/llms.txt')).toContain('Every order ships by Express Shipping for a flat $20, with delivery in 2–3 business days.')
  })
})

// ─── The cart drawer ──────────────────────────────────────────────────────────

const h = vi.hoisted(() => ({ zone: { methods: [] as any[] } }))

vi.mock('next/image', async () => {
  const R = await import('react')
  return { default: (props: any) => R.createElement('img', { alt: props.alt, src: typeof props.src === 'string' ? props.src : '' }) }
})
vi.mock('next/link', async () => {
  const R = await import('react')
  return { default: ({ href, children, prefetch: _p, ...rest }: any) => R.createElement('a', { href, ...rest }, children) }
})
vi.mock('lenis/react', () => ({ useLenis: () => ({ stop: () => undefined, start: () => undefined }) }))
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
              const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
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
vi.mock('@/components/subscriptions/PlanLineBadge', () => ({ PlanLineBadge: () => null }))
vi.mock('@/components/shop/QuantityStepper', () => ({ QuantityStepper: () => null }))
vi.mock('@/lib/analytics/ecommerce', () => ({ pushViewCart: vi.fn(), pushRemoveFromCart: vi.fn() }))

import { CartDrawer } from '../../src/components/cart/CartDrawer'
import { useCartStore } from '../../src/lib/cart/store'

const line = (priceSnapshot: number) => ({
  lineId: 'bpc',
  productId: '1',
  variantSku: 'DEFAULT',
  quantity: 1,
  priceSnapshot,
  product: { id: '1', name: 'BPC-157', slug: 'bpc-157', imageUrl: null },
})
const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

describe('the cart drawer', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ docs: [{ methods: h.zone.methods }] }) })),
    )
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    useCartStore.setState({ items: [], isOpen: false } as any)
  })
  const open = (subtotal: number) => {
    useCartStore.setState({ items: [line(subtotal)], isOpen: true } as any)
    return render(React.createElement(CartDrawer))
  }

  it('with only Express Shipping on offer: says what shipping costs and how long it takes, never "free shipping"', async () => {
    h.zone.methods = [{ method: 'Express Shipping', price: 2000, estimatedDays: null, minOrderAmount: null }]
    open(500) // far above the old $300 line
    await waitFor(() => expect(text()).toContain('Express Shipping: $20.00 · 2-3 business days'))
    expect(text()).not.toMatch(/free shipping/i)
    expect(text()).not.toMatch(/unlocked/i)
    expect(screen.getByTestId('drawer-shipping-note').querySelector('[class*="rounded-full overflow-hidden"]')).toBeNull() // no progress bar
    // and the subtotal area does not claim "Free" shipping
    expect(text()).toContain('Calculated at checkout')
    expect(text()).not.toMatch(/Shipping\s*Free/)
  })

  it('shows the Express price from the shop\'s own shipping zone', async () => {
    h.zone.methods = [{ method: 'Express Shipping', price: 2500, estimatedDays: 2, minOrderAmount: null }]
    open(50)
    await waitFor(() => expect(text()).toContain('Express Shipping: $25.00'))
  })

  it('shows the Express defaults right away, before the shipping zone has loaded', () => {
    h.zone.methods = []
    open(50)
    expect(text()).toContain('Express Shipping: $20.00 · 2-3 business days')
    expect(text()).not.toMatch(/free shipping/i)
  })

  it('a shop that DOES have a free-shipping method still gets its progress bar and message', async () => {
    h.zone.methods = [
      { method: 'Standard Shipping', price: 500, estimatedDays: 5, minOrderAmount: null },
      { method: 'Free Shipping', price: 0, estimatedDays: 5, minOrderAmount: 100 },
    ]
    open(40)
    await waitFor(() => expect(text()).toContain('Add $60.00 more for free shipping'))
    expect(text()).not.toContain('Express Shipping: ')
  })

  it('...and tells the customer once they have unlocked it', async () => {
    h.zone.methods = [{ method: 'Free Shipping', price: 0, estimatedDays: 5, minOrderAmount: 100 }]
    open(150)
    await waitFor(() => expect(text()).toContain("You've unlocked free shipping!"))
  })
})
