// src/access/addresses.ts
import type { Access } from 'payload/types'

/** Simple access control for Addresses collection */
export const access: Access = {
  // only admins and staff can manage addresses (for now)
  create: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
  read: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
  update: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
  delete: ({ req: { user } }) => !!user && ['admin', 'staff'].includes(user.role),
}
