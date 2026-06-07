import { HomePreloaderWrapper } from '@/components/home/HomePreloaderWrapper'
import { Hero } from '@/components/home/Hero'
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { AboutTeaser } from '@/components/home/AboutTeaser'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { JournalTeaser } from '@/components/home/JournalTeaser'
import { CoaSection } from '@/components/home/CoaSection'
import { FaqSection } from '@/components/home/FaqSection'
import { WhatSetsUsApart } from '@/components/home/WhatSetsUsApart'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Looksmaxxing Lab | Research-Grade Peptides, COA-Verified',
  description: 'US-synthesized research peptides — BPC-157, TB-500, GHK-Cu, Semaglutide. Every batch verified at ≥99% HPLC purity with a full COA. Shop with confidence. 2-day shipping available.',
}

export default function Homepage() {
  return (
    <>
      <HomePreloaderWrapper>
        <div className="flex flex-col w-full min-h-screen relative z-10 bg-white">
          <Hero />
          <FeaturedProductsSection />
          <CategoriesSection />
          <AboutTeaser />
          <TrustBadges />
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
              "url": "https://the-looksmaxxing-lab.vercel.app",
              "description": "US-based research peptide supplier providing ≥99% HPLC-pure compounds with third-party COA verification.",
              "sameAs": ["https://instagram.com/thelooksmaxxinglab"]
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://the-looksmaxxing-lab.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://the-looksmaxxing-lab.vercel.app/shop?q={search_term_string}"
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
