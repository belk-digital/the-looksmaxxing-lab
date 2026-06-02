'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, ShieldCheck, Microscope, Truck, Search, FlaskConical } from 'lucide-react'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'

const ABOUT_FAQS: FaqItem[] = [
  {
    question: "Are your products intended for human consumption?",
    answer: "No. All products sold by The Looks Maxxing Lab are strictly for laboratory research purposes only. They are not intended for human consumption, diagnostic, or therapeutic use. Buyers must be qualified researchers."
  },
  {
    question: "Do you provide Certificates of Analysis (COA)?",
    answer: "Yes, absolute transparency is our philosophy. We utilize independent, US-based third-party laboratories to conduct HPLC and LC-MS testing. Relevant COAs are available on our product pages and included with orders to verify \u226599% purity."
  },
  {
    question: "Where do you ship from?",
    answer: "All of our inventory is securely stored and shipped directly from our fulfillment centers located within the United States, ensuring rapid, reliable delivery without customs delays for domestic researchers."
  },
  {
    question: "How should I store the lyophilized peptides?",
    answer: "Prior to reconstitution, lyophilized (freeze-dried) peptides should be stored in a freezer at -20\u00B0C or below for long-term stability. Short-term transit at room temperature does not degrade the compound due to the lyophilization process."
  }
];

