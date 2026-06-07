import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin' || user.role === 'staff'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin' || user.role === 'staff'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin' || user.role === 'staff'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/documents'),
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  },
}
