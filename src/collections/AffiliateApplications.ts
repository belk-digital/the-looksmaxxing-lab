import type { CollectionConfig } from 'payload'
import { afterAffiliateApplicationChange } from '@/hooks/affiliateApplications'

export const AffiliateApplications: CollectionConfig = {
  slug: 'affiliate-applications',
  admin: {
    useAsTitle: 'displayName',
    group: 'Affiliate System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'staff'].includes(user.role as string)) return true
      return { user: { equals: user.id } }
    },
    create: () => true, // Logged in users can apply (or public depending on strategy)
    update: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role as string),
    delete: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role as string),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'websiteUrl',
      type: 'text',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'platform', type: 'select', options: ['instagram', 'youtube', 'tiktok', 'twitter', 'reddit'] },
        { name: 'url', type: 'text' }
      ]
    },
    {
      name: 'promotionMethods',
      type: 'textarea',
      required: true,
    },
    {
      name: 'estimatedMonthlyReach',
      type: 'select',
      options: [
        { label: '<1k', value: '<1k' },
        { label: '1k-10k', value: '1k-10k' },
        { label: '10k-100k', value: '10k-100k' },
        { label: '100k+', value: '100k+' },
      ]
    },
    {
      name: 'niche',
      type: 'textarea',
    },
    {
      name: 'whyJoin',
      type: 'textarea',
    },
    {
      name: 'agreedToTerms',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
    {
      name: 'linkedAffiliate',
      type: 'relationship',
      relationTo: 'affiliates',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [afterAffiliateApplicationChange],
  }
}
