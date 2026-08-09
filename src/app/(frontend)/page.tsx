import dynamic from 'next/dynamic'
import { HomePreloaderWrapper } from '@/components/home/HomePreloaderWrapper'
import { Hero } from '@/components/home/Hero'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'

// Lazy load below-the-fold components to improve initial JS bundle size and LCP
const AboutTeaser = dynamic(() => import('@/components/home/AboutTeaser').then(mod => mod.AboutTeaser))
const WhatSetsUsApart = dynamic(() => import('@/components/home/WhatSetsUsApart').then(mod => mod.WhatSetsUsApart))
const CoaSection = dynamic(() => import('@/components/home/CoaSection').then(mod => mod.CoaSection))
const JournalTeaser = dynamic(() => import('@/components/home/JournalTeaser').then(mod => mod.JournalTeaser))
const FaqSection = dynamic(() => import('@/components/home/FaqSection').then(mod => mod.FaqSection))
const NewsletterSection = dynamic(() => import('@/components/home/NewsletterSection').then(mod => mod.NewsletterSection))
import { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'Longevia Research — Research-Grade Peptides' }],
  },
  title: {
    absolute: 'Longevia Research | Premium Research Peptides (US-Made)',
  },
  description: 'Elevate your laboratory research with premium, US-synthesized peptides. We guarantee strict ≥99% HPLC purity through independent 3rd-party testing. Discover compounds for cellular regeneration, metabolic study, and structural repair with full COAs provided.',
  alternates: {
    canonical: '/',
  },
}

import { getShopProducts } from '@/app/(frontend)/(shop)/actions'

export default async function Homepage() {
  const headersList = await require('next/headers').headers()
  const userAgent = headersList.get('user-agent') || ''
  const isBot = /bot|googlebot|google-inspectiontool|lighthouse|crawler|spider|robot|crawling|facebookexternalhit|bingbot/i.test(userAgent)

  let products = []
  try {
    const res = await getShopProducts({ limit: 8, sort: 'newest', isBestSeller: true })
    if (res.success && res.products) {
      products = res.products as any[]
    }
  } catch (e) {
    console.error("Failed to fetch featured products", e)
  }

  return (
    <>
      <HomePreloaderWrapper isBot={isBot}>
        <div className="flex flex-col w-full min-h-screen relative z-10 bg-white">
          <Hero />
          <FeaturedProductsSection products={products} />
          <CategoriesSection />
          <AboutTeaser />
          <WhatSetsUsApart />
          <CoaSection />
          <JournalTeaser />
          <FaqSection />
          <NewsletterSection />
        </div>
      </HomePreloaderWrapper>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is the purity standard for your research peptides?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every research peptide must meet or exceed ≥99% purity, verified by independent third-party HPLC and LC-MS testing on every production batch. Any batch below this threshold is discarded."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can I access the Certificate of Analysis (COA)?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "COAs for every active batch are publicly available in our COA Library at /certificates. Every order includes a batch number traceable to its specific test documentation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are these products intended for human consumption?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All products are strictly for laboratory and research use only. Not intended to diagnose, treat, cure, or prevent any disease, and not for human or animal consumption."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why choose Longevia Research for laboratory peptides?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Longevia Research guarantees ≥99% HPLC purity for all compounds, verified by independent US laboratories. Every order ships with a lot-specific Certificate of Analysis to ensure your research data is perfectly reliable."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do you offer wholesale pricing for research institutions?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. We offer tiered wholesale pricing for qualified research institutions, university labs, and clinical facilities. Contact our team to apply for an institutional account."
                  }
                }
              ]
            }
          ])
        }}
      />
    </>
  )
}
