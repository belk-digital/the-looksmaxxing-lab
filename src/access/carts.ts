import type { Access } from 'payload'

export const cartsAccess = {
  read: ({ req }) => {
    const user = req?.user
    if (!user) return false
    if (user.role === 'admin' || user.role === 'superadmin') return true
    return { user: { equals: user.id } }
  },
  create: ({ req }) => !!req?.user?.id,
  update: ({ req }) => {
    const user = req?.user
    if (!user) return false
    if (user.role === 'admin' || user.role === 'superadmin') return true
    return { user: { equals: user.id } }
  },
  delete: ({ req }) => {
    const user = req?.user
    if (!user) return false
    if (user.role === 'admin' || user.role === 'superadmin') return true
    return { user: { equals: user.id } }
  },
} as Access
