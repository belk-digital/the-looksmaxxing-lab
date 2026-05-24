import { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { accessContent } from '../access/content'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { defaultColumns: ['title', 'status'] },
  access: accessContent,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', admin: { position: 'sidebar' } },
    { name: 'content', type: 'richText', editor: lexicalEditor() },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.slug && data.title) {
          data.slug = data.title.toLowerCase().replace(/\s+/g, '-')
        }
        return data
      },
    ],
  },
}
