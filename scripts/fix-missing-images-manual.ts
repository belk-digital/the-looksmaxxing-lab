import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const IMAGE_FIXES: Record<string, number[]> = {
  'oxytocin': [106],
  'll-37': [104],
}

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  console.log('Fetching products to fix...')
  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 1000,
    depth: 0,
  })

  const productsBySlug = new Map(products.map((p: any) => [p.slug, p]))

  let updated = 0
  for (const [slug, mediaIds] of Object.entries(IMAGE_FIXES)) {
    const product = productsBySlug.get(slug)
    if (!product) {
      console.log(`SKIP: Could not find product with slug ${slug}`)
      continue
    }

    try {
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          images: mediaIds.map(id => ({ image: id })),
        } as any,
      })
      console.log(`Fixed images for ${product.name} (slug: ${slug}) => [${mediaIds.join(', ')}]`)
      updated++
    } catch (e: any) {
      console.error(`ERROR updating ${slug}: ${e.message}`)
    }
  }

  console.log(`\nComplete! Fixed ${updated} products.`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
