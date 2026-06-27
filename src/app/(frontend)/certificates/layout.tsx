import type { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Certificates of Analysis (COA) | Third-Party Lab Verified',
  description: 'Browse and download Certificates of Analysis for all research peptides. Every batch is independently HPLC tested with ≥99% purity verification. Full batch traceability.',
  alternates: {
    canonical: `${siteUrl}/certificates`,
  },
  openGraph: {
    images: [{ url: '/og/og-certificates.png', width: 1200, height: 630, alt: 'Certificates of Analysis — The Looksmaxxing Lab' }],
    title: 'Certificates of Analysis | The Looksmaxxing Lab',
    description: 'Download COA documents for all research peptides. Third-party HPLC verified, ≥99% purity guaranteed.',
    url: `${siteUrl}/certificates`,
  },
}

export default function CertificatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
