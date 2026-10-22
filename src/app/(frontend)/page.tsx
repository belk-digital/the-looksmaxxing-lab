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

// Cached for 1 day. Saving a product in the Payload admin clears the cache for this page straight away
// (see src/hooks/products.ts), so best-seller changes show up without waiting for the day to pass.
export const revalidate = 86400

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'Longevia Research — Research-Grade Peptides' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og/og-home.webp'],
  },
  title: {
    absolute: 'Longevia Research | Premium Research Peptides (US-Made)',
  },
  description: 'Premium US-synthesized research peptides — ≥99% HPLC purity with third-party COA on every batch. 30+ compounds for laboratory research use only.',
  alternates: {
    canonical: '/',
  },
}

import { getShopProducts } from '@/app/(frontend)/(shop)/actions'

// Plain-text FAQ entries matching the visible FaqSection component (FaqSection.tsx).
// JSX answer content (React <Link> elements) is reduced to plain text here — the same
// approach as stripLinks() used in faq/page.tsx — so schema text matches what users read.
const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the purity standard for your research peptides?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every research peptide sold by Longevia Research must meet or exceed a strictly enforced ≥99% purity threshold. We verify this standard through independent, third-party High-Performance Liquid Chromatography (HPLC) and Liquid Chromatography–Mass Spectrometry (LC-MS) testing for every production batch — not random samples. Any batch that tests below this threshold is immediately discarded. See our full guide to HPLC purity testing for how to read the results."
      }
    },
    {
      "@type": "Question",
      "name": "How can I access the Certificate of Analysis (COA) for my order?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lot-specific Certificates of Analysis for every active batch are publicly available in our COA Library. Every order also includes a batch number that corresponds directly to that batch's test documentation. You can verify purity, molecular identity, and endotoxin status for every compound you receive."
      }
    },
    {
      "@type": "Question",
      "name": "Are these products intended for human consumption?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. All products sold by Longevia Research are strictly for laboratory and research use only. They are not intended to diagnose, treat, cure, or prevent any disease, and are not for human or animal consumption. These statements have not been evaluated by the FDA."
      }
    },
    {
      "@type": "Question",
      "name": "What are your shipping and fulfillment times?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All orders are fulfilled from our US-based facilities. We offer standard shipping (3–5 business days) and expedited 2-day shipping on orders over $300. Orders placed before 2 PM EST typically ship same day. All peptides are dispatched using validated cold-chain packaging to maintain molecular integrity in transit."
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
      "name": "How are your research peptides synthesized?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We utilize advanced solid-phase peptide synthesis (SPPS) in US-based, ISO-certified laboratories. This method assembles amino acid chains sequentially on a resin support, allowing precise control over sequence fidelity and molecular structure. Post-synthesis purification removes truncated sequences and impurities to meet our ≥99% purity floor. Every batch is independently verified before fulfillment."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer bulk or wholesale pricing for research institutions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We offer tiered wholesale pricing for qualified research institutions, university labs, clinical facilities, and approved wholesale accounts. Contact our support team to apply for an institutional account. Pricing scales with volume, and bulk orders still receive lot-specific COA documentation."
      }
    },
    {
      "@type": "Question",
      "name": "How do I verify that a peptide vendor is legitimate and properly tested?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The three non-negotiable markers of a legitimate research peptide supplier are: (1) independent third-party HPLC and LC-MS testing — not in-house testing — for every batch; (2) a publicly accessible COA library with lot-traceable documentation; and (3) US-based synthesis, not merely US-based fulfillment of overseas-sourced raw powders. Longevia Research meets all three criteria on every order."
      }
    }
  ]
}

export default async function Homepage() {
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
      <HomePreloaderWrapper>
        <div className="flex flex-col w-full min-h-screen relative z-10 bg-white">
          <Hero />
          <FeaturedProductsSection products={products} />
          <CoaSection />
          <CategoriesSection />
          <AboutTeaser />
          <WhatSetsUsApart />
          <JournalTeaser />
          <FaqSection />
          <NewsletterSection />
        </div>
      </HomePreloaderWrapper>

      {/* JSON-LD Structured Data — questions and answers match the visible FaqSection above */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }}
      />
    </>
  )
}
