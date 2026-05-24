'use server'

import payload from 'payload'
import type { LoginResult } from 'payload/types'

/**
 * Perform email/password login using Payload's built‑in auth.
 * The function returns the full Payload LoginResult which includes the
 * httpOnly session cookie – the request must be made from a server context
 * (e.g., a Server Action or API route) to set the cookie properly.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  // Payload's login method will set an httpOnly cookie on the response.
  // In a server‑side environment (e.g., Next.js route) you can forward the
  // response headers to the client.
  const result = await payload.login({
    collection: 'users',
    data: { email, password },
    // `expireIn` can be configured if desired; using default.
  })
  return result
}
