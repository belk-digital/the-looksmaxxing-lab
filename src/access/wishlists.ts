import type { Access, PayloadRequest } from 'payload'

export const wishlistsAccess = {
  read: ({ req }: { req: PayloadRequest }) => {
    const user = req?.user
    if (!user) return false
    // Admins can see all wishlists in the dashboard
    if (user.role === 'admin') return true
    return { user: { equals: user.id } }
  },
  create: ({ req }: { req: PayloadRequest }) => !!req?.user?.id,
  update: ({ req }: { req: PayloadRequest }) => {
    const user = req?.user
    if (!user) return false
    if (user.role === 'admin') return true
    return { user: { equals: user.id } }
  },
  delete: ({ req }: { req: PayloadRequest }) => {
    const user = req?.user
    if (!user) return false
    if (user.role === 'admin') return true
    return { user: { equals: user.id } }
  },
} as unknown as any
