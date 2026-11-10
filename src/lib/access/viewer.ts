/**
 * Is the person making this request logged in? SERVER ONLY (reads the login cookie).
 *
 * Do NOT call this while building a cached page (home, shop, product pages...): reading the cookie would make
 * that page uncacheable. Cached pages are built for everyone and must use the public view; only server actions,
 * API routes and other request-time code should ask who is logged in.
 *
 * Fails closed: any problem reading the session counts as "not logged in".
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function isLoggedIn(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    return Boolean(session?.user?.email)
  } catch {
    return false
  }
}
