import type { Block } from 'payload'

export const CalloutBox: Block = {
  slug: 'calloutBox',
  labels: { singular: 'Callout Box', plural: 'Callout Boxes' },
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Tip', value: 'tip' },
        { label: 'Warning', value: 'warning' },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: { description: 'Short highlighted note shown as a boxed callout within the article.' },
    },
  ],
}
