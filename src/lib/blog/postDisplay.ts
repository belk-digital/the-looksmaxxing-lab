import { encodeImageUrl } from '@/lib/utils'

export const FALLBACK_BLOG_IMAGE = '/New Images/glow-and-nad-bg-image.webp'

export function getFeaturedImageUrl(post: any): string {
  if (post.featuredImage && typeof post.featuredImage === 'object' && post.featuredImage.url) {
    return encodeImageUrl(post.featuredImage.url)
  }
  return FALLBACK_BLOG_IMAGE
}

export function formatPostDate(dateStr: string | undefined): string {
  const date = dateStr ? new Date(dateStr) : new Date()
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
