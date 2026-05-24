// src/lib/auth/register.ts

import type { Payload } from 'payload'
import type { User } from '@/payload-types'

/**
 * Register a new user using Payload's built‑in registration flow.
 * This will create the user, send the verification email (via Payload's
 * email settings) and return the created document.
 */
export async function register(payload: Payload, data: Partial<User>) {
  const doc = await payload.create({
    collection: 'users',
    data: {
      ...data,
      provider: data.provider ?? 'email',
    },
  })
  return doc
}
