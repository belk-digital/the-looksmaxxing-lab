'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { CheckCircle2, ShieldCheck, FileSearch, ArrowUpRight, FlaskConical, Activity, Eye, BadgeCheck } from 'lucide-react'

// Desktop Animated HUD Card
const AnimatedHUDCard = ({
  icon, title, desc, direction, delay, positionClass, tooltip
}: {
  icon: React.ReactNode, title: string, desc: string, direction: 'left' | 'right', delay: number, positionClass: string, tooltip?: string
}) => {
  const isLeft = direction === 'left'
  
  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { 
      scaleX: 1, 
      opacity: 1,
      transition: { duration: 0.5, delay: delay, ease: [0.16, 1, 0.3, 1] as const } 
    }
  }

  // Wipe the box into existence from the side the line touches it
  const boxVariants = {
    hidden: { clipPath: isLeft ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', opacity: 0 },
    visible: { 
      clipPath: 'inset(0% 0% 0% 0%)',
      opacity: 1,
      transition: { duration: 0.6, delay: delay + 0.4, ease: [0.16, 1, 0.3, 1] as const }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, filter: 'blur(4px)', y: 5 },
    visible: { 
      opacity: 1, filter: 'blur(0px)', y: 0,
      transition: { duration: 0.5, delay: delay + 0.7, ease: "easeOut" as const } 
    }
  }

  return (
    <div className={`hidden lg:block absolute z-30 ${positionClass}`}>
       <motion.div 
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true, margin: "-10%" }}
         className={`relative group cursor-default w-full flex ${isLeft ? 'justify-start' : 'justify-end'}`}
       >
          {/* Connecting Line */}
          <motion.div 
            variants={lineVariants}
            style={{ transformOrigin: isLeft ? 'right center' : 'left center' }}
            className={`absolute top-1/2 h-[1px] bg-[#5984c4]/40 group-hover:bg-[#5984c4]/80 transition-colors duration-500 z-0 ${isLeft ? 'left-[240px] lg:right-[180px] xl:right-[200px]' : 'right-[240px] lg:left-[180px] xl:left-[200px]'}`} 
          >
            {/* Single dot at the start (closest to the vial) */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#5984c4]/80 group-hover:bg-[#5984c4] transition-colors duration-500 ${isLeft ? 'right-0' : 'left-0'}`} />
          </motion.div>
          
          {/* The Box */}
          <motion.div 
            variants={boxVariants}
            title={tooltip}
            className="relative z-10 shrink-0 mx-0 w-[240px] bg-white/80 border border-[#5984c4]/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Hover Effects */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white transition-colors duration-500 pointer-events-none" />
            <div className="absolute inset-0 border border-[#5984c4]/0 group-hover:border-[#5984c4]/50 rounded-2xl transition-colors duration-500 pointer-events-none" />
            
            {/* Inner Content */}
            <motion.div variants={contentVariants} className="p-5 lg:p-6 w-full h-full relative z-20">
              <div className="w-10 h-10 rounded-full bg-[#5984c4]/10 flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-ink">{title}</h3>
              <p className="text-xs text-ink/70 leading-relaxed">{desc}</p>
            </motion.div>
          </motion.div>
       </motion.div>
    </div>
  )
}

// Mobile Animated Metric Card
const MobileAnimatedCard = ({ icon, title, desc, delay, tooltip }: { icon: React.ReactNode, title: string, desc: string, delay: number, tooltip?: string }) => {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-5%" }}
      className="relative group cursor-default w-full"
    >
      <motion.div 
        variants={{
          hidden: { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
          visible: { 
            clipPath: 'inset(0% 0% 0% 0%)', opacity: 1,
            transition: { duration: 0.6, delay: delay, ease: [0.16, 1, 0.3, 1] as const }
          }
        }}
        title={tooltip}
        className="relative z-10 w-full bg-white/80 border border-[#5984c4]/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm"
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { 
              opacity: 1, y: 0,
              transition: { duration: 0.5, delay: delay + 0.3, ease: "easeOut" } 
            }
          }}
          className="p-5 w-full h-full relative z-20"
        >
          <div className="w-10 h-10 rounded-full bg-[#5984c4]/10 flex items-center justify-center mb-4">
            {icon}
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-ink">{title}</h3>
          <p className="text-xs text-ink/70 leading-relaxed">{desc}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}


