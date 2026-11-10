/**
 * Server side of the nasal-spray rule: who gets sprays in the shop list, header menu, search and Payload's
 * public API.
 *
 * A small fake database stands in for Postgres. It understands exactly the filters the real queries use and
 * THROWS on any filter it does not know, so these tests also prove the code never relies on Payload's
 * "not_like" (which does not add wildcards and would hide nothing).
 * The spray products are listed FIRST, so a missing exclusion shows up immediately.
 *
 * No real database, no network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NON_SPRAY_SLUGS, SPRAY_SLUGS } from './fixtures/liveProductSlugs'

// ─── Fake database ────────────────────────────────────────────────────────────

const state = vi.hoisted(() => ({
  loggedIn: false,
  ignoreIdExclusion: false,
  finds: [] as any[],
}))

type FakeProduct = Record<string, any>
const PRODUCTS: FakeProduct[] = [...SPRAY_SLUGS, ...NON_SPRAY_SLUGS].map((slug, index) => ({
  id: index + 1,
  slug,
  name: slug.toUpperCase().replace(/-/g, ' '),
  status: 'active',
  isVisible: true,
  price: 10,
  salePrice: null,
  stock: 5,
  categories: [{ id: 1, name: 'Cat', slug: 'cat' }],
  images: [],
  variants: [],
  hasVariants: false,
}))

function leaf(doc: FakeProduct, field: string, condition: Record<string, any>): boolean {
  const value = doc[field]
  return Object.entries(condition).every(([operator, expected]) => {
    switch (operator) {
      case 'equals':
        return value === expected
      case 'not_equals':
        return value !== expected
      case 'in':
        return Array.isArray(value)
          ? value.some((v) => (expected as any[]).includes(typeof v === 'object' ? v.id : v))
          : (expected as any[]).includes(value)
      case 'not_in':
        if (state.ignoreIdExclusion) return true // simulates the database filter failing
        return !(expected as any[]).includes(value)
      case 'contains':
        return String(value ?? '').toLowerCase().includes(String(expected).toLowerCase())
      case 'greater_than':
        return Number(value) > Number(expected)
      default:
        throw new Error(`fake database: unsupported filter "${operator}" (not_like is NOT safe: it adds no wildcards)`)
    }
  })
}

function matches(doc: FakeProduct, where: any): boolean {
  if (!where) return true
  return Object.entries(where).every(([key, value]) => {
    if (key === 'and') return (value as any[]).every((w) => matches(doc, w))
    if (key === 'or') return (value as any[]).some((w) => matches(doc, w))
    return leaf(doc, key, value as Record<string, any>)
  })
}

async function fakeFind(args: any) {
  state.finds.push(args)
  if (args.collection === 'categories') {
    return { docs: [{ id: 1, name: 'Cat', slug: 'cat', isVisible: true }], totalDocs: 1, totalPages: 1, page: 1, hasNextPage: false }
  }
  if (args.collection !== 'products') throw new Error(`fake database: unexpected collection ${args.collection}`)

  const all = PRODUCTS.filter((product) => matches(product, args.where))
  const unpaged = args.pagination === false
  const limit = unpaged ? all.length : (args.limit ?? 10)
  const page = args.page ?? 1
  const docs = unpaged ? all : all.slice((page - 1) * limit, page * limit)
  return {
    docs,
    totalDocs: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / Math.max(limit, 1))),
    page,
    hasNextPage: !unpaged && page * limit < all.length,
  }
}

vi.mock('payload', () => ({ getPayload: async () => ({ find: (args: unknown) => fakeFind(args) }) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/payload.config', () => ({ default: {} }))
vi.mock('@/lib/access/viewer', () => ({ isLoggedIn: async () => state.loggedIn }))
vi.mock('@/lib/auth/getPayloadUser', () => ({ getPayloadUser: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { getRestrictedProductIds, publicProductsClause } from '../../src/lib/access/restrictedQuery'
import { restrictedOrderError } from '../../src/lib/access/orderGuard'
import { productsAccess } from '../../src/access/products'
import { RESTRICTED_LOGIN_MESSAGE } from '../../src/lib/access/restrictedProducts'
import { getShopProducts, getShopProductsForViewer } from '../../src/app/(frontend)/(shop)/actions'
import { getMegaMenuData } from '../../src/app/(frontend)/actions/megaMenu'
import { GET as searchRoute } from '../../src/app/(frontend)/api/search/route'
import ProductsPage from '../../src/app/(frontend)/(shop)/products/page'
import { renderToStaticMarkup } from 'react-dom/server'

const fakePayload = { find: (args: unknown) => fakeFind(args) }
const isSpray = (slug: string) => /spray/i.test(slug)
const savedFlag = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS

beforeEach(() => {
  state.loggedIn = false
  state.ignoreIdExclusion = false
  state.finds = []
  delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
})
afterEach(() => {
  if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
  else process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = savedFlag
})

/** Walks every page of a shop list and returns the product addresses. */
async function allShopSlugs(load: (p: { page: number; limit: number }) => Promise<any>): Promise<string[]> {
  const slugs: string[] = []
  for (let page = 1; page < 20; page++) {
    const res = await load({ page, limit: 24 })
    expect(res.success).toBe(true)
    slugs.push(...res.products.map((p: any) => p.slug))
    if (!res.hasNextPage) break
  }
  return slugs
}

