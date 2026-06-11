import { CollectionConfig } from 'payload'
import { cartsAccess } from '../access/carts'

export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: {
    defaultColumns: ['user', 'items'],
    useAsTitle: 'user',
  },
  access: cartsAccess,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // enforce single cart per user via unique index in migration
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
