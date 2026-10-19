import React from 'react'
import { Metadata } from 'next'
import JournalClient from './JournalClient'
import { getAllJournalPosts } from '@/lib/blog/getPosts'
// buildTitle / buildDescription not needed — literal strings used for SEO precision

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

// Re-render at most once every 3 hours so newly published/edited posts show up
// without needing a full redeploy, while still serving from cache the rest of the time.
export const revalidate = 10800

export const metadata: Metadata = {
  title: { absolute: 'Peptide Research Journal — Science Guides & Lab References | Longevia' },
  description: 'Research guides on HPLC purity, peptide reconstitution, COA interpretation, compound mechanisms, and sourcing standards. For laboratory researchers.',
  alternates: {
    canonical: `${siteUrl}/journal`,
  },
  openGraph: {
    title: 'Peptide Research Journal — Science Guides & Lab References | Longevia',
    description: 'Research guides on HPLC purity, peptide reconstitution, COA interpretation, compound mechanisms, and sourcing standards. For laboratory researchers.',
    url: `${siteUrl}/journal`,
    images: [{ url: '/og/og-journal.webp', width: 1200, height: 630, alt: 'Peptide Research Journal — Longevia Research' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peptide Research Journal — Science Guides & Lab References | Longevia',
    description: 'Research guides on HPLC purity, peptide reconstitution, COA interpretation, compound mechanisms, and sourcing standards. For laboratory researchers.',
    images: ['/og/og-journal.webp'],
  },
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