export function CoaSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const springConfig = { damping: 20, stiffness: 50, mass: 1 }
  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX = useSpring(rawRotateX, springConfig)
  const rotateY = useSpring(rawRotateY, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rawRotateX.set(y * 30)
    rawRotateY.set(x * -30)
  }

  const handleMouseLeave = () => {
    rawRotateX.set(0)
    rawRotateY.set(0)
  }
  
  return (
      <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full bg-[#f8fafd] text-ink py-24 lg:py-48 overflow-hidden z-10"
    >
       {/* Aesthetic Ambient Background Glow */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[700px] lg:h-[700px] rounded-full bg-gradient-to-tr from-[#5984c4]/5 to-[#5984c4]/10 blur-[80px] lg:blur-[140px] translate-y-16 transform-gpu opacity-60" />
       </div>
       
       <Container size="wide" className="relative z-10">
         
         {/* Header */}
         <div className="text-center mb-8 lg:mb-16">
            <FadeUp>
              <span className="text-label-md uppercase tracking-widest text-[#5984c4] mb-4 lg:mb-6 block font-bold">
                ABSOLUTE TRANSPARENCY
              </span>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-[12vw] md:text-5xl lg:text-7xl font-display leading-[0.9] tracking-tight text-ink">
                7X Tested.<br/>On Every Single Batch.
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="mt-6 text-body-md text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Third-party purity verification is the cornerstone of research-grade compounds. Every vial we ship carries an independently verified COA that proves what is inside — not what we claim is inside. Here is exactly what we test for, and why it matters.
              </p>
            </FadeUp>
         </div>

         {/* Interactive Arena (Vial & Desktop HUD) */}
         <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[900px] xl:h-[1000px] flex items-center justify-center">
            
            {/* The Central "Hologram" Vial */}
            <motion.div 
              style={{ rotateX, rotateY }}
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative w-[140px] sm:w-[180px] lg:w-[360px] xl:w-[400px] aspect-[1/2.2] z-20 pointer-events-none perspective-[1000px]"
            >
               <Image 
                 src="/New Images/longevia-vial.webp"
                 alt="Single precision research peptide vial with Certificate of Analysis document — Longevia Research"
                 fill
                 className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.4)]"
                 priority
               />
            </motion.div>

            {/* Desktop HUD: Metric 1 (Left 1) */}
            <AnimatedHUDCard 
              direction="left"
              delay={0.1}
              positionClass="top-[5%] left-[2%] xl:left-[8%] right-[50%]"
              icon={<CheckCircle2 className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="≥99% HPLC PURITY ANALYSIS"
              desc="Stringent chromatographic isolation for every compound – verified before any order ships."
            />

            {/* Desktop HUD: Metric 2 (Right 1) */}
            <AnimatedHUDCard 
              direction="right"
              delay={0.2}
              positionClass="top-[15%] right-[2%] xl:right-[8%] left-[50%]"
              icon={<FileSearch className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="MASS SPECTROMETRY (LC-MS Identity)"
              desc="Confirms exact molecular match through mass spectrometry analysis."
            />

            {/* Desktop HUD: Metric 3 (Left 2) */}
            <AnimatedHUDCard 
              direction="left"
              delay={0.3}
              positionClass="top-[30%] left-[2%] xl:left-[8%] right-[50%]"
              icon={<ShieldCheck className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="ENDOTOXIN-FREE"
              desc="Limulus Amebocyte Lysate (LAL) testing confirms endotoxin levels are well below research-safe thresholds."
            />

            {/* Desktop HUD: Metric 4 (Right 2) */}
            <AnimatedHUDCard 
              direction="right"
              delay={0.4}
              positionClass="top-[45%] right-[2%] xl:right-[8%] left-[50%]"
              icon={<FlaskConical className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="STERILITY VERIFICATION"
              desc="Microbial sterility tests performed in ISO/IEC 17025 Lab."
            />

            {/* Desktop HUD: Metric 5 (Left 3) */}
            <AnimatedHUDCard 
              direction="left"
              delay={0.5}
              positionClass="top-[55%] left-[2%] xl:left-[8%] right-[50%]"
              icon={<Activity className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="CONTENT QUANTIFICATION"
              desc="Confirms labeled potency and concentration."
            />

            {/* Desktop HUD: Metric 6 (Right 3) */}
            <AnimatedHUDCard 
              direction="right"
              delay={0.6}
              positionClass="top-[75%] right-[2%] xl:right-[8%] left-[50%]"
              icon={<Eye className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="APPEARANCE & PHYSICAL CHECK"
              desc="Inspects visual quality and physical integrity."
            />

            {/* Desktop HUD: Metric 7 (Left 4) */}
            <AnimatedHUDCard 
              direction="left"
              delay={0.7}
              positionClass="top-[80%] left-[2%] xl:left-[8%] right-[50%]"
              icon={<BadgeCheck className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="ILS LAB"
              desc="Third Party Verified – Independently reviewed and verified by ILS Labs."
            />

         </div>

         {/* Mobile Metrics Stack */}
         <div className="flex lg:hidden flex-col gap-4 w-full max-w-sm mx-auto mt-8 relative z-30 px-4">
            <MobileAnimatedCard 
              delay={0.1}
              icon={<CheckCircle2 className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="≥99% HPLC PURITY ANALYSIS"
              desc="Stringent chromatographic isolation for every compound – verified before any order ships."
            />
            <MobileAnimatedCard 
              delay={0.2}
              icon={<FileSearch className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="MASS SPECTROMETRY (LC-MS Identity)"
              desc="Confirms exact molecular match through mass spectrometry analysis."
            />
            <MobileAnimatedCard 
              delay={0.3}
              icon={<ShieldCheck className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="ENDOTOXIN-FREE"
              desc="Limulus Amebocyte Lysate (LAL) testing confirms endotoxin levels are well below research-safe thresholds."
            />
            <MobileAnimatedCard 
              delay={0.4}
              icon={<FlaskConical className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="STERILITY VERIFICATION"
              desc="Microbial sterility tests performed in ISO/IEC 17025 Lab."
            />
            <MobileAnimatedCard 
              delay={0.5}
              icon={<Activity className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="CONTENT QUANTIFICATION"
              desc="Confirms labeled potency and concentration."
            />
            <MobileAnimatedCard 
              delay={0.6}
              icon={<Eye className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="APPEARANCE & PHYSICAL CHECK"
              desc="Inspects visual quality and physical integrity."
            />
            <MobileAnimatedCard 
              delay={0.7}
              icon={<BadgeCheck className="w-5 h-5 text-[#5984c4]" strokeWidth={1.5} />}
              title="ILS LAB"
              desc="Third Party Verified – Independently reviewed and verified by ILS Labs."
            />
         </div>

         {/* Call to action */}
         <div className="mt-12 lg:mt-16 flex flex-wrap justify-center gap-4 px-4">
           <FadeUp delay={1.2}>
             <a href="/certificates" className="group bg-transparent border border-[#5984c4]/30 text-ink hover:bg-[#5984c4] hover:border-[#5984c4] hover:text-white rounded-full px-6 lg:px-8 py-4 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-3">
               VIEW COA LIBRARY
               <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
             </a>
           </FadeUp>
           <FadeUp delay={1.3}>
             <a href="/journal/peptide-coa-hplc-purity-testing-guide" className="group bg-transparent border border-ink/10 text-ink hover:bg-ink hover:border-ink hover:text-white rounded-full px-6 lg:px-8 py-4 uppercase tracking-widest text-[10px] md:text-xs font-bold transition-all duration-300 flex items-center gap-3">
               HOW TO READ A COA
               <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
             </a>
           </FadeUp>
         </div>

       </Container>
    </section>
  )
}
