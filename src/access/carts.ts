import type { CollectionAccess } from 'payload'

export const cartsAccess = {
  read: ({ req }) => {
    const userId = req?.user?.id
    if (!userId) return false
    return { user: { equals: userId } }
  },
  create: ({ req }) => !!req?.user?.id,
  update: ({ req }) => !!req?.user?.id,
  delete: ({ req }) => !!req?.user?.id,
} as Access
