'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, useMotionValueEvent, useMotionValue, useSpring } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, ShieldCheck, Microscope, Truck, Search, FlaskConical, ArrowRight } from 'lucide-react'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'
import { WhyChooseUs } from '@/components/about/WhyChooseUs'
import { SwipeCarousel } from '@/components/shared/SwipeCarousel'
import { getFeaturedProducts } from '@/app/(frontend)/actions/getFeaturedProducts'

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
  
  const [dynamicCompounds, setDynamicCompounds] = useState<any[]>([])
  const [isLoadingCompounds, setIsLoadingCompounds] = useState(true)

  useEffect(() => {
    getFeaturedProducts().then(products => {
      if (products && products.length > 0) {
        setDynamicCompounds(products)
      }
      setIsLoadingCompounds(false)
    })
  }, [])

  // Custom Cursor State for Services
  const [isServicesHovered, setIsServicesHovered] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);

  // Capabilities Scroll
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
      image: "/Featured%20Images/three-floating-vials.webp"
    },
    {
      id: "02",
      title: "Wholesale & Bulk Sourcing",
      desc: "Tailored pricing and dedicated supply chains for institutional buyers requiring significant volumes and guaranteed consistency.",
      image: "/Featured%20Images/crushed-white-powder.webp"
    },
    {
      id: "03",
      title: "Custom Synthesis Inquiries",
      desc: "Capabilities to facilitate custom sequence synthesis for specialized or novel research applications upon request.",
      image: "/Featured%20Images/scientist-at-microscope.webp"
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
            className="text-label-md uppercase tracking-widest text-[#5984c4] mb-4 sm:mb-8 font-bold"
          >
            Established 2024
          </motion.h2>

          {/* The Interactive Window */}
          <motion.div 
            initial={{ width: '90%', height: '40vh', borderRadius: '3rem' }}
            whileHover={{ width: '98%', height: '60vh', borderRadius: '1.5rem' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden shadow-2xl cursor-pointer group my-8 md:my-12 max-w-[1600px] w-full"
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
                 className="object-cover object-[75%_center] md:object-center"
                 priority
               />
               <div className="absolute inset-0 bg-[#5984c4]/20 group-hover:bg-[#5984c4]/10 transition-colors duration-700" />
             </motion.div>
             
             {/* Center Overlay Text inside Window */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.h1 
                  className="text-center text-[16vw] md:text-[18vw] lg:text-[10vw] font-serif text-white leading-none tracking-tight mix-blend-overlay opacity-90 whitespace-nowrap transform-gpu"
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
            className="text-body-lg lg:text-xl text-ink/70 max-w-[720px] mx-auto text-center mt-6 sm:mt-12 leading-relaxed px-6"
          >
            We are a premier, US-based supplier dedicated to providing the global research community with uncompromising quality, rigorous third-party testing, and absolute transparency in peptide synthesis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10"
          >
            <Link href="/shop">
              <Button size="lg" className="h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                Explore Our Catalog
              </Button>
            </Link>
          </motion.div>

        </div>
      </section>

      {/* 2. Mission, Philosophy, Journey - Sticky Stack */}
      <section className="py-24 lg:py-48 px-6 bg-white relative">
        
        {/* Crisp Technical Geometry Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          
          {/* Subtle Dot Grid Base */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

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
            <h2 className="text-label-md uppercase tracking-widest text-[#5984c4] mb-6 font-bold">Our Pillars</h2>
            <h3 className="text-4xl lg:text-6xl font-serif text-ink tracking-tight">The Foundation of The Lab</h3>
          </FadeUp>

          <div className="relative w-full pb-[20vh]">
            
            {/* Card 1: Mission */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="sticky top-20 lg:top-32 w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-slate-100 bg-white shadow-sm overflow-hidden group mb-8 lg:mb-12"
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
                  <Microscope className="w-8 h-8 lg:w-12 lg:h-12 text-[#5984c4]/40 mt-0 md:mt-12" strokeWidth={1} />
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
              className="sticky top-28 lg:top-[12.5rem] w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-slate-100 bg-[#f8fafd] shadow-sm overflow-hidden group mb-8 lg:mb-12"
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
                  <ShieldCheck className="w-8 h-8 lg:w-12 lg:h-12 text-[#5984c4]/40 mt-0 md:mt-12" strokeWidth={1} />
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
              className="sticky top-36 lg:top-[17rem] w-full rounded-[2.5rem] lg:rounded-[3.5rem] p-10 lg:p-16 border border-slate-100 bg-[#eef3fb] shadow-sm overflow-hidden group"
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
                  <FlaskConical className="w-8 h-8 lg:w-12 lg:h-12 text-[#5984c4]/40 mt-0 md:mt-12" strokeWidth={1} />
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

      {/* 3. Why Choose Us Section - Interactive Split Layout */}
      <WhyChooseUs />

      {/* 3.5. Research Backed Compounds Carousel */}
      <SwipeCarousel 
        title="Research-Backed Compounds"
        description="Every compound is synthesized with purposeful, high-performance processes to ensure absolute purity and stability for your laboratory research."
        cards={dynamicCompounds}
      />

      {/* 4. Our Services Section - Scroll Interactive Index */}
      <section ref={capabilitiesRef} className="relative h-auto lg:h-[300vh] bg-white text-ink">
        
        {/* Sticky Container */}
        <div className="lg:sticky top-0 lg:h-[100dvh] w-full flex flex-col justify-center lg:overflow-hidden px-6 py-16 lg:py-24">
        
        {/* Massive Typography Background Watermark */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0 overflow-hidden opacity-30">
          <motion.div style={{ x: capabilitiesX }} className="whitespace-nowrap">
            <span className="text-[18vw] font-serif text-slate-100 leading-none select-none tracking-tighter">
              CAPABILITIES
            </span>
          </motion.div>
        </div>

        {/* Subtle Background Texture */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="max-w-[1280px] w-full mx-auto relative z-10">
          
          {/* Header */}
          <FadeUp>
            <div className="mb-12 lg:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-[#5984c4] mb-4 font-bold">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left Menu - Minimalist Typography List */}
            <div 
              className="flex flex-col relative md:cursor-none"
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                cursorX.set(e.clientX - rect.left);
                cursorY.set(e.clientY - rect.top);
              }}
              onMouseEnter={() => setIsServicesHovered(true)}
              onMouseLeave={() => setIsServicesHovered(false)}
            >
              
              {/* Custom Cursor Bubble (Desktop Only) */}
              <motion.div
                className="pointer-events-none absolute z-50 hidden md:flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-[#5984c4]/90 backdrop-blur-md rounded-full shadow-xl border border-white/20 text-white"
                style={{
                  x: cursorXSpring,
                  y: cursorYSpring,
                  translateX: '-50%',
                  translateY: '-50%',
                  top: 0,
                  left: 0,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isServicesHovered ? 1 : 0, 
                  opacity: isServicesHovered ? 1 : 0 
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-sans font-medium text-[10px] lg:text-[12px] uppercase tracking-wider text-center leading-[1.2]">
                  CLICK<br/>ME
                </span>
              </motion.div>

              <FadeUp delay={0.2}>
                <div className="border-t border-slate-200">
                  {services.map((service, index) => {
                    const isActive = activeServiceIndex === index;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setActiveServiceIndex(index)}
                        className={`group w-full flex items-center justify-between py-6 lg:py-10 border-b border-slate-200 transition-all duration-500 ${
                          isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                        }`}
                      >
                        <div className="flex flex-col items-start gap-2 lg:gap-3">
                          <span className="text-[10px] lg:text-xs font-mono font-bold text-[#5984c4] tracking-widest">[{service.id}]</span>
                          <span className="text-xl lg:text-4xl font-serif text-ink text-left leading-tight">
                            {service.title}
                          </span>
                        </div>
                        {/* Interactive Arrow */}
                        <div className={`transition-all duration-500 transform ${isActive ? 'translate-x-0 opacity-100 text-[#5984c4]' : 'translate-x-0 lg:-translate-x-8 opacity-0 text-ink'}`}>
                          <svg width="24" height="24" className="lg:w-8 lg:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FadeUp>
            </div>

            {/* Right Display - Borderless Premium Viewport */}
            <FadeUp delay={0.4} className="relative w-full h-[300px] lg:h-[55vh] max-h-[550px] rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl">
              
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
              <div className="absolute bottom-0 left-0 w-full p-8 z-10">
                <motion.div
                  key={`text-${activeServiceIndex}`}
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <h4 className="text-3xl lg:text-4xl font-serif text-white mb-4 leading-tight drop-shadow-md">
                    {services[activeServiceIndex].title}
                  </h4>
                  <p className="text-base lg:text-lg text-white/80 leading-relaxed max-w-xl font-light">
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
        description="Learn more about our shipping, lab guidelines, and product storage guidelines."
        theme="light"
      />
      {/* 6. CTA section - Redesigned for Premium Aesthetic */}
      <section className="py-24 px-6 lg:px-12 bg-white relative overflow-hidden">
        <FadeUp>
          <div className="relative w-full max-w-[1400px] mx-auto bg-gradient-to-b from-[#f4f7fb] to-white border border-[#eef3fb] rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl shadow-[#5984c4]/10 px-6 py-24 lg:py-40 flex flex-col items-center justify-center text-center">
            
            {/* Ambient Glows (Optimized: Using radial gradients instead of expensive CSS blurs) */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] md:w-[800px] h-[400px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(89,132,196,0.15) 0%, rgba(89,132,196,0) 70%)' }}
            />
            <div 
              className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(186,230,253,0.2) 0%, rgba(186,230,253,0) 70%)' }}
            />
            
            {/* Background Vials & Tech Elements */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
              
              {/* Subtle Dot Grid */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#5984c4 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              
              {/* Floating Transparent Vial 1 */}
              <motion.div
                animate={{ y: [-15, 15, -15], rotate: [10, 15, 10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-[5%] md:left-[5%] top-[10%] w-[300px] md:w-[400px] h-[400px] md:h-[500px] opacity-[0.15] pointer-events-none"
                style={{ willChange: 'transform' }}
              >
                <Image src="/Featured%20Images/vial-no-bg.webp" alt="Vial Watermark" fill className="object-contain" />
              </motion.div>

              {/* Floating Transparent Vial 2 */}
              <motion.div
                animate={{ y: [15, -15, 15], rotate: [-15, -20, -15] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-[10%] md:-right-[5%] bottom-[5%] w-[400px] md:w-[500px] h-[500px] md:h-[600px] opacity-[0.1] pointer-events-none"
                style={{ willChange: 'transform' }}
              >
                <Image src="/Featured%20Images/vial-no-bg.webp" alt="Vial Watermark" fill className="object-contain" />
              </motion.div>

              {/* Scientific Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] border-[1px] border-[#5984c4]/10 rounded-full"
                style={{ willChange: 'transform' }}
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 250, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1000px] md:h-[1000px] border-[1px] border-[#5984c4]/10 rounded-full border-dashed"
                style={{ willChange: 'transform' }}
              />
            </div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
              <span className="text-[#5984c4] font-mono tracking-[0.2em] text-xs lg:text-sm uppercase font-bold bg-[#5984c4]/10 px-6 py-2 rounded-full">
                Initiate Your Guideline
              </span>
              
              <h2 className="text-5xl md:text-6xl lg:text-8xl font-serif text-ink leading-[1.1] tracking-tight">
                Advance your <br/>
                <span className="italic font-light text-[#5984c4]">research.</span>
              </h2>
              
              <p className="text-lg lg:text-2xl text-ink/60 font-light max-w-2xl mx-auto mt-2 lg:mt-4">
                Explore our catalog of highly purified, third-party verified compounds engineered for rigorous laboratory standards.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8 lg:mt-12 w-full sm:w-auto">
                <Link href="/shop" className="w-full sm:w-auto group">
                  <Button className="w-full rounded-full px-12 py-8 bg-ink text-white hover:bg-[#5984c4] transition-colors duration-500 shadow-xl font-medium text-lg flex items-center justify-center gap-3">
                    Shop Collection
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/certificates" className="w-full sm:w-auto group">
                  <Button variant="outline" className="w-full rounded-full px-12 py-8 border-slate-200 text-ink hover:border-[#5984c4] hover:bg-slate-50 transition-colors duration-500 text-lg bg-white shadow-sm flex items-center justify-center gap-3">
                    View COAs
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </FadeUp>
      </section>
    </main>
  )
}
