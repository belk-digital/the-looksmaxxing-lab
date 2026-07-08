import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import 'dotenv/config'
import { products as localProducts } from './product-data'

async function mapProducts() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
  })

  const categoryMap = new Map<string, number>()
  for (const cat of categories.docs) {
    categoryMap.set((cat.name as string).toLowerCase(), cat.id as number)
  }

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1000,
  })

  console.log(`Found ${products.docs.length} products to map...`)

  for (const p of products.docs) {
    const localProduct = localProducts.find(lp => lp.slug === p.slug || lp.name === p.name)
    if (localProduct && localProduct.categoryNames) {
      const resolvedCategories: number[] = []
      for (const name of localProduct.categoryNames) {
        const id = categoryMap.get(name.toLowerCase())
        if (id) resolvedCategories.push(id)
      }
      
      if (resolvedCategories.length > 0) {
        await payload.update({
          collection: 'products',
          id: p.id,
          data: { categories: resolvedCategories as any },
          overrideAccess: true,
        })
        console.log(`Updated ${p.name} with categories: ${localProduct.categoryNames.join(', ')}`)
      } else {
        console.log(`Could not find matching categories in DB for ${p.name}. (Requested: ${localProduct.categoryNames.join(', ')})`)
      }
    } else {
      console.log(`No category mapping needed/found for ${p.name}`)
    }
  }

  console.log('Mapping complete!')
  process.exit(0)
}

mapProducts().catch(console.error)
