import path from 'path'
import dotenv from 'dotenv'
import { products } from './product-data'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Only these slugs get created/upserted — everything else in product-data.ts is left untouched.
const TARGET_SLUGS = ['pinealon', 'mt2-spray', 'semax-spray', 'glp-3-rta-sublingual-strips', 'nad-strip', 'glow-strips']

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  console.log('Fetching categories...')
  const categoriesRes = await payload.find({ collection: 'categories', limit: 100 })
  const categoryMap = new Map<string, number>()
  for (const cat of categoriesRes.docs) {
    categoryMap.set((cat.name as string).toLowerCase(), cat.id as number)
  }

  const targets = products.filter((p) => TARGET_SLUGS.includes(p.slug))
  console.log(`Creating ${targets.length} product(s): ${targets.map((p) => p.slug).join(', ')}`)

  for (const p of targets) {
    const existing = await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1 })

    const resolvedCategories: number[] = []
    if (p.categoryNames) {
      for (const name of p.categoryNames) {
        const id = categoryMap.get(name.toLowerCase())
        if (id) resolvedCategories.push(id)
      }
    }
    if (resolvedCategories.length === 0) {
      const firstId = [...categoryMap.values()][0]
      if (firstId) resolvedCategories.push(firstId)
    }

    try {
      const data = {
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
        } as any

      if (existing.docs.length > 0) {
        const updated = await payload.update({ collection: 'products', id: existing.docs[0].id, data })
        console.log(`  Updated: ${p.name} (/${p.slug}) id=${updated.id}`)
      } else {
        const created = await payload.create({ collection: 'products', data })
        console.log(`  Created: ${p.name} (/${p.slug}) id=${created.id}`)
      }
    } catch (e: any) {
      console.error(`  FAILED: ${p.name} — ${e.message}`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
