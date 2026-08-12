import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JournalPostClient from './JournalPostClient'
import JournalCmsPostClient from './JournalCmsPostClient'
import { JOURNAL_POSTS } from '@/data/journal-posts'
import { getAllJournalPosts, getCmsJournalPost, getCmsJournalPostSlugs } from '@/lib/blog/getPosts'
import { getFeaturedImageUrl, formatPostDate } from '@/lib/blog/postDisplay'
import { estimateReadingTime } from '@/lib/blog/readingTime'
import { toAbsoluteUrl } from '@/lib/utils'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export async function generateStaticParams() {
  const cmsSlugs = await getCmsJournalPostSlugs()
  const staticSlugs = JOURNAL_POSTS.map((p) => p.slug)
  return [...new Set([...staticSlugs, ...cmsSlugs])].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const staticPost = JOURNAL_POSTS.find((p) => p.slug === slug)
  const postUrl = `${siteUrl}/journal/${slug}`

  if (staticPost) {
    let imageUrl = staticPost.heroImage
    if (imageUrl && imageUrl.startsWith('/')) imageUrl = `${siteUrl}${imageUrl}`

    return {
      title: staticPost.title,
      description: staticPost.excerpt,
      alternates: { canonical: postUrl },
      openGraph: {
        title: staticPost.title,
        description: staticPost.excerpt,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: staticPost.title }],
        type: 'article',
        url: postUrl,
        siteName: 'Longevia Research',
      },
      twitter: { card: 'summary_large_image', title: staticPost.title, description: staticPost.excerpt, images: [imageUrl] },
    }
  }

  const cms = await getCmsJournalPost(slug)
  if (!cms) return { title: 'Science Journal' }

  const { post } = cms
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt
  const imageUrl = toAbsoluteUrl(siteUrl, getFeaturedImageUrl(post))

  return {
    title,
    description,
    keywords: post.keywords ? post.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : undefined,
    alternates: { canonical: postUrl },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      url: postUrl,
      siteName: 'Longevia Research',
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const staticPost = JOURNAL_POSTS.find((p) => p.slug === slug)

  if (staticPost) {
    const postUrl = `${siteUrl}/journal/${slug}`
    const imageUrl = staticPost.heroImage.startsWith('http') ? staticPost.heroImage : `${siteUrl}${staticPost.heroImage}`

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: staticPost.title,
      description: staticPost.excerpt,
      image: [imageUrl],
      datePublished: staticPost.date,
      dateModified: staticPost.date,
      author: { '@type': 'Organization', name: staticPost.author, url: siteUrl },
      publisher: { '@type': 'Organization', name: 'Longevia Research', logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${siteUrl}/journal` },
        { '@type': 'ListItem', position: 3, name: staticPost.title, item: postUrl },
      ],
    }

    const faqSchema = staticPost.faqs && staticPost.faqs.length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: staticPost.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    } : null

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
        <JournalPostClient slug={slug} />
      </>
    )
  }

  const cms = await getCmsJournalPost(slug)
  if (!cms) return notFound()

  const { post, relatedProducts } = cms
  const postUrl = `${siteUrl}/journal/${slug}`
  const imageUrl = toAbsoluteUrl(siteUrl, getFeaturedImageUrl(post))
  const authorName = 'Longevia Research Team'
  const publishedAt = post.publishedAt || post.createdAt

  const allPosts = await getAllJournalPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3)
  const fallbackRelated = relatedPosts.length > 0
    ? relatedPosts
    : allPosts.filter((p) => p.slug !== slug).slice(0, 3)

  const articleSchema: any = {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [imageUrl],
    datePublished: publishedAt,
    dateModified: post.updatedAt || publishedAt,
    articleSection: post.category,
    keywords: post.keywords || undefined,
    author: { '@type': 'Organization', name: authorName, url: siteUrl },
    publisher: { '@type': 'Organization', name: 'Longevia Research', logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  }

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${siteUrl}/journal` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  }

  const faqSchema = Array.isArray(post.faqs) && post.faqs.length > 0 ? {
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null

  const productNodes = Array.isArray(post.relatedProducts)
    ? post.relatedProducts.filter((p: any) => typeof p === 'object').map((p: any) => {
        const price = p.hasVariants ? (p.variants?.[0]?.salePrice ?? p.variants?.[0]?.price) : (p.salePrice ?? p.price)
        const stock = p.hasVariants ? p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) : p.stock
        return {
          '@type': 'Product',
          '@id': `${siteUrl}/products/${p.slug}#product`,
          name: p.name,
          image: p.images?.[0]?.image?.url,
          sku: p.sku || p.variants?.[0]?.sku || undefined,
          url: `${siteUrl}/products/${p.slug}`,
          brand: { '@type': 'Brand', name: 'Longevia Research' },
          offers: { '@type': 'Offer', price, priceCurrency: 'USD', availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
        }
      })
    : []

  if (productNodes.length > 0) {
    articleSchema.mentions = productNodes.map((n: any) => ({ '@id': n['@id'] }))
  }

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : []), ...productNodes],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }} />
      <JournalCmsPostClient
        post={{
          slug: post.slug,
          title: post.title,
          category: post.category || '',
          date: formatPostDate(publishedAt),
          readTime: post.readTime || estimateReadingTime(post.content),
          authorName,
          imageUrl: getFeaturedImageUrl(post),
          content: post.content,
          keyTakeaways: (post.keyTakeaways || []).map((k: any) => k.text),
          faqs: post.faqs || [],
          references: post.references || [],
        }}
        relatedProducts={relatedProducts}
        relatedPosts={fallbackRelated}
      />
    </>
  )
}
