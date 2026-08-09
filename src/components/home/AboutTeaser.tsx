'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PackageCheck, Snowflake, ShieldCheck, Users } from 'lucide-react'

export function AboutTeaser() {
  const containerRef = useRef<HTMLElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"])
  const fgFocusY = useTransform(scrollYProgress, [0, 1], ["15%", "-15%"])
  const fgBlurY = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"])

  return (
    <div className="w-full mx-auto my-16 md:my-24">
      <section ref={containerRef} className="relative w-full max-w-[96%] mx-auto min-h-[90vh] md:min-h-[95vh] py-20 lg:py-0 overflow-hidden bg-white flex items-center justify-center rounded-[2.5rem] shadow-2xl border border-slate-100">
        
        {/* 1. Deep Background Layer */}
        <motion.div 
          style={{ y: bgY, willChange: 'transform' }}
          className="absolute inset-[-20%] w-[140%] h-[140%] z-0"
        >
          <Image 
            src="/Featured%20Images/scientist-at-microscope.webp"
            alt="US-based peptide synthesis facility — ISO-certified laboratory where Longevia Research compounds are produced"
            fill
            className="object-cover opacity-100"
          />
          {/* Light color overlay to soften the image */}
          <div className="absolute inset-0 bg-white/10" />
          {/* Sky blue color tint overlay */}
          <div className="absolute inset-0 bg-[#5984c4]/20 mix-blend-color" />
          {/* Vignette & Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
        </motion.div>

        {/* 4. Extreme Foreground Blur Layer (Left Side, huge scale, blurred, placed BEHIND text for depth) */}
        <motion.div 
          style={{ y: fgBlurY, willChange: 'transform' }}
          className="absolute top-[-10%] left-[-30%] sm:left-[-15%] md:left-[-5%] w-[80vw] max-w-[600px] aspect-[1/2.2] z-0 pointer-events-none opacity-40 rotate-12 transform-gpu"
        >
          <Image 
            src="/New Images/longevia-vial.webp"
            alt="Close-up of lyophilized research peptide vial with focus blur - Longevia Research"
            fill
            className="object-contain blur-xl opacity-20 transform-gpu"
          />
        </motion.div>

        {/* 2. Middle Layer: Huge Typography */}
        <motion.div 
          style={{ y: textY, willChange: 'transform' }}
          className="relative z-10 w-full flex flex-col items-center justify-center text-center px-6 pointer-events-none transform-gpu"
        >
          <span className="text-label-md uppercase tracking-widest text-[#2563EB] mb-6 md:mb-8 block font-bold">
            THE LAB
          </span>
          <h2 className="text-[10vw] sm:text-[8vw] md:text-[6vw] font-display text-ink leading-[0.9] tracking-tight max-w-[95%] md:max-w-[70%] drop-shadow-sm">
            Our Commitment to Researchers
          </h2>
          
          <div className="mt-10 md:mt-14 w-full max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-4">
            
            <div className="flex flex-col items-start text-left p-6 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-4 text-[#5984c4] group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-500 shadow-sm">
                <PackageCheck size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-[12px] md:text-[13px] font-bold tracking-widest uppercase text-ink mb-2">Immediate Availability</h4>
              <p className="text-sm opacity-80 leading-relaxed text-ink/80">Top research peptides are ready to ship. No backorders. No waiting. Fast shipping guaranteed.</p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-4 text-[#5984c4] group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-500 shadow-sm">
                <Snowflake size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-[12px] md:text-[13px] font-bold tracking-widest uppercase text-ink mb-2">Safe & Protected Shipping</h4>
              <p className="text-sm opacity-80 leading-relaxed text-ink/80">Cold-pack shipping keeps peptides stable. Full tracking provided on every USA order.</p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-4 text-[#5984c4] group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-500 shadow-sm">
                <ShieldCheck size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-[12px] md:text-[13px] font-bold tracking-widest uppercase text-ink mb-2">99%+ Purity Guaranteed</h4>
              <p className="text-sm opacity-80 leading-relaxed text-ink/80">Every batch is tested by U.S. ISO Labs, with a full Certificate of Analysis Included.</p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/60 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-4 text-[#5984c4] group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-500 shadow-sm">
                <Users size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-[12px] md:text-[13px] font-bold tracking-widest uppercase text-ink mb-2">Researcher Community</h4>
              <p className="text-sm opacity-80 leading-relaxed text-ink/80">Connect with researchers, share peer insights, and discuss peptide research applications.</p>
            </div>

          </div>
          
          <div className="pointer-events-auto mt-10 md:mt-12">
            <Button variant="outline" asChild className="border-slate-300 text-ink hover:bg-[#5984c4] hover:text-white hover:border-[#5984c4] rounded-[1.5rem] px-8 py-6 backdrop-blur-md transition-all duration-300 uppercase tracking-widest text-[10px] font-bold shadow-sm transform-gpu">
              <Link href="/about">Read About Us →</Link>
            </Button>
          </div>
        </motion.div>

        {/* 3. Foreground Focus Layer (Right Side) */}
        <motion.div 
          style={{ y: fgFocusY, willChange: 'transform' }}
          className="absolute bottom-[-20%] right-[-25%] md:right-[-15%] xl:right-[-10%] 2xl:right-[-5%] w-[30vw] max-w-[200px] md:max-w-[250px] 2xl:max-w-[350px] aspect-[1/2.2] z-20 pointer-events-none drop-shadow-2xl -rotate-6 transform-gpu"
        >
          <Image 
            src="/New Images/longevia-vial.webp"
            alt="High purity research peptide vial ready for reconstitution - Longevia Research"
            fill
            className="object-contain drop-shadow-xl transform-gpu"
          />
        </motion.div>

      </section>

      {/* Proof Points Grid (Added for SEO Strategy) */}
      <section className="w-full max-w-[90%] mx-auto mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 relative z-10 px-4">
        
        <div className="flex flex-col text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-[#5984c4]/10 flex items-center justify-center mb-6 mx-auto md:mx-0">
            <span className="text-[#2563EB] font-bold">01</span>
          </div>
          <h3 className="text-xl font-display font-bold text-ink mb-4">
            ≥99% HPLC Purity — Every Batch, No Exceptions
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            High-Performance Liquid Chromatography (HPLC) testing is performed on every production batch. Any sample failing to meet our strict 99% purity threshold is immediately discarded — never sold.
          </p>
        </div>

        <div className="flex flex-col text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-[#5984c4]/10 flex items-center justify-center mb-6 mx-auto md:mx-0">
            <span className="text-[#2563EB] font-bold">02</span>
          </div>
          <h3 className="text-xl font-display font-bold text-ink mb-4">
            LC-MS Verified Peptide Identity
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Mass spectrometry (LC-MS) confirms the exact molecular weight and identity of every compound we ship. You receive the peptide on the label, exactly as described.
          </p>
        </div>

        <div className="flex flex-col text-center md:text-left">
          <div className="w-12 h-12 rounded-full bg-[#5984c4]/10 flex items-center justify-center mb-6 mx-auto md:mx-0">
            <span className="text-[#2563EB] font-bold">03</span>
          </div>
          <h3 className="text-xl font-display font-bold text-ink mb-4">
            COA with Every Order — Full Transparency
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Every order ships with a lot-specific Certificate of Analysis (COA) traceable to its independent test results. Our full COA library is publicly accessible at any time.
          </p>
        </div>

      </section>
    </div>
  )
}
