import path from 'path'
import dotenv from 'dotenv'
import { products } from './product-data'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  // Fetch categories
  console.log('Fetching categories...')
  const categoriesRes = await payload.find({ collection: 'categories', limit: 100 })
  const categoryMap = new Map<string, number>()
  for (const cat of categoriesRes.docs) {
    categoryMap.set((cat.name as string).toLowerCase(), cat.id as number)
  }
  console.log(`Found ${categoryMap.size} categories: ${[...categoryMap.keys()].join(', ')}`)

  if (categoryMap.size === 0) {
    console.error('No categories found! Please seed categories first.')
    process.exit(1)
  }

  // Clean up blocking relations
  console.log('Cleaning up blocking relations...')
  for (const coll of ['carts', 'orders', 'wishlists', 'reviews'] as const) {
    try {
      const docs = await payload.find({ collection: coll, limit: 1000 })
      for (const d of docs.docs) {
        await payload.delete({ collection: coll, id: d.id })
      }
      console.log(`  Deleted ${docs.docs.length} ${coll}`)
    } catch (e) {
      console.log(`  No ${coll} to delete`)
    }
  }

  // Delete all existing products
  console.log('Deleting all existing products...')
  const oldProducts = await payload.find({ collection: 'products', limit: 1000 })
  for (const p of oldProducts.docs) {
    try {
      await payload.delete({ collection: 'products', id: p.id })
    } catch (e: any) {
      console.warn(`  Could not delete product ${p.name}: ${e.message}`)
    }
  }
  console.log(`  Deleted ${oldProducts.docs.length} products`)

  // Create products
  console.log(`\nCreating ${products.length} products...\n`)

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    // Resolve category IDs
    const resolvedCategories: number[] = []
    if (p.categoryNames) {
      for (const name of p.categoryNames) {
        const id = categoryMap.get(name.toLowerCase())
        if (id) resolvedCategories.push(id)
      }
    }
    // Fallback: use first available category
    if (resolvedCategories.length === 0) {
      const firstId = [...categoryMap.values()][0]
      if (firstId) resolvedCategories.push(firstId)
    }

    try {
      await payload.create({
        collection: 'products',
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          price: p.price,
          salePrice: p.salePrice,
          stock: p.stock ?? 500,
          weight: 0.05,
          dimensions: { length: 5, width: 2, height: 2 },
          categories: resolvedCategories as any,
          sku: p.sku,
          hasVariants: p.hasVariants ?? false,
          variants: p.variants ?? [],
          productDetailsTitle: p.productDetailsTitle ?? 'Comprehensive Product Details',
          productDetailsDescription: p.productDetailsDescription,
          researchFocusTitle: p.researchFocusTitle ?? 'Advanced Research Focus',
          researchFocusDescription: p.researchFocusDescription,
          qualityPurityTitle: p.qualityPurityTitle ?? 'Uncompromising Quality Standards',
          qualityPurityDescription: p.qualityPurityDescription,
          complianceNoticeTitle: p.complianceNoticeTitle ?? 'Legal & Compliance Notice',
          complianceNoticeDescription: p.complianceNoticeDescription,
          faqs: p.faqs ?? [],
          status: p.status ?? 'active',
          isVisible: true,
          averageRating: 5,
          reviewCount: 0,
        } as any,
      })
      console.log(`  [${i + 1}/${products.length}] Created: ${p.name} (/${p.slug}) ${p.hasVariants ? `[${p.variants?.length} variants]` : ''}`)
    } catch (e: any) {
      console.error(`  [${i + 1}/${products.length}] FAILED: ${p.name} — ${e.message}`)
    }
  }

  console.log('\n✓ Product seeding complete!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Error during seeding:', err)
  process.exit(1)
})
