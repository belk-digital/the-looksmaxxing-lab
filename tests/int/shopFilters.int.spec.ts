/**
 * Tests for the cached /shop page's filters.
 *
 * /shop is saved for 2 days, so Next.js builds it WITHOUT knowing the visitor's address-bar filters. The filters
 * are therefore handed to the shop after the page loads (src/components/shop/ShopParams.tsx).
 *
 * What is tested:
 * - The saved page still contains the full default product grid (what search engines read), even when Next.js
 *   cannot read the URL while building it.
 * - In the browser: no wasted re-fetch of the default grid; arriving from a category link filters the grid,
 *   the chip and the sidebar checkbox; clearing filters returns to the default grid.
 * - A slow answer for old filters can never overwrite the newer filters; "load more" can't mix pages from
 *   different filters.
 * - The sort dropdown follows the URL.
 *
 * No database and no real browser: Next's router, the product loader, framer-motion and the product card are mocked.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { render, screen, act, waitFor, cleanup } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const nav = vi.hoisted(() => ({
  search: '',
  bailout: false,
  inView: false,
  listeners: new Set<() => void>(),
  push: vi.fn(),
}))
const getShopProducts = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', async () => {
  const R = await import('react')
  return {
    useRouter: () => ({ push: nav.push }),
    usePathname: () => '/shop',
    useSearchParams: () => {
      // While Next.js builds a cached page it cannot read the URL and throws this kind of error.
      if (nav.bailout) throw new Error('BAILOUT_TO_CLIENT_SIDE_RENDERING')
      const search = R.useSyncExternalStore(
        (cb) => {
          nav.listeners.add(cb)
          return () => nav.listeners.delete(cb)
        },
        () => nav.search,
        () => nav.search,
      )
      return new URLSearchParams(search)
    },
  }
})

vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  getShopProducts: (...args: unknown[]) => getShopProducts(...args),
}))

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
              const { initial, animate, whileHover, whileInView, viewport, transition, variants, exit, style, layout, ...rest } = props
              return R.createElement(tag, { ...rest, ref })
            }),
          )
        }
        return cache.get(tag)
      },
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
    useInView: () => nav.inView,
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 0,
  }
})

vi.mock('next/image', async () => {
  const R = await import('react')
  return { default: (props: any) => R.createElement('img', { alt: props.alt, src: typeof props.src === 'string' ? props.src : '' }) }
})
vi.mock('next/link', async () => {
  const R = await import('react')
  return { default: ({ href, children }: any) => R.createElement('a', { href }, children) }
})

vi.mock('@/components/shop/PrimaryProductCard', async () => {
  const R = await import('react')
  return { PrimaryProductCard: ({ product }: any) => R.createElement('div', { 'data-testid': 'card' }, product.name) }
})

// Radix widgets need a real browser; light stand-ins that keep the props the shop passes.
vi.mock('@/components/ui/select', async () => {
  const R = await import('react')
  const pass = ({ children }: any) => R.createElement(R.Fragment, null, children)
  return {
    Select: ({ value, children }: any) => R.createElement('div', { 'data-testid': 'sort-select', 'data-value': value }, children),
    SelectTrigger: pass,
    SelectContent: pass,
    SelectItem: pass,
    SelectValue: pass,
  }
})
vi.mock('@/components/ui/dropdown-menu', async () => {
  const R = await import('react')
  const pass = ({ children }: any) => R.createElement(R.Fragment, null, children)
  return { DropdownMenu: pass, DropdownMenuTrigger: pass, DropdownMenuContent: pass }
})
vi.mock('@/components/ui/checkbox', async () => {
  const R = await import('react')
  return {
    Checkbox: ({ id, checked, onCheckedChange }: any) =>
      R.createElement('input', { type: 'checkbox', id, checked: !!checked, onChange: (e: any) => onCheckedChange?.(e.target.checked) }),
  }
})
vi.mock('@/components/ui/slider', async () => {
  const R = await import('react')
  return { Slider: ({ value }: any) => R.createElement('div', { 'data-testid': 'price-slider', 'data-value': JSON.stringify(value) }) }
})
vi.mock('@/components/ui/radio-group', async () => {
  const R = await import('react')
  const pass = ({ children }: any) => R.createElement(R.Fragment, null, children)
  return { RadioGroup: pass, RadioGroupItem: pass }
})

import { ShopClient } from '../../src/components/shop/ShopClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const product = (name: string) => ({
  name,
  slug: name.toLowerCase().replace(/\W+/g, '-'),
  image: '/x.png',
  shortDescription: '',
  priceRange: '$10',
  category: 'c',
})
const ok = (names: string[], extra: Record<string, unknown> = {}) => ({
  success: true,
  products: names.map(product),
  totalPages: 1,
  hasNextPage: false,
  ...extra,
})
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const CATEGORIES = [
  { id: 1, name: 'Hormonal Health', slug: 'hormonal-health' },
  { id: 2, name: 'Longevity Research', slug: 'longevity-research' },
]

const props = (over: Record<string, unknown> = {}) => ({
  initialProducts: ['Alpha', 'Beta'].map(product),
  totalPages: 1,
  categories: CATEGORIES,
  ...over,
})

const cards = () => screen.queryAllByTestId('card').map((el) => el.textContent)

/** Simulates the address bar changing (a filter click, back button, or a link from another page). */
const setUrl = (search: string) => {
  act(() => {
    nav.search = search
    nav.listeners.forEach((l) => l())
  })
}

