'use client'

import React from 'react'
import { FadeUp } from '@/components/motion/FadeUp'
import { ParallaxImage } from '@/components/motion/ParallaxImage'
import { Button } from '@/components/ui/button'

export function AboutTeaser() {
  return (
    <section className="w-full py-32">
      <div className="relative w-full overflow-hidden">
        
        {/* Parallax Image Background */}
        <ParallaxImage 
          src="/temp-products/about-lifestyle.png"
          alt="The Looksmaxxing Lab Facility"
          intensity={0.15}
          className="w-full aspect-[4/5] md:aspect-[16/9]"
        />

        {/* Content Overlay */}
        <div className="absolute inset-x-4 bottom-4 md:inset-auto md:bottom-12 md:left-12 max-w-[480px] mx-auto md:mx-0 bg-cream/95 backdrop-blur-md p-8 md:p-12 rounded-md shadow-lg">
          <FadeUp>
            <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">
              THE LAB
            </span>
          </FadeUp>
          
          <FadeUp delay={0.1}>
            <h2 className="text-display-sm font-display text-ink mb-6">
              Considered compounds for considered research.
            </h2>
          </FadeUp>
          
          <FadeUp delay={0.2}>
            <p className="text-body-md text-ink-muted mb-8 leading-relaxed">
              We synthesize ultra-pure peptides in sterile, state-of-the-art facilities. 
              Every batch is subjected to rigorous third-party LC-MS analysis to verify 
              potency and identity before it reaches your bench.
            </p>
          </FadeUp>
          
          <FadeUp delay={0.3}>
            <Button variant="secondary">
              Read About Us →
            </Button>
          </FadeUp>
        </div>
        
      </div>
    </section>
  )
}
