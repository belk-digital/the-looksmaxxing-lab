import { CollectionConfig } from 'payload'
import { accessContent } from '../access/content'

export const EmailLogs: CollectionConfig = {
  slug: 'email-logs',
  admin: { defaultColumns: ['to', 'subject', 'sentAt', 'status'] },
  access: {
    read: ({ req }) => req.user?.role === 'admin',
    create: () => false,
    update: () => false,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'to', type: 'text', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'body', type: 'json', required: true },
    { name: 'sentAt', type: 'date', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'sent',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ],
}