beforeEach(() => {
  nav.search = ''
  nav.bailout = false
  nav.inView = false
  nav.listeners.clear()
  nav.push.mockReset()
  getShopProducts.mockReset()
  getShopProducts.mockResolvedValue(ok(['Default-From-Server']))
})
afterEach(() => cleanup())

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('the saved (cached) page', () => {
  it('contains the full default grid even when Next.js cannot read the URL while building', () => {
    nav.bailout = true // what Next.js does while it builds a cached page
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const html = renderToString(React.createElement(ShopClient, props()))
    spy.mockRestore()

    expect(html).toContain('Alpha')
    expect(html).toContain('Beta')
    expect(html).toContain('THE COMPLETE COLLECTION')
    // no filter chips in the saved copy: it is the default shop
    expect(html).not.toContain('In Stock<')
  })
})

describe('in the browser', () => {
  it('shows the default grid from the page and does not fetch it again', async () => {
    render(React.createElement(ShopClient, props()))
    await act(async () => undefined)
    expect(cards()).toEqual(['Alpha', 'Beta'])
    expect(getShopProducts).not.toHaveBeenCalled()
    expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('newest')
  })

  it('arriving from a category link filters the grid, shows the chip and ticks the sidebar box', async () => {
    nav.search = 'category=Hormonal%20Health'
    getShopProducts.mockResolvedValue(ok(['Gamma']))
    render(React.createElement(ShopClient, props()))

    await waitFor(() => expect(cards()).toEqual(['Gamma']))
    expect(getShopProducts).toHaveBeenCalledTimes(1)
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ page: 1, categories: ['Hormonal Health'] })
    expect(screen.getByRole('button', { name: 'Hormonal Health' })).toBeTruthy()
    expect((document.getElementById('cat-hormonal-health') as HTMLInputElement).checked).toBe(true)
    expect((document.getElementById('cat-longevity-research') as HTMLInputElement).checked).toBe(false)
  })

  it('applies filters that are added after the page loaded (filter clicks, back button)', async () => {
    render(React.createElement(ShopClient, props()))
    getShopProducts.mockResolvedValue(ok(['OnSale-Item']))
    setUrl('onSale=true')

    await waitFor(() => expect(cards()).toEqual(['OnSale-Item']))
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ page: 1, onSale: true })
  })

  it('clearing the filters goes back to the default grid', async () => {
    nav.search = 'category=Hormonal%20Health'
    getShopProducts.mockResolvedValue(ok(['Gamma']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['Gamma']))

    getShopProducts.mockResolvedValue(ok(['Alpha', 'Beta']))
    setUrl('')
    await waitFor(() => expect(cards()).toEqual(['Alpha', 'Beta']))
    expect(getShopProducts.mock.calls[1][0].categories).toBeUndefined()
  })

  it('a slow answer for old filters cannot overwrite the newer filters', async () => {
    render(React.createElement(ShopClient, props()))
    const slowOld = deferred<ReturnType<typeof ok>>()
    const fastNew = deferred<ReturnType<typeof ok>>()
    getShopProducts.mockReturnValueOnce(slowOld.promise).mockReturnValueOnce(fastNew.promise)

    setUrl('category=Old')
    setUrl('category=New')

    await act(async () => {
      fastNew.resolve(ok(['New-Result']))
    })
    await waitFor(() => expect(cards()).toEqual(['New-Result']))

    await act(async () => {
      slowOld.resolve(ok(['Old-Result']))
    })
    expect(cards()).toEqual(['New-Result'])
  })

  it('"load more" never mixes the default grid\'s next page into a filtered grid', async () => {
    nav.search = 'category=Hormonal%20Health'
    nav.inView = true // the end of the grid is on screen straight away
    getShopProducts.mockImplementation(async (p: any) => {
      if (p.page === 2 && !p.categories) return ok(['Default-Page-2'])
      if (p.categories) return ok(['Filtered-1'])
      return ok([])
    })
    render(React.createElement(ShopClient, props({ totalPages: 2 })))

    await waitFor(() => expect(cards()).toContain('Filtered-1'))
    await act(async () => undefined)
    expect(cards()).not.toContain('Default-Page-2')
    expect(cards()).not.toContain('Alpha')
  })

  it('the sort dropdown follows the URL', async () => {
    render(React.createElement(ShopClient, props()))
    expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('newest')

    getShopProducts.mockResolvedValue(ok(['Cheap']))
    setUrl('sort=price-asc')
    await waitFor(() => expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('price-asc'))
    await waitFor(() => expect(cards()).toEqual(['Cheap']))
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ sort: 'price-asc' })
  })
})
