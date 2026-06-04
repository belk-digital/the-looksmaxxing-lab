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
      name: 'sku',
      type: 'text',
      admin: {
        condition: (data) => !data.hasVariants,
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'salePrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'If set, this price will override the regular price.',
      },
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      admin: { description: 'Weight in kg or lbs (depending on global settings)' },
    },
    {
      name: 'dimensions',
      type: 'group',
      fields: [
        { name: 'length', type: 'number', min: 0 },
        { name: 'width', type: 'number', min: 0 },
        { name: 'height', type: 'number', min: 0 },
      ],
      admin: { description: 'Dimensions in cm or inches (depending on global settings)' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
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
          name: 'salePrice',
          type: 'number',
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
      name: 'isBundle',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Enable to sell multiple products together as a kit.' },
    },
    {
      name: 'bundleItems',
      type: 'array',
      admin: {
        condition: (data) => data.isBundle === true,
      },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1, defaultValue: 1 },
      ],
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
      type: 'tabs',
      tabs: [
        {
          label: 'Product Details',
          fields: [
            { name: 'productDetailsTitle', type: 'text', defaultValue: 'Product Details' },
            { name: 'productDetailsDescription', type: 'textarea' },
          ],
        },
        {
          label: 'Research Focus & Mechanism Overview',
          fields: [
            { name: 'researchFocusTitle', type: 'text', defaultValue: 'Research Focus & Mechanism Overview' },
            { name: 'researchFocusDescription', type: 'textarea' },
          ],
        },
        {
          label: 'Quality & Purity Standards',
          fields: [
            { name: 'qualityPurityTitle', type: 'text', defaultValue: 'Quality & Purity Standards' },
            { name: 'qualityPurityDescription', type: 'textarea' },
          ],
        },
        {
          label: 'Compliance Notice',
          fields: [
            { name: 'complianceNoticeTitle', type: 'text', defaultValue: 'Compliance Notice' },
            { name: 'complianceNoticeDescription', type: 'textarea' },
          ],
        },
      ],
    },
    {
      name: 'coaFile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Upload the Certificate of Analysis (COA) document (PDF/Image)',
      },
    },
    {
      name: 'faqs',
      type: 'array',
      labels: {
        singular: 'FAQ',
        plural: 'FAQs',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
      admin: {
        description: 'Add frequently asked questions specifically for this product.',
      },
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
