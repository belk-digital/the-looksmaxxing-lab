import React from 'react'
import { Metadata } from 'next'
import JournalPostClient from './JournalPostClient'
import { JOURNAL_POSTS } from '@/data/journal-posts'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export async function generateStaticParams() {
  return JOURNAL_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  const post = JOURNAL_POSTS.find(p => p.slug === slug)
  
  const title = post?.title || 'Science Journal'
  const description = post?.excerpt || 'Research and clinical guidelines from Longevia Research.'
  let imageUrl = post?.heroImage
  
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${siteUrl}${imageUrl}`
  }

  const postUrl = `${siteUrl}/journal/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title,
      description,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
        : [{ url: '/New Images/glow-and-nad-bg-image.webp', width: 1200, height: 630, alt: 'Science Journal Post' }],
      type: 'article',
      url: postUrl,
      siteName: 'Longevia Research',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : ['/New Images/glow-and-nad-bg-image.webp'],
    },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = JOURNAL_POSTS.find(p => p.slug === slug)

  if (!post) {
    return <JournalPostClient slug={slug} />
  }

  const postUrl = `${siteUrl}/journal/${slug}`
  const imageUrl = post.heroImage.startsWith('http') ? post.heroImage : `${siteUrl}${post.heroImage}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: [imageUrl],
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Longevia Research',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Journal',
        item: `${siteUrl}/journal`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  }

  const faqSchema = post.faqs && post.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <JournalPostClient slug={slug} />
    </>
  )
}
