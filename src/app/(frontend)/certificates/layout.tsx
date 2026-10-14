import type { Metadata } from 'next'
import { buildTitle, buildDescription } from '@/lib/seo/buildMetadata'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: { absolute: buildTitle('Certificates of Analysis (COA)') },
  description: buildDescription('Browse genuine, downloadable Certificates of Analysis as they are published for our research peptides, independently HPLC and mass-spectrometry verified.'),
  alternates: {
    canonical: `${siteUrl}/certificates`,
  },
  openGraph: {
    images: [{ url: '/og/og-certificates.webp', width: 1200, height: 630, alt: 'Certificates of Analysis — Longevia Research' }],
    title: 'Certificates of Analysis (COA) | Longevia Research',
    description: 'Download genuine, published COA documents for our research peptides. Independently HPLC and mass-spectrometry verified.',
    url: `${siteUrl}/certificates`,
  },
}

export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
