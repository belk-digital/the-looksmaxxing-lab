'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function AboutTeaser() {
  const containerRef = useRef<HTMLElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Deep Background Layer (moves very slowly)
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"])
  
  // Mid Text Layer (moves slightly faster)
  const textY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])
  
  // Foreground Focus Layer (moves fast)
  const fgFocusY = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"])
  
  // Extreme Foreground Blur Layer (moves extremely fast)
  const fgBlurY = useTransform(scrollYProgress, [0, 1], ["80%", "-80%"])

  return (
    <div className="w-full max-w-[96%] mx-auto my-16 md:my-24">
      <section ref={containerRef} className="relative w-full h-[85vh] md:h-[95vh] overflow-hidden bg-ink flex items-center justify-center rounded-[2.5rem] shadow-2xl">
        
        {/* 1. Deep Background Layer */}
        <motion.div 
          style={{ y: bgY }}
          className="absolute inset-[-20%] w-[140%] h-[140%] z-0"
        >
          <Image 
            src="/temp-products/about-lifestyle.png"
            alt="The Looksmaxxing Lab Facility"
            fill
            className="object-cover opacity-40 mix-blend-luminosity"
          />
          {/* Vignette & Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/80" />
        </motion.div>

        {/* 4. Extreme Foreground Blur Layer (Left Side, huge scale, blurred, placed BEHIND text for depth) */}
        <motion.div 
          style={{ y: fgBlurY }}
          className="absolute top-[-10%] left-[-30%] sm:left-[-15%] md:left-[-5%] w-[80vw] max-w-[600px] aspect-[1/2.2] z-0 pointer-events-none opacity-40 rotate-12"
        >
          <Image 
            src="/temp-homepage/hero-vial-image.webp"
            alt="Foreground Blur Vial"
            fill
            className="object-contain blur-2xl"
          />
        </motion.div>

        {/* 2. Middle Layer: Huge Typography */}
        <motion.div 
          style={{ y: textY }}
          className="relative z-10 w-full flex flex-col items-center justify-center text-center px-6 pointer-events-none"
        >
          <span className="text-label-md uppercase tracking-widest text-gold mb-6 md:mb-8 block font-bold">
            THE LAB
          </span>
          <h2 className="text-[10vw] sm:text-[8vw] md:text-[6vw] font-display text-cream leading-[0.9] tracking-tight max-w-[95%] md:max-w-[70%] drop-shadow-2xl">
            Considered compounds for considered research.
          </h2>
          <p className="mt-8 text-cream/70 max-w-xl text-sm sm:text-base md:text-lg mx-auto leading-relaxed drop-shadow-md">
            We synthesize ultra-pure peptides in sterile, state-of-the-art facilities. 
            Every batch is subjected to rigorous third-party LC-MS analysis to verify 
            potency and identity before it reaches your bench.
          </p>
          <Button variant="outline" className="mt-10 border-white/20 text-white hover:bg-white hover:text-ink pointer-events-auto rounded-[1.5rem] px-8 py-6 backdrop-blur-md">
            Read About Us
          </Button>
        </motion.div>

        {/* 3. Foreground Focus Layer (Right Side) */}
        <motion.div 
          style={{ y: fgFocusY }}
          className="absolute bottom-[-30%] right-[-10%] sm:right-0 md:right-[5%] lg:right-[10%] w-[50vw] max-w-[400px] aspect-[1/2.2] z-20 pointer-events-none drop-shadow-2xl -rotate-6"
        >
          <Image 
            src="/temp-homepage/hero-vial-image.webp"
            alt="Foreground Vial"
            fill
            className="object-contain"
          />
        </motion.div>

      </section>
    </div>
  )
}
