import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'

async function run() {
  console.log('Initializing Payload...')
  const payload = await getPayload({ config })

  console.log('Fetching existing categories...')
  const existingCategories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })

  console.log(`Deleting ${existingCategories.totalDocs} existing categories...`)
  for (const doc of existingCategories.docs) {
    try {
      await payload.delete({
        collection: 'categories',
        id: doc.id,
      })
    } catch (err: any) {
      console.warn(`Could not delete category ${doc.name}: ${err.message}`)
    }
  }

  const newCategories = [
    'Bioregulators',
    'Cellular Health Research',
    'Cognitive Function Studies',
    'Essentials',
    'Growth Factor Research Peptides',
    'Metabolic Research Peptides',
    'Receptor Agonist Research Peptides',
    'Recovery Research Peptides'
  ]

  console.log('Creating new categories...')
  for (const cat of newCategories) {
    const slug = cat.toLowerCase().replace(/ /g, '-')
    try {
      await payload.create({
        collection: 'categories',
        data: {
          name: cat,
          slug,
          isVisible: true,
        },
      })
      console.log(`Created: ${cat}`)
    } catch (err: any) {
      console.error(`Failed to create ${cat}: ${err.message}`)
    }
  }

  console.log('Categories update complete!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Error during update:', err)
  process.exit(1)
})
