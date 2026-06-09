import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function seed() {
  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'shippingzones',
    where: { name: { equals: 'Domestic (US Only)' } }
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'shippingzones',
      data: {
        name: 'Domestic (US Only)',
        methods: [
          { method: 'Standard Shipping', price: 500, estimatedDays: 5 },
          { method: 'Express Shipping', price: 1500, estimatedDays: 2 }
        ]
      }
    })
    console.log('Seeded Domestic US shipping zone')
  } else {
    console.log('Shipping zone already exists')
  }

  process.exit(0)
}

seed().catch(console.error)
