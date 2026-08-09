import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AffiliatesLandingClient, UserAffiliateStatus } from './AffiliatesLandingClient'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata = {
  title: 'Affiliate Program | Earn 15% Commission on Research Peptides',
  description: 'Join Longevia Research affiliate program and earn 15% commission on every referred sale. Real-time tracking, fast payouts, and dedicated support for research peptide affiliates.',
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

export default async function AffiliatesLandingPage() {
  const user = await getPayloadUser()
  let status: UserAffiliateStatus = 'guest'

  if (user) {
    status = 'user'
    const payload = await getPayload({ config })

    // 1. Check if they are an active affiliate
    const { docs: affiliates } = await payload.find({
      collection: 'affiliates',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (affiliates.length > 0) {
      status = `affiliate_${affiliates[0].status}` as UserAffiliateStatus
    } else {
      // 2. Check if they have a pending application
      const { docs: applications } = await payload.find({
        collection: 'affiliate-applications',
        where: { user: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      })

      if (applications.length > 0) {
        if (applications[0].status === 'pending') {
          status = 'pending_application'
        } else if (applications[0].status === 'rejected') {
          status = 'affiliate_rejected'
        }
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AffiliatesLandingClient userStatus={status} />
    </>
  )
}
