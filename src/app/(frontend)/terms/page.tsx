import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Terms & Conditions | The Looksmaxxing Lab',
  description: 'Terms and Conditions governing the purchase and use of research-use-only peptides from The Looksmaxxing Lab, including account, ordering, shipping, and liability terms.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: 'Terms & Conditions | The Looksmaxxing Lab',
    description: 'Terms and Conditions governing the purchase and use of research-use-only peptides from The Looksmaxxing Lab.',
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Terms & Conditions' }],
    url: `${siteUrl}/terms`,
    type: 'website',
  },
}

const schemaBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: `${siteUrl}/terms` },
  ],
}

export default function TermsPage() {
  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />

      <nav aria-label="Breadcrumb" className="px-6 max-w-3xl mx-auto mb-12">
        <ol className="flex flex-wrap items-center gap-2 text-label-sm uppercase tracking-wider text-ink-muted">
          <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">Terms & Conditions</li>
        </ol>
      </nav>

      <section className="px-6 max-w-3xl mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Legal Information</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-4">Terms &amp; Conditions</h1>
          <p className="text-label-sm uppercase tracking-wider text-ink-muted mb-10">Effective Date: January 2026</p>

          <p className="text-body-lg text-ink-muted leading-relaxed mb-16">
            Welcome to The Looksmaxxing Lab. By accessing this website, creating an account, or purchasing any product, you agree to be bound by the following Terms &amp; Conditions. If you do not agree to these terms, please do not use our website or place an order.
          </p>

          <div className="space-y-14 text-body-lg text-ink leading-relaxed">
            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">01. Purpose</h2>
              <p className="text-ink-muted">
                The Looksmaxxing Lab supplies research-grade peptides and related laboratory compounds, all offered strictly for <strong>Research Use Only (RUO)</strong>. Products are not intended for human or veterinary consumption, diagnosis, or treatment of any kind. These Terms govern your access to, and use of, our website, products, and services.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">02. Research-Use-Only Products</h2>
              <p className="text-ink-muted mb-4">By purchasing or using any product from The Looksmaxxing Lab, you confirm that:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>You understand that all products are laboratory reagents, not drugs, supplements, or food products, and are not for consumption.</li>
                <li>You will use all products solely within a controlled laboratory or research setting, by a qualified researcher.</li>
                <li>You accept full responsibility for the safe handling, storage, and disposal of every compound you purchase — see our <Link href="/journal/peptide-reconstitution-storage-guide" className="text-gold underline hover:text-ink transition-colors">reconstitution and storage guide</Link> for correct handling protocol.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">03. Account &amp; User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>You must be 18 years of age or older, or the age of legal majority in your jurisdiction, to create an account or place an order.</li>
                <li>You agree to provide accurate, current billing and shipping information.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and all activity under your account.</li>
                <li>Any suspected unauthorized use of your account should be reported to us immediately via our <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">04. Ordering &amp; Payment</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Orders are processed once payment has been successfully authorized.</li>
                <li>We accept the payment methods presented at checkout.</li>
                <li>All prices are listed in USD unless otherwise stated.</li>
                <li>Order modifications or cancellations may be requested prior to shipment, subject to review.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">05. Shipping &amp; Delivery</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>We ship from US-based facilities to approved domestic and international destinations, subject to local import regulations for research-use compounds.</li>
                <li>Published delivery timeframes are estimates and may vary due to carrier logistics or customs processing beyond our control.</li>
                <li>The Looksmaxxing Lab is not liable for shipping delays caused by the carrier once a package has left our facility.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">06. Product Liability &amp; Safety</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>No product sold by The Looksmaxxing Lab is approved for human or veterinary use.</li>
                <li>The purchaser assumes all risk associated with storage, handling, and application of any compound in a research setting.</li>
                <li>The Looksmaxxing Lab is not liable for any misuse, accidental exposure, or unapproved application of a purchased product.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">07. Intellectual Property</h2>
              <p className="text-ink-muted">
                All website content — including product descriptions, Certificates of Analysis presentation, Journal articles, imagery, and branding — is the property of The Looksmaxxing Lab. Unauthorized reproduction, distribution, or commercial reuse of this content is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">08. User Conduct</h2>
              <p className="text-ink-muted mb-4">By using this website, you agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Use our products for any illegal purpose.</li>
                <li>Resell, redistribute, or apply research products for any unapproved, non-laboratory purpose.</li>
                <li>Violate any applicable local, state, or federal law governing research compounds.</li>
              </ul>
              <p className="text-ink-muted mt-4">Violations may result in order cancellation, account suspension, or further legal action.</p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">09. Limitation of Liability</h2>
              <p className="text-ink-muted">
                To the maximum extent permitted by law, The Looksmaxxing Lab is not liable for damages arising from product misuse, unauthorized application, or website errors, and any liability related to a specific order is limited to the purchase price of that order.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">10. Indemnification</h2>
              <p className="text-ink-muted">
                You agree to indemnify and hold harmless The Looksmaxxing Lab, its employees, and affiliates from any claim, damage, or expense arising from your improper use of a product, violation of these Terms, or breach of any applicable law related to product use.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">11. Governing Law</h2>
              <p className="text-ink-muted">
                These Terms are governed by the laws of the United States and the state in which The Looksmaxxing Lab operates. Any disputes arising from these Terms will be resolved under those laws.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">12. Privacy &amp; Data Use</h2>
              <p className="text-ink-muted">
                Your use of this website is also governed by our <Link href="/privacy" className="text-gold underline hover:text-ink transition-colors">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">13. Changes to These Terms</h2>
              <p className="text-ink-muted">
                We reserve the right to update these Terms at any time. Changes take effect immediately upon posting to this page. Continued use of our website or products after a change constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="bg-white rounded-[1.5rem] p-8 lg:p-10 border border-border-subtle shadow-sm mt-16">
              <h2 className="text-editorial-md font-serif text-ink mb-4">Questions About These Terms?</h2>
              <p className="text-ink-muted mb-6">
                For order-related questions or general support, reach our team via the <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link>, or email us directly.
              </p>
              <a href="mailto:support@thelooksmaxxinglab.com" className="text-lg font-medium text-ink hover:text-gold transition-colors underline underline-offset-4">
                support@thelooksmaxxinglab.com
              </a>
            </section>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
