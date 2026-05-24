import type { CollectionConfig } from 'payload'
import { afterAffiliatePayoutChange } from '@/hooks/affiliatePayouts'
export const AffiliatePayouts: CollectionConfig = {
  slug: 'affiliate-payouts',
  admin: {
    group: 'Affiliate System',
  },
  access: {
    read: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    create: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    update: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
    delete: () => false,
  },
  fields: [
    { name: 'affiliate', type: 'relationship', relationTo: 'affiliates', required: true },
    { name: 'conversions', type: 'relationship', relationTo: 'affiliate-conversions', hasMany: true, required: true },
    { name: 'conversionCount', type: 'number' },
    { name: 'totalAmountCents', type: 'number', required: true },
    { name: 'currency', type: 'select', options: ['USD', 'BTC', 'ETH', 'USDT'] },
    { name: 'cryptoAmountRaw', type: 'text' },
    { name: 'exchangeRateUsed', type: 'number' },
    { name: 'paymentMethod', type: 'select', options: ['paypal', 'wise', 'bank_wire', 'crypto_btc', 'crypto_eth', 'crypto_usdt_erc20', 'crypto_usdt_trc20', 'store_credit'] },
    { name: 'paymentDestination', type: 'json' },
    { name: 'status', type: 'select', options: ['draft', 'processing', 'paid', 'failed'], defaultValue: 'draft' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    { name: 'processedBy', type: 'relationship', relationTo: 'users' },
    { name: 'adminNotes', type: 'textarea' },
    { name: 'transactionId', type: 'text' },
    { name: 'receiptFile', type: 'upload', relationTo: 'media' },
    { name: 'receiptUrl', type: 'text' },
    { name: 'exportedAt', type: 'date' },
    { name: 'paidAt', type: 'date' },
    { name: 'failedAt', type: 'date' },
    { name: 'failureReason', type: 'text' },
  ],
  hooks: {
    afterChange: [afterAffiliatePayoutChange],
  }
}
