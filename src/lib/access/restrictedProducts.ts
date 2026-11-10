/**
 * Nasal-spray products are only for logged-in customers.
 *
 * This file is the single definition of "restricted". It has no Node or database imports, so the
 * middleware (which runs on the edge), server code and browser code can all use it.
 *
 * A product is restricted when its address (slug) contains "spray". There is no separate "format" field on
 * a product, and every nasal-spray product on the site has "spray" in its slug (e.g. bpc-157-spray,
 * tb-500-5mg-10mg-45-sprays). If this ever needs to be controlled from the admin, replace
 * `isRestrictedSlug` with a check of a product checkbox (that needs a database migration).
 *
 * Kill switch: set NEXT_PUBLIC_RESTRICT_SPRAYS=false in Vercel (and redeploy) to show sprays to everyone again.
 */

export const RESTRICTED_SLUG_FRAGMENT = 'spray'

/** Why a visitor was sent to the login page. The login page uses it to explain what is going on. */
export const LOGIN_REASON_CATALOGUE = 'catalogue'

export const RESTRICTED_LOGIN_MESSAGE =
  'Nasal spray products are available to logged-in customers. Please log in or create a free account to continue.'

export function isRestrictionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RESTRICT_SPRAYS !== 'false'
}

export function isRestrictedSlug(slug: unknown): boolean {
  return isRestrictionEnabled() && typeof slug === 'string' && slug.toLowerCase().includes(RESTRICTED_SLUG_FRAGMENT)
}

/** Leaves restricted products out of a list (anything with a `slug`). */
export function withoutRestricted<T extends { slug?: unknown }>(items: readonly T[]): T[] {
  return items.filter((item) => !isRestrictedSlug(item?.slug))
}

/** "/products/bpc-157-spray" -> "bpc-157-spray"; null for any other path. */
export function productSlugFromPath(pathname: string): string | null {
  const match = /^\/products\/([^/]+)\/?$/.exec(pathname)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export type GateDecision = { action: 'allow' } | { action: 'redirect'; to: string }

/**
 * Decides what to do with a request for `pathname`: a logged-out visitor asking for a restricted product page is
 * sent to the login page (and brought back afterwards); everything else goes through untouched.
 * Only the path is carried in `next` (it must stay short and on this site for the login page to accept it).
 */
export function gateRestrictedPath(args: { pathname: string; hasToken: boolean }): GateDecision {
  if (args.hasToken) return { action: 'allow' }
  if (!isRestrictedSlug(productSlugFromPath(args.pathname))) return { action: 'allow' }
  return {
    action: 'redirect',
    to: `/login?next=${encodeURIComponent(args.pathname)}&reason=${LOGIN_REASON_CATALOGUE}`,
  }
}

/** True when any cart line is a restricted product (cart lines carry the product slug). */
export function cartHasRestricted(lines: ReadonlyArray<{ product?: { slug?: unknown } | null }>): boolean {
  return lines.some((line) => isRestrictedSlug(line?.product?.slug))
}
