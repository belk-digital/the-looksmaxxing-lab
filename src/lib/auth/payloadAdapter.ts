// src/lib/auth/payloadAdapter.ts

import payload from 'payload'
import type { AdapterUser } from 'next-auth/adapters'
import type { CollectionConfig } from 'payload/types'
import type { User } from '@/payload-types'

/**
 * Minimal NextAuth adapter that works against Payload's Users collection.
 * It implements the subset of methods required by NextAuth v5.
 */
export const payloadAdapter = {
  /** Find a user by email (used by credential and OAuth callbacks) */
  async getUserByEmail(email: string) {
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })
    return result.docs[0] as unknown as AdapterUser | null
  },

  /** Create a new user – used when a Google account does not exist yet */
  async createUser(data: Partial<User>) {
    const doc = await payload.create({
      collection: 'users',
      data: {
        ...data,
        emailVerified: true,
        provider: 'google',
      },
    })
    return doc as unknown as AdapterUser
  },

  /** Update an existing user (e.g., to store googleId after OAuth) */
  async updateUser(id: string, data: Partial<User>) {
    const doc = await payload.update({
      collection: 'users',
      id,
      data,
    })
    return doc as unknown as AdapterUser
  },

  /** Get a user by its internal Payload id – used for session callbacks */
  async getUser(id: string) {
    const doc = await payload.findByID({
      collection: 'users',
      id,
    })
    return doc as unknown as AdapterUser | null
  },
}
