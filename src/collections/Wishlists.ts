import { CollectionConfig } from 'payload'
import { wishlistsAccess } from '../access/wishlists'

export const Wishlists: CollectionConfig = {
  slug: 'wishlists',
  admin: {
    defaultColumns: ['userName', 'user', 'items'],
    useAsTitle: 'userName',
  },
  access: wishlistsAccess,
  fields: [
    {
      name: 'userName',
      type: 'text',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (data?.user) {
              try {
                // If user is just an ID
                const userId = typeof data.user === 'object' ? data.user.id : data.user
                if (!userId) return null
                let localPayload = req?.payload
                if (!localPayload) {
                  const { getPayload } = await import('payload')
                  const configPromise = await import('@/payload.config').then(m => m.default)
                  localPayload = await getPayload({ config: configPromise })
                }
                const user = await localPayload.findByID({ collection: 'users', id: userId })
                if (user) {
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  return name || user.email || 'Unknown User'
                }
              } catch (e) {
                return 'Unknown User'
              }
            }
            return null
          }
        ]
      }
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: false,
        },
        {
          name: 'variantSku',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'addedAt',
          type: 'date',
          required: true,
          defaultValue: () => new Date(),
        },
        {
          name: 'priceSnapshot',
          type: 'number',
          required: true,
        },
      ],
    },
  ],
}
