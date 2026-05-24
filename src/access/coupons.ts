import { Access } from 'payload'

export const couponsAccess = {
  read: () => true, // public read for validation lookups
  create: ({ req }) => req?.user?.role === 'admin',
  update: ({ req }) => req?.user?.role === 'admin',
  delete: ({ req }) => req?.user?.role === 'admin',
} as Access
