import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function run() {
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  const productRes = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'bpc-157' } },
    limit: 1,
  })

  if (productRes.docs.length === 0) {
    console.log('BPC-157 not found')
    process.exit(1)
  }
  const product = productRes.docs[0]

  const filePath = path.join(process.cwd(), 'public/Temp Product Images/bpc-157-10mg.PNG')
  const fileData = fs.readFileSync(filePath)
  const stats = fs.statSync(filePath)

  console.log('Uploading new BPC-157 image...')
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'BPC-157 research peptide vial — The Looksmaxxing Lab' },
    file: {
      data: fileData,
      mimetype: 'image/png',
      name: `bpc-157-10mg-${Date.now()}.png`,
      size: stats.size,
    }
  })

  console.log(`Media uploaded with ID: ${media.id}`)

  await payload.update({
    collection: 'products',
    id: product.id,
    data: {
      images: [
        { image: media.id }
      ]
    }
  })

  console.log('Product BPC-157 updated with correct image.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
