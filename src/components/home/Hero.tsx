'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { RevealText } from '@/components/motion/RevealText'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'

export function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      
      {/* Desktop Video Background */}
      <motion.video
        src="/hero.webm"
        poster="/hero-image.png"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
      />

      {/* Mobile Image Background */}
      <motion.div
        className="md:hidden absolute inset-0 w-full h-full bg-ink"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <Image 
          src="/hero-image.png" 
          alt="Looksmaxxing Lab" 
          fill
          className="object-cover" 
          priority
        />
      </motion.div>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-ink/20 bg-gradient-to-b from-transparent via-ink/10 to-ink/60" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-32">
        <Container size="wide">
          <div className="max-w-3xl flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-label-md uppercase tracking-wider text-cream/70 mb-4 block">
              RESEARCH USE ONLY
            </span>
            
            <RevealText
              lines={['Research-grade peptides.', 'Documented purity.']}
              baseDelay={0.4}
              className="text-display-lg md:text-display-xl font-display text-cream"
            />
            
            <FadeUp delay={0.8}>
              <p className="text-body-lg text-cream/80 mt-6 max-w-md mx-auto md:mx-0">
                Where biotechnology meets ritual.
              </p>
            </FadeUp>
            
            <StaggerChildren staggerDelay={0.08} initialDelay={1.0} className="flex flex-col md:flex-row gap-3 md:gap-4 mt-10 w-full md:w-auto">
              <motion.div variants={staggerItemVariants} className="w-full md:w-auto">
                <Button variant="primary" size="lg" className="w-full md:w-auto">
                  View Collection
                </Button>
              </motion.div>
              <motion.div variants={staggerItemVariants} className="w-full md:w-auto flex justify-center">
                <Button 
                  variant="link" 
                  size="lg" 
                  className="w-fit text-cream hover:text-cream/80"
                >
                  The Science →
                </Button>
              </motion.div>
            </StaggerChildren>
            
          </div>
        </Container>
      </div>
      
    </section>
  )
}
