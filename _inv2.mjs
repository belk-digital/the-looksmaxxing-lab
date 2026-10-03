import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'
const payload = await getPayload({ config: configPromise })
const { docs } = await payload.find({ collection: 'blog-posts', where: { status: { equals: 'published' } }, limit: 200, depth: 0, sort: '-publishedAt' })
console.log('CMS PUBLISHED (' + docs.length + '):')
docs.forEach(p => console.log('-', p.title, '|', p.category))
