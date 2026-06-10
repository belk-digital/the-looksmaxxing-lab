'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function getFeaturedProducts() {
  try {
    const payload = await getPayload({ config: configPromise })
    const products = await payload.find({
      collection: 'products',
      limit: 6,
      where: {
        status: { equals: 'active' }
      }
    })

    return products.docs.map((p: any) => {
      const imageUrl = p.images?.[0]?.image?.url || '/hero-image.png'
      // Use the actual description and truncate it if it's too long
      const rawDesc = p.description || ''
      const shortDesc = rawDesc.length > 120 ? rawDesc.substring(0, 117) + '...' : rawDesc
      
      return {
        title: p.name,
        desc: shortDesc,
        image: imageUrl,
        link: `/products/${p.slug}`
      }
    })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}
