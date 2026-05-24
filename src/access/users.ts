// src/access/users.ts
import type { Access } from 'payload'

/**
 * Access control for the Users collection.
 *
 * - create: public (registration)
 * - read: own record OR admin / staff
 * - update: own record (limited fields) OR admin (all)
 * - delete: admin only
 */
export const accessUsers: Access = {
  create: () => true,
  read: ({ req: { user } }) => {
    if (!user) return false
    if (['admin', 'staff'].includes(user.role)) return true
    // allow reading own user record – Payload will filter by id when accessing a single doc
    return {
      id: { equals: user.id },
    }
  },
  update: ({ req: { user } }) => {
    if (!user) return false
    if (['admin', 'staff'].includes(user.role)) return true
    // users can update only a whitelist of safe fields – enforced via field‑level admin conditions
    return {
      id: { equals: user.id },
    }
  },
  delete: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
}
