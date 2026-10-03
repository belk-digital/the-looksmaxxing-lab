import type { Metadata } from 'next'
import { buildTitle, buildDescription } from '@/lib/seo/buildMetadata'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: { absolute: buildTitle('Certificates of Analysis (COA)') },
  description: buildDescription('Browse and download Certificates of Analysis for every batch. Independently HPLC-tested at ≥99% purity. Full batch traceability.'),
  alternates: {
    canonical: `${siteUrl}/certificates`,
  },
  openGraph: {
    images: [{ url: '/og/og-certificates.webp', width: 1200, height: 630, alt: 'Certificates of Analysis — Longevia Research' }],
    title: 'Certificates of Analysis | Longevia Research',
    description: 'Download COA documents for all research peptides. Third-party HPLC verified, ≥99% purity guaranteed.',
    url: `${siteUrl}/certificates`,
  },
}

export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
