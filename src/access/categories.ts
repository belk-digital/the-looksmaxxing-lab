// src/access/categories.ts
import type { Access } from 'payload'

export const access: Access = {
  // Public can read only visible categories; admins/staff can read all.
  read: ({ req: { user } }) => {
    if (!user) return { isVisible: { equals: true } }
    if (['admin', 'staff'].includes(user.role)) return true
    return { isVisible: { equals: true } }
  },
  // Creation / update / delete limited to admin / staff.
  create: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
  update: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
  delete: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
}
