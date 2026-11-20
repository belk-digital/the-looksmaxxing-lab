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
 * - The search box (?q=): typing searches after a pause, it shares the address bar with the other filters, and an
 *   answer from the address bar can never overwrite what the visitor has typed since.
 *
 * No database and no real browser: Next's router, the product loader, framer-motion and the product card are mocked.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { render, screen, act, waitFor, cleanup, fireEvent } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const nav = vi.hoisted(() => ({
  search: '',
  bailout: false,
  inView: false,
  authStatus: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  listeners: new Set<() => void>(),
  push: vi.fn(),
  replace: vi.fn(),
}))
const getShopProducts = vi.hoisted(() => vi.fn())

vi.mock('next-auth/react', () => ({ useSession: () => ({ status: nav.authStatus, data: null }) }))

vi.mock('next/navigation', async () => {
  const R = await import('react')
  return {
    useRouter: () => ({ push: nav.push, replace: nav.replace }),
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

// The shop screen loads its list through the viewer-aware function (it includes nasal sprays only for logged-in
// customers); the test stands in for the server with one mock.
vi.mock('@/app/(frontend)/(shop)/actions', () => ({
  getShopProducts: (...args: unknown[]) => getShopProducts(...args),
  getShopProductsForViewer: (...args: unknown[]) => getShopProducts(...args),
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
  nav.authStatus = 'unauthenticated'
  nav.listeners.clear()
  nav.push.mockReset()
  nav.replace.mockReset()
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

describe('the search box', () => {
  const box = () => screen.getByLabelText('Search products') as HTMLInputElement
  const form = () => box().closest('form') as HTMLFormElement
  const type = (text: string) => fireEvent.change(box(), { target: { value: text } })
  const wait = (ms: number) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)))
  /** The address the shop last asked for, e.g. "/shop?q=bpc". */
  const lastReplace = () => nav.replace.mock.calls.at(-1)?.[0] as string | undefined

  it('is in the filter bar, labelled for screen readers, with a phone-friendly keyboard and no zoom-in on iPhones', () => {
    render(React.createElement(ShopClient, props()))
    expect(form().getAttribute('role')).toBe('search')
    expect(box().getAttribute('inputmode')).toBe('search')
    expect(box().getAttribute('enterkeyhint')).toBe('search')
    // iOS Safari zooms the page in when a text box has a font smaller than 16px
    expect(box().className).toContain('text-base')
    expect(box().className).not.toMatch(/(^|\s)text-(xs|sm)(\s|$)/)
  })

  it('is part of the saved (cached) page, but empty', () => {
    nav.bailout = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const html = renderToString(React.createElement(ShopClient, props()))
    spy.mockRestore()
    expect(html).toContain('aria-label="Search products"')
    expect(html).not.toContain('Clear search')
  })

  it('searches a moment after the visitor stops typing, not on every key', async () => {
    render(React.createElement(ShopClient, props()))
    type('b')
    type('bp')
    type('bpc')
    expect(nav.replace).not.toHaveBeenCalled()

    await waitFor(() => expect(nav.replace).toHaveBeenCalledTimes(1))
    expect(lastReplace()).toBe('/shop?q=bpc')
    expect(nav.push).not.toHaveBeenCalled() // replace, so the back button isn't filled with half-typed words
  })

  it('Enter searches straight away', () => {
    render(React.createElement(ShopClient, props()))
    type('tirz')
    fireEvent.submit(form())
    expect(lastReplace()).toBe('/shop?q=tirz')
    expect(nav.replace).toHaveBeenCalledTimes(1)
  })

  it('trims spaces and does not search for nothing', () => {
    render(React.createElement(ShopClient, props()))
    type('   ')
    fireEvent.submit(form())
    expect(nav.replace).not.toHaveBeenCalled()
    type('  bpc  ')
    fireEvent.submit(form())
    expect(lastReplace()).toBe('/shop?q=bpc')
  })

  it('keeps the other filters when searching', async () => {
    nav.search = 'category=Hormonal%20Health&onSale=true'
    getShopProducts.mockResolvedValue(ok(['Gamma']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['Gamma']))
    type('bpc')
    fireEvent.submit(form())
    const url = new URL(lastReplace()!, 'https://x.test')
    expect(url.searchParams.get('q')).toBe('bpc')
    expect(url.searchParams.getAll('category')).toEqual(['Hormonal Health'])
    expect(url.searchParams.get('onSale')).toBe('true')
  })

  it('asks the server for the search and shows what comes back', async () => {
    nav.search = 'q=bpc'
    getShopProducts.mockResolvedValue(ok(['BPC-157']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['BPC-157']))
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ page: 1, q: 'bpc' })
    expect(box().value).toBe('bpc')
  })

  it('shows "Relevance" as the sort while searching (and not otherwise), until another sort is picked', async () => {
    render(React.createElement(ShopClient, props()))
    const options = () => screen.getByTestId('sort-select').textContent
    expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('newest')
    expect(options()).not.toContain('Relevance')

    getShopProducts.mockResolvedValue(ok(['BPC-157']))
    setUrl('q=bpc')
    await waitFor(() => expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('relevance'))
    expect(options()).toContain('Relevance')
    expect(getShopProducts.mock.calls[0][0].sort).toBeUndefined() // the server uses best-match order by default

    setUrl('q=bpc&sort=price-asc')
    await waitFor(() => expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('price-asc'))
  })

  it('a leftover "relevance" sort without a search falls back to newest', async () => {
    nav.search = 'sort=relevance'
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(screen.getByTestId('sort-select').getAttribute('data-value')).toBe('newest'))
  })

  it('the clear button empties the box and the search, and keeps the other filters', async () => {
    nav.search = 'q=bpc&category=Hormonal%20Health'
    getShopProducts.mockResolvedValue(ok(['BPC-157']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(box().value).toBe('bpc'))

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(box().value).toBe('')
    const url = new URL(lastReplace()!, 'https://x.test')
    expect(url.searchParams.has('q')).toBe(false)
    expect(url.searchParams.getAll('category')).toEqual(['Hormonal Health'])
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  })

  it('clearing the search also drops the "relevance" sort', async () => {
    nav.search = 'q=bpc&sort=relevance'
    getShopProducts.mockResolvedValue(ok(['BPC-157']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(box().value).toBe('bpc'))
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(lastReplace()).toBe('/shop')
  })

  it('Escape clears the box', async () => {
    nav.search = 'q=bpc'
    getShopProducts.mockResolvedValue(ok(['BPC-157']))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(box().value).toBe('bpc'))
    fireEvent.keyDown(box(), { key: 'Escape' })
    expect(box().value).toBe('')
    expect(lastReplace()).toBe('/shop')
  })

  it('follows the address bar when it changes from elsewhere (back button, "Clear all filters")', async () => {
    nav.search = 'q=bpc'
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(box().value).toBe('bpc'))

    getShopProducts.mockResolvedValue(ok(['Alpha', 'Beta']))
    setUrl('')
    await waitFor(() => expect(box().value).toBe(''))
    setUrl('q=tirz')
    await waitFor(() => expect(box().value).toBe('tirz'))
    // and following the address bar is not mistaken for the visitor searching
    await wait(600)
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('a late answer from the address bar never overwrites what was typed since', async () => {
    render(React.createElement(ShopClient, props()))
    type('bp')
    fireEvent.submit(form())
    expect(lastReplace()).toBe('/shop?q=bp')

    // the visitor carries on typing before the address bar has caught up...
    type('bpc')
    // ...then the address bar answers for the OLD text
    setUrl('q=bp')
    expect(box().value).toBe('bpc')

    // the newer text is still searched for, and its answer doesn't disturb the box either
    await waitFor(() => expect(lastReplace()).toBe('/shop?q=bpc'))
    setUrl('q=bpc')
    expect(box().value).toBe('bpc')
    await wait(600)
    expect(nav.replace).toHaveBeenCalledTimes(2)
  })

  it('typing back to what the address bar had before it caught up still searches for it', () => {
    render(React.createElement(ShopClient, props()))
    type('bp')
    fireEvent.submit(form()) // asks for q=bp; the address bar still says "nothing"
    type('') // the visitor deletes it again straight away
    fireEvent.submit(form())
    expect(nav.replace.mock.calls.map((c) => c[0])).toEqual(['/shop?q=bp', '/shop'])
  })

  it('says what was searched for when nothing matches', async () => {
    nav.search = 'q=zzz'
    getShopProducts.mockResolvedValue(ok([]))
    render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(screen.getByText('No products found')).toBeTruthy())
    expect(document.body.textContent).toContain('Nothing matched “zzz”')
  })
})

describe('nasal sprays (logged-in customers only)', () => {
  const FULL = ['Alpha', 'Beta', 'Spray-One', 'Spray-Two']

  it('a logged-in customer gets the full catalogue loaded right after the page appears', async () => {
    nav.authStatus = 'authenticated'
    getShopProducts.mockResolvedValue(ok(FULL))
    render(React.createElement(ShopClient, props()))

    await waitFor(() => expect(cards()).toEqual(FULL))
    expect(getShopProducts).toHaveBeenCalledTimes(1)
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ page: 1 })
  })

  it('a logged-out visitor keeps the public grid and triggers no extra request', async () => {
    nav.authStatus = 'unauthenticated'
    render(React.createElement(ShopClient, props()))
    await act(async () => undefined)
    expect(cards()).toEqual(['Alpha', 'Beta'])
    expect(getShopProducts).not.toHaveBeenCalled()
  })

  it('waits until it is known whether the visitor is logged in, then loads once', async () => {
    nav.authStatus = 'loading'
    nav.search = 'category=Hormonal%20Health'
    getShopProducts.mockResolvedValue(ok(['Spray-Filtered']))
    const view = render(React.createElement(ShopClient, props()))
    await act(async () => undefined)
    expect(getShopProducts).not.toHaveBeenCalled()

    nav.authStatus = 'authenticated'
    view.rerender(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['Spray-Filtered']))
    expect(getShopProducts).toHaveBeenCalledTimes(1)
    expect(getShopProducts.mock.calls[0][0]).toMatchObject({ page: 1, categories: ['Hormonal Health'] })
  })

  it('logging out replaces the full grid with the public one', async () => {
    nav.authStatus = 'authenticated'
    getShopProducts.mockResolvedValue(ok(FULL))
    const view = render(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(FULL))

    nav.authStatus = 'unauthenticated'
    getShopProducts.mockResolvedValue(ok(['Alpha', 'Beta']))
    view.rerender(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['Alpha', 'Beta']))
  })

  it('a slow answer for the logged-out grid cannot overwrite the logged-in grid', async () => {
    nav.authStatus = 'unauthenticated'
    const slowGuest = deferred<ReturnType<typeof ok>>()
    nav.search = 'onSale=true'
    getShopProducts.mockReturnValueOnce(slowGuest.promise)
    const view = render(React.createElement(ShopClient, props()))

    nav.authStatus = 'authenticated'
    getShopProducts.mockResolvedValueOnce(ok(['Member-Result']))
    view.rerender(React.createElement(ShopClient, props()))
    await waitFor(() => expect(cards()).toEqual(['Member-Result']))

    await act(async () => {
      slowGuest.resolve(ok(['Guest-Result']))
    })
    expect(cards()).toEqual(['Member-Result'])
  })

  describe('the "log in to see more" nudge at the end of the catalogue', () => {
    it('is shown to a logged-out visitor, and leads to the login page and back to the shop', async () => {
      render(React.createElement(ShopClient, props()))
      const link = await screen.findByRole('link', { name: 'Log in to see more' })
      expect(link.getAttribute('href')).toBe('/login?next=%2Fshop')
      expect(document.body.textContent).toContain('full catalogue')
    })

    it('is not shown to a logged-in customer', async () => {
      nav.authStatus = 'authenticated'
      getShopProducts.mockResolvedValue(ok(FULL))
      render(React.createElement(ShopClient, props()))
      await waitFor(() => expect(cards()).toEqual(FULL))
      expect(screen.queryByRole('link', { name: 'Log in to see more' })).toBeNull()
    })

    it('is not shown while the login state is still being checked (no flash)', () => {
      nav.authStatus = 'loading'
      render(React.createElement(ShopClient, props()))
      expect(screen.queryByRole('link', { name: 'Log in to see more' })).toBeNull()
    })

    it('is not shown when the restriction is switched off', () => {
      const saved = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
      process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
      render(React.createElement(ShopClient, props()))
      expect(screen.queryByRole('link', { name: 'Log in to see more' })).toBeNull()
      if (saved === undefined) delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
      else process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = saved
    })

    it('is not part of the cached page (it appears only once the visitor is known to be logged out)', () => {
      nav.bailout = true // while a page is built, Next.js cannot read the URL...
      nav.authStatus = 'loading' // ...and next-auth reports "loading": nobody's login state is known yet
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const html = renderToString(React.createElement(ShopClient, props()))
      spy.mockRestore()
      // the cached page is built before anyone's login state is known: no nudge, no personalised content
      expect(html).not.toContain('Log in to see more')
      expect(html).toContain('Alpha')
    })
  })
})
