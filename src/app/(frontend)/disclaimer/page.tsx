import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Medical & Research-Use Disclaimer | The Looksmaxxing Lab',
  description: 'All content and products from The Looksmaxxing Lab are for research use only. Not for human or veterinary use, diagnosis, or treatment. No medical advice is provided.',
  alternates: {
    canonical: `${siteUrl}/disclaimer`,
  },
  openGraph: {
    title: 'Medical & Research-Use Disclaimer | The Looksmaxxing Lab',
    description: 'All content and products from The Looksmaxxing Lab are for research use only. No medical advice is provided.',
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Medical Disclaimer' }],
    url: `${siteUrl}/disclaimer`,
    type: 'website',
  },
}

const schemaBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Disclaimer', item: `${siteUrl}/disclaimer` },
  ],
}

export default function DisclaimerPage() {
  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />

      <nav aria-label="Breadcrumb" className="px-6 max-w-3xl mx-auto mb-12">
        <ol className="flex flex-wrap items-center gap-2 text-label-sm uppercase tracking-wider text-ink-muted">
          <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">Disclaimer</li>
        </ol>
      </nav>

      <section className="px-6 max-w-3xl mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Legal Information</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-4">Medical &amp; Research-Use Disclaimer</h1>
          <p className="text-label-sm uppercase tracking-wider text-ink-muted mb-10">Effective Date: January 2026</p>

          <p className="text-body-lg text-ink-muted leading-relaxed mb-16">
            The information provided on this website, and every product sold by The Looksmaxxing Lab, is intended solely for laboratory and academic research. Nothing here is intended for human or veterinary use, diagnosis, or treatment of any condition.
          </p>

          <div className="space-y-14 text-body-lg text-ink leading-relaxed">
            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">01. No Medical Advice</h2>
              <p className="text-ink-muted">
                Content on this site — including product descriptions, purity documentation, and our <Link href="/journal" className="text-gold underline hover:text-ink transition-colors">Science Journal</Link> — does not constitute medical advice. The Looksmaxxing Lab is not a healthcare provider, and all material is presented for informational and educational purposes only. Always consult a licensed medical or scientific professional before acting on any information found on this site.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">02. Product Usage Limitation</h2>
              <p className="text-ink-muted">
                Every product offered by The Looksmaxxing Lab is intended exclusively for controlled laboratory or research environments. Any use outside this context, including self-administration, is strictly prohibited and may violate local, state, or federal law. Users are responsible for ensuring all handling, storage, and application comply with applicable research protocols — see our <Link href="/journal/peptide-coa-hplc-purity-testing-guide" className="text-gold underline hover:text-ink transition-colors">COA verification guide</Link> and <Link href="/journal/peptide-reconstitution-storage-guide" className="text-gold underline hover:text-ink transition-colors">reconstitution and storage guide</Link> before beginning any protocol.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">03. Liability</h2>
              <p className="text-ink-muted">
                The Looksmaxxing Lab assumes no responsibility or liability for the misuse of any product, improper handling, or adverse effects resulting from unauthorized use. By accessing this website or purchasing our products, you acknowledge that The Looksmaxxing Lab is not liable for any direct, indirect, or consequential damages arising from your actions.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">04. User Responsibility</h2>
              <p className="text-ink-muted mb-4">It is the responsibility of every user to:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Follow all local, state, and federal laws governing research compounds.</li>
                <li>Use products only in a designated laboratory or research setting.</li>
                <li>Exercise proper safety protocols when handling any compound.</li>
                <li>Consult a qualified professional regarding research procedures, legal compliance, or scientific interpretation.</li>
              </ul>
            </section>

            <section className="bg-white rounded-[1.5rem] p-8 lg:p-10 border border-border-subtle shadow-sm mt-16">
              <h2 className="text-editorial-md font-serif text-ink mb-4">Questions About Product Use or Compliance?</h2>
              <p className="text-ink-muted mb-6">
                Reach our team via the <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link>, or email us directly.
              </p>
              <a href="mailto:support@thelooksmaxxinglab.com" className="text-lg font-medium text-ink hover:text-gold transition-colors underline underline-offset-4">
                support@thelooksmaxxinglab.com
              </a>
              <p className="text-ink-muted mt-6 text-body-sm">
                By accessing this website or purchasing our products, you agree to comply with this Disclaimer and acknowledge that The Looksmaxxing Lab is not responsible for any misuse or unauthorized application of its research materials.
              </p>
            </section>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
