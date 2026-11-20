import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { searchProducts } from '@/lib/search/products'
import { isLoggedIn } from '@/lib/access/viewer'
import { publicProductsClause } from '@/lib/access/restrictedQuery'
import { withoutRestricted } from '@/lib/access/restrictedProducts'

// The answer depends on who is asking (members-only products are only searchable when logged in), so it must be built
// fresh for each request and never stored and reused for someone else. (It was already uncached in practice:
// reading request.url makes a route dynamic, which is what the old "Dynamic server usage" build message was.)
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    const payload = await getPayload({ config: configPromise })

    const showRestricted = await isLoggedIn()
    const publicOnly = showRestricted ? null : await publicProductsClause(payload)

    // Fetch all active products
    // We only need a few fields for search to keep memory lightweight
    const productsRes = await payload.find({
      collection: 'products',
      where: {
        and: [
          { status: { equals: 'active' } },
          { isVisible: { equals: true } },
          ...(publicOnly ? [publicOnly] : []),
        ],
      },
      depth: 1, // To get categories
      limit: 1000,
    })

    // Second lock: even if the query above were ever wrong, a restricted product never reaches a logged-out search.
    const searchableDocs = showRestricted ? productsRes.docs : withoutRestricted(productsRes.docs)

    const products = searchableDocs.map((doc: any) => {
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
      return NextResponse.json([], { headers: NO_STORE })
    }

    // Fuzzy search (name, hidden aliases, categories, description); top 8 results
    const matchedProducts = searchProducts(products, query)

    return NextResponse.json(matchedProducts, { headers: NO_STORE })
  } catch (error: any) {
    console.error('Search API Error:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500, headers: NO_STORE })
  }
}
