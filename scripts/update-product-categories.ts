import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Category IDs from DB:
// 6: Recovery & Tissue Repair
// 7: Immune Regulation
// 8: Metabolic Research
// 9: Growth Hormone Secretagogues
// 10: Mitochondrial & Cellular Energy
// 11: Cognitive & Nootropic
// 12: Hormonal Health
// 13: Longevity Research

const PRODUCT_CATEGORY_MAPPING: Record<string, number[]> = {
  // Recovery & Tissue Repair (6), Longevity Research (13)
  'bpc-157': [6, 13],
  'bpc-tb-500': [6, 13],
  'tb-500': [6, 7],
  'ghk-cu': [6, 13],
  'glow-blend': [6, 13],
  'glow-strips': [6, 13],
  'klow-blend': [6, 7, 13],
  'kpv': [7, 6],
  'll-37': [7, 13],
  'reconstitution-solution': [6, 13],

  // Cognitive & Nootropic (11)
  'semax': [11, 13],
  'semax-spray': [11, 13],
  'selank': [11, 7],
  'semax-selank': [11, 7],
  'pinealon': [11, 12, 13],
  'oxytocin': [12, 11],

  // Mitochondrial & Cellular Energy (10)
  'nad-plus': [10, 8, 13],
  'nad-strip': [10, 8, 13],
  'mots-c': [10, 8, 13],
  'glutathione': [7, 10, 13],
  'epithalon': [13, 10, 12],
  'lipo-c': [8, 10],

  // Metabolic Research (8)
  'semaglutide': [8, 13],
  'tirzepatide': [8, 13],
  'glp-3': [8, 13],
  'glp-3-rta-sublingual-strips': [8, 13],

  // Growth Hormone Secretagogues (9)
  'cjc-1295-no-dac': [9, 6],
  'cjc-ipamorelin': [9, 6],
  'ipamorelin': [9, 6],
  'sermorelin': [9, 13],
  'tesamorelin': [9, 8],
  'tesa-ipa': [9, 8, 6],

  // Hormonal Health (12)
  'kisspeptin': [12, 13],
  'melanotan-i': [12, 7],
  'melanotan-ii': [12, 8],
  'mt2-spray': [12, 8],
}

async function updateProductCategories() {
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  console.log('--- STARTING PRODUCT CATEGORIES UPDATE ---')

  const categoriesRes = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: true,
  })
  const categoryMap = new Map<number, string>()
  categoriesRes.docs.forEach((cat: any) => {
    categoryMap.set(Number(cat.id), cat.name)
  })

  console.log(`Loaded ${categoryMap.size} categories from DB:`)
  for (const [id, name] of categoryMap.entries()) {
    console.log(`  [${id}] ${name}`)
  }

  const productsRes = await payload.find({
    collection: 'products',
    limit: 200,
    overrideAccess: true,
  })

  console.log(`\nFound ${productsRes.docs.length} products to update.\n`)

  let successCount = 0
  for (const product of productsRes.docs) {
    const slug = product.slug as string
    const targetCategoryIds = PRODUCT_CATEGORY_MAPPING[slug]

    if (!targetCategoryIds || targetCategoryIds.length === 0) {
      console.warn(`[SKIP] No category mapping found for slug: "${slug}" (Product: "${product.name}")`)
      continue
    }

    const catNames = targetCategoryIds.map(id => categoryMap.get(id) || `ID:${id}`).join(', ')

    try {
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          categories: targetCategoryIds as any,
        },
        overrideAccess: true,
      })
      console.log(`✓ Updated [${product.name}] (${slug}) -> Categories: [${catNames}]`)
      successCount++
    } catch (err: any) {
      console.error(`✗ Error updating product [${product.name}] (${slug}):`, err.message || err)
    }
  }

  console.log(`\n--- COMPLETED: Updated ${successCount}/${productsRes.docs.length} products. ---`)

  // Verification step: verify how many products each category now has
  console.log('\n--- CATEGORY PRODUCT COUNTS POST-UPDATE ---')
  for (const [catId, catName] of categoryMap.entries()) {
    const checkRes = await payload.find({
      collection: 'products',
      where: {
        categories: { in: [catId] },
      },
      limit: 200,
      overrideAccess: true,
    })
    console.log(`Category [${catName}] (ID: ${catId}): ${checkRes.docs.length} products`)
  }

  process.exit(0)
}

updateProductCategories().catch(err => {
  console.error(err)
  process.exit(1)
})
