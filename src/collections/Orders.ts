import { CollectionConfig } from 'payload'
import { validateStatusTransition } from '../lib/orders/state'
import { sql } from '@payloadcms/db-postgres'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    defaultColumns: ['orderNumber', 'status', 'paymentStatus', 'fulfillmentStatus', 'owner'],
    description: 'Customer orders – generated server‑side only.',
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { owner: { equals: req.user?.id } }
    },
    create: () => false,
    update: ({ req }) => req.user?.role === 'admin',
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      async ({ operation, originalDoc, data, req }) => {
        if (operation === 'create') {
          const year = new Date().getFullYear()
          const counterRes: any = await req.payload.db.query({
            query: sql`INSERT INTO "order_counters" ("year", "counter") VALUES (${year}, 1)
                      ON CONFLICT ("year") DO UPDATE SET "counter" = "order_counters"."counter" + 1
                      RETURNING "counter"`,
          })
          const counter = (counterRes[0] as any).counter
          const padded = String(counter).padStart(5, '0')
          data.orderNumber = `PEP-${year}-${padded}`

          if (Array.isArray(data.items)) {
            const snapshotItems = await Promise.all(
              data.items.map(async (item: any) => {
                const product = await req.payload.find({
                  collection: 'products',
                  where: { id: { equals: item.product } },
                  depth: 0,
                })
                return { ...item, productSnapshot: product?.docs?.[0] ?? null }
              }),
            )
            data.items = snapshotItems
          }

          if (data.shippingAddress) data.shippingAddress = { ...data.shippingAddress }
          if (data.billingAddress) data.billingAddress = { ...data.billingAddress }
        }

        if (operation === 'update' && originalDoc) {
          const oldStatus = originalDoc.status as any
          const newStatus = data.status as any
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            validateStatusTransition(oldStatus, newStatus)
          }
        }
      },
    ],
    afterChange: [
      async ({ operation, doc }) => {
        if (operation === 'update') {
          // TODO: send status change email (Phase 14)
        }
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      admin: { disabled: true, description: 'Auto‑generated order identifier (PEP‑YYYY‑NNNNN).' },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'User who placed the order.' },
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true },
        {
          name: 'productSnapshot',
          type: 'json',
          admin: { description: 'Snapshot of product data at order time.' },
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'line1', type: 'text' },
        { name: 'line2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
      ],
    },
    {
      name: 'billingAddress',
      type: 'group',
      fields: [
        { name: 'line1', type: 'text' },
        { name: 'line2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Completed', value: 'completed' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
      defaultValue: 'pending',
    },
    {
      name: 'paymentStatus',
      type: 'select',
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Authorized', value: 'authorized' },
        { label: 'Captured', value: 'captured' },
        { label: 'Refunded', value: 'refunded' },
      ],
      required: true,
      defaultValue: 'unpaid',
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      options: [
        { label: 'Unfulfilled', value: 'unfulfilled' },
        { label: 'Partial', value: 'partial' },
        { label: 'Fulfilled', value: 'fulfilled' },
      ],
      required: true,
      defaultValue: 'unfulfilled',
    },
    {
      name: 'refunds',
      type: 'array',
      fields: [
        { name: 'amount', type: 'number' },
        { name: 'reason', type: 'text' },
        { name: 'createdAt', type: 'date', admin: { readonly: true } },
      ],
    },
    { name: 'createdAt', type: 'date', admin: { position: 'sidebar', disabled: true } },
    { name: 'updatedAt', type: 'date', admin: { position: 'sidebar', disabled: true } },
  ],
}
