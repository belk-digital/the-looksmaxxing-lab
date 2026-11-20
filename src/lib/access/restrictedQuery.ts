/**
 * Database side of the members-only restriction. SERVER ONLY.
 *
 * Why this looks the way it does: Payload's "not like" filter does NOT add wildcards, so
 * `{ slug: { not_like: 'spray' } }` means "is not exactly 'spray'" and would hide nothing. Instead we ask the
 * database for the restricted products ("slug contains spray, or glp-3rta, or ...", which does add wildcards) and
 * exclude them by id. Doing it in the query (rather than only filtering the results afterwards) keeps paging correct.
 */

import type { Payload, Where } from 'payload'
import { RESTRICTED_SLUG_FRAGMENTS, isRestrictedSlug, isRestrictionEnabled } from './restrictedProducts'

export async function getRestrictedProductIds(payload: Payload): Promise<Array<string | number>> {
  if (!isRestrictionEnabled()) return []

  const { docs } = await payload.find({
    collection: 'products',
    where: { or: RESTRICTED_SLUG_FRAGMENTS.map((fragment) => ({ slug: { contains: fragment } })) },
    pagination: false,
    depth: 0,
    select: { slug: true },
    overrideAccess: true,
  })

  return docs.filter((doc: any) => isRestrictedSlug(doc.slug)).map((doc: any) => doc.id)
}

/**
 * A `where` fragment that leaves restricted products out, ready to add to an `and` list.
 * Null when there is nothing to exclude (restriction switched off, or no restricted products exist).
 */
export async function publicProductsClause(payload: Payload): Promise<Where | null> {
  const ids = await getRestrictedProductIds(payload)
  return ids.length > 0 ? { id: { not_in: ids } } : null
}
