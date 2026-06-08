import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function RunScriptPage() {
  let message = ''
  try {
    const payload = await getPayload({ config: configPromise })

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { contains: 'tirzepatide' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.totalDocs === 0) {
      return <div>Tirzepatide product not found in database.</div>
    }

    const product = existing.docs[0]
    const prodId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id

    await payload.update({
      collection: 'products',
      id: prodId as any,
      data: {
        hasVariants: true,
        price: 129.99,
        variants: [
          {
            sku: 'TIRZ-5',
            price: 129.99,
            salePrice: 99.99,
            stock: 100,
            options: [
              { key: 'Size', value: '5mg' }
            ]
          },
          {
            sku: 'TIRZ-10',
            price: 249.99,
            salePrice: 199.99,
            stock: 100,
            options: [
              { key: 'Size', value: '10mg' }
            ]
          },
          {
            sku: 'TIRZ-15',
            price: 349.99,
            salePrice: 299.99,
            stock: 50,
            options: [
              { key: 'Size', value: '15mg' }
            ]
          }
        ],
      },
      overrideAccess: true,
    })

    const { sql } = require('drizzle-orm')
    
    // Fix the Postgres sequence that got out of sync
    try {
      await payload.db.drizzle.execute(sql`SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id),0) + 1, false) FROM products;`)
    } catch (e) {
      console.error('Sequence fix failed:', e)
    }

    // Create Bundle 1
    const existing5Kit = await payload.find({
      collection: 'products',
      where: { slug: { equals: 'tirzepatide-5-kits' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing5Kit.totalDocs === 0) {
      await payload.create({
        collection: 'products',
        data: {
          name: 'Tirzepatide - 5 Kits Bundle',
          slug: 'tirzepatide-5-kits',
          description: 'Save big by purchasing 5 kits of our pure Tirzepatide research compound.',
          price: 449.99,
          salePrice: 399.99,
          stock: 50,
          status: 'active',
          images: product.images,
          categories: product.categories
        },
        overrideAccess: true,
      })
    } else {
        await payload.update({
          collection: 'products',
          id: typeof existing5Kit.docs[0].id === 'string' ? parseInt(existing5Kit.docs[0].id, 10) : existing5Kit.docs[0].id as any,
          data: {
            name: 'Tirzepatide - 5 Kits Bundle',
            price: 449.99,
            salePrice: 399.99
          },
          overrideAccess: true,
        })
    }

    // Create Bundle 2
    const existing10Kit = await payload.find({
      collection: 'products',
      where: { slug: { equals: 'tirzepatide-10-kits' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing10Kit.totalDocs === 0) {
      await payload.create({
        collection: 'products',
        data: {
          name: 'Tirzepatide - 10 Kits Bundle',
          slug: 'tirzepatide-10-kits',
          description: 'The ultimate research package. 10 kits of our premium Tirzepatide compound.',
          price: 799.99,
          salePrice: 699.99,
          stock: 25,
          status: 'active',
          images: product.images,
          categories: product.categories
        },
        overrideAccess: true,
      })
    } else {
        await payload.update({
          collection: 'products',
          id: typeof existing10Kit.docs[0].id === 'string' ? parseInt(existing10Kit.docs[0].id, 10) : existing10Kit.docs[0].id as any,
          data: {
            name: 'Tirzepatide - 10 Kits Bundle',
            price: 799.99,
            salePrice: 699.99
          },
          overrideAccess: true,
        })
    }

    message = 'Successfully created both 5 Kit and 10 Kit bundles automatically!'
  } catch (error: any) {
    message = `Error: ${error.message}\nData: ${JSON.stringify(error.data || {})}\nStack: ${error.stack}`
  }

  return <div id="result-message"><pre>{message}</pre></div>
}
