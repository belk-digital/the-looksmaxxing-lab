import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import 'dotenv/config'

async function inspect() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
  })

  console.log('--- CATEGORIES ---')
  categories.docs.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`))

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 100,
  })

  console.log('\n--- PRODUCTS ---')
  products.docs.forEach(p => {
    const cats = Array.isArray(p.categories) ? p.categories.join(', ') : p.categories
    console.log(`- ${p.name} (Categories: ${cats || 'NONE'})`)
  })

  process.exit(0)
}

inspect().catch(console.error)
