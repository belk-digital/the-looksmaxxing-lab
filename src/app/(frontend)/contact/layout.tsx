import type { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Contact Us | Research Peptide Support',
  description: 'Contact The Looksmaxxing Lab for questions about research peptides, order support, bulk pricing, or COA documentation. US-based team. Fast response times.',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    images: [{ url: '/og/og-contact.webp', width: 1200, height: 630, alt: 'Contact The Looksmaxxing Lab' }],
    title: 'Contact Us | The Looksmaxxing Lab',
    description: 'Get in touch with our research peptide support team. Questions about orders, COA documents, bulk pricing, or product availability.',
    url: `${siteUrl}/contact`,
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
