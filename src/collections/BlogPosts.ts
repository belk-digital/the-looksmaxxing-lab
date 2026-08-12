import { CollectionConfig } from 'payload'
import { lexicalEditor, EXPERIMENTAL_TableFeature, BlocksFeature } from '@payloadcms/richtext-lexical'
import { accessContent } from '../access/content'
import { CalloutBox } from '../blocks/CalloutBox'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: { defaultColumns: ['title', 'category', 'author', 'status', 'publishedAt'], useAsTitle: 'title' },
  access: accessContent,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'blog-media', label: 'Featured Image', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: { description: 'Short summary shown on the journal listing cards and used as the default SEO/social description.' },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          EXPERIMENTAL_TableFeature(),
          BlocksFeature({ blocks: [CalloutBox] }),
        ],
      }),
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      admin: { position: 'sidebar' },
      // Kept in sync with the filter chips on /journal (JournalClient.tsx CATEGORIES).
      options: [
        { label: 'Emerging', value: 'Emerging' },
        { label: 'Guidelines', value: 'Guidelines' },
        { label: 'Studies', value: 'Studies' },
        { label: 'Guides', value: 'Guides' },
      ],
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'readTime',
      type: 'text',
      admin: { description: "e.g. '12 min read'. Leave blank to auto-calculate from content length when rendered." },
    },
    {
      name: 'keyTakeaways',
      type: 'array',
      admin: { description: 'Short factual bullet points summarizing the post. Used for AI answer-engine (AEO/GEO) extraction and the on-page "Key Takeaways" callout.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'faqs',
      type: 'array',
      admin: { description: 'Populates FAQPage schema.org markup and the on-page FAQ accordion.' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'references',
      type: 'array',
      admin: { description: 'Peer-reviewed sources cited in this post (PubMed, DOI, journal links). Strengthens E-E-A-T trust signals.' },
      fields: [
        { name: 'citationText', type: 'text', required: true, admin: { description: 'e.g. "Smith et al., 2023, Journal of Peptide Science"' } },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'focusKeyphrase',
      type: 'text',
      admin: { position: 'sidebar', description: 'Primary target keyword/phrase for this post (editorial SEO guidance).' },
    },
    {
      name: 'keywords',
      type: 'text',
      admin: { position: 'sidebar', description: 'Comma-separated secondary keywords for meta keywords / internal search relevance.' },
    },
    {
      name: 'metaTitle',
      type: 'text',
      admin: { position: 'sidebar', description: 'Overrides the <title> tag. Leave blank to fall back to the post title.' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Overrides the meta description. Leave blank to fall back to the excerpt.' },
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
