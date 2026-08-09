import type { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Research Journal | Peptide Science & Lab Insights',
  description: 'Explore research articles, peptide science guides, and laboratory insights from Longevia Research. Stay updated on peptide research, purity standards, and compound profiles.',
  alternates: {
    canonical: `${siteUrl}/journal`,
  },
  openGraph: {
    images: [{ url: '/og/og-journal.webp', width: 1200, height: 630, alt: 'Research Journal — Longevia Research' }],
    title: 'Research Journal | Longevia Research',
    description: 'Peptide research articles, compound guides, and laboratory science insights.',
    url: `${siteUrl}/journal`,
  },
}

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children
}
