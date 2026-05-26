'use client'

import React from 'react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { RevealText } from '@/components/motion/RevealText'
import { ParallaxImage } from '@/components/motion/ParallaxImage'
import { MagneticHover } from '@/components/motion/MagneticHover'
import { motion } from 'framer-motion'

export default function TestMotionPage() {
  return (
    <div className="bg-cream text-ink min-h-screen py-32 overflow-hidden">
      <Container size="page" className="space-y-48">
        
        {/* Reveal Text Test */}
        <section>
          <div className="mb-4">
            <span className="text-label-md text-gold tracking-wider uppercase font-sans">01 / Reveal Text</span>
          </div>
          <RevealText 
            lines={['Effortless motion.', 'Documented purity.']} 
            className="text-display-xl font-display text-ink"
            baseDelay={0.2}
          />
        </section>

        {/* Magnetic Hover Test */}
        <section>
          <div className="mb-8">
            <span className="text-label-md text-gold tracking-wider uppercase font-sans">02 / Magnetic Hover</span>
          </div>
          <MagneticHover className="w-fit" strength={0.4}>
            <Button size="lg" variant="dark">Hover Over Me</Button>
          </MagneticHover>
        </section>

        {/* Staggered Children Test */}
        <section>
          <div className="mb-12">
            <span className="text-label-md text-gold tracking-wider uppercase font-sans">03 / Staggered Entrance</span>
          </div>
          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <motion.div key={item} variants={staggerItemVariants}>
                <div className="h-64 bg-cream-warm border border-default rounded-md flex items-center justify-center">
                  <span className="text-ink-muted text-display-sm font-display">{item}</span>
                </div>
              </motion.div>
            ))}
          </StaggerChildren>
        </section>

        {/* Fade Up Test */}
        <section>
          <div className="mb-8">
            <span className="text-label-md text-gold tracking-wider uppercase font-sans">04 / Fade Up</span>
          </div>
          <FadeUp delay={0.2} distance={40}>
            <p className="text-body-lg max-w-prose">
              This paragraph gently fades up as it comes into view. The motion should feel confident and use an ease-out timing curve.
            </p>
          </FadeUp>
        </section>

        {/* Parallax Test */}
        <section className="pb-32">
          <div className="mb-8">
            <span className="text-label-md text-gold tracking-wider uppercase font-sans">05 / Parallax Image</span>
          </div>
          <div className="h-[60vh] w-full rounded-md overflow-hidden relative border border-default">
            <ParallaxImage 
              src="/hero-image.png"
              alt="Test Parallax"
              className="absolute inset-0 w-full h-full"
              intensity={0.2}
            />
          </div>
        </section>

      </Container>
    </div>
  )
}
