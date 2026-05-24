import type { CollectionConfig } from 'payload'
import { accessUsers } from '@/access/users'

export const Affiliates: CollectionConfig = {
  slug: 'affiliates',
  admin: {
    useAsTitle: 'displayName',
    group: 'Affiliate System',
  },
  access: {
    read: accessUsers,
    create: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    update: accessUsers,
    delete: () => false, // Never delete
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'user', type: 'relationship', relationTo: 'users', required: true, hasMany: false, unique: true },
            { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'approved', 'rejected', 'suspended'] },
            { name: 'applicationDate', type: 'date', admin: { readOnly: true } },
            { name: 'approvedAt', type: 'date', admin: { readOnly: true } },
            { name: 'approvedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
            { name: 'suspendedAt', type: 'date', admin: { readOnly: true } },
            { name: 'suspensionReason', type: 'textarea' },
            { name: 'displayName', type: 'text' },
            { name: 'websiteUrl', type: 'text' },
            { name: 'socialLinks', type: 'array', fields: [{ name: 'platform', type: 'select', options: ['instagram', 'youtube', 'tiktok', 'twitter', 'reddit'] }, { name: 'url', type: 'text' }] },
            { name: 'parentAffiliate', type: 'relationship', relationTo: 'affiliates', admin: { description: 'For Multi-Tier / MLM. The affiliate who recruited this affiliate.' } },
          ]
        },
        {
          label: 'Referral',
          fields: [
            { name: 'referralSlug', type: 'text', unique: true, index: true },
            { name: 'couponCode', type: 'text', unique: true },
            { name: 'coupon', type: 'relationship', relationTo: 'coupons', admin: { readOnly: true } },
            { name: 'cookieDurationDays', type: 'number', defaultValue: 30 },
          ]
        },
        {
          label: 'Commission',
          fields: [
            { name: 'commissionRate', type: 'number', defaultValue: 10, admin: { description: 'Percentage of eligible order value' } },
            { name: 'commissionType', type: 'select', defaultValue: 'percentage', options: ['percentage', 'fixed_amount'] },
            { name: 'customerDiscount', type: 'number', defaultValue: 10, admin: { description: '% discount the customer gets using their coupon' } },
            { name: 'pendingPeriodDays', type: 'number', defaultValue: 30 },
            { name: 'commissionOn', type: 'select', defaultValue: 'subtotal_after_coupon', options: ['subtotal_after_coupon', 'subtotal_before_coupon'] },
            { name: 'tier', type: 'select', defaultValue: 'standard', options: ['standard', 'silver', 'gold', 'vip'] },
          ]
        },
        {
          label: 'Stats',
          fields: [
            { name: 'totalClicks', type: 'number', defaultValue: 0, admin: { readOnly: true } },
            { name: 'uniqueClicks', type: 'number', defaultValue: 0, admin: { readOnly: true } },
            { name: 'totalConversions', type: 'number', defaultValue: 0, admin: { readOnly: true } },
            { name: 'totalRevenue', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
            { name: 'totalCommissionEarned', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
            { name: 'totalCommissionPending', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
            { name: 'totalCommissionApproved', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
            { name: 'totalCommissionPaid', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
          ]
        },
        {
          label: 'Payout',
          fields: [
            { name: 'minimumPayoutThreshold', type: 'number', defaultValue: 5000, admin: { description: 'In cents. Default 5000 ($50.00)' } },
            { name: 'payoutCurrency', type: 'select', defaultValue: 'USD', options: ['USD', 'BTC', 'ETH', 'USDT_ERC20', 'USDT_TRC20', 'STORE_CREDIT'] },
            {
              name: 'payoutMethods',
              type: 'array',
              fields: [
                { name: 'type', type: 'select', options: ['paypal', 'wise', 'bank_wire', 'crypto_btc', 'crypto_eth', 'crypto_usdt_erc20', 'crypto_usdt_trc20', 'store_credit'] },
                { name: 'isPrimary', type: 'checkbox' },
                { name: 'paypalEmail', type: 'text' },
                { name: 'walletAddress', type: 'text' },
                { name: 'walletNetwork', type: 'text' },
                // ... other bank details can be added as needed
              ]
            }
          ]
        },
        {
          label: 'Fraud & Internal',
          fields: [
            { name: 'flaggedForReview', type: 'checkbox' },
            { name: 'fraudScore', type: 'number' },
            { name: 'fraudNotes', type: 'textarea' },
            { name: 'adminNotes', type: 'textarea' },
            { name: 'agreedToTermsAt', type: 'date' },
          ]
        }
      ]
    }
  ]
}
