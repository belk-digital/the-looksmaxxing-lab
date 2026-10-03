'use client'

import React, { useEffect, useState } from 'react'
import { SearchIcon, ArrowRight, PlusIcon } from 'lucide-react'
import { FadeUp } from '@/components/motion/FadeUp'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FAQ_DATA, faqAnchor, parseAnswer, stripLinks } from './faqData'

function Answer({ text }: { text: string }) {
  return (
    <p>
      {parseAnswer(text).map((part, i) =>
        part.type === 'link' ? (
          <Link
            key={i}
            href={part.href}
            className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors"
          >
            {part.label}
          </Link>
        ) : (
          <React.Fragment key={i}>{part.value}</React.Fragment>
        ),
      )}
    </p>
  )
}

export default function FaqClient() {
  const [searchQuery, setSearchQuery] = useState('')

  // Open and scroll to a question when the URL has a matching #anchor (e.g. /faq#where-is-my-tracking-number).
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const el = document.getElementById(id)
    if (el instanceof HTMLDetailsElement) {
      el.open = true
      el.scrollIntoView({ block: 'center' })
    }
  }, [])

  const query = searchQuery.trim().toLowerCase()
  const filteredCategories = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) => !query || item.q.toLowerCase().includes(query) || stripLinks(item.a).toLowerCase().includes(query),
    ),
  })).filter((cat) => cat.items.length > 0)

  return (
    <main className="bg-[#f3f4f6] min-h-screen pb-24 flex flex-col">
      <div className="w-full max-w-2xl mx-auto pt-32 px-6 lg:px-12 flex-shrink-0">
        <nav aria-label="breadcrumb" className="text-xs font-mono tracking-widest uppercase text-ink/50">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-ink">FAQ</span>
        </nav>
      </div>

      {/* Header & Search */}
      <section className="px-6 mb-16 lg:mb-24 mt-12 max-w-2xl mx-auto flex flex-col items-center flex-1">
        <FadeUp className="w-full flex flex-col items-center">
          <span className="px-4 py-1.5 bg-white border border-gray-100 shadow-sm text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Support Center</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6 text-center tracking-tight leading-tight">
            Frequently Asked Questions
            <span className="sr-only"> — Longevia Research Peptides: Purity, COAs, Ordering &amp; Shipping</span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-500 text-center mb-10 max-w-xl font-light leading-relaxed">
            Straight answers about our research-grade peptides, how to check purity with a{' '}
            <Link href="/certificates" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">Certificate of Analysis</Link>
            , ordering and shipping, and what “research use only” means. Can&apos;t find what you need? <Link href="/contact" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">Ask our team</Link>.
          </p>

          <div className="relative w-full max-w-[540px]">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              aria-label="Search the FAQ"
              placeholder="Search questions about purity, COAs, shipping, and more..."
              className="w-full h-14 pl-14 pr-6 rounded-full bg-white border-transparent shadow-sm hover:shadow-md focus:border-[#5984c4] focus:ring-1 focus:ring-[#5984c4] transition-all duration-300 text-lg placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </FadeUp>
      </section>

      {/* FAQ list: native <details> keeps every answer in the page HTML (crawlable) while staying collapsed for visitors */}
      <section className="px-4 md:px-6 max-w-[800px] mx-auto mb-24 w-full">
        <FadeUp delay={0.1}>
          {filteredCategories.length === 0 ? (
            <div className="py-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center">
              <EmptyState
                icon={SearchIcon}
                title="No results found"
                description={`We couldn't find any answers matching "${searchQuery}".`}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {filteredCategories.map((category) => (
                <div key={category.title} className="bg-white rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-10 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-full bg-[#5984c4]/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5984c4]" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">{category.title}</h2>
                  </div>
                  <div className="w-full">
                    {category.items.map((item) => (
                      <details
                        key={item.q}
                        id={faqAnchor(item.q)}
                        className="group border-b border-gray-100 last:border-0 scroll-mt-28"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-left [&::-webkit-details-marker]:hidden">
                          <h3 className="text-lg md:text-xl font-medium text-ink group-hover:text-[#5984c4] transition-colors duration-300">
                            {item.q}
                          </h3>
                          <PlusIcon className="shrink-0 text-ink-muted transition-transform duration-500 group-open:rotate-45" aria-hidden="true" />
                        </summary>
                        <div className="text-base md:text-lg text-gray-500 leading-relaxed pb-8 font-light">
                          <Answer text={item.a} />
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </FadeUp>
      </section>

      {/* Bottom CTA Strip */}
      <section className="px-4 md:px-6 max-w-[800px] mx-auto w-full">
        <FadeUp delay={0.2}>
          <div className="bg-white rounded-[1.5rem] lg:rounded-[2rem] p-8 lg:p-12 shadow-sm text-center flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-serif text-ink mb-4">Still have a question?</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-lg leading-relaxed">
              Our support team is happy to help with orders, batch documents and product questions. For compound-specific reading, our{' '}
              <Link href="/journal" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">research journal</Link>{' '}
              covers{' '}
              <Link href="/journal/bpc-157-tb-500-synergy" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">BPC-157 and TB-500</Link>,{' '}
              <Link href="/journal/ghk-cu-pharmacokinetics" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">GHK-Cu</Link> and{' '}
              <Link href="/journal/semaglutide-vs-tirzepatide-vs-glp-3-comparison" className="font-medium text-[#5984c4] underline underline-offset-2 hover:text-ink transition-colors">Semaglutide</Link> in detail.
            </p>
            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 w-full">
              <Link href="/contact" className="w-full md:w-auto flex-1 md:flex-none">
                <Button className="w-full whitespace-nowrap rounded-full px-8 h-14 bg-ink text-white hover:bg-[#5984c4] transition-colors duration-500 font-medium text-base flex items-center justify-center gap-2 group">
                  Contact Support
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
              </Link>
              <Link href="/certificates" className="w-full md:w-auto flex-1 md:flex-none">
                <Button variant="outline" className="w-full whitespace-nowrap rounded-full px-8 h-14 border-slate-200 text-ink hover:border-[#5984c4] hover:bg-slate-50 transition-colors duration-500 font-medium text-base flex items-center justify-center gap-2 group">
                  View COA Library
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
              </Link>
              <Link href="/shop" className="w-full md:w-auto flex-1 md:flex-none">
                <Button variant="outline" className="w-full whitespace-nowrap rounded-full px-8 h-14 border-slate-200 text-ink hover:border-[#5984c4] hover:bg-slate-50 transition-colors duration-500 font-medium text-base flex items-center justify-center gap-2 group">
                  Browse Research Peptides
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Button>
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
