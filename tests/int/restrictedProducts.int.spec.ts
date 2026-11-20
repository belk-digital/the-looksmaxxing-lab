/**
 * The members-only rule: nasal sprays, and GLP-3RTA / Tirzepatide / Semaglutide in every format, are for
 * logged-in customers only.
 *
 * What is tested:
 * - The rule sorts the REAL catalogue (all 98 live products) with no mistakes in either direction:
 *   52 members-only (49 sprays + the 3 gated vial products) and 46 public.
 * - The login redirect for members-only pages: who is sent where, and that the way back is a safe path.
 * - The kill switch (NEXT_PUBLIC_RESTRICT_SPRAYS=false) turns everything off.
 * - Helpers used by listings and the basket.
 *
 * Pure functions: no database, no network.
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
  cartHasRestricted,
  gateRestrictedPath,
  isRestrictedSlug,
  isRestrictionEnabled,
  productSlugFromPath,
  withoutRestricted,
} from '../../src/lib/access/restrictedProducts'
import { safeNextPath } from '../../src/lib/auth/safeRedirect'
import {
  GATED_COMPOUND_VIAL_SLUGS,
  MEMBERS_ONLY_SLUGS,
  NON_SPRAY_SLUGS,
  PUBLIC_SLUGS,
  SPRAY_SLUGS,
} from './fixtures/liveProductSlugs'

const savedFlag = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
afterEach(() => {
  if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
  else process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = savedFlag
})

describe('which products are members-only (the real catalogue)', () => {
  it('has the expected catalogue snapshot', () => {
    expect(SPRAY_SLUGS).toHaveLength(49)
    expect(NON_SPRAY_SLUGS).toHaveLength(49)
    expect(GATED_COMPOUND_VIAL_SLUGS).toHaveLength(3)
    expect(MEMBERS_ONLY_SLUGS).toHaveLength(52)
    expect(PUBLIC_SLUGS).toHaveLength(46)
    // the three gated vials are real non-spray products, and every product is in exactly one group
    expect(GATED_COMPOUND_VIAL_SLUGS.every((slug) => NON_SPRAY_SLUGS.includes(slug))).toBe(true)
    expect(new Set([...MEMBERS_ONLY_SLUGS, ...PUBLIC_SLUGS]).size).toBe(98)
  })

  it.each(SPRAY_SLUGS)('%s (a nasal spray) is restricted', (slug) => {
    expect(isRestrictedSlug(slug)).toBe(true)
  })

  it.each(GATED_COMPOUND_VIAL_SLUGS)('%s (a gated compound, vial format) is restricted', (slug) => {
    expect(isRestrictedSlug(slug)).toBe(true)
  })

  it.each(PUBLIC_SLUGS)('%s is NOT restricted', (slug) => {
    expect(isRestrictedSlug(slug)).toBe(false)
  })

  it('restricts the three compounds in EVERY format, sprays included', () => {
    for (const compound of ['glp-3rta', 'tirzepatide', 'semaglutide']) {
      const formats = SPRAY_SLUGS.concat(NON_SPRAY_SLUGS).filter((slug) => slug.includes(compound))
      expect(formats.length).toBeGreaterThanOrEqual(2) // a vial and a spray product
      expect(formats.every(isRestrictedSlug)).toBe(true)
    }
    // addresses that do not exist yet but follow the same naming
    expect(isRestrictedSlug('tirzepatide-60mg')).toBe(true)
    expect(isRestrictedSlug('semaglutide-vial-5mg')).toBe(true)
    expect(isRestrictedSlug('glp-3rta-30mg')).toBe(true)
  })

  it('is not fooled by similar names (no other product is caught by accident)', () => {
    for (const slug of ['glp-3', 'glp-1', 'semax', 'semax-selank', 'sermorelin', 'tesamorelin', 'cagrilintide', 'tirz', 'sema']) {
      expect(isRestrictedSlug(slug)).toBe(false)
    }
  })

  it('ignores letter case, and anything that is not a text address', () => {
    expect(isRestrictedSlug('BPC-157-SPRAY')).toBe(true)
    expect(isRestrictedSlug('TIRZEPATIDE')).toBe(true)
    expect(isRestrictedSlug('Semaglutide')).toBe(true)
    expect(isRestrictedSlug(undefined)).toBe(false)
    expect(isRestrictedSlug(null)).toBe(false)
    expect(isRestrictedSlug(42)).toBe(false)
    expect(isRestrictedSlug('')).toBe(false)
  })
})

describe('the kill switch', () => {
  it('is on unless it is explicitly set to "false"', () => {
    delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
    expect(isRestrictionEnabled()).toBe(true)
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'true'
    expect(isRestrictionEnabled()).toBe(true)
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    expect(isRestrictionEnabled()).toBe(false)
  })

  it('shows everything to everyone again when switched off', () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    for (const slug of MEMBERS_ONLY_SLUGS) {
      expect(isRestrictedSlug(slug)).toBe(false)
      expect(gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: false })).toEqual({ action: 'allow' })
    }
    expect(withoutRestricted([{ slug: 'bpc-157-spray' }, { slug: 'tirzepatide' }, { slug: 'bpc-157' }])).toHaveLength(3)
    expect(cartHasRestricted([{ product: { slug: 'bpc-157-spray' } }])).toBe(false)
    expect(cartHasRestricted([{ product: { slug: 'semaglutide' } }])).toBe(false)
  })
})

describe('reading a product address from a path', () => {
  it('finds the product address in /products/<slug>', () => {
    expect(productSlugFromPath('/products/bpc-157-spray')).toBe('bpc-157-spray')
    expect(productSlugFromPath('/products/bpc-157-spray/')).toBe('bpc-157-spray')
    expect(productSlugFromPath('/products/BPC%2D157%2Dspray')).toBe('BPC-157-spray')
  })

  it('returns null for every other kind of page', () => {
    for (const path of ['/products', '/products/', '/shop', '/', '/journal/some-spray-post', '/products/a/b', '/account/products/x-spray']) {
      expect(productSlugFromPath(path)).toBeNull()
    }
  })

  it('does not throw on a broken % sequence', () => {
    expect(productSlugFromPath('/products/%E0%A4%A-spray')).toBe('%E0%A4%A-spray')
  })
})

describe('sending logged-out visitors to the login page', () => {
  it('redirects a logged-out visitor asking for a spray page, with a way back', () => {
    const decision = gateRestrictedPath({ pathname: '/products/bpc-157-spray', hasToken: false })
    expect(decision).toEqual({
      action: 'redirect',
      to: '/login?next=%2Fproducts%2Fbpc-157-spray&reason=catalogue',
    })
  })

  it.each(GATED_COMPOUND_VIAL_SLUGS)('redirects a logged-out visitor asking for the %s page, with a way back', (slug) => {
    expect(gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: false })).toEqual({
      action: 'redirect',
      to: `/login?next=%2Fproducts%2F${slug}&reason=catalogue`,
    })
    expect(gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: true })).toEqual({ action: 'allow' })
  })

  it('lets a logged-in visitor through', () => {
    expect(gateRestrictedPath({ pathname: '/products/bpc-157-spray', hasToken: true })).toEqual({ action: 'allow' })
  })

  it('never touches public product pages, whoever is asking', () => {
    for (const slug of PUBLIC_SLUGS) {
      expect(gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: false })).toEqual({ action: 'allow' })
    }
    for (const path of ['/', '/shop', '/products', '/journal', '/about', '/cart', '/checkout']) {
      expect(gateRestrictedPath({ pathname: path, hasToken: false })).toEqual({ action: 'allow' })
    }
  })

  it('redirects every real members-only page (all 52)', () => {
    for (const slug of MEMBERS_ONLY_SLUGS) {
      const decision = gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: false })
      expect(decision.action).toBe('redirect')
    }
  })

  it('produces a way back that the login page will accept (a short path on this site)', () => {
    for (const slug of MEMBERS_ONLY_SLUGS) {
      const decision = gateRestrictedPath({ pathname: `/products/${slug}`, hasToken: false })
      if (decision.action !== 'redirect') throw new Error('expected a redirect')
      const next = new URL(decision.to, 'https://example.com').searchParams.get('next')
      expect(safeNextPath(next)).toBe(`/products/${slug}`)
    }
  })

  it('tells the login page why they were sent there', () => {
    const decision = gateRestrictedPath({ pathname: '/products/bpc-157-spray', hasToken: false })
    if (decision.action !== 'redirect') throw new Error('expected a redirect')
    expect(new URL(decision.to, 'https://example.com').searchParams.get('reason')).toBe('catalogue')
  })
})

describe('list and basket helpers', () => {
  it('withoutRestricted removes members-only products and keeps everything else, in order', () => {
    const items = [
      { slug: 'bpc-157' },
      { slug: 'bpc-157-spray' },
      { slug: 'tb-500' },
      { slug: 'tirzepatide' },
      { slug: undefined },
      { slug: 'glp-3rta-spray' },
      { slug: 'semaglutide' },
      { slug: 'glp-3rta' },
    ]
    expect(withoutRestricted(items).map((i) => i.slug)).toEqual(['bpc-157', 'tb-500', undefined])
  })

  it('cartHasRestricted spots a members-only product in the basket', () => {
    expect(cartHasRestricted([{ product: { slug: 'bpc-157' } }, { product: { slug: 'tb-500-5mg-10mg-45-sprays' } }])).toBe(true)
    expect(cartHasRestricted([{ product: { slug: 'bpc-157' } }, { product: { slug: 'tirzepatide' } }])).toBe(true)
    expect(cartHasRestricted([{ product: { slug: 'semaglutide' } }])).toBe(true)
    expect(cartHasRestricted([{ product: { slug: 'glp-3rta' } }])).toBe(true)
    expect(cartHasRestricted([{ product: { slug: 'bpc-157' } }, { product: null }, {}])).toBe(false)
    expect(cartHasRestricted([])).toBe(false)
  })
})
