'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'

const PILLARS = [
  {
    id: '01',
    title: 'Independent Testing',
    desc: 'Every single batch is tested by accredited US-based third-party laboratories via HPLC & Mass Spectrometry before it is ever made available for research.',
    image: '/Featured%20Images/scientist-at-microscope.webp'
  },
  {
    id: '02',
    title: '≥99% Purity Guarantee',
    desc: 'We enforce a strict 99% purity floor across our entire catalog. If a batch tests at 98.9%, it is discarded. There are no exceptions to this standard.',
    image: '/Featured%20Images/clear-glass-dropper.webp'
  },
  {
    id: '03',
    title: 'USA Fulfillment',
    desc: 'Our compounds are stocked securely in domestic, climate-controlled facilities. We fulfill and ship all orders directly from the United States for rapid delivery.',
    image: '/Featured%20Images/three-floating-vials.webp'
  },
  {
    id: '04',
    title: 'Lyophilized Stability',
    desc: 'Compounds are rigorously lyophilized and vacuum-sealed to prevent degradation, ensuring structural integrity from our laboratory to yours.',
    image: '/Featured%20Images/crushed-white-powder.webp'
  }
]

export function WhyChooseUs() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PILLARS.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [activeIndex, isPaused])

  return (
    <section className="py-16 lg:py-32 px-4 sm:px-6 bg-[#f8fafd] text-ink relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.5fr_1fr] gap-8 lg:gap-24 items-start relative">
          
          {/* Left Side: Dynamic Image Slider (Desktop & Mobile) */}
          <div className="lg:sticky lg:top-32 h-[300px] md:h-[400px] lg:h-[75vh] w-full relative rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-slate-100 z-10 order-1">
            <motion.div 
              className="absolute inset-0 w-full h-full flex flex-col"
              animate={{ y: `-${activeIndex * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {PILLARS.map((pillar, index) => (
                <div key={index} className="w-full h-full relative shrink-0">
                  <Image 
                    src={pillar.image} 
                    alt={pillar.title} 
                    fill 
                    className="object-cover" 
                  />
                  {/* Subtle overlay to ensure it feels premium */}
                  <div className="absolute inset-0 bg-ink/5 mix-blend-overlay" />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Side: Content & Interaction */}
          <div className="flex flex-col w-full h-full z-20 order-2">
            
            <FadeUp>
              <h2 className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-[#5984c4] mb-6 lg:mb-12 font-bold mt-4 lg:mt-0">The Gold Standard</h2>
            </FadeUp>
            
            {/* Top area: Dynamic Content */}
            <div className="relative min-h-[240px] md:min-h-[160px] lg:min-h-[220px] mb-4 lg:mb-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full"
                >
                  <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-3 md:mb-4 lg:mb-6 tracking-tight leading-[1.1] text-ink">
                    {PILLARS[activeIndex].title}
                  </h3>
                  <p className="text-base lg:text-lg text-ink/70 leading-relaxed font-light max-w-lg">
                    {PILLARS[activeIndex].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom area: Hoverable List */}
            <div 
              className="flex flex-col w-full mt-auto"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <FadeUp delay={0.2}>
                <div className="border-t border-slate-200" />
                {PILLARS.map((pillar, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={pillar.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => setActiveIndex(index)}
                      className="group border-b border-slate-200 py-4 lg:py-8 flex items-center justify-between text-left transition-colors duration-500 hover:border-[#5984c4]/30 w-full"
                    >
                      <span className={`text-xl md:text-2xl lg:text-3xl font-serif tracking-tight transition-colors duration-500 pr-4 ${isActive ? 'text-[#5984c4]' : 'text-ink/50 group-hover:text-ink/80'}`}>
                        {pillar.title}
                      </span>
                      
                      {/* Interactive Arrow Indicator */}
                      <motion.div 
                        initial={false}
                        animate={{ 
                          rotate: isActive ? 0 : -45,
                          x: isActive ? 0 : -8,
                          opacity: isActive ? 1 : 0.3
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-[#5984c4] shrink-0"
                      >
                        <svg width="20" height="20" className="lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </motion.div>
                    </button>
                  )
                })}
              </FadeUp>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
