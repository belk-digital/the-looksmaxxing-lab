import type { Metadata } from 'next'
import FaqClient from './FaqClient'
import { FAQ_DATA, stripLinks } from './faqData'
import { buildTitle, buildDescription } from '@/lib/seo/buildMetadata'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: { absolute: buildTitle('Research Peptide FAQ | Purity & Ordering') },
  description: buildDescription('Answers on research peptide purity standards, COA verification, ordering, and storage. US-synthesized compounds for research use only.'),
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    images: [{ url: '/og/og-faq.webp', width: 1200, height: 630, alt: 'Research Peptide FAQ — Longevia Research' }],
    title: 'Research Peptide FAQ',
    description: 'Frequently asked questions about research peptides, purity standards, COA verification, ordering, and storage.',
    url: `${siteUrl}/faq`,
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
        "item": "https://longeviaresearch.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": "https://longeviaresearch.com/faq"
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
    "url": "https://longeviaresearch.com/faq",
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
