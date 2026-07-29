import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const IMAGE_MAP: Record<string, string[]> = {
  'tirzepatide': ['tirzepatide-10mg.jpg', 'terzepatide-10mg.PNG'],
  'glp-3': ['glp-3-10mg.jpg', 'glp-3-10mg.PNG'],
  'semaglutide': ['semaglutide-10mg.PNG'],
  'glow-blend': ['glow-70mg.jpg', 'glow-70mg.PNG'],
  'klow-blend': ['klow-50mg.jpg', 'klow-50-10-10-10mg.PNG'],
  'cjc-ipamorelin': ['cjc-1295-or-ipamorelin-10mg.jpg', 'cjc-1295-ipamorelin-10mg.PNG'],
  'epithalon': ['epithalon-10mg.jpg', 'epithalon-10mg.PNG'],
  'glutathione': ['glutathione-200mg.jpg', 'glutathione-200mg.PNG'],
  'ipamorelin': ['ipamorelin-10mg.jpg', 'ipamorelin-10mg.PNG'],
  'mots-c': ['mots-c-10mg.jpg', 'mots-c-10mg.PNG'],
  'melanotan-ii': ['mt-2-10mg.jpg', 'mt-2-10mg.PNG'],
  'nad-plus': ['nad-plus-500mg.jpg', 'nad-plus-500mg.PNG'],
  'selank': ['selank-5mg.jpg', 'selank-5mg.PNG'],
  'semax': ['semax-5mg.jpg', 'semax-5mg.PNG'],
  'tesamorelin': ['tesamorelin-10mg.jpg', 'tesamorelin-10mg.PNG'],
  'bpc-157': ['bpc-157-10mg.PNG'],
  'ghk-cu': ['ghk-cu-50mg.PNG'],
  'kisspeptin': ['kisspeptine-10mg.PNG'],
  'sermorelin': ['sermorelin-10mg.PNG'],
  'tesa-ipa': ['tesa-ipa-6-3-mg.PNG'],
}

async function run() {
  console.log('Initializing Payload...')
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  const imagesDir = path.resolve(process.cwd(), 'public/Temp Product Images')

  console.log('Fetching all products...')
  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 1000,
    depth: 0,
  })

  const productsBySlug = new Map(products.map(p => [p.slug, p]))
  console.log(`Found ${products.length} products in database\n`)

  let updated = 0
  let skipped = 0

  for (const [slug, imageFiles] of Object.entries(IMAGE_MAP)) {
    const product = productsBySlug.get(slug)
    if (!product) {
      console.log(`  SKIP: No product found for slug "${slug}"`)
      skipped++
      continue
    }

    const existingImages = (product.images as any[]) || []
    if (existingImages.length > 0) {
      console.log(`  SKIP: "${product.name}" already has ${existingImages.length} image(s)`)
      skipped++
      continue
    }

    const mediaIds: number[] = []

    for (const fileName of imageFiles) {
      const filePath = path.join(imagesDir, fileName)
      if (!fs.existsSync(filePath)) {
        console.log(`  WARN: File not found: ${fileName}`)
        continue
      }

      const fileData = fs.readFileSync(filePath)
      const ext = path.extname(fileName).toLowerCase()
      const mimetype = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'

      try {
        const media = await payload.create({
          collection: 'media',
          data: { alt: `${product.name} research peptide vial — The Looksmaxxing Lab` },
          file: {
            data: fileData,
            mimetype,
            name: fileName,
            size: fs.statSync(filePath).size,
          },
        })
        mediaIds.push(media.id as number)
      } catch (e: any) {
        console.log(`  ERROR uploading ${fileName}: ${e.message}`)
      }
    }

    if (mediaIds.length === 0) {
      console.log(`  SKIP: No images uploaded for "${product.name}"`)
      skipped++
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
      console.log(`  ✓ "${product.name}" — ${mediaIds.length} image(s) attached`)
      updated++
    } catch (e: any) {
      console.log(`  ERROR updating "${product.name}": ${e.message}`)
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
