import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { JOURNAL_POSTS } from '@/data/journal-posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')
  const payload = await getPayload({ config: configPromise })

  // lastModified dates are derived from the most recent meaningful git commit
  // touching each page's primary content file. Legal pages omit lastModified
  // because their last commit was a structural rebrand, not a content edit.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date('2026-09-23'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date('2026-09-13'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date('2026-09-23'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date('2026-08-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date('2026-08-10'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/certificates`,
      lastModified: new Date('2026-09-13'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: new Date('2026-09-23'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    /*
    {
      url: `${siteUrl}/peptide-calculator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    */
    {
      url: `${siteUrl}/affiliates`,
      lastModified: new Date('2026-09-23'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      // No lastModified — last commit was a structural rebrand, not a content edit
      url: `${siteUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      // No lastModified — last commit was a structural rebrand, not a content edit
      url: `${siteUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      // No lastModified — last commit was a structural rebrand, not a content edit
      url: `${siteUrl}/refund`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      // No lastModified — last commit was a structural rebrand, not a content edit
      url: `${siteUrl}/disclaimer`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let productPages: MetadataRoute.Sitemap = []
  try {
    const { docs: products } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 1000,
      depth: 0,
    })

    productPages = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${siteUrl}/products/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
  } catch {
    console.warn('Could not fetch products for sitemap')
  }

  // Build journal pages: static posts first (using article publish date),
  // then CMS posts (using Payload updatedAt). Deduplicate by URL so a slug
  // present in both sources only appears once, with the static entry winning.
  let journalPages: MetadataRoute.Sitemap = []
  try {
    journalPages = JOURNAL_POSTS.map((p) => ({
      url: `${siteUrl}/journal/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (err) {
    console.error('Failed to map journal posts for sitemap', err)
  }

  try {
    const { docs: cmsPosts } = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    })
    const seenUrls = new Set(journalPages.map((e) => e.url))
    for (const post of cmsPosts) {
      if (!post.slug) continue
      const url = `${siteUrl}/journal/${post.slug}`
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
      journalPages.push({
        url,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })
    }
  } catch (err) {
    console.error('Failed to fetch CMS blog posts for sitemap', err)
  }

  return [...staticPages, ...productPages, ...journalPages]
}
