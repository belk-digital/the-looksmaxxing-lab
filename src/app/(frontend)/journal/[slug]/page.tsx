import React from 'react'
import { Metadata } from 'next'
import JournalPostClient from './JournalPostClient'
import { JOURNAL_POSTS } from '@/data/journal-posts'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export async function generateStaticParams() {
  return JOURNAL_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  const post = JOURNAL_POSTS.find(p => p.slug === slug)
  
  const title = post?.title || 'Science Journal'
  const description = post?.excerpt || 'Research and clinical guidelines from The Looksmaxxing Lab.'
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
        : [{ url: '/hero-image.png', width: 1200, height: 630, alt: 'Science Journal Post' }],
      type: 'article',
      url: postUrl,
      siteName: 'The Looksmaxxing Lab',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : ['/hero-image.png'],
    },
  }
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = JOURNAL_POSTS.find(p => p.slug === slug)

  const faqSchema = post?.faqs && post.faqs.length > 0 ? {
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
