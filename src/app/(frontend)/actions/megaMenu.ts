'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { isLoggedIn } from '@/lib/access/viewer'
import { publicProductsClause } from '@/lib/access/restrictedQuery'
import { withoutRestricted } from '@/lib/access/restrictedProducts'

export async function getMegaMenuData() {
  const payload = await getPayload({ config: configPromise })
  const categoriesRes = await payload.find({
    collection: 'categories',
    where: { isVisible: { equals: true } },
    sort: 'sortOrder',
    limit: 100,
    overrideAccess: true,
  })

  // Nasal sprays are for logged-in customers only: leave them out of the menu for everyone else.
  const showRestricted = await isLoggedIn()
  const publicOnly = showRestricted ? null : await publicProductsClause(payload)

  const categoriesWithProducts = [];

  for (const doc of categoriesRes.docs) {
    const productsRes = await payload.find({
      collection: 'products',
      where: {
        and: [
          { categories: { in: [doc.id] } },
          { status: { equals: 'active' } },
          { isVisible: { equals: true } },
          ...(publicOnly ? [publicOnly] : []),
        ],
      },
      limit: 3,
      overrideAccess: true,
    })

    // Second lock: even if the query above were ever wrong, a restricted product never reaches a logged-out menu.
    const products = showRestricted ? productsRes.docs : withoutRestricted(productsRes.docs)

    categoriesWithProducts.push({
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      products: products.map(prod => ({
        name: prod.name,
        slug: prod.slug,
        image: typeof prod.images?.[0]?.image === 'object' && prod.images[0].image?.url
          ? prod.images[0].image.url
          : '/new-images/longevia-vial.webp',
        price: prod.price
      }))
    })
  }

  return categoriesWithProducts;
}
