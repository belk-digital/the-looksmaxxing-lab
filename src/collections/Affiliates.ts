import type { CollectionConfig } from 'payload'

export const Affiliates: CollectionConfig = {
  slug: 'affiliates',
  admin: {
    useAsTitle: 'referralSlug',
    group: 'Affiliate System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'staff'].includes(user.role as string)) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role as string),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (['admin', 'staff'].includes(user.role as string)) return true
      return { user: { equals: user.id } }
    },
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
            { name: 'commissionRate', type: 'number', admin: { description: 'Leave blank to use Global Default. Percentage of eligible order value or fixed amount in cents.' } },
            { name: 'commissionType', type: 'select', options: ['percentage', 'fixed_amount'], admin: { description: 'Leave blank to use Global Default.' } },
            { name: 'customerDiscount', type: 'number', defaultValue: 10, admin: { description: '% discount the customer gets using their coupon' } },
            { name: 'pendingPeriodDays', type: 'number', admin: { description: 'Leave blank to use Global Default. Days before commission is approved.' } },
            { name: 'commissionOn', type: 'select', options: ['subtotal_after_coupon', 'subtotal_before_coupon'], admin: { description: 'Leave blank to use Global Default.' } },
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
            { name: 'totalCommissionRequested', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents (pending/approved payout requests)' } },
            { name: 'totalCommissionPaid', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'In cents' } },
          ]
        },
        {
          label: 'Payout',
          fields: [
            { name: 'minimumPayoutThreshold', type: 'number', admin: { description: 'Leave blank to use Global Default. Minimum payout threshold in cents (e.g. 5000 = $50.00).' } },
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
