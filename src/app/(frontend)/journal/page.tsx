import React from 'react'
import { Metadata } from 'next'
import JournalClient from './JournalClient'
import { getAllJournalPosts } from '@/lib/blog/getPosts'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Science Journal | Research & Clinical Guidelines',
  description: 'Documented purity, detailed guidelines, and emerging studies in advanced peptide science.',
  alternates: {
    canonical: `${siteUrl}/journal`,
  },
  openGraph: {
    title: 'Science Journal',
    description: 'Documented purity, detailed guidelines, and emerging studies in advanced peptide science.',
    url: `${siteUrl}/journal`,
    images: [{ url: '/New Images/glow-and-nad-bg-image.webp', width: 1200, height: 630, alt: 'Science Journal' }],
  }
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Journal', item: `${siteUrl}/journal` },
  ],
}

export default async function JournalPage() {
  const posts = await getAllJournalPosts()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <JournalClient posts={posts} />
    </>
  )
}
