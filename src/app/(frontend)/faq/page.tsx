import type { Metadata } from 'next'
import FaqClient from './FaqClient'
import { FAQ_DATA, stripLinks } from './faqData'
// buildTitle and buildDescription replaced by literal strings for SEO precision

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

// Cached for 1 day. This page only changes when the code is deployed (a deploy rebuilds it),
// so the daily refresh is just a safety net.
export const revalidate = 86400

export const metadata: Metadata = {
  title: { absolute: 'Research Peptide FAQ — Purity, COAs, Ordering & Shipping | Longevia' },
  description: 'Straight answers on HPLC purity, batch COAs, reconstitution, shipping, and Research Use Only rules from a US-based peptide supplier.',
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    images: [{ url: '/og/og-faq.webp', width: 1200, height: 630, alt: 'Research Peptide FAQ — Longevia Research' }],
    title: 'Research Peptide FAQ — Purity, COAs, Ordering & Shipping | Longevia',
    description: 'Straight answers on HPLC purity, batch COAs, reconstitution, shipping, and Research Use Only rules from a US-based peptide supplier.',
    url: `${siteUrl}/faq`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Research Peptide FAQ — Purity, COAs, Ordering & Shipping | Longevia',
    description: 'Straight answers on HPLC purity, batch COAs, reconstitution, shipping, and Research Use Only rules from a US-based peptide supplier.',
    images: ['/og/og-faq.webp'],
  },
}

export default function FAQPage() {
  const schemaBreadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${siteUrl}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": `${siteUrl}/faq`
      }
    ]
  };

  const schemaFAQPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_DATA.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": stripLinks(item.a),
        },
      })),
    ),
  };

  const schemaWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Research Peptide FAQ — Longevia Research",
    "url": `${siteUrl}/faq`,
    "description": "Answers about Longevia Research peptides: purity and COAs, ordering and shipping, order problems, storage, and research-use-only compliance.",
    "mainEntity": schemaFAQPage
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }} />
      <FaqClient />
    </>
  )
}
