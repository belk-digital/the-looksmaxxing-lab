import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'

const siteUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.thelooksmaxxinglab.com').replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Privacy Policy | The Looksmaxxing Lab',
  description: 'How The Looksmaxxing Lab collects, uses, and protects your personal information when you browse, create an account, or order research peptides.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | The Looksmaxxing Lab',
    description: 'How The Looksmaxxing Lab collects, uses, and protects your personal information.',
    images: [{ url: '/og/og-home.webp', width: 1200, height: 630, alt: 'The Looksmaxxing Lab — Privacy Policy' }],
    url: `${siteUrl}/privacy`,
    type: 'website',
  },
}

const schemaBreadcrumbList = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${siteUrl}/privacy` },
  ],
}

export default function PrivacyPage() {
  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbList) }} />

      <nav aria-label="Breadcrumb" className="px-6 max-w-3xl mx-auto mb-12">
        <ol className="flex flex-wrap items-center gap-2 text-label-sm uppercase tracking-wider text-ink-muted">
          <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">Privacy Policy</li>
        </ol>
      </nav>

      <section className="px-6 max-w-3xl mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Legal Information</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-4">Privacy Policy</h1>
          <p className="text-label-sm uppercase tracking-wider text-ink-muted mb-10">Effective Date: January 2026</p>

          <p className="text-body-lg text-ink-muted leading-relaxed mb-16">
            Your privacy matters to us. This Privacy Policy explains what information The Looksmaxxing Lab collects, how we use it, and the choices you have. By using this website, you consent to the practices described below.
          </p>

          <div className="space-y-14 text-body-lg text-ink leading-relaxed">
            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">01. Information We Collect</h2>
              <p className="text-ink-muted mb-4">We collect information necessary to process orders and operate our website securely:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Personal information:</strong> name, email address, phone number, billing and shipping address.</li>
                <li><strong>Account information:</strong> login credentials, order history, and saved preferences.</li>
                <li><strong>Payment information:</strong> processed securely by our third-party payment provider — we do not store full card numbers on our servers.</li>
                <li><strong>Technical data:</strong> IP address, browser type, device information, and pages visited.</li>
                <li><strong>Cookies:</strong> used to keep you signed in, remember your cart, and understand site usage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">02. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Processing and fulfilling orders, including shipping and payment confirmation.</li>
                <li>Providing order updates, customer support, and account notifications.</li>
                <li>Improving website performance, security, and the overall research-ordering experience.</li>
                <li>Sending promotional communications, with an opt-out available in every email.</li>
                <li>Meeting our legal and regulatory obligations as a research-compound supplier.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">03. Sharing Your Information</h2>
              <p className="text-ink-muted mb-4">We do not sell your personal data. Information is shared only in limited circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li><strong>Service providers:</strong> trusted partners handling payment processing, shipping, and technical infrastructure.</li>
                <li><strong>Legal requirements:</strong> when required by law, subpoena, or regulatory request.</li>
                <li><strong>Protection of rights:</strong> to prevent fraud, enforce our <Link href="/terms" className="text-gold underline hover:text-ink transition-colors">Terms &amp; Conditions</Link>, or protect the safety of our users.</li>
                <li><strong>Third-party links:</strong> our site may link to external resources; we are not responsible for their privacy practices.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">04. Data Security</h2>
              <p className="text-ink-muted">
                We apply industry-standard safeguards — encryption in transit, secure hosting, and restricted internal access — to protect your information. No online system is completely immune to risk, and by using our services you acknowledge the inherent limitations of data transmitted over the internet.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">05. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Access, update, or correct the personal information we hold about you.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of marketing communications at any time.</li>
                <li>Object to or restrict certain uses of your data.</li>
              </ul>
              <p className="text-ink-muted mt-4">
                To exercise any of these rights, email <a href="mailto:support@thelooksmaxxinglab.com" className="text-gold underline hover:text-ink transition-colors">support@thelooksmaxxinglab.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">06. Research-Use Products Disclaimer</h2>
              <p className="text-ink-muted mb-4">All products sold by The Looksmaxxing Lab are strictly Research Use Only:</p>
              <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                <li>Not for human or veterinary use.</li>
                <li>Not intended for diagnosis, treatment, or any therapeutic purpose.</li>
                <li>The purchaser is responsible for compliant handling under all applicable laws — see our <Link href="/journal/peptide-coa-hplc-purity-testing-guide" className="text-gold underline hover:text-ink transition-colors">COA verification guide</Link> and <Link href="/journal/peptide-reconstitution-storage-guide" className="text-gold underline hover:text-ink transition-colors">storage guide</Link> for correct laboratory protocol.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-editorial-md font-serif text-ink mb-4">07. Updates to This Policy</h2>
              <p className="text-ink-muted">
                We may revise this Privacy Policy periodically. Updates take effect immediately upon posting, with the effective date above reflecting the most recent revision. We encourage you to check back periodically.
              </p>
            </section>

            <section className="bg-white rounded-[1.5rem] p-8 lg:p-10 border border-border-subtle shadow-sm mt-16">
              <h2 className="text-editorial-md font-serif text-ink mb-4">Questions About Your Data?</h2>
              <p className="text-ink-muted mb-6">
                Reach our team via the <Link href="/contact" className="text-gold underline hover:text-ink transition-colors">Contact page</Link>, or email us directly.
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
