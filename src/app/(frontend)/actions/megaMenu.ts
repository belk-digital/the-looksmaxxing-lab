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
  })
  
  const categoriesWithProducts = await Promise.all(
    categoriesRes.docs.map(async (doc) => {
      const productsRes = await payload.find({
        collection: 'products',
        where: {
          categories: { contains: doc.id },
          status: { equals: 'active' },
          isVisible: { equals: true }
        },
        limit: 3,
      })

      return {
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
      }
    })
  )

  return categoriesWithProducts;
}
