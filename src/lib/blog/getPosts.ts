import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { JOURNAL_POSTS } from '@/data/journal-posts'
import { getFeaturedImageUrl, formatPostDate } from './postDisplay'
import { estimateReadingTime } from './readingTime'
import type { UnifiedJournalPost } from './types'
import type { Product as ShopProduct } from '@/components/shop/PrimaryProductCard'

function staticPostsAsUnified(): UnifiedJournalPost[] {
  return JOURNAL_POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    date: p.date,
    sortDate: p.date,
    readTime: p.readTime,
    excerpt: p.excerpt,
    heroImage: p.heroImage,
    source: 'static' as const,
  }))
}

async function cmsPostsAsUnified(): Promise<UnifiedJournalPost[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 100,
      depth: 1,
    })

    return docs.map((post: any) => ({
      slug: post.slug,
      title: post.title,
      category: post.category || '',
      date: formatPostDate(post.publishedAt || post.createdAt),
      sortDate: post.publishedAt || post.createdAt,
      readTime: post.readTime || estimateReadingTime(post.content),
      excerpt: post.excerpt || '',
      heroImage: getFeaturedImageUrl(post),
      source: 'cms' as const,
    }))
  } catch (err) {
    console.error('Failed to fetch CMS blog posts', err)
    return []
  }
}

// Merges Payload-authored posts with the hardcoded JOURNAL_POSTS array so both
// continue to show together on /journal, newest first.
export async function getAllJournalPosts(): Promise<UnifiedJournalPost[]> {
  const cmsPosts = await cmsPostsAsUnified()
  const all = [...cmsPosts, ...staticPostsAsUnified()]
  return all.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
}

export async function getCmsJournalPostSlugs(): Promise<string[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    })
    return docs.map((d: any) => d.slug).filter(Boolean)
  } catch (err) {
    console.error('Failed to fetch CMS blog post slugs', err)
    return []
  }
}

function resolveProductImage(product: any): string {
  const topLevel = product.images?.[0]?.image?.url
  if (topLevel) return topLevel
  const variantWithImage = product.variants?.find((v: any) => v.image?.url)
  if (variantWithImage) return variantWithImage.image.url
  return '/New Images/glow-and-nad-bg-image.webp'
}

function toShopProduct(product: any): ShopProduct {
  const hasVariants = !!product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0

  let priceRange = ''
  let originalPrice: string | undefined
  let discountPercentage: number | undefined

  if (hasVariants) {
    const effectivePrices = product.variants.map((v: any) => v.salePrice ?? v.price).filter((p: any) => typeof p === 'number')
    if (effectivePrices.length > 0) {
      const min = Math.min(...effectivePrices)
      const max = Math.max(...effectivePrices)
      priceRange = min === max ? `$${min}` : `$${min} - $${max}`
    }
  } else {
    const price = product.price
    const salePrice = product.salePrice
    if (salePrice != null && salePrice < price) {
      priceRange = `$${salePrice}`
      originalPrice = `$${price}`
      discountPercentage = Math.round((1 - salePrice / price) * 100)
    } else {
      priceRange = price != null ? `$${price}` : ''
    }
  }

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug,
    image: resolveProductImage(product),
    hoverImage: product.images?.[1]?.image?.url || undefined,
    shortDescription: product.seoDescription || product.description || '',
    priceRange,
    originalPrice,
    discountPercentage,
    category: '',
    hasVariants,
    variantCount: product.variants?.length || 0,
    firstVariantName: product.variants?.[0]?.sku,
    firstVariantSku: product.variants?.[0]?.sku,
  }
}

export async function getCmsJournalPost(slug: string): Promise<{
  post: any
  relatedProducts: ShopProduct[]
} | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'blog-posts',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      depth: 2,
      limit: 1,
    })

    const post = docs[0]
    if (!post) return null

    const relatedProducts: ShopProduct[] = Array.isArray(post.relatedProducts)
      ? post.relatedProducts.filter((p: any) => typeof p === 'object').map(toShopProduct)
      : []

    return { post, relatedProducts }
  } catch (err) {
    console.error(`Failed to fetch CMS blog post "${slug}"`, err)
    return null
  }
}
