'use client'

import React, { useState, useRef } from 'react'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { ShieldCheck, Dna, Snowflake } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import Image from 'next/image'

const PILLARS = [
  {
    title: "US-Based Synthesis",
    description: "Every compound is strictly synthesized in US-based, ISO-certified laboratories. We do not source raw, untested powders from overseas. Our closed-loop supply chain ensures absolute traceability.",
    icon: Dna,
    image: "/temp-products/growth-factor.png"
  },
  {
    title: "99%+ Purity Floor",
    description: "We enforce a strict 99% purity minimum. Any batch testing below this threshold is immediately discarded. Every single vial is backed by independent LC-MS and HPLC testing.",
    icon: ShieldCheck,
    image: "/temp-products/bpc-157.png"
  },
  {
    title: "Cold-Chain Logistics",
    description: "Peptides are fragile. We store all inventory in climate-controlled, medical-grade refrigeration units and utilize specialized packaging to maintain molecular integrity during transit.",
    icon: Snowflake,
    image: "/temp-products/tb-500.png"
  }
]

export function WhatSetsUsApart() {
  const containerRef = useRef<HTMLElement>(null)
  const [activeTab, setActiveTab] = useState(0)

  // Track scroll progress through this specific section for Desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Map scroll progress (0 to 1) into 3 distinct active states
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      setActiveTab(0)
    } else if (latest >= 0.33 && latest < 0.66) {
      setActiveTab(1)
    } else {
      setActiveTab(2)
    }
  })

  return (
    <section ref={containerRef} className="w-full h-auto lg:h-[250vh] bg-white relative z-10 border-y border-ink/5">
      
      {/* ----------------------------- */}
      {/* DESKTOP LAYOUT (Sticky Scroll) */}
      {/* ----------------------------- */}
      <div className="hidden lg:flex sticky top-0 h-screen w-full flex-col justify-center overflow-hidden">
        <Container size="wide">
          <div className="flex flex-row gap-16 xl:gap-24 items-center">
            
            {/* Left Column: Headers & Tabs */}
            <div className="w-5/12 flex flex-col">
              <FadeUp>
                <span className="text-label-md uppercase tracking-widest text-gold mb-4 block font-bold">
                  THE LOOKSMAXXING STANDARD
                </span>
              </FadeUp>
              <FadeUp delay={0.1}>
                <h2 className="text-[4rem] font-display text-ink leading-[0.9] tracking-tight mb-6">
                  Not all compounds<br/>are created equal.
                </h2>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="text-body-md text-ink/70 leading-relaxed mb-12 max-w-md">
                  We operate at the bleeding edge of aesthetic science. Our commitment to uncompromised quality translates into repeatable, verifiable research results.
                </p>
              </FadeUp>

              {/* Passive Scroll Indicators */}
              <div className="flex flex-col gap-2 relative">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ink/5" />
                
                {PILLARS.map((pillar, idx) => {
                  const isActive = activeTab === idx
                  return (
                    <div 
                      key={idx}
                      className={`relative text-left flex items-center py-5 pl-8 transition-all duration-500 ${isActive ? 'text-ink' : 'text-ink/20'}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeScrollIndicator"
                          className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <h3 className="text-3xl font-display tracking-tight">
                        {pillar.title}
                      </h3>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Dynamic Display Area */}
            <div className="w-7/12">
              <FadeUp delay={0.3} className="w-full h-full">
                <div className="relative w-full h-[600px] rounded-[2rem] bg-ink overflow-hidden shadow-2xl flex flex-col justify-end">
                  
                  {/* Background Imagery Crossfade */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0"
                    >
                      {/* Lighter bottom gradient to ensure text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent z-20 pointer-events-none" />
                      
                      <Image 
                        src={PILLARS[activeTab].image}
                        alt={PILLARS[activeTab].title}
                        fill
                        className="object-cover opacity-90"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Content Overlay */}
                  <div className="relative z-30 p-12 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-md"
                      >
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
                          {React.createElement(PILLARS[activeTab].icon, {
                            className: "w-6 h-6 text-gold",
                            strokeWidth: 1.5
                          })}
                        </div>
                        <p className="text-cream leading-relaxed text-lg">
                          {PILLARS[activeTab].description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                </div>
              </FadeUp>
            </div>

          </div>
        </Container>
      </div>

      {/* ----------------------------- */}
      {/* MOBILE/TABLET LAYOUT (Static) */}
      {/* ----------------------------- */}
      <div className="flex lg:hidden flex-col w-full py-16 sm:py-24">
        <Container size="wide">
          
          <div className="flex flex-col mb-12">
            <FadeUp>
              <span className="text-label-md uppercase tracking-widest text-gold mb-4 block font-bold">
                THE LOOKSMAXXING STANDARD
              </span>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-[10vw] sm:text-display-sm font-display text-ink leading-[0.9] tracking-tight mb-6">
                Not all compounds<br/>are created equal.
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-body-md text-ink/70 leading-relaxed max-w-md">
                We operate at the bleeding edge of aesthetic science. Our commitment to uncompromised quality translates into repeatable, verifiable research results.
              </p>
            </FadeUp>
          </div>

          <div className="flex flex-col gap-6 sm:gap-8">
            {PILLARS.map((pillar, idx) => (
              <FadeUp key={idx} delay={0.2 + (idx * 0.1)}>
                <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] rounded-[2rem] bg-ink overflow-hidden shadow-xl flex flex-col justify-end">
                  
                  {/* Background Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent z-20 pointer-events-none" />
                  <Image 
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover opacity-90"
                  />
                  
                  {/* Content Overlay */}
                  <div className="relative z-30 p-6 sm:p-8 w-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20">
                      <pillar.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-display text-white mb-3 tracking-tight drop-shadow-md">
                      {pillar.title}
                    </h3>
                    <p className="text-cream leading-relaxed text-sm sm:text-base drop-shadow-md">
                      {pillar.description}
                    </p>
                  </div>
                  
                </div>
              </FadeUp>
            ))}
          </div>

        </Container>
      </div>
      
    </section>
  )
}
