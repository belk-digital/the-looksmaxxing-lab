'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { Button } from '@/components/ui/button'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'

const AFFILIATE_FAQS: FaqItem[] = [
  { question: 'How long do cookies last?', answer: 'Our affiliate tracking cookie remains active for 30 days after the initial click.' },
  { question: 'When do I get paid?', answer: 'Commissions have a 30-day pending period to account for potential returns. Once approved, you can request a payout anytime if you meet the minimum threshold.' },
  { question: 'What payment methods do you support?', answer: 'We process payouts globally via PayPal, Wise, Bank Wire, and major cryptocurrencies (BTC, ETH, USDT).' },
  { question: 'Do I get free products?', answer: 'Top-tier Gold and VIP affiliates receive seasonal research allocations for content creation. Standard affiliates do not receive free compounds initially.' },
]

export default function AffiliatesLandingPage() {
  return (
    <main className="bg-cream min-h-screen">
      {/* 1. Hero Section (Split Pattern) */}
      <section className="relative min-h-[90vh] flex flex-col lg:flex-row">
        {/* Left: Image */}
        <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-full">
          <FadeUp className="w-full h-full">
            <Image 
              src="/hero-image.png" 
              alt="Affiliate Program" 
              fill 
              className="object-cover"
              priority
            />
          </FadeUp>
        </div>

        {/* Right: Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-cream">
          <FadeUp delay={0.1} className="max-w-[480px]">
            <EyebrowHeading gold>Partner Program</EyebrowHeading>
            <h1 className="text-display-md font-serif text-ink mt-4 mb-6">Advancing independent research</h1>
            <div className="text-body-lg text-ink-muted mb-10 space-y-6">
              <p>
                Join the industry's most rigorous peptide testing facility. We partner with leading biohackers, clinicians, and researchers to distribute the highest purity compounds available.
              </p>
              <p>
                Earn competitive commissions while providing your audience with exclusive access to verified, LC-MS tested research materials.
              </p>
            </div>
            <Link href="/affiliates/apply">
              <Button variant="dark" size="lg">Apply to the Program</Button>
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* 2. How it works (3 steps) */}
      <section className="px-6 py-32 max-w-page mx-auto">
        <FadeUp>
          <div className="text-center mb-16">
            <EyebrowHeading gold className="items-center">Process</EyebrowHeading>
            <h2 className="text-editorial-lg font-serif text-ink mt-4">How it works</h2>
          </div>
          
          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cream-warm border border-gold flex items-center justify-center text-editorial-md font-serif text-ink mb-6">1</div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Apply</h3>
              <p className="text-body-md text-ink-muted">Submit your application with your platform metrics. We review applications weekly to ensure audience alignment.</p>
            </motion.div>
            
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cream-warm border border-gold flex items-center justify-center text-editorial-md font-serif text-ink mb-6">2</div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Share</h3>
              <p className="text-body-md text-ink-muted">Receive a dedicated 10% off coupon code and trackable referral links to share across your digital footprint.</p>
            </motion.div>
            
            <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cream-warm border border-gold flex items-center justify-center text-editorial-md font-serif text-ink mb-6">3</div>
              <h3 className="text-editorial-md font-serif text-ink mb-4">Earn</h3>
              <p className="text-body-md text-ink-muted">Earn competitive percentage commissions on all eligible orders placed within 30 days of a referral click.</p>
            </motion.div>
          </StaggerChildren>
        </FadeUp>
      </section>

      {/* 3. Commission Rates / Metrics */}
      <section className="bg-ink text-cream py-32 px-6">
        <div className="max-w-page mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <h2 className="text-display-sm font-serif mb-6">Generous structures for serious partners</h2>
            <p className="text-body-lg text-cream-warm/80 mb-8 max-w-prose">
              Our baseline tier offers highly competitive rates. As your volume scales, we automatically upgrade your account to unlock higher commissions, dedicated support, and custom synthesis requests.
            </p>
          </FadeUp>
          
          <FadeUp delay={0.1}>
            <div className="grid grid-cols-2 gap-8">
              <div className="border-l border-gold pl-6">
                <span className="block text-display-md font-serif text-gold mb-2">10%</span>
                <span className="text-label-md uppercase tracking-wider text-cream-warm/70">Base Commission</span>
              </div>
              <div className="border-l border-gold pl-6">
                <span className="block text-display-md font-serif text-gold mb-2">30</span>
                <span className="text-label-md uppercase tracking-wider text-cream-warm/70">Day Cookie Life</span>
              </div>
              <div className="border-l border-gold pl-6">
                <span className="block text-display-md font-serif text-gold mb-2">$50</span>
                <span className="text-label-md uppercase tracking-wider text-cream-warm/70">Min. Payout</span>
              </div>
              <div className="border-l border-gold pl-6">
                <span className="block text-display-md font-serif text-gold mb-2">4</span>
                <span className="text-label-md uppercase tracking-wider text-cream-warm/70">Payout Methods</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 4. FAQ */}
      <FaqCarousel 
        faqs={AFFILIATE_FAQS}
        title="Frequent"
        accentTitle="Inquiries"
        description="Everything you need to know about cookies, payouts, and our tiered commission structure."
        theme="light"
      />

      {/* 5. CTA */}
      <section className="bg-cream-sand py-32 px-6 text-center">
        <FadeUp>
          <h2 className="text-editorial-lg font-serif text-ink mb-6">Ready to scale your influence?</h2>
          <p className="text-body-lg text-ink-muted mb-10 max-w-prose mx-auto">
            Applications are reviewed on a rolling basis. Partner with a lab that prioritizes verifiable purity and consistent results.
          </p>
          <Link href="/affiliates/apply">
            <Button variant="dark" size="lg">Submit Application</Button>
          </Link>
        </FadeUp>
      </section>
    </main>
  )
}
