import type { GlobalConfig } from 'payload'

export const AffiliateSettings: GlobalConfig = {
  slug: 'affiliate-settings',
  admin: {
    group: 'Affiliate System',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'defaultCommissionRate',
      type: 'number',
      required: true,
      defaultValue: 10,
      admin: {
        description: 'Global default commission percentage applied to all affiliates unless individually overridden.',
      },
    },
    {
      name: 'defaultCommissionType',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: ['percentage', 'fixed_amount'],
      admin: {
        description: 'Global default commission type.',
      },
    },
    {
      name: 'defaultCommissionOn',
      type: 'select',
      required: true,
      defaultValue: 'subtotal_after_coupon',
      options: ['subtotal_after_coupon', 'subtotal_before_coupon'],
      admin: {
        description: 'Global default base for calculating commission.',
      },
    },
    {
      name: 'defaultCookieDurationDays',
      type: 'number',
      required: true,
      defaultValue: 30,
    },
    {
      name: 'defaultPendingPeriodDays',
      type: 'number',
      required: true,
      defaultValue: 30,
    },
    {
      name: 'defaultMinimumPayoutThreshold',
      type: 'number',
      required: true,
      defaultValue: 5000,
      admin: {
        description: 'Global default minimum payout threshold in cents (e.g. 5000 = $50.00).',
      },
    },
  ],
}
