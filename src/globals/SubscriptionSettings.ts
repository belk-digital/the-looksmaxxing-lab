import type { GlobalConfig } from 'payload'
import { DEFAULT_SUBSCRIPTION_SETTINGS } from '../lib/subscriptions/settings'

const canEdit = ({ req: { user } }: any) => !!user?.role && ['admin', 'staff'].includes(user.role)

export const SubscriptionSettings: GlobalConfig = {
  slug: 'subscription-settings',
  admin: {
    group: 'Store Management',
    description:
      'Subscription plans and billing rules. A plan is how often an order is invoiced (every month, every 3 months, every 6 months) and it continues until the customer pauses it. Existing subscriptions keep their locked-in discount; changes here apply to new subscriptions (timing rules apply to all).',
  },
  access: {
    read: () => true,
    update: canEdit,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Master switch for NEW subscriptions. Turn this on to show "Subscribe & save" on eligible products. Existing subscriptions keep billing when this is off.',
      },
    },
    {
      name: 'plans',
      type: 'array',
      label: 'Plans',
      defaultValue: DEFAULT_SUBSCRIPTION_SETTINGS.plans,
      admin: { description: 'How often customers get an order. The discount applies to every order of the plan.' },
      validate: (value: any) => {
        if (!Array.isArray(value)) return true
        const months = value.map((p: any) => p?.months).filter(Boolean)
        return new Set(months).size === months.length || 'Each interval can only appear once.'
      },
      fields: [
        { name: 'months', type: 'number', required: true, min: 1, max: 36, admin: { description: 'How often an order is invoiced, in months: 1 = every month, 3 = every 3 months, 6 = every 6 months. The subscription continues until the customer pauses it.' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'Internal name only (customers see "Every N months").' } },
        { name: 'discountPercent', type: 'number', required: true, min: 0, max: 90, defaultValue: 15, admin: { description: 'Percent off the live price on every order of the plan.' } },
        { name: 'badge', type: 'text', admin: { description: 'Optional highlight, e.g. "Best value".' } },
        { name: 'isActive', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      type: 'collapsible',
      label: 'Payment methods allowed for subscriptions',
      fields: [
        { name: 'allowCard', type: 'checkbox', defaultValue: true, label: 'Credit card (Authorize.net via Longevia Beauty)' },
        { name: 'allowZelle', type: 'checkbox', defaultValue: true, label: 'Zelle' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Invoice & reminder timing',
      fields: [
        { name: 'invoiceLeadDays', type: 'number', min: 1, max: 30, defaultValue: 7, admin: { description: 'Create and email each invoice this many days before it is due.' } },
        { name: 'finalNoticeAfterDays', type: 'number', min: 1, max: 60, defaultValue: 7, admin: { description: 'Send one final notice this many days after the due date if still unpaid.' } },
        { name: 'lapseAfterDays', type: 'number', min: 2, max: 90, defaultValue: 14, admin: { description: 'Unpaid this many days after the due date: the invoice is cancelled and the subscription is marked Lapsed. The customer can still pay to reactivate.' } },
        { name: 'firstPaymentExpiryDays', type: 'number', min: 1, max: 90, defaultValue: 14, admin: { description: 'A subscription whose FIRST payment (e.g. Zelle) never arrives is cancelled after this many days.' } },
        { name: 'minDaysBetweenEarlyOrders', type: 'number', min: 0, max: 60, defaultValue: 0, admin: { description: 'Minimum days between "Order next delivery now" requests. 0 = no limit.' } },
      ],
    },
    {
      name: 'termsText',
      type: 'textarea',
      defaultValue: DEFAULT_SUBSCRIPTION_SETTINGS.termsText,
      admin: { description: 'The agreement shown with the required checkbox at checkout.' },
    },
  ],
}
