'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DownloadIcon, FileTextIcon, ArrowRightIcon } from 'lucide-react'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type COA = {
  id: string
  product: string
  productSlug: string
  category: string
  // The document's own title field in Payload, if the admin set one. Shown verbatim — never parsed
  // or used to infer a batch number, since we have no verified structured batch data.
  documentTitle?: string
  // When the COA file was uploaded/last updated in the CMS — not a lab "analyzed" date, since we
  // don't have verified lab analysis dates for each file.
  uploadedDate?: string
  coaUrl: string
}

export function CertificatesClient({ coas }: { coas: COA[] }) {
  const [filter, setFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(coas.map((c) => c.category).filter(Boolean))).sort()]

  const filteredCOAs = filter === 'All' ? coas : coas.filter((c) => c.category === filter)

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      {/* Header */}
      <section className="px-6 mb-16 max-w-page mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Verification</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-6">Certificates of Analysis</h1>
          <p className="text-body-lg text-ink-muted max-w-prose mb-8">
            Every Certificate of Analysis below is a genuine, downloadable document as published in our
            system — nothing on this page is a placeholder or sample. We're actively expanding published
            COA coverage across the catalog; if a product you're researching isn't listed yet, reach out
            and we'll get you its documentation directly.
          </p>
          <div className="flex gap-4">
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                Shop Verified Products
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* Filter and Table */}
      <section className="px-6 mb-32 max-w-page mx-auto">
        <FadeUp delay={0.1}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-editorial-md font-serif text-ink">Published Certificates</h2>
            {coas.length > 0 && (
              <div className="w-full sm:w-64">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {coas.length === 0 ? (
            <div className="bg-cream-warm border border-border-subtle rounded-md p-10 text-center">
              <p className="text-body-lg text-ink-muted mb-6">
                We're in the process of publishing Certificates of Analysis for our catalog. None are
                published here yet — contact us directly and we'll send you the documentation for the
                specific product you're researching.
              </p>
              <Link href="/contact">
                <Button variant="outline" className="rounded-full px-8 py-4 uppercase tracking-widest text-xs font-bold">
                  Request a COA
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-strong">
                      <th className="py-4 px-4 text-label-md uppercase tracking-wider text-ink-muted font-normal">Product</th>
                      <th className="py-4 px-4 text-label-md uppercase tracking-wider text-ink-muted font-normal">Category</th>
                      <th className="py-4 px-4 text-label-md uppercase tracking-wider text-ink-muted font-normal">Reference</th>
                      <th className="py-4 px-4 text-label-md uppercase tracking-wider text-ink-muted font-normal">Uploaded</th>
                      <th className="py-4 px-4 text-label-md uppercase tracking-wider text-ink-muted font-normal text-right">COA Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCOAs.map((coa) => (
                      <tr key={coa.id} className="border-b border-border-subtle hover:bg-cream-warm transition-colors duration-fast">
                        <td className="py-6 px-4">
                          <Link href={`/products/${coa.productSlug}`} className="text-body-md font-medium text-ink hover:text-gold transition-colors">
                            {coa.product}
                          </Link>
                        </td>
                        <td className="py-6 px-4 text-body-md text-ink-muted">{coa.category || '—'}</td>
                        <td className="py-6 px-4 text-body-md text-ink font-mono">{coa.documentTitle || '—'}</td>
                        <td className="py-6 px-4 text-body-md text-ink-muted">{coa.uploadedDate || '—'}</td>
                        <td className="py-6 px-4 text-right">
                          <a
                            href={coa.coaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-label-md uppercase tracking-wider text-gold hover:text-gold-dark transition-colors"
                          >
                            <FileTextIcon className="w-4 h-4" />
                            <span>PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden flex flex-col gap-4">
                {filteredCOAs.map((coa) => (
                  <div key={coa.id} className="bg-cream-warm border border-border-subtle rounded-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/products/${coa.productSlug}`} className="text-body-md font-medium text-ink hover:text-gold transition-colors">
                          {coa.product}
                        </Link>
                        <span className="block text-body-sm text-ink-muted">{coa.category || '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-t border-b border-border-subtle mb-4">
                      <div>
                        <span className="block text-label-sm uppercase tracking-wider text-ink-muted mb-1">Reference</span>
                        <span className="text-body-sm font-mono text-ink">{coa.documentTitle || '—'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-label-sm uppercase tracking-wider text-ink-muted mb-1">Uploaded</span>
                        <span className="text-body-sm text-ink">{coa.uploadedDate || '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <a
                        href={coa.coaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 border border-gold text-label-md uppercase tracking-wider text-gold rounded-sm hover:bg-gold hover:text-cream transition-colors"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Download COA</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <p className="text-body-md text-ink-muted mb-4">
                  Don't see the product you're researching? We're continuing to publish COAs across the
                  catalog — request one directly and we'll send it to you.
                </p>
                <Link href="/contact" className="text-body-sm text-gold hover:text-ink underline underline-offset-4 transition-colors">
                  Request a Certificate of Analysis
                </Link>
              </div>
            </>
          )}
        </FadeUp>
      </section>

      {/* Editorial Section */}
      <section className="px-6 mb-32 bg-cream-sand py-24">
        <div className="max-w-page mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-sm overflow-hidden">
                <Image
                  src="/new-images/glow-and-nad-bg-image.webp"
                  alt="TB-500 (Thymosin Beta-4) research peptide vial splashing through water, ≥98% purity research-grade compound from Longevia Research"
                  fill
                  className="object-cover"
                />
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <EyebrowHeading gold>The Process</EyebrowHeading>
              <h2 className="text-display-sm font-serif text-ink mt-4 mb-8">About our testing methodology</h2>
              <div className="text-body-lg text-ink-muted space-y-6">
                <p>
                  Every raw material we receive undergoes rigorous High-Performance Liquid Chromatography (HPLC) prior to compounding. This analytical technique separates, identifies, and quantifies each component in a mixture, ensuring absolute sequence accuracy.
                </p>
                <p>
                  Following synthesis and lyophilization, random samples from the finished batch are submitted to independent third-party laboratories. They perform secondary HPLC alongside Mass Spectrometry (MS) to verify that the molecular weight perfectly matches the target peptide structure and that purity exceeds our 99% baseline standard.
                </p>
                <p>
                  Want the full breakdown of how to read a chromatogram, what a purity percentage actually means, and how to spot red flags in a supplier's documentation? See our complete <Link href="/journal/why-peptide-purity-matters-in-scientific-research" className="text-gold underline hover:text-ink transition-colors">guide to reading a peptide Certificate of Analysis</Link>.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 text-center max-w-content mx-auto">
        <FadeUp>
          <h2 className="text-editorial-lg font-serif text-ink mb-6">Demanding a higher standard</h2>
          <p className="text-body-lg text-ink-muted mb-10">
            Learn more about why rigorous independent testing is the only way to guarantee reproducible research results.
          </p>
          <Link href="/journal">
            <Button variant="primary" size="lg" className="gap-2">
              Explore Our Science <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </Link>
        </FadeUp>
      </section>
    </main>
  )
}
