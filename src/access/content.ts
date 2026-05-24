import { Access } from 'payload'

export const accessContent: Access = {
  create: ({ req }) => req.user?.role === 'admin',
  read: ({ req, data }) => {
    if (req.user?.role === 'admin') return true
    // public read only for published items
    return data?.status === 'published'
  },
  update: ({ req }) => req.user?.role === 'admin',
  delete: ({ req }) => req.user?.role === 'admin',
}
