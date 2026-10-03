import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'
const payload = await getPayload({ config: configPromise })
const { docs } = await payload.find({ collection: 'blog-posts', where: { slug: { equals: 'epithalon-telomeres-longevity-regulatory-status' } }, limit: 1, depth: 0 })
const p = docs[0]
const hasTable = (p.content?.root?.children || []).some(n => JSON.stringify(n).includes('"type":"table"'))
console.log('title:', p.title)
console.log('has table node:', hasTable)
console.log('content length (chars):', JSON.stringify(p.content).length)
console.log('faqs:', p.faqs?.map(f => f.question))
