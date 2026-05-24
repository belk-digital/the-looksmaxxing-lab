// src/lib/auth/getCurrentUser.ts

'use server'

import { getPayload } from 'payload'
import { getServerSession } from 'next-auth'
import config from '@payload-config'
import { authOptions } from '@/lib/auth/nextauth'
import type { User } from '@/payload-types'

/**
 * Retrieve the currently authenticated user based on the NextAuth session.
 * Returns the full Payload user document or null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Initialise Payload with project config
  const payload = await getPayload({ config })

  // Get the session using NextAuth's server helper
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  // Fetch the user from Payload by its id (stored in token.sub)
  const doc = await payload.findByID({
    collection: 'users',
    id: session.user.id as string,
  })
  return doc as unknown as User
}
