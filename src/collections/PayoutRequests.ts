import type { CollectionConfig } from 'payload'
import { afterPayoutRequestChange } from '@/hooks/payoutRequests'

export const PayoutRequests: CollectionConfig = {
  slug: 'payout-requests',
  admin: {
    group: 'Affiliate System',
    useAsTitle: 'id',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role && ['admin', 'staff'].includes(user.role as string)) return true
      return { 'affiliate.user': { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role as string),
    delete: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role as string),
  },
  fields: [
    { name: 'affiliate', type: 'relationship', relationTo: 'affiliates', required: true, index: true },
    { name: 'amountCents', type: 'number', required: true, admin: { description: 'Amount requested in cents' } },
    { 
      name: 'payoutMethod', 
      type: 'select', 
      options: ['zelle', 'cashapp', 'applepay'],
      required: true 
    },
    { 
      name: 'payoutDetails', 
      type: 'text', 
      required: true,
      admin: { description: 'Phone number, CashTag, or ApplePay ID' }
    },
    { 
      name: 'status', 
      type: 'select', 
      options: ['pending', 'approved', 'paid', 'rejected'], 
      defaultValue: 'pending',
      required: true
    },
    { name: 'processedAt', type: 'date', admin: { readOnly: true } },
    { name: 'processedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'adminNotes', type: 'textarea' },
    { name: 'rejectionReason', type: 'textarea' }
  ],
  hooks: {
    afterChange: [afterPayoutRequestChange],
  }
}
