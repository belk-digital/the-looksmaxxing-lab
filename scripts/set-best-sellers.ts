import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  const slugs = ['tirzepatide', 'glp-3', 'semaglutide', 'bpc-157', 'nad-plus', 'glow-blend']
  
  for (const slug of slugs) {
    const res = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1
    })

    if (res.docs && res.docs.length > 0) {
      const product = res.docs[0]
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          isBestSeller: true,
        }
      })
      console.log(`Set ${slug} as best seller.`)
    } else {
      console.log(`Could not find ${slug}`)
    }
  }

  console.log('Done!')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
