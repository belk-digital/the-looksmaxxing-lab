'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function getMegaMenuData() {
  const payload = await getPayload({ config: configPromise })
  const categoriesRes = await payload.find({
    collection: 'categories',
    where: { isVisible: { equals: true } },
    sort: 'sortOrder',
    limit: 100,
    overrideAccess: true,
  })
  
  const categoriesWithProducts = [];
  
  for (const doc of categoriesRes.docs) {
    const productsRes = await payload.find({
      collection: 'products',
      where: {
        categories: { in: [doc.id] },
        status: { equals: 'active' },
        isVisible: { equals: true }
      },
      limit: 3,
      overrideAccess: true,
    })

    categoriesWithProducts.push({
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      products: productsRes.docs.map(prod => ({
        name: prod.name,
        slug: prod.slug,
        image: typeof prod.images?.[0]?.image === 'object' && prod.images[0].image?.url 
          ? prod.images[0].image.url 
          : '/placeholder.jpg',
        price: prod.price
      }))
    })
  }

  return categoriesWithProducts;
}
