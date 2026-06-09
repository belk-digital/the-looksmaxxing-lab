import { CollectionConfig } from 'payload'

export const OrderCounters: CollectionConfig = {
  slug: 'order_counters',
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'id',
      type: 'number',
    },
    {
      name: 'counter',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
  ],
}
