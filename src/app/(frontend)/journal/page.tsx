import React from 'react'
import { Metadata } from 'next'
import JournalClient from './JournalClient'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Science Journal | Research & Clinical Guidelines',
  description: 'Documented purity, detailed guidelines, and emerging studies in advanced peptide science.',
  alternates: {
    canonical: `${siteUrl}/journal`,
  },
  openGraph: {
    title: 'Science Journal | The Looksmaxxing Lab',
    description: 'Documented purity, detailed guidelines, and emerging studies in advanced peptide science.',
    url: `${siteUrl}/journal`,
    images: [{ url: '/hero-image.webp', width: 1200, height: 630, alt: 'Science Journal' }],
  }
}

export default function JournalPage() {
  return <JournalClient />
}
