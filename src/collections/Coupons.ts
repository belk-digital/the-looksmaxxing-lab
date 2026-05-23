import { CollectionConfig } from 'payload/types'
import { couponsAccess } from '../access/coupons'
import { couponsHook } from '../hooks/coupons'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: {
    defaultColumns: ['code', 'type', 'value', 'usageCount'],
    useAsTitle: 'code',
  },
  access: couponsAccess,
  hooks: {
    beforeChange: [couponsHook],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed_amount' },
        { label: 'Free Shipping', value: 'free_shipping' },
      ],
    },
    {
      name: 'value',
      type: 'number',
      required: false,
      admin: {
        description: (args) => {
          const type = args?.data?.type
          if (type === 'percentage') return 'Enter a discount percentage (0‑100).'
          if (type === 'fixed_amount') return 'Enter a fixed discount amount in cents.'
          return 'Value is ignored for free shipping coupons.'
        },
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'appliesTo',
      type: 'select',
      required: true,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Specific Products', value: 'specific_products' },
        { label: 'Specific Categories', value: 'specific_categories' },
      ],
    },
    {
      name: 'products',
      type: 'array',
      admin: { condition: (_, siblingData) => siblingData.appliesTo === 'specific_products' },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
      ],
    },
    {
      name: 'categories',
      type: 'array',
      admin: { condition: (_, siblingData) => siblingData.appliesTo === 'specific_categories' },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
      ],
    },
  ],
}
