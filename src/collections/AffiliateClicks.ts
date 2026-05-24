import type { CollectionConfig } from 'payload'
import { afterAffiliateClickChange } from '@/hooks/affiliateClicks'
export const AffiliateClicks: CollectionConfig = {
  slug: 'affiliate-clicks',
  admin: {
    group: 'Affiliate System',
  },
  access: {
    read: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    create: () => true, // Created by API
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'affiliate', type: 'relationship', relationTo: 'affiliates', required: true, index: true },
    { name: 'source', type: 'select', options: ['referral_link', 'coupon_code_attempt'] },
    { name: 'ipHash', type: 'text', index: true },
    { name: 'ipCountry', type: 'text' },
    { name: 'userAgent', type: 'text' },
    { name: 'deviceType', type: 'select', options: ['desktop', 'mobile', 'tablet'] },
    { name: 'referrer', type: 'text' },
    { name: 'landingPage', type: 'text' },
    { name: 'sessionId', type: 'text', index: true },
    { name: 'convertedToOrder', type: 'checkbox', defaultValue: false },
    { name: 'conversion', type: 'relationship', relationTo: 'affiliate-conversions' },
    { name: 'conversionValue', type: 'number', admin: { description: 'In cents' } },
    { name: 'isSuspicious', type: 'checkbox', defaultValue: false },
    { name: 'suspicionReason', type: 'text' },
    { name: 'clickedAt', type: 'date', required: true, index: true },
  ],
  hooks: {
    afterChange: [afterAffiliateClickChange],
  }
}
