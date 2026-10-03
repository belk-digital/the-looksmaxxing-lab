import { AffiliatesLandingClient } from './AffiliatesLandingClient'
import { buildTitle, buildDescription } from '@/lib/seo/buildMetadata'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata = {
  title: { absolute: buildTitle('Affiliate Program | Earn 15% Commission') },
  description: buildDescription('Join the Longevia Research affiliate program — earn 15% commission per referred sale. Real-time tracking and fast payouts.'),
  alternates: {
    canonical: `${siteUrl}/affiliates`,
  },
  openGraph: {
    images: [{ url: '/og/og-affiliates.webp', width: 1200, height: 630, alt: 'Affiliate Program — Longevia Research' }],
    title: 'Affiliate Program',
    description: 'Earn 15% commission on every referral. Join our research peptide affiliate program today.',
    url: `${siteUrl}/affiliates`,
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Affiliates', item: `${siteUrl}/affiliates` },
  ],
}

// Deliberately static: no session/DB lookups here. A returning affiliate's
// real status (approved/pending/rejected) is fetched client-side in
// AffiliatesLandingClient so this page (public marketing content, in the
// sitemap) can be prerendered and cached instead of forced fully dynamic.
export default function AffiliatesLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AffiliatesLandingClient />
    </>
  )
}
