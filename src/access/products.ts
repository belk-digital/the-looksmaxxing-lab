import { Access } from 'payload'

export const productsAccess = {
  read: ({ req }) => {
    // Admin or staff can read all; public can read only active products
    const isAdmin = req?.user?.role?.some?.((r) => ['admin', 'staff'].includes(r))
    if (isAdmin) return {}
    return { status: { equals: 'active' } }
  },
  create: ({ req }) => ({ role: { contains: 'admin' } }),
  update: ({ req }) => ({ role: { contains: 'admin' } }),
  delete: ({ req }) => ({ role: { contains: 'admin' } }),
} as Access
