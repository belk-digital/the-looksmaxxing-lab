/**
 * Where customers SEE the member discount, in a simulated browser:
 * - The cart summary: a logged-in customer sees "Member discount (15%)" and the total follows; a visitor who is not
 *   logged in sees what logging in would save (with a link that brings them back); a subscription cart sees neither.
 * - The order confirmation page and the account order page: "Member discount (15%)" on its own line, the coupon on
 *   another, and an order from before the member discount existed looks exactly as it did.
 * - The two small building blocks (the discount line and the "log in to save" nudge).
 *
 * (The checkout page uses the same two building blocks and the same maths; it is checked in a real browser.)
 * Next's router, login state, framer-motion, images and fonts are mocked; the pages themselves are the real thing.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'

const h = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  fees: [] as any[],
  coupons: [] as any[],
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: h.status, data: h.status === 'authenticated' ? { user: { email: 'a@b.co' } } : null }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => '/cart' }))
vi.mock('next/font/local', () => ({ default: () => ({ className: 'font-grotesk', variable: '' }) }))
vi.mock('next/image', async () => {
  const R = await import('react')
  return { default: (props: any) => R.createElement('img', { alt: props.alt, src: typeof props.src === 'string' ? props.src : '' }) }
})
vi.mock('next/link', async () => {
  const R = await import('react')
  return { default: ({ href, children, prefetch: _p, ...rest }: any) => R.createElement('a', { href, ...rest }, children) }
})
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
vi.mock('@/components/shop/PrimaryProductCard', () => ({ PrimaryProductCard: () => null }))
vi.mock('@/components/shop/QuantityStepper', () => ({ QuantityStepper: () => null }))
vi.mock('@/components/subscriptions/PlanLineBadge', () => ({ PlanLineBadge: () => null }))
vi.mock('@/components/shop/RestrictedCartNotice', () => ({ RestrictedCartNotice: () => null }))
vi.mock('@/components/motion/StaggerChildren', () => ({
  StaggerChildren: ({ children }: any) => children,
  staggerItemVariants: {},
}))
vi.mock('@/components/motion/FadeUp', () => ({ FadeUp: ({ children }: any) => children }))
vi.mock('@/lib/analytics/ecommerce', () => ({
  pushPurchase: vi.fn(),
  claimPurchaseEvent: () => false,
  buildPurchaseItems: () => [],
}))
vi.mock('@/lib/analytics/meta-pixel', () => ({ trackPurchase: vi.fn() }))

import { CartClient } from '../../src/app/(frontend)/(shop)/cart/CartClient'
import { OrderConfirmationClient } from '../../src/app/(frontend)/(shop)/order-confirmation/[id]/OrderConfirmationClient'
import { OrderDetailClient } from '../../src/app/(frontend)/(shop)/account/orders/[id]/OrderDetailClient'
import { MemberDiscountNudge, MemberDiscountRow } from '../../src/components/shop/MemberDiscount'
import { useCartStore } from '../../src/lib/cart/store'

const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ')

// ─── Building blocks ──────────────────────────────────────────────────────────

describe('the discount line', () => {
  afterEach(cleanup)

  it('reads "Member discount (15%)" with the amount taken off', () => {
    render(React.createElement(MemberDiscountRow, { amount: 6 }))
    const row = screen.getByTestId('member-discount-row')
    expect(text(row)).toContain('Member discount (15%)')
    expect(text(row)).toContain('-$6.00')
  })

  it('shows nothing when there is no discount', () => {
    render(React.createElement(MemberDiscountRow, { amount: 0 }))
    expect(screen.queryByTestId('member-discount-row')).toBeNull()
  })
})

describe('the "log in to save" nudge', () => {
  afterEach(cleanup)

  it('says what members save and what that is on this order, and brings the visitor back to where they were', () => {
    render(React.createElement(MemberDiscountNudge, { savings: 6, returnTo: '/checkout' }))
    const nudge = screen.getByTestId('member-discount-nudge')
    expect(text(nudge)).toContain('Members save 15% on every order')
    expect(text(nudge)).toContain('$6.00 on this one')
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login?next=%2Fcheckout')
  })

  it('returns to the basket from the basket', () => {
    render(React.createElement(MemberDiscountNudge, { savings: 6, returnTo: '/cart' }))
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login?next=%2Fcart')
  })

  it('shows nothing when there would be nothing to save', () => {
    render(React.createElement(MemberDiscountNudge, { savings: 0, returnTo: '/cart' }))
    expect(screen.queryByTestId('member-discount-nudge')).toBeNull()
  })

  it('never mentions GLP-1', () => {
    render(React.createElement(MemberDiscountNudge, { savings: 6, returnTo: '/cart' }))
    expect(text(screen.getByTestId('member-discount-nudge'))).not.toMatch(/glp/i)
  })
})

// ─── The cart ─────────────────────────────────────────────────────────────────

const cartLine = (over: Record<string, unknown> = {}) => ({
  lineId: 'bpc',
  productId: '1',
  variantSku: 'DEFAULT',
  quantity: 2,
  priceSnapshot: 20,
  product: { id: '1', name: 'BPC-157', slug: 'bpc-157', imageUrl: null },
  ...over,
})

describe('the cart page', () => {
  beforeEach(() => {
    h.status = 'unauthenticated'
    h.fees = []
    h.coupons = []
    useCartStore.setState({ items: [cartLine()] as any, couponCode: null } as any)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const body = url.includes('/api/shippingzones')
          ? { docs: [{ methods: [{ method: 'Standard Shipping', price: 500 }] }] }
          : url.includes('/api/processing-fees')
            ? { docs: h.fees }
            : url.includes('/api/coupons')
              ? { docs: h.coupons }
              : { docs: [] }
        return { ok: true, json: async () => body }
      }),
    )
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    useCartStore.setState({ items: [], couponCode: null } as any)
  })

  // "Total" appears twice on the page (a mobile bar and the summary): read both.
  const total = () => screen.getAllByText('Total').map((el) => text(el.parentElement)).join(' | ')

  it('a logged-in customer sees the member discount and the total follows (subtotal 40 - 6 + 5 shipping = 39)', async () => {
    h.status = 'authenticated'
    render(React.createElement(CartClient))
    const row = await screen.findByTestId('member-discount-row')
    expect(text(row)).toContain('Member discount (15%)')
    expect(text(row)).toContain('-$6.00')
    await waitFor(() => expect(total()).toContain('$39.00'))
    expect(screen.queryByTestId('member-discount-nudge')).toBeNull()
  })

  it('a visitor who is not logged in is shown what logging in would save, and the total is the full price', async () => {
    h.status = 'unauthenticated'
    render(React.createElement(CartClient))
    const nudge = await screen.findByTestId('member-discount-nudge')
    expect(text(nudge)).toContain('$6.00 on this one')
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login?next=%2Fcart')
    await waitFor(() => expect(total()).toContain('$45.00')) // 40 + 5 shipping, no discount
    expect(screen.queryByTestId('member-discount-row')).toBeNull()
  })

  it('the processing fee is estimated on the discounted subtotal, like the server charges it', async () => {
    h.status = 'authenticated'
    h.fees = [{ id: 1, name: 'Fee', type: 'percentage', amount: 10, isActive: true, isOptional: false }]
    render(React.createElement(CartClient))
    await screen.findByTestId('member-discount-row')
    await waitFor(() => expect(text(screen.getByText('Processing Fee').parentElement)).toContain('$3.40')) // 10% of 34
    expect(total()).toContain('$42.40') // 34 + 5 + 3.40
  })

  it('a subscription cart gets neither the discount nor the nudge (plans have their own discount)', async () => {
    h.status = 'authenticated'
    useCartStore.setState({ items: [cartLine({ planMonths: 3, priceSnapshot: 17 })] } as any)
    render(React.createElement(CartClient))
    await waitFor(() => expect(total()).toContain('$39.00')) // 34 + 5
    expect(screen.queryByTestId('member-discount-row')).toBeNull()
    expect(screen.queryByTestId('member-discount-nudge')).toBeNull()
  })

  it('a logged-out subscription cart is not nudged either', async () => {
    h.status = 'unauthenticated'
    useCartStore.setState({ items: [cartLine({ planMonths: 3, priceSnapshot: 17 })] } as any)
    render(React.createElement(CartClient))
    await waitFor(() => expect(total()).toContain('$39.00'))
    expect(screen.queryByTestId('member-discount-nudge')).toBeNull()
  })

  describe('the member discount cannot be combined with a discount code: whichever saves more', () => {
    const coupon = (value: number, over: Record<string, unknown> = {}) => ({
      code: 'CODE',
      type: 'percentage',
      value,
      appliesTo: 'all',
      applicableProductTypes: 'all',
      ...over,
    })
    const withCode = (doc: any) => {
      h.coupons = [doc]
      useCartStore.setState({ couponCode: doc.code } as any)
    }

    it('a code worth LESS (5% = $2 < $6): the member discount applies, the code is not used, and the customer is told', async () => {
      h.status = 'authenticated'
      withCode(coupon(5, { code: 'SAVE5' }))
      render(React.createElement(CartClient))
      const row = await screen.findByTestId('member-discount-row')
      expect(text(row)).toContain('-$6.00')
      expect(await screen.findByTestId('coupon-not-used-note')).toBeTruthy()
      expect(screen.queryByTestId('member-not-used-note')).toBeNull()
      await waitFor(() => expect(total()).toContain('$39.00')) // 40 - 6 + 5
      expect(text(document.body)).not.toContain('-$2.00') // the code's own discount is not shown
    })

    it('a code worth MORE (50% = $20 > $6): the code applies alone, the member discount is not added, and the customer is told', async () => {
      h.status = 'authenticated'
      withCode(coupon(50, { code: 'HALF' }))
      render(React.createElement(CartClient))
      expect(await screen.findByTestId('member-not-used-note')).toBeTruthy()
      expect(screen.queryByTestId('member-discount-row')).toBeNull()
      expect(screen.queryByTestId('coupon-not-used-note')).toBeNull()
      await waitFor(() => expect(total()).toContain('$25.00')) // 40 - 20 + 5
      expect(text(document.body)).toContain('-$20.00')
    })

    it('a gift card is paid on top of the member discount (no notes)', async () => {
      h.status = 'authenticated'
      withCode(coupon(0, { code: 'GIFT', type: 'store_credit' }))
      render(React.createElement(CartClient))
      expect(await screen.findByTestId('member-discount-row')).toBeTruthy()
      expect(screen.queryByTestId('coupon-not-used-note')).toBeNull()
      expect(screen.queryByTestId('member-not-used-note')).toBeNull()
    })

    it('a visitor who is not logged in just uses the code, as before (and no notes)', async () => {
      h.status = 'unauthenticated'
      withCode(coupon(50, { code: 'HALF' }))
      render(React.createElement(CartClient))
      await waitFor(() => expect(total()).toContain('$25.00'))
      expect(screen.queryByTestId('coupon-not-used-note')).toBeNull()
      expect(screen.queryByTestId('member-not-used-note')).toBeNull()
      expect(screen.queryByTestId('member-discount-row')).toBeNull()
    })

    it('a free-shipping code that loses does not give free shipping', async () => {
      h.status = 'authenticated'
      withCode(coupon(0, { code: 'SHIPFREE', type: 'free_shipping', freeShipping: true }))
      render(React.createElement(CartClient))
      expect(await screen.findByTestId('coupon-not-used-note')).toBeTruthy()
      await waitFor(() => expect(total()).toContain('$39.00')) // shipping is still charged: 40 - 6 + 5
    })
  })

  it('an empty basket shows no discount', async () => {
    h.status = 'authenticated'
    useCartStore.setState({ items: [] } as any)
    render(React.createElement(CartClient))
    await act(async () => undefined)
    expect(screen.queryByTestId('member-discount-row')).toBeNull()
  })
})

// ─── Order confirmation and the account order page ────────────────────────────

const confirmationOrder = (over: Record<string, unknown> = {}) => ({
  id: '1077',
  orderRef: '77',
  customerName: 'Ada Lovelace',
  email: 'ada@example.com',
  shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
  estimatedDelivery: '5-7 Business Days',
  items: [{ id: '1', productId: '1', name: 'BPC-157', variant: 'DEFAULT', price: 20, quantity: 2, image: '/x.png' }],
  subtotal: 40,
  shipping: 5,
  processingFee: 0,
  total: 45,
  discountTotal: 0,
  redeemedPoints: 0,
  couponCode: '',
  paymentMethod: 'stripe',
  paymentStatus: 'captured',
  subscription: null,
  ...over,
})

describe('the order confirmation page', () => {
  afterEach(cleanup)
  const open = (over: Record<string, unknown>) => render(React.createElement(OrderConfirmationClient, { order: confirmationOrder(over) as any }))

  it('shows "Member discount (15%)" with the amount', () => {
    open({ discountTotal: 6, memberDiscountTotal: 6, memberDiscountPercent: 15, total: 39 })
    const row = screen.getByTestId('order-member-discount')
    expect(text(row)).toContain('Member discount (15%)')
    expect(text(row)).toContain('-$6.00')
  })

  it('an order placed while the offer was still 20% keeps saying 20%', () => {
    open({ discountTotal: 8, memberDiscountTotal: 8, memberDiscountPercent: 20, total: 37 })
    const row = screen.getByTestId('order-member-discount')
    expect(text(row)).toContain('Member discount (20%)')
    expect(text(row)).toContain('-$8.00')
    expect(text(document.body)).not.toContain('(15%)')
  })

  it('shows the member discount and a coupon on separate lines', () => {
    open({ discountTotal: 11, memberDiscountTotal: 6, memberDiscountPercent: 15, couponCode: 'SAVE', total: 34 })
    expect(text(screen.getByTestId('order-member-discount'))).toContain('-$6.00')
    expect(document.body.textContent).toContain('Discount (SAVE)')
    expect(text(document.body)).toContain('-$5.00')
  })

  it('an order from before the member discount existed looks exactly as it did', () => {
    open({ discountTotal: 6, couponCode: 'SAVE', total: 39 }) // no member fields
    expect(screen.queryByTestId('order-member-discount')).toBeNull()
    expect(text(document.body)).toContain('Discount (SAVE)')
    expect(text(document.body)).toContain('-$6.00')
  })

  it('an order with no discount shows no discount line', () => {
    open({})
    expect(screen.queryByTestId('order-member-discount')).toBeNull()
    expect(text(document.body)).not.toContain('Discount (')
  })
})

describe('the account order page', () => {
  afterEach(cleanup)
  const accountOrder = (over: Record<string, unknown> = {}) => ({
    id: 77,
    orderNumber: '1077',
    status: 'paid',
    createdAt: '2026-11-20T10:00:00.000Z',
    items: [{ product: { id: 1, name: 'BPC-157', slug: 'bpc-157', images: [] }, variant: 'DEFAULT', price: 20, quantity: 2 }],
    subtotal: 40,
    shippingTotal: 5,
    taxTotal: 0,
    feeTotal: 0,
    total: 45,
    shippingAddress: { line1: '1 Main St', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
    paymentMethod: 'stripe',
    ...over,
  })
  const open = (over: Record<string, unknown>) => render(React.createElement(OrderDetailClient, { order: accountOrder(over) }))

  it('shows "Member discount (15%)" on its own line', () => {
    open({ discountTotal: 6, memberDiscountTotal: 6, memberDiscountPercent: 15, total: 39 })
    const row = screen.getByTestId('order-member-discount')
    expect(text(row)).toContain('Member discount (15%)')
    expect(text(row)).toContain('-$6.00')
  })

  it('shows the member discount and a coupon on separate lines', () => {
    open({ discountTotal: 11, memberDiscountTotal: 6, memberDiscountPercent: 15, couponCode: 'SAVE', total: 34 })
    expect(text(screen.getByTestId('order-member-discount'))).toContain('-$6.00')
    expect(text(document.body)).toContain('Discount (SAVE)')
    expect(text(document.body)).toContain('-$5.00')
  })

  it('an order from before the member discount existed looks exactly as it did', () => {
    open({ discountTotal: 6, couponCode: 'SAVE', total: 39 })
    expect(screen.queryByTestId('order-member-discount')).toBeNull()
    expect(text(document.body)).toContain('Discount (SAVE)')
  })
})
