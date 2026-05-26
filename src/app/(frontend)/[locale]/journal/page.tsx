'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { BlogPostCard } from '@/components/editorial/BlogPostCard'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['All', 'Emerging', 'Protocols', 'Studies', 'Guides']

export default function JournalIndexPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      {/* Header */}
      <section className="px-6 mb-16 max-w-[1280px] mx-auto">
        <FadeUp>
          <EyebrowHeading gold>Science Journal</EyebrowHeading>
          <h1 className="text-display-lg font-serif text-ink mt-4 mb-6">Latest research</h1>
          <p className="text-body-lg text-ink-muted max-w-[960px]">
            Documented purity, protocols, and emerging studies in peptide science.
          </p>
        </FadeUp>
      </section>

      {/* Featured Post */}
      <section className="px-6 mb-24 max-w-[1280px] mx-auto">
        <FadeUp delay={0.1}>
          <Link href="/journal/the-case-for-nad-in-mitochondrial-research" className="group block relative w-full rounded-sm overflow-hidden min-h-[60vh] flex flex-col justify-end p-8 md:p-16">
            <Image 
              src="/hero-image.png" 
              alt="Featured post" 
              fill 
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 z-0" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent z-10" />
            
            <div className="relative z-20 max-w-[960px] text-cream">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-label-md uppercase tracking-wider text-gold">Emerging</span>
                <span className="text-label-md uppercase tracking-wider text-cream/70">· 12 min read</span>
              </div>
              <h2 className="text-display-md font-serif mb-4">
                The case for NAD+ in mitochondrial research
              </h2>
              <p className="text-body-lg text-cream-warm mb-8 line-clamp-2">
                A comprehensive review of NAD+ precursors and their impact on cellular respiration, longevity markers, and tissue repair protocols.
              </p>
              <span className="text-label-md uppercase tracking-wider text-gold flex items-center gap-2 group-hover:text-cream transition-colors duration-fast">
                Read the full article <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </FadeUp>
      </section>

      {/* Filter Chips */}
      <section className="px-6 mb-12 max-w-[1280px] mx-auto">
        <FadeUp delay={0.2} className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-label-md uppercase tracking-wider transition-colors duration-fast ${
                activeCategory === cat 
                  ? 'bg-ink text-cream border border-ink' 
                  : 'bg-transparent text-ink border border-border-subtle hover:border-ink hover:bg-cream-warm'
              }`}
            >
              {cat}
            </button>
          ))}
        </FadeUp>
      </section>

      {/* Grid */}
      <section className="px-6 max-w-[1280px] mx-auto mb-24">
        <StaggerChildren staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div key={i} variants={staggerItemVariants} className="h-full">
              <BlogPostCard 
                slug={`sample-post-${i}`}
                title={`Protocol: Reconstitution and storage guidelines ${i}`}
                category={i % 2 === 0 ? 'Protocols' : 'Studies'}
                excerpt="Best practices for maintaining peptide stability, minimizing degradation, and ensuring accurate dosing in clinical environments."
                imageSrc="/hero-image.png"
                readTime="5 min read"
              />
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* Infinite Scroll trigger area */}
      <section className="py-12 flex justify-center">
        <FadeUp>
          <Button variant="secondary" className="px-8">Load More Posts</Button>
        </FadeUp>
      </section>
    </main>
  )
}
