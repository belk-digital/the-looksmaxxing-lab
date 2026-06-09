import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function AddBulkBundles() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { contains: 'tirzepatide' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.totalDocs === 0) {
      return <div id="result-message">Tirzepatide product not found.</div>
    }

    const product = existing.docs[0]
    const prodId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id

    await payload.update({
      collection: 'products',
      id: prodId as any,
      data: {
        bulkBundles: [
          {
            name: '2 Kits',
            quantity: 2,
            price: 259.98,
            salePrice: 229.98
          },
          {
            name: '5 Kits',
            quantity: 5,
            price: 649.95,
            salePrice: 549.95
          },
          {
            name: '10 Kits',
            quantity: 10,
            price: 1299.90,
            salePrice: 999.90
          }
        ]
      },
      overrideAccess: true,
    })

    return <div id="result-message">Successfully pushed 2 kits, 5 kits, and 10 kits bundles!</div>
  } catch (error: any) {
    return <div id="result-message"><pre>{`Error: ${error.message}\nStack: ${error.stack}`}</pre></div>
  }
}
