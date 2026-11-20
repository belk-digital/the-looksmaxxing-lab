/**
 * Server side of the members-only rule (nasal sprays, and GLP-3RTA / Tirzepatide / Semaglutide in every format):
 * who gets them in the shop list, header menu, search, the /products page, checkout and Payload's public API.
 *
 * A small fake database stands in for Postgres. It understands exactly the filters the real queries use and
 * THROWS on any filter it does not know, so these tests also prove the code never relies on Payload's
 * "not_like" (which does not add wildcards and would hide nothing).
 * The spray products are listed FIRST, so a missing exclusion shows up immediately.
 *
 * No real database, no network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GATED_COMPOUND_VIAL_SLUGS, MEMBERS_ONLY_SLUGS, NON_SPRAY_SLUGS, PUBLIC_SLUGS, SPRAY_SLUGS } from './fixtures/liveProductSlugs'

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
// Members-only = a nasal spray, or one of the gated compounds (GLP-3RTA, Tirzepatide, Semaglutide) in any format.
const isMembersOnly = (slug: string) => MEMBERS_ONLY_SLUGS.includes(slug)
const PUBLIC_COUNT = PUBLIC_SLUGS.length // 46 products a logged-out visitor can see
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
  it('finds exactly the 52 members-only products (49 sprays + 3 gated vials) and asks the database with wildcard "contains"', async () => {
    const ids = await getRestrictedProductIds(fakePayload as any)
    expect(ids).toHaveLength(52)
    const expectedIds = PRODUCTS.filter((p) => isMembersOnly(p.slug)).map((p) => p.id)
    expect([...ids].sort()).toEqual([...expectedIds].sort())

    const call = state.finds[0]
    expect(call.where).toEqual({
      or: [
        { slug: { contains: 'spray' } },
        { slug: { contains: 'glp-3rta' } },
        { slug: { contains: 'tirzepatide' } },
        { slug: { contains: 'semaglutide' } },
      ],
    })
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
  it('gives a logged-out visitor every public product and nothing members-only, page after page', async () => {
    const slugs = await allShopSlugs((p) => getShopProducts(p))
    expect(slugs).toHaveLength(PUBLIC_COUNT)
    expect(slugs.some(isMembersOnly)).toBe(false)
    expect(new Set(slugs).size).toBe(PUBLIC_COUNT)
    expect([...slugs].sort()).toEqual([...PUBLIC_SLUGS].sort())
  })

  it('leaves out GLP-3RTA, Tirzepatide and Semaglutide (vials) for a logged-out visitor', async () => {
    const slugs = await allShopSlugs((p) => getShopProducts(p))
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) expect(slugs).not.toContain(slug)
    expect(slugs).toContain('bpc-157') // and still lists ordinary vials
  })

  it('paging stays correct for a logged-out visitor (no short or empty pages)', async () => {
    const first = await getShopProducts({ page: 1, limit: 24 })
    expect(first.products).toHaveLength(24)
    expect(first.totalPages).toBe(2)
    const last = await getShopProducts({ page: 2, limit: 24 })
    expect(last.products).toHaveLength(PUBLIC_COUNT - 24)
    expect(last.hasNextPage).toBe(false)
  })

  it('gives a logged-in customer the full catalogue including the sprays and the gated compounds', async () => {
    state.loggedIn = true
    const slugs = await allShopSlugs((p) => getShopProductsForViewer(p))
    expect(slugs).toHaveLength(98)
    expect(slugs.filter(isMembersOnly)).toHaveLength(52)
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) expect(slugs).toContain(slug)
  })

  it('gives a logged-out visitor the public list even through the viewer-aware function', async () => {
    state.loggedIn = false
    const slugs = await allShopSlugs((p) => getShopProductsForViewer(p))
    expect(slugs).toHaveLength(PUBLIC_COUNT)
    expect(slugs.some(isMembersOnly)).toBe(false)
  })

  it('cannot be talked into showing sprays: a "includeRestricted" flag sent by the browser is ignored', async () => {
    const res = await (getShopProducts as any)({ limit: 100, includeRestricted: true })
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
    const viaViewer = await (getShopProductsForViewer as any)({ limit: 100, includeRestricted: true })
    expect(viaViewer.products.some((p: any) => isMembersOnly(p.slug))).toBe(false) // still logged out
  })

  it('still hides sprays when the category filter is used', async () => {
    const res = await getShopProducts({ limit: 100, categories: ['Cat'] })
    expect(res.products.length).toBeGreaterThan(0)
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
  })

  it('second lock: even if the database filter failed, no spray reaches a logged-out visitor', async () => {
    state.ignoreIdExclusion = true
    const res = await getShopProducts({ limit: 100 })
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
  })

  it('shows sprays to everyone when the kill switch is off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const slugs = await allShopSlugs((p) => getShopProducts(p))
    expect(slugs).toHaveLength(98)
  })
})

// ─── Shop search box ─────────────────────────────────────────────────────────

describe('the shop search box (?q=)', () => {
  const productCalls = () => state.finds.filter((call) => call.collection === 'products')

  it('finds products for a logged-out visitor, and never a spray (even when searching for one)', async () => {
    const res = await getShopProductsForViewer({ q: 'bpc' })
    expect(res.success).toBe(true)
    expect(res.products.map((p: any) => p.slug)).toContain('bpc-157')
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)

    const spray = await getShopProductsForViewer({ q: 'bpc 157 spray' })
    expect(spray.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
    const bare = await getShopProductsForViewer({ q: 'spray' })
    expect(bare.products).toEqual([])
  })

  it('cannot find GLP-3RTA, Tirzepatide or Semaglutide for a logged-out visitor, by any of their names', async () => {
    for (const q of ['tirzepatide', 'semaglutide', 'glp-3rta', 'glp 3rta', 'tirz', 'sema', 'reta', 'retatrutide', 'tirzepetide']) {
      const res = await getShopProductsForViewer({ q })
      expect(res.success).toBe(true)
      expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
    }
  })

  it('finds the sprays and the gated compounds for a logged-in customer', async () => {
    state.loggedIn = true
    const res = await getShopProductsForViewer({ q: 'bpc 157 spray' })
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(true)
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) {
      const found = await getShopProductsForViewer({ q: slug })
      expect(found.products.map((p: any) => p.slug)).toContain(slug)
    }
  })

  it('the public list (what cached pages use) never searches into the sprays', async () => {
    state.loggedIn = true
    const res = await getShopProducts({ q: 'bpc 157 spray' })
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
  })

  it('second lock: no spray reaches a logged-out search even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const res = await getShopProductsForViewer({ q: 'bpc 157 spray' })
    expect(res.products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
  })

  it('searches only inside the products the visitor could see anyway (the other filters still apply)', async () => {
    const [ranking, listing] = [await getShopProductsForViewer({ q: 'bpc' }), productCalls()]
    expect(ranking.success).toBe(true)
    // both queries carry the "no sprays" exclusion; the second one is limited to the ranked ids
    expect(listing).toHaveLength(3) // restricted ids, the search pool, the final list
    expect(JSON.stringify(listing[1].where)).toContain('not_in')
    expect(JSON.stringify(listing[2].where)).toContain('not_in')
    expect(JSON.stringify(listing[2].where)).toContain('"in"')
  })

  it('answers with every match in one page (nothing to page through)', async () => {
    const res = await getShopProductsForViewer({ q: 'tb 500' })
    expect(res.success).toBe(true)
    expect(res.products.length).toBeGreaterThan(0)
    expect(res.hasNextPage).toBe(false)
    expect(res.totalPages).toBe(1)
  })

  it('a search with no match is an empty list, not an error, and skips the final lookup', async () => {
    const res = await getShopProductsForViewer({ q: 'zzzzzz' })
    expect(res).toMatchObject({ success: true, products: [], hasNextPage: false })
    expect(productCalls()).toHaveLength(2) // restricted ids + the search pool; no third query
  })

  it('keeps the visitor-chosen sort, and only uses best-match order when none was chosen', async () => {
    await getShopProductsForViewer({ q: 'bpc', sort: 'price-asc' })
    expect(productCalls().at(-1).sort).toBe('price')

    const chosen = await getShopProductsForViewer({ q: 'bpc', sort: 'relevance' })
    const unchosen = await getShopProductsForViewer({ q: 'bpc' })
    expect(chosen.products.map((p: any) => p.slug)).toEqual(unchosen.products.map((p: any) => p.slug))
    expect(unchosen.products[0].slug).toBe('bpc-157') // the product NAMED bpc-157 comes first
  })

  it('ignores a search that is blank or not text, and cuts an oversized one', async () => {
    for (const q of ['', '   ', undefined, 123, { $ne: 1 }]) {
      const res = await (getShopProductsForViewer as any)({ q, limit: 100 })
      expect(res.products).toHaveLength(PUBLIC_COUNT) // the ordinary (public) list
    }
    const huge = await getShopProductsForViewer({ q: `bpc ${'x'.repeat(5000)}` })
    expect(huge.success).toBe(true)
  })

  it('combines with the other filters', async () => {
    const res = await getShopProductsForViewer({ q: 'bpc', categories: ['Cat'] })
    expect(res.products.length).toBeGreaterThan(0)
    const none = await getShopProductsForViewer({ q: 'bpc', categories: ['Not A Category'] })
    expect(none.products).toEqual([])
  })
})

// ─── Header menu ─────────────────────────────────────────────────────────────

describe('the header menu', () => {
  it('shows a logged-out visitor 3 real products per category, none of them sprays', async () => {
    const menu = await getMegaMenuData()
    expect(menu[0].products).toHaveLength(3)
    expect(menu[0].products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
  })

  it('shows a logged-in customer the sprays too', async () => {
    state.loggedIn = true
    const menu = await getMegaMenuData()
    expect(menu[0].products.some((p: any) => isMembersOnly(p.slug))).toBe(true)
  })

  it('second lock: no spray in a logged-out menu even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const menu = await getMegaMenuData()
    expect(menu[0].products.some((p: any) => isMembersOnly(p.slug))).toBe(false)
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
    expect(body.some((p) => isMembersOnly(p.slug))).toBe(false)
  })

  it('still finds the ordinary products for a logged-out visitor', async () => {
    const { body } = await search('bpc 157')
    expect(body.length).toBeGreaterThan(0)
    expect(body.every((p) => !isMembersOnly(p.slug))).toBe(true)
    expect(body.some((p) => p.slug === 'bpc-157')).toBe(true)
  })

  it('finds sprays for a logged-in customer', async () => {
    state.loggedIn = true
    const { body } = await search('BPC 157 spray')
    expect(body.some((p) => isMembersOnly(p.slug))).toBe(true)
  })

  it('finds no GLP-3RTA, Tirzepatide or Semaglutide for a logged-out visitor, but finds them for a logged-in customer', async () => {
    for (const q of ['tirzepatide', 'semaglutide', 'glp-3rta', 'retatrutide']) {
      const out = await search(q)
      expect(out.body.some((p) => isMembersOnly(p.slug))).toBe(false)
    }
    state.loggedIn = true
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) {
      const { body } = await search(slug)
      expect(body.map((p) => p.slug)).toContain(slug)
    }
  })

  it('is never stored and reused for someone else', async () => {
    const { res } = await search('bpc')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('second lock: no spray in logged-out results even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const { body } = await search('BPC 157 spray')
    expect(body.some((p) => isMembersOnly(p.slug))).toBe(false)
  })
})

// ─── The "all products" page ─────────────────────────────────────────────────

describe('the /products list page (cached, shared by everyone)', () => {
  const productLinks = async () => {
    const html = renderToStaticMarkup(await ProductsPage())
    return [...html.matchAll(/href="\/products\/([^"]+)"/g)].map((m) => m[1])
  }

  it('lists the public products and nothing members-only (no spray, no GLP-3RTA / Tirzepatide / Semaglutide)', async () => {
    const links = await productLinks()
    expect(links).toHaveLength(PUBLIC_COUNT)
    expect(links.some(isMembersOnly)).toBe(false)
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) expect(links).not.toContain(slug)
  })

  it('second lock: no spray even if the database filter failed', async () => {
    state.ignoreIdExclusion = true
    const links = await productLinks()
    expect(links.some(isMembersOnly)).toBe(false)
  })

  it('is unchanged when the kill switch is off (the first 50 products, sprays included)', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const links = await productLinks()
    expect(links).toHaveLength(50)
    expect(links.some(isMembersOnly)).toBe(true)
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

  it.each(GATED_COMPOUND_VIAL_SLUGS)('refuses a logged-out order that contains %s', async (slug) => {
    expect(await restrictedOrderError(basket('bpc-157', slug))).toBe(RESTRICTED_LOGIN_MESSAGE)
    expect(await restrictedOrderError(basket(slug))).toBe(RESTRICTED_LOGIN_MESSAGE)
  })

  it('allows a logged-in customer to order sprays and the gated compounds', async () => {
    state.loggedIn = true
    expect(await restrictedOrderError(basket('bpc-157-spray'))).toBeNull()
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) expect(await restrictedOrderError(basket(slug))).toBeNull()
  })

  it('allows everything when switched off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    expect(await restrictedOrderError(basket('bpc-157-spray'))).toBeNull()
    expect(await restrictedOrderError(basket('tirzepatide', 'semaglutide', 'glp-3rta'))).toBeNull()
  })
})

// ─── Payload's public REST / GraphQL API ─────────────────────────────────────

describe("Payload's public products API", () => {
  const read = (req: any) => (productsAccess as any).read({ req })

  it('hides the members-only products from anyone not signed in to the admin', async () => {
    const result = await read({ payload: fakePayload })
    expect(result).toEqual({ and: [{ status: { equals: 'active' } }, { id: { not_in: expect.any(Array) } }] })
    // and the rule really leaves exactly the public products when applied to the products
    const visible = PRODUCTS.filter((p) => matches(p, result)).map((p) => p.slug)
    expect(visible).toHaveLength(PUBLIC_COUNT)
    expect(visible.some(isMembersOnly)).toBe(false)
    for (const slug of GATED_COMPOUND_VIAL_SLUGS) expect(visible).not.toContain(slug)
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
