import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'

async function run() {
  console.log('Initializing Payload...')
  const payload = await getPayload({ config })

  console.log('Seeding dummy categories...')
  const categoriesToCreate = ['Skincare', 'Supplements', 'Research Use Only', 'Beauty', 'Wellness']
  const categoryIds: Record<string, number | string> = {}

  for (const cat of categoriesToCreate) {
    const slug = cat.toLowerCase().replace(/ /g, '-')
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
    })

    if (existing.docs.length > 0) {
      console.log(`Category "${cat}" already exists.`)
      categoryIds[cat] = existing.docs[0].id
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: {
          name: cat,
          slug,
          isVisible: true,
        },
      })
      console.log(`Created category: ${cat}`)
      categoryIds[cat] = created.id
    }
  }

  console.log('Seeding dummy products...')
  const products = [
    { name: 'BPC-157 Peptide', category: 'Research Use Only', price: 59.99 },
    { name: 'TB-500 Recovery', category: 'Research Use Only', price: 65.00 },
    { name: 'Vitamin C Serum', category: 'Skincare', price: 29.99 },
    { name: 'Retinol Cream', category: 'Skincare', price: 34.50 },
    { name: 'Creatine Monohydrate', category: 'Supplements', price: 24.99 },
    { name: 'Whey Protein Isolate', category: 'Supplements', price: 49.99 },
    { name: 'Hyaluronic Acid', category: 'Beauty', price: 19.99 },
    { name: 'Ashwagandha Extract', category: 'Wellness', price: 22.00 },
  ]

  const productIds: string[] = []

  for (const prod of products) {
    const slug = prod.name.toLowerCase().replace(/ /g, '-')
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
    })

    if (existing.docs.length > 0) {
      console.log(`Product "${prod.name}" already exists.`)
      productIds.push(existing.docs[0].id as unknown as string)
    } else {
      const created = await payload.create({
        collection: 'products',
        data: {
          name: prod.name,
          slug,
          price: prod.price,
          status: 'active',
          categories: [categoryIds[prod.category]] as any,
          description: `This is a sample description for ${prod.name}.`,
          stock: 100,
        } as any,
      })
      console.log(`Created product: ${prod.name}`)
      productIds.push(created.id as unknown as string)
    }
  }

  console.log('Seeding dummy user...')
  let userId = ''
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'dummy@test.com' } },
  })

  if (existingUser.docs.length > 0) {
    console.log('Dummy user already exists.')
    userId = existingUser.docs[0].id as unknown as string
  } else {
    const createdUser = await payload.create({
      collection: 'users',
      data: {
        email: 'dummy@test.com',
        role: 'customer',
        password: 'password123',
        firstName: 'Dummy',
        lastName: 'User',
      },
    })
    console.log('Created dummy user.')
    userId = createdUser.id as unknown as string
  }

  console.log('Seeding dummy order...')
  const existingOrder = await payload.find({
    collection: 'orders',
    where: { owner: { equals: userId } },
  })

  if (existingOrder.docs.length > 0) {
    console.log('Dummy order already exists.')
  } else if (productIds.length > 0) {
    await payload.create({
      collection: 'orders',
      data: {
        owner: userId,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal: 59.99,
        discountTotal: 0,
        taxTotal: 0,
        feeTotal: 0,
        total: 59.99,
        items: [
          {
            product: productIds[0],
            quantity: 1,
          }
        ],
      } as any,
    })
    console.log('Created dummy order.')
  }

  console.log('Seed completed successfully!')
  process.exit(0)
}

run().catch((err) => {
  console.error('Error during seeding:', err)
  process.exit(1)
})
