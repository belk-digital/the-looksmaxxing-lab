import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://longeviaresearch.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Refund & Returns Policy',
  description: 'Longevia Research operates an all-sales-final policy on research peptides. Learn why, and what is covered instead - free replacement for damaged, incorrect, or COA-mismatched orders.',
  alternates: {
    canonical: `${siteUrl}/refund`,
  },
  openGraph: {
    title: 'Refund & Returns Policy',
    description: 'Longevia Research operates an all-sales-final policy on research peptides. See what is covered instead.',
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'Longevia Research — Refund & Returns Policy' }],
    url: `${siteUrl}/refund`,
    type: 'website',
  },
}

const schemaBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Refund & Returns Policy', item: `${siteUrl}/refund` },
  ],
}

export default function RefundPage() {
  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />

      <nav aria-label="Breadcrumb" className="px-6 max-w-3xl mx-auto mb-12">
        <ol className="flex flex-wrap items-center gap-2 text-label-sm uppercase tracking-wider text-ink-muted">
          <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">Refund &amp; Returns Policy</li>
        </ol>
      </nav>

      <section className="px-6 max-w-3xl mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Legal Information</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-4">Refund &amp; Returns Policy</h1>
          <p className="text-label-sm uppercase tracking-wider text-ink-muted mb-10">Effective Date: January 2026</p>

          <p className="text-body-lg text-ink-muted leading-relaxed mb-10">
            Please read this policy carefully before ordering. Because of the strict chain-of-custody, stability, and quality-control requirements attached to every batch we ship, Longevia Research operates on an all-sales-final basis.
          </p>

          <div className="border-l-4 border-gold bg-ink/5 rounded-r-xl p-6 mb-16">
            <p className="text-body-lg text-ink font-medium m-0">
              <strong>All Sales Are Final.</strong> Once an order ships, we are unable to offer refunds, exchanges, or returns for any reason — including change of mind, unused product, or orders that remain unopened. This applies to every product in our catalog, with no exceptions for order size or compound.
            </p>
          </div>

          <div className="space-y-14 text-body-lg text-ink leading-relaxed">
            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">01. Why All Sales Are Final</h2>
              <p className="text-ink-muted">
                Research peptides are batch-tested, cold-chain-sensitive laboratory reagents, not consumer goods. Once a vial leaves our facility, we can no longer verify how it was stored, transported, or handled — so we cannot responsibly resell or restock a returned product, and cannot guarantee its integrity if it were accepted back. Maintaining this standard protects the purity and chain-of-custody guarantee behind every <Link href="/certificates" className="text-gold underline hover:text-ink transition-colors">Certificate of Analysis</Link> we issue, for every researcher who orders from us.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">02. What We Do Cover</h2>
              <p className="text-ink-muted mb-4">
                While we do not offer refunds or returns, we stand behind what actually ships from our facility. If your order arrives in any of the following conditions, we will replace it at no additional cost:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>The package or vial arrived visibly damaged or with a broken seal in transit.</li>
                <li>You received the wrong product or the wrong quantity.</li>
                <li>The product does not match the batch specification on its accompanying <Link href="/certificates" className="text-gold underline hover:text-ink transition-colors">Certificate of Analysis</Link>.</li>
              </ul>
              <p className="text-ink-muted mt-4">
                These cases are the only exceptions to our all-sales-final policy, and are evaluated case by case once reported.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">03. How to Report an Issue</h2>
              <ol className="list-decimal pl-6 space-y-2 text-ink-muted">
                <li>Contact our support team within 48 hours of delivery via the <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link> or <a href="mailto:support@longeviaresearch.com" className="text-gold underline hover:text-ink transition-colors">support@longeviaresearch.com</a>, with your order number and a description of the issue.</li>
                <li>Include photos of the product, vial label, and outer packaging as received.</li>
                <li>Our team reviews each report and responds within 3–5 business days.</li>
                <li>Verified cases are resolved with a replacement shipment at no additional cost — we do not issue cash or store-credit refunds.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">04. What Isn't Covered</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Change of mind, ordering the wrong item, or no longer needing a product.</li>
                <li>Any vial that has been opened, reconstituted, or used.</li>
                <li>Degradation caused by improper storage or handling after delivery — see our <Link href="/journal/peptide-reconstitution-storage-guide" className="text-gold underline hover:text-ink transition-colors">reconstitution and storage guide</Link> for correct protocol.</li>
                <li>Issues reported more than 48 hours after delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">05. Legal Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>All products are for laboratory and research use only. Misuse for any human or veterinary purpose voids all replacement eligibility.</li>
                <li>Replacement approval is subject to verification and is granted at our discretion, in accordance with applicable law.</li>
                <li>Longevia Research reserves the right to update this policy at any time; the effective date above reflects the most recent revision.</li>
              </ul>
            </section>

            <section className="bg-white rounded-[1.5rem] p-8 lg:p-10 border border-border-subtle shadow-sm mt-16">
              <h2 className="text-editorial-md font-serif text-ink mb-4">Order Arrived Damaged or Incorrect?</h2>
              <p className="text-ink-muted mb-6">
                Reach our team via the <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link>, or email us directly with your order number and photos.
              </p>
              <a href="mailto:support@longeviaresearch.com" className="text-lg font-medium text-ink hover:text-gold transition-colors underline underline-offset-4">
                support@longeviaresearch.com
              </a>
            </section>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
