import { CollectionConfig } from 'payload'
import { couponsAccess } from '../access/coupons'
import { couponsHook } from '../hooks/coupons'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: {
    defaultColumns: ['code', 'type', 'value', 'freeShipping', 'usageCount'],
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
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'freeShipping',
      type: 'checkbox',
      label: 'Free Shipping',
      defaultValue: false,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed_amount' },
        { label: 'Free Shipping', value: 'free_shipping' },
        { label: 'Buy One Get One', value: 'buy_one_get_one' },
        { label: 'Store Credit', value: 'store_credit' },
      ],
    },
    // Advanced features
    {
      name: 'minSpend',
      type: 'number',
      required: false,
      admin: {
        description: 'Minimum order amount (in cents) required to apply this coupon.',
        position: 'sidebar',
      },
    },
    {
      name: 'usageLimit',
      type: 'number',
      required: false,
      admin: {
        description: 'Maximum number of times this coupon can be used globally.',
        position: 'sidebar',
      },
    },
    {
      name: 'stackable',
      type: 'checkbox',
      label: 'Stackable with other coupons',
      defaultValue: false,
      admin: {
        description: 'Allow this coupon to be combined with other coupons on the same order.',
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: false,
      admin: {
        description: 'Expiration date after which the coupon is no longer valid.',
        position: 'sidebar',
      },
    },
    {
      name: 'excludeSaleItems',
      type: 'checkbox',
      label: 'Exclude Sale Items',
      defaultValue: false,
      admin: {
        description: 'If enabled, the coupon will not apply to items on sale.',
        position: 'sidebar',
      },
    },
    {
      name: 'autoApply',
      type: 'checkbox',
      label: 'Auto‑apply',
      defaultValue: false,
      admin: {
        description:
          'When true, the coupon is automatically applied at checkout if conditions are met.',
        position: 'sidebar',
      },
    },
    {
      name: 'lockedEmails',
      type: 'array',
      admin: {
        description:
          'Restrict coupon usage to specific email addresses (leave empty for unrestricted).',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'storeCreditAmount',
      type: 'number',
      required: false,
      admin: {
        description: 'Total store credit value in cents.',
        condition: (_, siblingData) => siblingData?.type === 'store_credit',
        position: 'sidebar',
      },
    },
    {
      name: 'remainingBalance',
      type: 'number',
      required: false,
      admin: {
        description: 'Remaining credit balance. Managed by the system.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: false,
      admin: {
        description: 'Percentage (0-100), fixed amount in cents, or ignored for free shipping.',
      },
    },

    {
      name: 'applicableProductTypes',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'All Product Types (Normal + Bulk)', value: 'all' },
        { label: 'Normal Variants Only (Exclude Bulk Bundles)', value: 'normal_only' },
        { label: 'Bulk Bundles Only', value: 'bulk_only' }
      ],
      admin: {
        description: 'Restrict coupon usage to standard variants or bulk bundles.',
      }
    },
    {
      name: 'appliesTo',
      type: 'select',
      required: true,
      defaultValue: 'all',
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
