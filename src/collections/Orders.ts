import { CollectionConfig } from 'payload'
import { validateStatusTransition } from '../lib/orders/state'
import { sql } from '@payloadcms/db-postgres'
import { afterOrderChange } from '@/hooks/orders'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    defaultColumns: ['orderNumber', 'status', 'paymentStatus', 'fulfillmentStatus', 'owner', 'orderTime'],
    description: 'Customer orders – generated server‑side only.',
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { owner: { equals: req.user?.id } }
    },
    create: () => false,
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ operation, originalDoc, data, req }) => {
        if (operation === 'create') {
          const year = new Date().getFullYear()
          const db = req.payload.db as any
          const counterRes: any = await db.drizzle.execute(sql`INSERT INTO "order_counters" ("id", "counter", "created_at", "updated_at") VALUES (${year}, 1, now(), now())
                      ON CONFLICT ("id") DO UPDATE SET "counter" = "order_counters"."counter" + 1, "updated_at" = now()
                      RETURNING "counter"`)
          const counter = (counterRes.rows ? counterRes.rows[0].counter : counterRes[0].counter)
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
      afterOrderChange,
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
      required: false,
      admin: { description: 'User who placed the order (null for guests).' },
    },
    {
      name: 'customerFirstName',
      type: 'text',
      admin: { description: 'First name of the customer (useful for guest orders).' },
    },
    {
      name: 'customerLastName',
      type: 'text',
    },
    {
      name: 'customerPhone',
      type: 'text',
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
        { name: 'createdAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    { name: 'subtotal', type: 'number', admin: { position: 'sidebar', description: 'Before discounts/shipping/tax' } },
    { name: 'discountTotal', type: 'number', admin: { position: 'sidebar' } },
    { name: 'redeemedPoints', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Maxx Points used in this order ($1 per point)' } },
    { name: 'shippingTotal', type: 'number', admin: { position: 'sidebar' }, defaultValue: 0 },
    {
      name: 'taxTotal',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'feeTotal',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Total of all applied processing fees in cents' },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'appliedFees',
      type: 'array',
      admin: { description: 'Processing fees applied to this order' },
      fields: [
        { name: 'feeId', type: 'relationship', relationTo: 'processing-fees' },
        { name: 'feeName', type: 'text' },
        { name: 'amount', type: 'number' },
      ],
    },
    { name: 'shippingMethod', type: 'text', admin: { position: 'sidebar' } },
    { name: 'couponCode', type: 'text', admin: { position: 'sidebar' } },
    { name: 'customerNote', type: 'textarea' },
    { name: 'guestEmail', type: 'text', admin: { position: 'sidebar', description: 'For orders without a registered user account' } },
    { name: 'createdAt', type: 'date', admin: { position: 'sidebar', disabled: true } },
    { name: 'updatedAt', type: 'date', admin: { position: 'sidebar', disabled: true } },
    {
      name: 'orderTime',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/NullField',
          Cell: '@/components/admin/TimeAgoCell',
        },
      },
    },
  ],
}
