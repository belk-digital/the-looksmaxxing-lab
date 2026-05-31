'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { motion, useSpring, useTransform } from 'framer-motion'
import { CheckCircle2, ShieldCheck, FileSearch, ArrowUpRight } from 'lucide-react'

// Reusable Metric Card component for both mobile and desktop layouts
const MetricCard = ({ icon, title, desc, className = '' }: { icon: React.ReactNode, title: string, desc: string, className?: string }) => (
  <div className={`bg-white/5 border border-white/10 backdrop-blur-md p-5 lg:p-6 rounded-2xl w-full lg:w-[240px] shadow-2xl hover:border-gold/30 hover:bg-white/10 group-hover:border-gold/30 group-hover:bg-white/10 transition-colors duration-500 ${className}`}>
    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h4 className="text-sm font-bold uppercase tracking-wider mb-2 text-white">{title}</h4>
    <p className="text-xs text-cream/50 leading-relaxed">{desc}</p>
  </div>
)

export function CoaSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Create a mouse-tracking effect for the 3D vial
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePosition({ x, y })
  }

  // Smooth springs for mouse movement
  const springConfig = { damping: 20, stiffness: 50, mass: 1 }
  const rotateX = useSpring(mousePosition.y * 30, springConfig)
  const rotateY = useSpring(mousePosition.x * -30, springConfig)
  
  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
      className="relative w-full bg-ink text-cream py-24 lg:py-48 overflow-hidden z-10"
    >
       {/* Background ambient glow */}
       <div className="absolute top-[20%] lg:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-gold/10 rounded-full blur-[80px] lg:blur-[100px] pointer-events-none" />
       
       <Container size="wide" className="relative z-10">
         
         {/* Header */}
         <div className="text-center mb-8 lg:mb-16">
            <FadeUp>
              <span className="text-label-md uppercase tracking-widest text-gold mb-4 lg:mb-6 block font-bold">
                ABSOLUTE TRANSPARENCY
              </span>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-[12vw] md:text-5xl lg:text-7xl font-display leading-[0.9] tracking-tight text-white">
                Verified purity.<br/>Every single batch.
              </h2>
            </FadeUp>
         </div>

         {/* Interactive Arena (Vial & Desktop HUD) */}
         <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[700px] flex items-center justify-center">
            
            {/* The Central "Hologram" Vial */}
            <motion.div 
              style={{ rotateX, rotateY }}
              className="relative w-[140px] sm:w-[180px] lg:w-[300px] aspect-[1/2.2] z-20 pointer-events-none perspective-[1000px]"
            >
               <Image 
                 src="/temp-homepage/hero-vial-image.webp"
                 alt="Premium Peptide Vial"
                 fill
                 className="object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.15)] lg:drop-shadow-[0_0_60px_rgba(212,175,55,0.15)]"
                 priority
               />
               <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent mix-blend-overlay" />
            </motion.div>

            {/* Desktop HUD: Metric 1 (Middle Left) */}
            <FadeUp delay={0.2} className="hidden lg:block absolute top-[40%] left-[5%] xl:left-[10%] right-[50%] z-30">
               <div className="relative group cursor-default w-full flex justify-start">
                  <div className="absolute top-1/2 left-[240px] right-[150px] h-[1px] bg-gold/30 group-hover:bg-gold/60 transition-colors duration-500 z-0" />
                  <MetricCard 
                    icon={<CheckCircle2 className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                    title="≥99% HPLC Purity"
                    desc="Stringent baseline isolation for all compounds."
                    className="relative z-10 shrink-0 mx-0"
                  />
               </div>
            </FadeUp>

            {/* Desktop HUD: Metric 2 (Top Right) */}
            <FadeUp delay={0.3} className="hidden lg:block absolute top-[15%] right-[5%] xl:right-[10%] left-[50%] z-30">
               <div className="relative group cursor-default w-full flex justify-end">
                  <div className="absolute top-1/2 left-[150px] right-[240px] h-[1px] bg-gold/30 group-hover:bg-gold/60 transition-colors duration-500 z-0" />
                  <MetricCard 
                    icon={<FileSearch className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                    title="Mass Spectrometry"
                    desc="Exact molecular weight verification via LC-MS."
                    className="relative z-10 shrink-0 mx-0"
                  />
               </div>
            </FadeUp>

            {/* Desktop HUD: Metric 3 (Bottom Right) */}
            <FadeUp delay={0.4} className="hidden lg:block absolute bottom-[20%] right-[5%] xl:right-[10%] left-[50%] z-30">
               <div className="relative group cursor-default w-full flex justify-end">
                  <div className="absolute top-1/2 left-[150px] right-[240px] h-[1px] bg-gold/30 group-hover:bg-gold/60 transition-colors duration-500 z-0" />
                  <MetricCard 
                    icon={<ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                    title="Endotoxin Free"
                    desc="Ensuring absolute biological safety and sterility."
                    className="relative z-10 shrink-0 mx-0"
                  />
               </div>
            </FadeUp>

         </div>

         {/* Mobile Metrics Stack */}
         <div className="flex lg:hidden flex-col gap-4 w-full max-w-sm mx-auto mt-8 relative z-30 px-4">
            <FadeUp delay={0.2}>
              <MetricCard 
                icon={<CheckCircle2 className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                title="≥99% HPLC Purity"
                desc="Stringent baseline isolation for all compounds."
              />
            </FadeUp>
            <FadeUp delay={0.3}>
              <MetricCard 
                icon={<FileSearch className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                title="Mass Spectrometry"
                desc="Exact molecular weight verification via LC-MS."
              />
            </FadeUp>
            <FadeUp delay={0.4}>
              <MetricCard 
                icon={<ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />}
                title="Endotoxin Free"
                desc="Ensuring absolute biological safety and sterility."
              />
            </FadeUp>
         </div>

         {/* Call to action */}
         <div className="mt-12 lg:mt-16 flex justify-center px-4">
           <FadeUp delay={0.5}>
             <button className="group bg-transparent border border-cream/30 text-cream hover:bg-cream hover:text-ink rounded-full px-6 lg:px-8 py-4 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-3">
               VIEW COA LIBRARY
               <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
             </button>
           </FadeUp>
         </div>

       </Container>
    </section>
  )
}
