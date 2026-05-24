import { CollectionConfig } from 'payload'
import { productsAccess } from '../access/products'
import { productsBeforeChange } from '../hooks/products'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    defaultColumns: ['name', 'price', 'hasVariants', 'status'],
    useAsTitle: 'name',
  },
  access: productsAccess,
  hooks: {
    beforeChange: [productsBeforeChange],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'seoTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'hasVariants',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'variants',
      type: 'array',
      fields: [
        {
          name: 'sku',
          type: 'text',
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'stock',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'key', type: 'text' },
            { name: 'value', type: 'text' },
          ],
        },
      ],
      // hide when hasVariants is false – handled in admin UI via custom component if needed
    },
    {
      name: 'averageRating',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
