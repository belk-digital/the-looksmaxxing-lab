import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function run() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('Testing Trash creation...')
    
    const result = await payload.create({
      collection: 'trash',
      data: {
        collectionSlug: 'test',
        originalId: '123',
        documentData: { test: 'data' },
      },
      overrideAccess: true,
    })
    
    console.log('Success:', result.id)
  } catch (err: any) {
    console.error('Error creating Trash:', err.message || err)
  }
  process.exit(0)
}

run()
