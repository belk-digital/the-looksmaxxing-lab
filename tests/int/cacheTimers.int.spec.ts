// @vitest-environment node
/**
 * Guards the page cache lifetimes.
 *
 * Next.js needs `export const revalidate = <number>` to be a plain number written in the file,
 * so the only way to check it without building the site is to read the source.
 *
 * 2 days = 172800 seconds: home, journal list, journal posts, about, faq, the four legal pages,
 * certificates, the products list and every product page.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const APP = join(__dirname, '..', '..', 'src', 'app', '(frontend)')
const TWO_DAYS = 172800

const TWO_DAY_PAGES: Array<[label: string, file: string]> = [
  ['home', 'page.tsx'],
  ['journal list', 'journal/page.tsx'],
  ['journal post', 'journal/[slug]/page.tsx'],
  ['about', 'about/page.tsx'],
  ['faq', 'faq/page.tsx'],
  ['terms', 'terms/page.tsx'],
  ['privacy', 'privacy/page.tsx'],
  ['refund', 'refund/page.tsx'],
  ['disclaimer', 'disclaimer/page.tsx'],
  ['certificates', 'certificates/page.tsx'],
  ['products list', '(shop)/products/page.tsx'],
  ['product page', '(shop)/products/[slug]/page.tsx'],
]

const revalidateOf = (file: string): number | null => {
  const source = readFileSync(join(APP, file), 'utf8')
  const match = source.match(/^export const revalidate\s*=\s*(\d+)\s*(?:;|\/\/.*)?$/m)
  return match ? Number(match[1]) : null
}

describe('page cache lifetimes', () => {
  it.each(TWO_DAY_PAGES)('%s is cached for 2 days', (_label, file) => {
    expect(revalidateOf(file)).toBe(TWO_DAYS)
  })

  it('the 2-day number really is two days', () => {
    expect(TWO_DAYS).toBe(2 * 24 * 60 * 60)
  })
})

// Pages that must never be served from a saved copy.
const NEVER_CACHED: Array<[label: string, file: string]> = [
  ['cart', '(shop)/cart/page.tsx'],
  ['checkout', '(shop)/checkout/page.tsx'],
]

describe('pages that must never be cached', () => {
  it.each(NEVER_CACHED)('%s is built fresh on every visit', (_label, file) => {
    const source = readFileSync(join(APP, file), 'utf8')
    expect(source).toMatch(/^export const dynamic\s*=\s*['"]force-dynamic['"]/m)
    // and it must not have picked up a cache lifetime as well
    expect(source).not.toMatch(/^export const revalidate\s*=/m)
  })
})