// ─── The database lookup ─────────────────────────────────────────────────────

describe('finding the restricted products', () => {
  it('finds exactly the 49 spray products and asks the database with a wildcard "contains"', async () => {
    const ids = await getRestrictedProductIds(fakePayload as any)
    expect(ids).toHaveLength(49)
    const sprayIds = PRODUCTS.filter((p) => isSpray(p.slug)).map((p) => p.id)
    expect([...ids].sort()).toEqual([...sprayIds].sort())

    const call = state.finds[0]
    expect(call.where).toEqual({ slug: { contains: 'spray' } })
    expect(call.overrideAccess).toBe(true) // so it can never recurse into the access rule that uses it
  })

  it('builds a "not in these ids" filter, and never a "not_like"', async () => {
    const clause = await publicProductsClause(fakePayload as any)
    expect(clause).toEqual({ id: { not_in: expect.any(Array) } })
    expect(JSON.stringify(clause)).not.toContain('not_like')
  })

  it('does nothing when switched off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    expect(await getRestrictedProductIds(fakePayload as any)).toEqual([])
    expect(await publicProductsClause(fakePayload as any)).toBeNull()
    expect(state.finds).toHaveLength(0)
  })
})

// ─── Shop list ───────────────────────────────────────────────────────────────

describe('the shop product list', () => {
  it('gives a logged-out visitor every non-spray product and no spray, page after page', async () => {
    const slugs = await allShopSlugs((p) => getShopProducts(p))
    expect(slugs).toHaveLength(49)
    expect(slugs.some(isSpray)).toBe(false)
    expect(new Set(slugs).size).toBe(49)
  })

  it('paging stays correct for a logged-out visitor (no short or empty pages)', async () => {
    const first = await getShopProducts({ page: 1, limit: 24 })
    expect(first.products).toHaveLength(24)
    expect(first.totalPages).toBe(3)
    const last = await getShopProducts({ page: 3, limit: 24 })
    expect(last.products).toHaveLength(1)
  })

  it('gives a logged-in customer the full catalogue including the sprays', async () => {
    state.loggedIn = true
    const slugs = await allShopSlugs((p) => getShopProductsForViewer(p))
    expect(slugs).toHaveLength(98)
    expect(slugs.filter(isSpray)).toHaveLength(49)
  })

  it('gives a logged-out visitor the public list even through the viewer-aware function', async () => {
    state.loggedIn = false
    const slugs = await allShopSlugs((p) => getShopProductsForViewer(p))
    expect(slugs).toHaveLength(49)
    expect(slugs.some(isSpray)).toBe(false)
  })

  it('cannot be talked into showing sprays: a "includeRestricted" flag sent by the browser is ignored', async () => {
    const res = await (getShopProducts as any)({ limit: 100, includeRestricted: true })
    expect(res.products.some((p: any) => isSpray(p.slug))).toBe(false)
    const viaViewer = await (getShopProductsForViewer as any)({ limit: 100, includeRestricted: true })
    expect(viaViewer.products.some((p: any) => isSpray(p.slug))).toBe(false) // still logged out
  })

  it('still hides sprays when the category filter is used', async () => {
    const res = await getShopProducts({ limit: 100, categories: ['Cat'] })
    expect(res.products.length).toBeGreaterThan(0)
    expect(res.products.some((p: any) => isSpray(p.slug))).toBe(false)
  })

  it('second lock: even if the database filter failed, no spray reaches a logged-out visitor', async () => {
    state.ignoreIdExclusion = true
    const res = await getShopProducts({ limit: 100 })
    expect(res.products.some((p: any) => isSpray(p.slug))).toBe(false)
  })

  it('shows sprays to everyone when the kill switch is off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const slugs = await allShopSlugs((p) => getShopProducts(p))
    expect(slugs).toHaveLength(98)
  })
})

// ─── Header menu ─────────────────────────────────────────────────────────────

describe('the header menu', () => {
  it('shows a logged-out visitor 3 real products per category, none of them sprays', async () => {
    const menu = await getMegaMenuData()
    expect(menu[0].products).toHaveLength(3)
    expect(menu[0].products.some((p: any) => isSpray(p.slug))).toBe(false)
  })

  it('shows a logged-in customer the sprays too', async () => {
    state.loggedIn = true
    const menu = await getMegaMenuData()
    expect(menu[0].products.some((p: any) => isSpray(p.slug))).toBe(true)
  })

  it('second lock: no spray in a logged-out menu even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const menu = await getMegaMenuData()
    expect(menu[0].products.some((p: any) => isSpray(p.slug))).toBe(false)
  })
})

