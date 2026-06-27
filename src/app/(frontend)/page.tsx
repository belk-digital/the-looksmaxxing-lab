import { HomePreloaderWrapper } from '@/components/home/HomePreloaderWrapper'
import { Hero } from '@/components/home/Hero'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { JournalTeaser } from '@/components/home/JournalTeaser'
import { CoaSection } from '@/components/home/CoaSection'
import { FaqSection } from '@/components/home/FaqSection'
import { WhatSetsUsApart } from '@/components/home/WhatSetsUsApart'
import { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/og/og-home.png', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Research-Grade Peptides' }],
  },
  title: 'The Looksmaxxing Lab | Research-Grade Peptides, COA-Verified',
  description: 'US-synthesized research peptides — BPC-157, Semaglutide, Tirzepatide, GHK-Cu, NAD+, and 30+ compounds. Every batch verified at ≥99% HPLC purity with a full COA. 2-day shipping available. Research use only.',
  alternates: {
    canonical: siteUrl,
  },
}

import { getShopProducts } from '@/app/(frontend)/(shop)/actions'

export default async function Homepage() {
  let products = []
  try {
    const res = await getShopProducts({ limit: 8, sort: 'newest' })
    if (res.success && res.products) {
      products = res.products as any[]
    }
  } catch (e) {
    console.error("Failed to fetch featured products", e)
  }

  return (
    <>
      <HomePreloaderWrapper>
        <div className="flex flex-col w-full min-h-screen relative z-10 bg-white">
          <Hero />
          <FeaturedProductsSection products={products} />
          <CategoriesSection />
          <AboutTeaser />
          <WhatSetsUsApart />
          <CoaSection />
          <JournalTeaser />
          <FaqSection />
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
                  "name": "What is looksmaxxing and how do peptides relate to it?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Looksmaxxing is the practice of optimizing physical appearance through controllable factors. Research peptides are studied in relation to skin collagen, tissue recovery, body composition, and hair density. Our compounds are research use only."
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
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "The Looksmaxxing Lab",
              "url": "https://www.thelooksmaxxinglab.com",
              "description": "US-based research peptide supplier providing ≥99% HPLC-pure compounds with third-party COA verification.",
              "sameAs": ["https://instagram.com/thelooksmaxxinglab"]
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://www.thelooksmaxxinglab.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.thelooksmaxxinglab.com/shop?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }
          ])
        }}
      />
    </>
  )
}
