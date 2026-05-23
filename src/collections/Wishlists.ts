import { CollectionConfig } from 'payload/types'
import { wishlistsAccess } from '../access/wishlists'

export const Wishlists: CollectionConfig = {
  slug: 'wishlists',
  admin: {
    defaultColumns: ['user', 'items'],
    useAsTitle: 'user',
    hideCreate: true,
  },
  access: wishlistsAccess,
  fields: [
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
          required: true,
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
