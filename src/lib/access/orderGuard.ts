/**
 * Nasal-spray products can only be ordered by a logged-in customer. SERVER ONLY.
 *
 * The pages hide them from everyone else, but a basket can still hold one (added before logging out, or a saved
 * basket), and an order can be sent straight to the server, so the check is repeated where the order is
 * actually priced (checkout/actions.ts).
 *
 * Returns the message to show the customer, or null when the order is allowed.
 */

import { isLoggedIn } from './viewer'
import { isRestrictedSlug, RESTRICTED_LOGIN_MESSAGE } from './restrictedProducts'

export async function restrictedOrderError(productsById: Map<any, any>): Promise<string | null> {
  const hasRestricted = [...productsById.values()].some((product) => isRestrictedSlug(product?.slug))
  if (!hasRestricted) return null
  return (await isLoggedIn()) ? null : RESTRICTED_LOGIN_MESSAGE
}
