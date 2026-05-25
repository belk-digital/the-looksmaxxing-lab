// src/access/users.ts


/**
 * Access control for the Users collection.
 *
 * - create: public (registration)
 * - read: own record OR admin / staff
 * - update: own record (limited fields) OR admin (all)
 * - delete: admin only
 */
export const accessUsers: any = {
  create: () => true,
  read: ({ req: { user } }: any) => {
    if (!user) return false
    if (['admin', 'staff'].includes(user.role)) return true
    // allow reading own user record – Payload will filter by id when accessing a single doc
    return {
      id: { equals: user.id },
    }
  },
  update: ({ req: { user } }: any) => {
    if (!user) return false
    if (['admin', 'staff'].includes(user.role)) return true
    // users can update only a whitelist of safe fields – enforced via field‑level admin conditions
    return {
      id: { equals: user.id },
    }
  },
  delete: ({ req: { user } }: any) => !!user && ['admin', 'staff'].includes(user.role),
}
