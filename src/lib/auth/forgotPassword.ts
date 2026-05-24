'use server'

import payload from 'payload'

/**
 * Send a password‑reset email via Payload's built‑in auth flow.
 * This runs on the server, so we can safely use Node APIs.
 */
export async function forgotPassword(email: string): Promise<void> {
  // Payload provides a `forgotPassword` method on the auth API.
  // If the method is unavailable, Payload will still send the reset email
  // based on the `auth.forgotPassword` configuration in payload.config.ts.
  await payload.forgotPassword({ email, collection: 'users' })
}
