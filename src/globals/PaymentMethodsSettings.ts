import type { GlobalConfig } from 'payload'

export const PaymentMethodsSettings: GlobalConfig = {
  slug: 'payment-methods-settings',
  admin: {
    group: 'Store Management',
    description: 'Enable/disable payment methods, drag to reorder, and edit their title/description shown at checkout.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => !!user?.role && ['admin', 'staff'].includes(user.role),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const methods = data?.methods
        if (Array.isArray(methods) && methods.length > 0 && !methods.some((m: any) => m?.isActive)) {
          throw new Error('At least one payment method must remain active - checkout needs at least one usable option.')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'methods',
      type: 'array',
      label: 'Payment Methods',
      admin: {
        description: 'Drag rows to reorder how they appear at checkout.',
      },
      validate: (value: any) => {
        if (!Array.isArray(value)) return true
        const ids = value.map((row: any) => row?.methodId).filter(Boolean)
        const hasDuplicates = new Set(ids).size !== ids.length
        if (hasDuplicates) {
          return 'Each payment method can only appear once in this list - remove the duplicate entry.'
        }
        return true
      },
      defaultValue: [
        {
          methodId: 'stripe',
          label: 'Credit / Debit Card',
          description: '',
          isActive: true,
        },
        {
          methodId: 'zelle',
          label: 'Zelle',
          description: '',
          isActive: true,
        },
        {
          methodId: 'authnet_bridge',
          label: 'Credit Card (via Longevia Beauty)',
          description: "You'll be securely redirected to our partner checkout at Longevia Beauty to complete your card payment, then brought back here automatically once it's done.",
          isActive: true,
        },
      ],
      fields: [
        {
          // Named "methodId" rather than "id" - Payload already reserves "id" as the
          // array row's own system identity field, and shadowing it with a custom
          // field would confuse Payload's row tracking on save/reorder.
          name: 'methodId',
          type: 'select',
          required: true,
          options: [
            { label: 'Credit / Debit Card (Stripe)', value: 'stripe' },
            { label: 'Zelle (Manual)', value: 'zelle' },
            { label: 'Credit Card (via Longevia Beauty)', value: 'authnet_bridge' },
          ],
          admin: {
            description: 'Which payment method this entry controls. This is tied to real checkout logic, so only these three are selectable.',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: "Shown as the option's name at checkout." },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Shown when this method is selected. For Zelle this is an optional intro line shown above the existing step-by-step instructions. Not shown for Stripe (its own card form covers that space).',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'If disabled, this method is hidden from checkout entirely.' },
        },
      ],
    },
  ],
}
