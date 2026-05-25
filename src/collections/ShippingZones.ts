import { CollectionConfig } from 'payload'

export const ShippingZones: CollectionConfig = {
  slug: 'shippingzones',
  admin: {
    defaultColumns: ['name', 'methods'],
    description: 'Geographic shipping zones with sample shipping methods.',
  },
  access: {
    // Only admins can manage shipping zones
    read: ({ req }) => req.user?.role === 'admin',
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'methods',
      type: 'array',
      fields: [
        { name: 'method', type: 'text', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'estimatedDays', type: 'number' },
      ],
      admin: {
        description: 'Sample shipping methods for this zone.',
      },
    },
  ],
}