export default function AboutPage() {
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);
  const capabilitiesRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress: capabilitiesScroll } = useScroll({
    target: capabilitiesRef,
    offset: ["start start", "end end"]
  });
  
  useMotionValueEvent(capabilitiesScroll, "change", (latest) => {
    if (latest < 0.33) {
      if (activeServiceIndex !== 0) setActiveServiceIndex(0);
    } else if (latest < 0.66) {
      if (activeServiceIndex !== 1) setActiveServiceIndex(1);
    } else {
      if (activeServiceIndex !== 2) setActiveServiceIndex(2);
    }
  });

  const capabilitiesX = useTransform(capabilitiesScroll, [0, 1], ["10%", "-20%"]);

  const services = [
    {
      id: "01",
      title: "Retail Research Peptides",
      desc: "A comprehensive library of meticulously synthesized peptides available for immediate dispatch in single or multi-vial quantities.",
      image: "/hero-image.png"
    },
    {
      id: "02",
      title: "Wholesale & Bulk Sourcing",
      desc: "Tailored pricing and dedicated supply chains for institutional buyers requiring significant volumes and guaranteed consistency.",
      image: "/hero-image.png"
    },
    {
      id: "03",
      title: "Custom Synthesis Inquiries",
      desc: "Capabilities to facilitate custom sequence synthesis for specialized or novel research applications upon request.",
      image: "/hero-image.png"
    }
  ];

  return (
    <main className="bg-white min-h-screen">
      
      {/* 1. Window to the Lab Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[100dvh] flex flex-col items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden bg-white">
        
        {/* Background Marquee */}
        <div className="absolute bottom-4 left-0 w-full overflow-hidden whitespace-nowrap flex z-0 pointer-events-none">
          <div className="animate-marquee flex items-center whitespace-nowrap w-max opacity-[0.04]">
              {Array(4).fill(0).map((_, i) => (
                <span key={i} className="text-[12vw] lg:text-[7vw] xl:text-[5vw] font-serif uppercase tracking-tighter mx-8 text-ink">
                  TRUSTED IN THE USA &bull; 99% PURITY &bull; 3RD PARTY TESTED &bull; 
                </span>
             ))}
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 h-full flex-1">
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-label-md uppercase tracking-widest text-ink/50 mb-4 sm:mb-8 font-bold"
          >
            Established 2024
          </motion.h2>

          {/* The Interactive Window */}
          <motion.div 
            initial={{ width: '90%', height: '40vh', borderRadius: '3rem' }}
            whileHover={{ width: '98%', height: '60vh', borderRadius: '1.5rem' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden shadow-2xl cursor-pointer group my-2 max-w-[1600px] w-full"
            style={{ width: '85%' }} // default width before hover
          >
             <motion.div 
               className="w-full relative"
               style={{ height: '150%', top: '-25%', y: heroImageY }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             >
               <Image 
                 src="/hero-image.png" 
                 alt="Laboratory environment" 
                 fill 
                 className="object-cover object-center"
                 priority
               />
               <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/10 transition-colors duration-700" />
             </motion.div>
             
             {/* Center Overlay Text inside Window */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.h1 
                  className="text-[18vw] lg:text-[10vw] font-serif text-white leading-none tracking-tight mix-blend-overlay opacity-90 drop-shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  THE LAB
                </motion.h1>
             </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-body-lg lg:text-xl text-ink-muted max-w-[720px] mx-auto text-center mt-6 sm:mt-12 leading-relaxed px-6"
          >
            We are a premier, US-based supplier dedicated to providing the global research community with uncompromising quality, rigorous third-party testing, and absolute transparency in peptide synthesis.
          </motion.p>

        </div>
      </section>

      {/* 2. Mission, Philosophy, Journey - Sticky Stack */}
      <section className="py-24 lg:py-48 px-6 bg-white relative">
        
        {/* Crisp Technical Geometry Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          
          {/* Subtle Dot Grid Base */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#D6CDB8 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

          {/* Large Rotating Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="absolute top-[10%] -left-[20%] w-[60vw] h-[60vw] border-[1px] border-ink/5 rounded-full"
          />

          {/* Large Rotating Ring 2 */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[10%] -right-[20%] w-[80vw] h-[80vw] border-[1px] border-ink/5 rounded-full"
          />

          {/* Scientific Hexagon Accent */}
          <div className="absolute top-[25%] right-[10%] w-[20vw] h-[20vw] max-w-[300px] text-ink-[0.03]">
            <motion.svg 
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full text-ink/10"
            >
              <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
            </motion.svg>
          </div>

          {/* Vertical Technical Typography */}
          <div className="absolute top-1/2 left-8 -translate-y-1/2 -rotate-90 origin-left text-ink/5 font-mono text-[8vw] whitespace-nowrap font-bold tracking-widest select-none">
            RESEARCH &bull; PURITY
          </div>
          
          {/* Technical Crosshairs */}
          <div className="absolute top-[15%] right-[5%] text-ink/20 font-mono text-xs">+</div>
          <div className="absolute bottom-[20%] left-[8%] text-ink/20 font-mono text-xs">+</div>
        </div>

        <div className="max-w-[900px] mx-auto relative z-10">
          
          <FadeUp className="text-center mb-24 lg:mb-40">
            <h2 className="text-label-md uppercase tracking-widest text-gold mb-6 font-bold">Our Pillars</h2>
            <h3 className="text-4xl lg:text-6xl font-serif text-ink tracking-tight">The Foundation of The Lab</h3>
          </FadeUp>

          <div className="relative w-full pb-[20vh]">
            
            {/* Card 1: Mission */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="sticky top-20 lg:top-32 w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-ink/5 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden group mb-8 lg:mb-12"
              style={{ zIndex: 10 }}
            >
              {/* SVG Noise */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4] mix-blend-multiply z-0">
                <filter id="noise1">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise1)" />
              </svg>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-[100px_1fr] lg:grid-cols-[160px_1fr] gap-8 lg:gap-16 items-stretch">
                {/* Left: Editorial Number & Icon */}
                <div className="flex flex-row md:flex-col justify-between items-end md:items-start border-b md:border-b-0 md:border-r border-ink/10 pb-6 md:pb-0 md:pr-8">
                  <span className="text-5xl lg:text-8xl font-serif text-ink tracking-tighter leading-none">01</span>
                  <Microscope className="w-8 h-8 lg:w-12 lg:h-12 text-ink/30 mt-0 md:mt-12" strokeWidth={1} />
                </div>
                
                {/* Right: Content */}
                <div className="flex flex-col justify-center py-2 lg:py-4">
                  <h3 className="text-4xl lg:text-6xl font-serif text-ink mb-6 lg:mb-8 tracking-tight leading-[1.1]">Our Mission</h3>
                  <p className="text-lg lg:text-2xl text-ink/70 leading-relaxed max-w-3xl font-light">
                    To accelerate scientific discovery by providing researchers with the highest purity compounds available. We aim to remove the guesswork from research by setting an uncompromising standard for documentation and quality control.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Philosophy */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="sticky top-28 lg:top-[12.5rem] w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-ink/5 bg-[#E5E9EF] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden group mb-8 lg:mb-12"
              style={{ zIndex: 20 }}
            >
              {/* SVG Noise */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4] mix-blend-multiply z-0">
                <filter id="noise2">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise2)" />
              </svg>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-[100px_1fr] lg:grid-cols-[160px_1fr] gap-8 lg:gap-16 items-stretch">
                {/* Left: Editorial Number & Icon */}
                <div className="flex flex-row md:flex-col justify-between items-end md:items-start border-b md:border-b-0 md:border-r border-ink/10 pb-6 md:pb-0 md:pr-8">
                  <span className="text-5xl lg:text-8xl font-serif text-ink tracking-tighter leading-none">02</span>
                  <ShieldCheck className="w-8 h-8 lg:w-12 lg:h-12 text-ink/30 mt-0 md:mt-12" strokeWidth={1} />
                </div>
                
                {/* Right: Content */}
                <div className="flex flex-col justify-center py-2 lg:py-4">
                  <h3 className="text-4xl lg:text-6xl font-serif text-ink mb-6 lg:mb-8 tracking-tight leading-[1.1]">Our Philosophy</h3>
                  <p className="text-lg lg:text-2xl text-ink/70 leading-relaxed max-w-3xl font-light">
                    Absolute transparency. We believe that researchers deserve to know exactly what they are working with. If a batch doesn't meet our strict &ge;99% purity threshold through independent LC-MS and HPLC testing, it is destroyed.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Journey */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="sticky top-36 lg:top-[17rem] w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-ink/5 bg-[#E8EFE3] shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden group"
              style={{ zIndex: 30 }}
            >
              {/* SVG Noise */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4] mix-blend-multiply z-0">
                <filter id="noise3">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise3)" />
              </svg>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-[100px_1fr] lg:grid-cols-[160px_1fr] gap-8 lg:gap-16 items-stretch">
                {/* Left: Editorial Number & Icon */}
                <div className="flex flex-row md:flex-col justify-between items-end md:items-start border-b md:border-b-0 md:border-r border-ink/10 pb-6 md:pb-0 md:pr-8">
                  <span className="text-5xl lg:text-8xl font-serif text-ink tracking-tighter leading-none">03</span>
                  <FlaskConical className="w-8 h-8 lg:w-12 lg:h-12 text-ink/30 mt-0 md:mt-12" strokeWidth={1} />
                </div>
                
                {/* Right: Content */}
                <div className="flex flex-col justify-center py-2 lg:py-4">
                  <h3 className="text-4xl lg:text-6xl font-serif text-ink mb-6 lg:mb-8 tracking-tight leading-[1.1]">Our Journey</h3>
                  <p className="text-lg lg:text-2xl text-ink/70 leading-relaxed max-w-3xl font-light">
                    Born out of frustration with an industry plagued by vague COAs and unreliable suppliers. We built the infrastructure and partnered with elite US analytical labs to create the standard we always wished existed for our own research.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Why Choose Us Section - Editorial Index */}
      <section className="py-24 lg:py-48 px-6 bg-ink text-white relative">
        
        {/* Massive Interactive Background Vial (Left Side) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              y: [-40, 40, -40],
              rotate: [-2, 2, -2]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -left-10 md:left-0 top-[10%] md:top-[15%] h-[80vh] md:h-[100vh] w-[200px] md:w-[300px] lg:w-[450px] opacity-10 md:opacity-[0.15] mix-blend-screen"
          >
            <Image 
              src="/temp-homepage/hero-vial-image.webp" 
              alt="Vial Background"
              fill
              className="object-contain object-left-top"
            />
          </motion.div>
        </div>

        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24 items-start relative z-10">
          
          {/* Left: Sticky Title Area */}
          <div className="lg:sticky lg:top-32">
            <FadeUp>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-gold mb-8">The Gold Standard</h2>
              <h3 className="text-5xl lg:text-7xl font-serif mb-8 tracking-tight leading-[1.1]">Why Choose Us</h3>
              <p className="text-xl text-white/50 leading-relaxed max-w-md font-light">
                We don't cut corners. Every aspect of our operation is designed to ensure maximum efficacy and reliability, setting an uncompromising standard for the research community.
              </p>
            </FadeUp>
          </div>

          {/* Right: Editorial Index List */}
          <div className="flex flex-col w-full">
            <StaggerChildren className="w-full">
              
              {/* Item 01 */}
              <motion.div variants={staggerItemVariants} className="group border-t border-white/10 py-12 flex flex-col md:flex-row gap-6 md:gap-12 md:items-start hover:border-gold/30 transition-colors duration-500">
                <div className="text-gold/60 shrink-0 mt-2">
                  <Search className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-3xl lg:text-4xl font-serif tracking-tight text-white group-hover:text-gold transition-colors duration-500">Independent Testing</h4>
                  <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl">
                    Every single batch is tested by accredited US-based third-party laboratories via HPLC & Mass Spectrometry before it is ever made available for research.
                  </p>
                </div>
              </motion.div>

              {/* Item 02 */}
              <motion.div variants={staggerItemVariants} className="group border-t border-white/10 py-12 flex flex-col md:flex-row gap-6 md:gap-12 md:items-start hover:border-gold/30 transition-colors duration-500">
                <div className="text-gold/60 shrink-0 mt-2">
                  <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-3xl lg:text-4xl font-serif tracking-tight text-white group-hover:text-gold transition-colors duration-500">&ge;99% Purity Guarantee</h4>
                  <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl">
                    We maintain the strictest purity thresholds in the industry. If a batch tests at 98.9%, it is destroyed. Compromise is simply not in our vocabulary.
                  </p>
                </div>
              </motion.div>

              {/* Item 03 */}
              <motion.div variants={staggerItemVariants} className="group border-t border-white/10 py-12 flex flex-col md:flex-row gap-6 md:gap-12 md:items-start hover:border-gold/30 transition-colors duration-500">
                <div className="text-gold/60 shrink-0 mt-2">
                  <Truck className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-3xl lg:text-4xl font-serif tracking-tight text-white group-hover:text-gold transition-colors duration-500">USA Fulfillment</h4>
                  <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl">
                    All products are stocked securely in our climate-controlled US facilities, ensuring rapid domestic transit times and eliminating international customs delays.
                  </p>
                </div>
              </motion.div>

              {/* Item 04 */}
              <motion.div variants={staggerItemVariants} className="group border-t border-b border-white/10 py-12 flex flex-col md:flex-row gap-6 md:gap-12 md:items-start hover:border-gold/30 transition-colors duration-500">
                <div className="text-gold/60 shrink-0 mt-2">
                  <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-3xl lg:text-4xl font-serif tracking-tight text-white group-hover:text-gold transition-colors duration-500">Lyophilized Stability</h4>
                  <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl">
                    Advanced lyophilization techniques guarantee structural integrity during transit and long-term storage, arriving in the exact condition it left the lab.
                  </p>
                </div>
              </motion.div>

            </StaggerChildren>
          </div>
          
        </div>
      </section>

      {/* 4. Our Services Section - Scroll Interactive Index */}
      <section ref={capabilitiesRef} className="relative h-auto lg:h-[300vh] bg-white text-ink">
        
        {/* Sticky Container */}
        <div className="lg:sticky top-0 lg:h-[100dvh] w-full flex flex-col justify-center lg:overflow-hidden px-6 py-16 lg:py-24">
        
        {/* Massive Typography Background Watermark */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0 overflow-hidden">
          <motion.div style={{ x: capabilitiesX }} className="whitespace-nowrap">
            <span className="text-[18vw] font-serif text-ink/[0.03] leading-none select-none tracking-tighter">
              CAPABILITIES
            </span>
          </motion.div>
        </div>

        {/* Subtle Background Texture */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#D6CDB8 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="max-w-[1280px] w-full mx-auto relative z-10">
          
          {/* Header */}
          <FadeUp>
            <div className="mb-12 lg:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-gold mb-4 font-bold">
                  Capabilities
                </h2>
                <h3 className="text-4xl lg:text-6xl font-serif text-ink tracking-tight">Our Services</h3>
              </div>
              <div className="md:max-w-md lg:max-w-lg pb-2">
                <p className="text-lg text-ink-muted leading-relaxed font-light md:text-right">
                  Beyond our extensive catalog of readily available research compounds, we provide highly specialized synthesis and bulk fulfillment services for institutional and large-scale researchers globally.
                </p>
              </div>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-24 items-center">
            
            {/* Left Menu - Minimalist Typography List */}
            <div className="flex flex-col">
              <FadeUp delay={0.2}>
                <div className="border-t border-ink/10">
                  {services.map((service, index) => {
                    const isActive = activeServiceIndex === index;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setActiveServiceIndex(index)}
                        className={`group w-full flex items-center justify-between py-6 lg:py-10 border-b border-ink/10 transition-all duration-500 ${
                          isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                        }`}
                      >
                        <div className="flex flex-col items-start gap-2 lg:gap-3">
                          <span className="text-[10px] lg:text-xs font-mono font-bold text-gold tracking-widest">[{service.id}]</span>
                          <span className="text-xl lg:text-4xl font-serif text-ink text-left leading-tight">
                            {service.title}
                          </span>
                        </div>
                        {/* Interactive Arrow */}
                        <div className={`transition-all duration-500 transform ${isActive ? 'translate-x-0 opacity-100 text-gold' : 'translate-x-0 lg:-translate-x-8 opacity-0 text-ink'}`}>
                          <svg width="24" height="24" className="lg:w-8 lg:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FadeUp>
            </div>

            {/* Right Display - Borderless Premium Viewport */}
            <FadeUp delay={0.4} className="relative w-full h-[350px] lg:h-[70vh] max-h-[700px] rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl">
              
              {/* Background Image / Graphic */}
              <motion.div 
                key={`bg-${activeServiceIndex}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 z-0"
              >
                <Image 
                  src={services[activeServiceIndex].image} 
                  alt={services[activeServiceIndex].title} 
                  fill 
                  className="object-cover"
                />
                {/* Dark gradient so text is always readable over any image */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              </motion.div>

              {/* Animated Text Content */}
              <div className="absolute bottom-0 left-0 w-full p-8 lg:p-12 z-10">
                <motion.div
                  key={`text-${activeServiceIndex}`}
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h4 className="text-3xl lg:text-5xl font-serif text-white mb-6 leading-tight drop-shadow-md">
                    {services[activeServiceIndex].title}
                  </h4>
                  <p className="text-lg text-white/80 leading-relaxed max-w-xl font-light">
                    {services[activeServiceIndex].desc}
                  </p>
                </motion.div>
              </div>
              
            </FadeUp>

          </div>
        </div>
      </div>
    </section>

      {/* 5. FAQs Section */}
      <FaqCarousel 
        faqs={ABOUT_FAQS}
        title="Frequently"
        accentTitle="Asked Questions"
        description="Learn more about our shipping, lab protocols, and product storage guidelines."
        theme="light"
      />
      {/* 6. CTA section with Interactive Motion Graphics */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <FadeUp>
          <div className="relative w-full max-w-[1400px] mx-auto bg-ink rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">
            


            {/* Left Content */}
            <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-8 lg:pl-12">
              <span className="text-gold font-mono tracking-[0.2em] text-xs lg:text-sm uppercase font-bold">Initiate Your Protocol</span>
              
              <h2 className="text-4xl lg:text-6xl xl:text-7xl font-serif text-white leading-tight">
                Ready to advance your <span className="italic font-light text-white/90">research?</span>
              </h2>
              
              <p className="text-lg lg:text-xl text-white/70 font-light max-w-xl">
                Browse our catalog of highly purified, third-party verified compounds engineered for rigorous laboratory standards.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button className="w-full rounded-full px-10 py-6 bg-gold text-ink hover:bg-gold/90 transition-colors shadow-lg font-medium text-lg">
                    Shop Collection
                  </Button>
                </Link>
                <Link href="/certificates" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full rounded-full px-10 py-6 border-white/20 text-white hover:bg-white/10 hover:text-white transition-colors text-lg">
                    View COAs
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Interactive Motion Graphics */}
            <div className="relative z-10 w-full lg:w-1/2 h-[400px] lg:h-[500px] flex items-center justify-center pointer-events-none">
              {/* Central glowing orb behind the vial */}
              <div className="absolute w-[400px] h-[400px] bg-gold/20 rounded-full blur-[100px] animate-pulse" />
              
              {/* Floating Vial Animation - Massive and partially clipped */}
              <motion.div
                animate={{ 
                  y: [-10, 10, -10],
                  rotate: [-1, 1, -1]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute top-4 lg:top-0 -right-[5%] lg:-right-[15%] w-[110%] lg:w-[130%] h-[140%] lg:h-[150%] drop-shadow-2xl"
              >
                <Image 
                  src="/temp-homepage/hero-vial-image.webp" 
                  alt="Research Vial" 
                  fill 
                  className="object-contain object-top"
                />
              </motion.div>
            </div>

          </div>
        </FadeUp>
      </section>
    </main>
  )
}
