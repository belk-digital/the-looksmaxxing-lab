import React from 'react'
import { Metadata } from 'next'
import JournalClient from './JournalClient'
import { getAllJournalPosts } from '@/lib/blog/getPosts'
import { buildTitle, buildDescription } from '@/lib/seo/buildMetadata'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

// Re-render at most once every 3 hours so newly published/edited posts show up
// without needing a full redeploy, while still serving from cache the rest of the time.
export const revalidate = 10800

export const metadata: Metadata = {
  title: { absolute: buildTitle('Peptide Research Journal | Science & Lab Guides') },
  description: buildDescription('In-depth peptide science guides, COA verification resources, compound research protocols, and scientific insights from Longevia Research.'),
  alternates: {
    canonical: `${siteUrl}/journal`,
  },
  openGraph: {
    title: 'Peptide Research Journal | Longevia Research',
    description: 'In-depth peptide science guides, COA verification resources, compound research protocols, and scientific insights from Longevia Research.',
    url: `${siteUrl}/journal`,
    images: [{ url: '/og/og-journal.webp', width: 1200, height: 630, alt: 'Peptide Research Journal — Longevia Research' }],
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
