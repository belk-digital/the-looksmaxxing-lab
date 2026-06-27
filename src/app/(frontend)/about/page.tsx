import type { Metadata } from 'next'
import AboutClient from './AboutClient'

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com'

export const metadata: Metadata = {
  title: 'About The Looksmaxxing Lab | US Research Peptide Supplier',
  description: 'The Looksmaxxing Lab is a US-based research peptide supplier founded in 2024. We synthesize BPC-157, TB-500, GHK-Cu & more at ≥99% HPLC purity with independent COA verification.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    images: [{ url: '/og/og-about.png', width: 1200, height: 630, alt: 'About The Looksmaxxing Lab' }],
    title: 'About The Looksmaxxing Lab | US Research Peptide Supplier',
    description: 'US-based research peptide supplier. ≥99% HPLC purity, independent COA verification, 30+ compounds.',
    url: `${siteUrl}/about`,
  },
}

export default function AboutPage() {
  const schemaOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Looksmaxxing Lab",
    "url": "https://www.thelooksmaxxinglab.com",
    "foundingDate": "2024",
    "description": "US-based research peptide supplier providing ≥99% HPLC-pure compounds with independent third-party COA verification on every order.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "sameAs": []
  };

  const schemaAboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About The Looksmaxxing Lab",
    "url": "https://www.thelooksmaxxinglab.com/about",
    "description": "About The Looksmaxxing Lab — US-based research peptide supplier founded in 2024. Mission, philosophy, quality standards, and compound catalog.",
    "mainEntity": {
      "@type": "Organization",
      "name": "The Looksmaxxing Lab"
    }
  };

  const schemaBreadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thelooksmaxxinglab.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About",
        "item": "https://www.thelooksmaxxinglab.com/about"
      }
    ]
  };

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Research Peptide Catalog — The Looksmaxxing Lab",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "BPC-157" },
      { "@type": "ListItem", "position": 2, "name": "TB-500" },
      { "@type": "ListItem", "position": 3, "name": "GHK-Cu" },
      { "@type": "ListItem", "position": 4, "name": "Tirzepatide" },
      { "@type": "ListItem", "position": 5, "name": "Semaglutide" }
    ]
  };

  const schemaFAQPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are your products intended for human consumption?",
        "acceptedAnswer": { "@type": "Answer",
          "text": "No. All products are strictly for laboratory research use only. Not intended for human consumption, clinical diagnosis, or therapeutic use. These statements have not been evaluated by the FDA."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide Certificates of Analysis (COA)?",
        "acceptedAnswer": { "@type": "Answer",
          "text": "Yes. Every order ships with a lot-specific COA from an independent US-based laboratory including HPLC purity %, LC-MS identity, and endotoxin results traceable to the batch number."
        }
      },
      {
        "@type": "Question",
        "name": "Where do your compounds ship from?",
        "acceptedAnswer": { "@type": "Answer",
          "text": "All orders ship from US-based warehouses. Same-day shipping for orders before 2 PM ET. Standard delivery 3-5 days; expedited 2-day on orders over $300. International shipping available."
        }
      },
      {
        "@type": "Question",
        "name": "How should I store lyophilized peptides?",
        "acceptedAnswer": { "@type": "Answer",
          "text": "Store at -20°C or below for long-term stability. Lyophilized peptides are stable during transit. Once reconstituted with bacteriostatic water, refrigerate at 2-8°C and use within 2-4 weeks."
        }
      },
      {
        "@type": "Question",
        "name": "Where are your compounds synthesized?",
        "acceptedAnswer": { "@type": "Answer",
          "text": "All compounds are synthesized via SPPS in ISO-certified US-based laboratories. We do not source raw powders from overseas or use third-party bulk brokers. Full traceability on every batch."
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaAboutPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQPage) }} />
      <AboutClient />
    </>
  )
}
