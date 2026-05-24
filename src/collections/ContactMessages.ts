import { CollectionConfig } from 'payload'
import { accessContent } from '../access/content'

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  admin: { defaultColumns: ['name', 'email', 'subject', 'createdAt'] },
  access: { create: () => true, read: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'createdAt', type: 'date', defaultValue: () => new Date(), admin: { readOnly: true } },
  ],
}
