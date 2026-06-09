import type { CollectionConfig } from 'payload'
import { afterAffiliateConversionChange } from '@/hooks/affiliateConversions'
export const AffiliateConversions: CollectionConfig = {
  slug: 'affiliate-conversions',
  admin: {
    group: 'Affiliate System',
  },
  access: {
    read: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    create: () => false, // Only created by server
    update: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'affiliate', type: 'relationship', relationTo: 'affiliates', required: true, index: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, unique: true },
    { name: 'customer', type: 'relationship', relationTo: 'users' },
    { name: 'customerEmail', type: 'email' },
    { name: 'attributionSource', type: 'select', options: ['referral_link', 'coupon_code', 'both'] },
    { name: 'attributionClick', type: 'relationship', relationTo: 'affiliate-clicks' },
    { name: 'cookieAgeDays', type: 'number' },
    { name: 'couponCodeUsed', type: 'text' },
    { name: 'orderSubtotal', type: 'number' },
    { name: 'orderDiscount', type: 'number' },
    { name: 'eligibleSubtotal', type: 'number' },
    { name: 'commissionRate', type: 'number' },
    { name: 'commissionAmount', type: 'number', admin: { description: 'In cents' } },
    { name: 'status', type: 'select', options: ['pending', 'approved', 'paid', 'reversed', 'voided'], index: true },
    { name: 'pendingUntil', type: 'date', index: true },
    { name: 'approvedAt', type: 'date' },
    { name: 'payout', type: 'relationship', relationTo: 'affiliate-payouts' },
    { name: 'paidAt', type: 'date' },
    { name: 'reversedAt', type: 'date' },
    { name: 'reversedReason', type: 'select', options: ['order_refunded', 'order_cancelled', 'fraud_detected', 'self_referral', 'admin_manual'] },
    { name: 'reversedBy', type: 'relationship', relationTo: 'users' },
    { name: 'selfReferralDetected', type: 'checkbox' },
    { name: 'ipMatchesAffiliate', type: 'checkbox' },
    { name: 'fraudScore', type: 'number' },
    { name: 'flaggedForReview', type: 'checkbox' },
    { name: 'fraudNotes', type: 'text' },
  ],
  hooks: {
    afterChange: [afterAffiliateConversionChange],
  }
}
