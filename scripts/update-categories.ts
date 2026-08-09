import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env') })

process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'a202580d681449743587f244'
process.env.DATABASE_URI = process.env.DATABASE_URI || 'postgresql://postgres.wfqndulqjkqgqxisvbtu:7bqXA+P-9rA8@aws-1-us-east-1.pooler.supabase.com:6543/postgres'

import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import slugify from 'slugify'

const NEW_CATEGORIES = [
  'Longevity Research',
  'Hormonal Health',
  'Cognitive & Nootropic',
  'Mitochondrial & Cellular Energy',
  'Growth Hormone Secretagogues',
  'Metabolic Research',
  'Immune Regulation',
  'Recovery & Tissue Repair'
]

async function run() {
  console.log('Initializing payload...')
  const payload = await getPayload({ config: configPromise })
  
  console.log('Fetching existing categories...')
  const existing = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  
  for (let i = 0; i < NEW_CATEGORIES.length; i++) {
    const newName = NEW_CATEGORIES[i]
    const slug = slugify(newName, { lower: true, strict: true })
    
    if (existing.docs[i]) {
      console.log(`Updating category ${existing.docs[i].name} -> ${newName}`)
      await payload.update({
        collection: 'categories',
        id: existing.docs[i].id,
        data: {
          name: newName,
          slug,
          isVisible: true,
          sortOrder: i + 1,
        }
      })
    } else {
      console.log(`Creating category ${newName}`)
      await payload.create({
        collection: 'categories',
        data: {
          name: newName,
          slug,
          isVisible: true,
          sortOrder: i + 1,
        }
      })
    }
  }
  
  // If there are extra categories left over, disable or delete them
  if (existing.docs.length > NEW_CATEGORIES.length) {
    for (let i = NEW_CATEGORIES.length; i < existing.docs.length; i++) {
      console.log(`Deleting extra category ${existing.docs[i].name}`)
      await payload.delete({
        collection: 'categories',
        id: existing.docs[i].id,
      })
    }
  }
  
  console.log('Categories updated successfully')
  process.exit(0)
}

run().catch(console.error)
