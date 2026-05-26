'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { PullQuote } from '@/components/editorial/PullQuote'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <main className="bg-cream min-h-screen">
      {/* 1. Hero split */}
      <section className="flex flex-col lg:flex-row min-h-[60vh]">
        <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-full">
          <FadeUp className="w-full h-full">
            <Image 
              src="/hero-image.png" 
              alt="Laboratory environment" 
              fill 
              className="object-cover"
            />
          </FadeUp>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-12 lg:p-24 bg-cream-warm">
          <FadeUp className="max-w-[720px]">
            <h2 className="text-label-md uppercase tracking-wider text-gold mb-6">The Lab</h2>
            <h1 className="text-display-md font-serif text-ink mb-8">
              Considered compounds for considered research.
            </h1>
            <p className="text-body-lg text-ink-muted">
              We founded The Looksmaxxing Lab to bring unprecedented documentation and transparency to the research peptide market.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* 2. Origin section */}
      <section className="py-32 px-6">
        <div className="max-w-[720px] mx-auto">
          <FadeUp>
            <h3 className="text-label-md uppercase tracking-wider text-gold mb-6 text-center">Our Origin</h3>
            <h2 className="text-editorial-lg font-serif text-ink mb-12 text-center">
              The standard we couldn't find, so we built it.
            </h2>
            <div className="text-body-lg leading-relaxed text-ink-muted space-y-6">
              <p className="first-letter:text-7xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:text-ink first-letter:mt-2">
                For years, researchers have had to compromise between affordable access and reliable documentation. We experienced this frustration firsthand. The industry standard was a vague certificate of analysis, often years old, from an undisclosed third-party laboratory.
              </p>
              <p>
                We decided that if we were going to conduct serious research, we needed serious documentation. Every batch. Every time.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 3. PullQuote section */}
      <section className="py-32 px-6 bg-cream-warm">
        <FadeUp>
          <PullQuote attribution="Dr. J. Mitchell, Lead Quality Officer">
            Documented purity is the foundation of every reproducible result. Without it, you are simply guessing.
          </PullQuote>
        </FadeUp>
      </section>

      {/* 4. Three pillars grid */}
      <section className="py-32 px-6">
        <div className="max-w-[1280px] mx-auto">
          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="relative w-full aspect-square mb-8">
                <Image src="/hero-image.png" alt="Biotechnology" fill className="object-cover" />
              </div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Biotechnology</h3>
              <p className="text-body-md text-ink-muted">State-of-the-art synthesis ensuring the most stable and efficacious compounds available.</p>
            </motion.div>
            
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="relative w-full aspect-square mb-8">
                <Image src="/hero-image.png" alt="Precision" fill className="object-cover" />
              </div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Precision</h3>
              <p className="text-body-md text-ink-muted">Exact mass measurements and strictly controlled environments for unparalleled consistency.</p>
            </motion.div>
            
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="relative w-full aspect-square mb-8">
                <Image src="/hero-image.png" alt="Purity" fill className="object-cover" />
              </div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Purity</h3>
              <p className="text-body-md text-ink-muted">Independent HPLC and LC-MS verification exceeding 99% purity for every single batch.</p>
            </motion.div>
          </StaggerChildren>
        </div>
      </section>

      {/* 5. Standards section */}
      <section className="py-32 relative min-h-[80vh] flex items-center justify-center">
        <Image src="/hero-image.png" alt="Laboratory standards" fill className="object-cover z-0" />
        <div className="absolute inset-0 bg-ink/70 z-10" />
        <div className="relative z-20 max-w-[720px] mx-auto text-center px-6">
          <FadeUp>
            <h2 className="text-display-sm font-serif text-cream mb-8">The Gold Standard in Verification</h2>
            <p className="text-body-lg text-cream-warm mb-12">
              We employ independent, US-based laboratories to perform high-performance liquid chromatography (HPLC) and mass spectrometry (MS) on every batch. A Certificate of Analysis (COA) is included with every order.
            </p>
            <Link href="/certificates">
              <Button variant="dark" className="border-cream text-cream hover:bg-cream hover:text-ink transition-colors">
                View COA Library
              </Button>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* 6. CTA section */}
      <section className="py-32 px-6 text-center bg-cream-sand">
        <FadeUp>
          <div className="max-w-[720px] mx-auto flex flex-col items-center gap-8">
            <h2 className="text-editorial-lg font-serif text-ink">Continue your research</h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/science">
                <Button variant="secondary">The Science</Button>
              </Link>
              <Link href="/journal">
                <Button variant="secondary">Read Journal</Button>
              </Link>
              <Link href="/shop">
                <Button variant="primary">Shop Collection</Button>
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
