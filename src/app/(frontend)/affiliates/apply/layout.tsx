import type { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Apply to Affiliate Program | Earn 15% Commission',
  description: 'Apply to Longevia Research affiliate program. Earn 15% commission on every referred sale. Research peptide affiliate opportunity with real-time tracking and fast payouts.',
  alternates: {
    canonical: `${siteUrl}/affiliates/apply`,
  },
  openGraph: {
    title: 'Apply to Affiliate Program | Longevia Research',
    description: 'Join our affiliate program and earn 15% commission on every referral. Apply now.',
    url: `${siteUrl}/affiliates/apply`,
  },
}

export default function AffiliateApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
