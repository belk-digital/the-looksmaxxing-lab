import type { CollectionConfig } from 'payload'
import { afterSubscriptionChange } from '../hooks/subscriptions'

const isStaff = (req: any) => req?.user?.role === 'admin' || req?.user?.role === 'staff'

/**
 * A customer's subscription: an order every 1 / 3 / 6 months until it is paused. Each order is a normal
 * order (type "Subscription"), so fulfilment, tracking and emails work exactly like any other order.
 *
 * Customers never write to this collection directly: every change they make (pause, skip, address...)
 * goes through server actions that check ownership and enforce the business rules.
 */
export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    group: 'Store Management',
    useAsTitle: 'id',
    defaultColumns: ['reference', 'owner', 'status', 'planMonths', 'cyclesCompleted', 'nextDueDate', 'paymentMethod'],
    description:
      'Subscriptions. Every interval creates a normal order (type "Subscription"). Set Status to Paused or Cancelled to stop billing - any unpaid invoice is cancelled automatically.',
  },
  access: {
    read: ({ req }) => {
      if (isStaff(req)) return true
      if (!req.user) return false
      return { owner: { equals: req.user.id } }
    },
    create: ({ req }) => isStaff(req),
    update: ({ req }) => isStaff(req),
    delete: ({ req }) => req?.user?.role === 'admin',
  },
  hooks: {
    afterChange: [afterSubscriptionChange],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      virtual: true,
      admin: { readOnly: true, description: 'Subscription reference (SUB-<id>).' },
      hooks: {
        afterRead: [({ data }) => (data?.id ? `SUB-${data.id}` : undefined)],
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_payment',
      index: true,
      options: [
        { label: 'Pending first payment', value: 'pending_payment' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Lapsed (invoice unpaid)', value: 'lapsed' },
        { label: 'Ended (staff only)', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Pending first payment = waiting for the first order to be paid. Active = billing normally. Paused = no invoices (setting this cancels any unpaid invoice). Lapsed = an invoice went unpaid; the customer can reactivate. Ended = closed by staff; the system never ends a subscription by itself, and nothing more is invoiced. Cancelled = stopped by staff (unpaid invoice is cancelled; refunds are manual).',
      },
    },
    {
      name: 'planMonths',
      type: 'number',
      required: true,
      admin: { position: 'sidebar', description: 'Billing interval in months: an order is invoiced every this many months (1, 3 or 6) until the subscription is paused.' },
    },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Plan discount locked in when the customer subscribed.' },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'Products shipped with every order (price follows the live store price, minus the plan discount).' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'variantSku', type: 'text' },
        { name: 'variantTitle', type: 'text' },
        { name: 'quantity', type: 'number', required: true, min: 1, defaultValue: 1 },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'authnet_bridge',
      options: [
        { label: 'Credit Card (via Longevia Beauty)', value: 'authnet_bridge' },
        { label: 'Zelle (Manual)', value: 'zelle' },
      ],
      admin: { description: 'How future invoices are paid. The customer can change this.' },
    },
    {
      name: 'recurringCouponCode',
      type: 'text',
      admin: {
        description:
          'A coupon that is taken off EVERY order of this subscription (set at checkout when the customer used an "Every order" coupon). Clear it to stop the discount for future invoices.',
      },
    },
    { name: 'shippingMethod', type: 'text' },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'line1', type: 'text' },
        { name: 'line2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'postalCode', type: 'text' },
        { name: 'country', type: 'text' },
      ],
    },
    { name: 'customerFirstName', type: 'text' },
    { name: 'customerLastName', type: 'text' },
    { name: 'customerPhone', type: 'text' },
    {
      type: 'collapsible',
      label: 'Progress & schedule',
      fields: [
        {
          name: 'cyclesCompleted',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, description: 'Orders paid so far (recalculated from paid orders).' },
        },
        { name: 'startedAt', type: 'date', admin: { readOnly: true, description: 'When the first order was paid.' } },
        { name: 'nextDueDate', type: 'date', admin: { description: 'When the next order is due / ships.' } },
        { name: 'nextInvoiceDate', type: 'date', admin: { description: 'When the next invoice is created and emailed.' } },
        {
          name: 'openInvoice',
          type: 'relationship',
          relationTo: 'orders',
          admin: { readOnly: true, description: 'The current unpaid order, if any.' },
        },
        { name: 'firstOrder', type: 'relationship', relationTo: 'orders', admin: { readOnly: true } },
        { name: 'pausedAt', type: 'date', admin: { readOnly: true } },
        { name: 'lapsedAt', type: 'date', admin: { readOnly: true } },
        { name: 'lastEarlyOrderAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Affiliate attribution',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'affiliate',
          type: 'relationship',
          relationTo: 'affiliates',
          admin: { description: 'Earns commission on every paid order.' },
        },
        { name: 'affiliateClickId', type: 'text' },
      ],
    },
    {
      name: 'adminNote',
      type: 'textarea',
      admin: { description: 'Internal note (not shown to the customer).' },
    },
  ],
}
