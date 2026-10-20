import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { searchProducts } from '@/lib/search/products'

// Cache the route heavily so we aren't querying Payload on every keystroke
export const revalidate = 60 // Cache for 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    const payload = await getPayload({ config: configPromise })
    
    // Fetch all active products
    // We only need a few fields for search to keep memory lightweight
    const productsRes = await payload.find({
      collection: 'products',
      where: {
        status: { equals: 'active' },
        isVisible: { equals: true }
      },
      depth: 1, // To get categories
      limit: 1000,
    })

    const products = productsRes.docs.map((doc: any) => {
      // Flatten categories for easier searching
      const categoryNames = doc.categories?.map((c: any) => c.title || c.name).join(' ') || ''

      return {
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        description: doc.description || doc.seoDescription || '',
        price: doc.price,
        imageUrl: doc.images?.[0]?.image?.url || null,
        categories: categoryNames,
        descriptor: doc.descriptor || ''
      }
    })

    if (!query) {
      // If no query, just return empty array
      return NextResponse.json([])
    }

    // Fuzzy search (name, hidden aliases, categories, description); top 8 results
    const matchedProducts = searchProducts(products, query)

    return NextResponse.json(matchedProducts)
  } catch (error: any) {
    console.error('Search API Error:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
  }
}