// ─── Search ──────────────────────────────────────────────────────────────────

describe('search', () => {
  const search = async (q: string) => {
    const res = await searchRoute(new Request(`https://example.com/api/search?q=${encodeURIComponent(q)}`))
    return { res, body: (await res.json()) as Array<{ slug: string }> }
  }

  it('finds no spray for a logged-out visitor, even when searching for one by name', async () => {
    const { body } = await search('BPC 157 spray')
    expect(body.some((p) => isSpray(p.slug))).toBe(false)
  })

  it('still finds the ordinary products for a logged-out visitor', async () => {
    const { body } = await search('bpc 157')
    expect(body.length).toBeGreaterThan(0)
    expect(body.every((p) => !isSpray(p.slug))).toBe(true)
    expect(body.some((p) => p.slug === 'bpc-157')).toBe(true)
  })

  it('finds sprays for a logged-in customer', async () => {
    state.loggedIn = true
    const { body } = await search('BPC 157 spray')
    expect(body.some((p) => isSpray(p.slug))).toBe(true)
  })

  it('is never stored and reused for someone else', async () => {
    const { res } = await search('bpc')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('second lock: no spray in logged-out results even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const { body } = await search('BPC 157 spray')
    expect(body.some((p) => isSpray(p.slug))).toBe(false)
  })
})

// ─── The "all products" page ─────────────────────────────────────────────────

describe('the /products list page (cached, shared by everyone)', () => {
  const productLinks = async () => {
    const html = renderToStaticMarkup(await ProductsPage())
    return [...html.matchAll(/href="\/products\/([^"]+)"/g)].map((m) => m[1])
  }

  it('lists the ordinary products and no spray', async () => {
    const links = await productLinks()
    expect(links).toHaveLength(49)
    expect(links.some(isSpray)).toBe(false)
  })

  it('second lock: no spray even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const links = await productLinks()
    expect(links.some(isSpray)).toBe(false)
  })

  it('is unchanged when the kill switch is off (the first 50 products, sprays included)', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const links = await productLinks()
    expect(links).toHaveLength(50)
    expect(links.some(isSpray)).toBe(true)
  })
})

// ─── Checkout guard ──────────────────────────────────────────────────────────

describe('the checkout guard', () => {
  const basket = (...slugs: string[]) => new Map(slugs.map((slug, i) => [String(i), { slug }]))

  it('allows an ordinary order, logged in or not', async () => {
    expect(await restrictedOrderError(basket('bpc-157', 'tb-500'))).toBeNull()
    state.loggedIn = true
    expect(await restrictedOrderError(basket('bpc-157'))).toBeNull()
  })

  it('refuses a logged-out order that contains a nasal spray', async () => {
    expect(await restrictedOrderError(basket('bpc-157', 'bpc-157-spray'))).toBe(RESTRICTED_LOGIN_MESSAGE)
  })

  it('allows a logged-in customer to order sprays', async () => {
    state.loggedIn = true
    expect(await restrictedOrderError(basket('bpc-157-spray'))).toBeNull()
  })

  it('allows everything when switched off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    expect(await restrictedOrderError(basket('bpc-157-spray'))).toBeNull()
  })
})

// ─── Payload's public REST / GraphQL API ─────────────────────────────────────

describe("Payload's public products API", () => {
  const read = (req: any) => (productsAccess as any).read({ req })

  it('hides the sprays from anyone not signed in to the admin', async () => {
    const result = await read({ payload: fakePayload })
    expect(result).toEqual({ and: [{ status: { equals: 'active' } }, { id: { not_in: expect.any(Array) } }] })
    // and the rule really leaves exactly the non-sprays when applied to the products
    const visible = PRODUCTS.filter((p) => matches(p, result)).map((p) => p.slug)
    expect(visible).toHaveLength(49)
    expect(visible.some(isSpray)).toBe(false)
  })

  it('lets admins and staff see everything', async () => {
    expect(await read({ user: { role: 'admin' }, payload: fakePayload })).toEqual({})
    expect(await read({ user: { role: 'staff' }, payload: fakePayload })).toEqual({})
  })

  it('does not narrow the rule for other signed-in users', async () => {
    expect(await read({ user: { role: 'customer' }, payload: fakePayload })).toEqual({ status: { equals: 'active' } })
  })

  it('falls back to the active-only rule when switched off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    expect(await read({ payload: fakePayload })).toEqual({ status: { equals: 'active' } })
  })

  it('keeps the other rules unchanged', () => {
    expect((productsAccess as any).create({ req: { user: { role: 'admin' } } })).toBe(true)
    expect((productsAccess as any).create({ req: { user: { role: 'staff' } } })).toBe(false)
    expect((productsAccess as any).update({ req: {} })).toBe(false)
    expect((productsAccess as any).delete({ req: { user: { role: 'admin' } } })).toBe(true)
  })
})
