'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { BlogPostCard } from '@/components/editorial/BlogPostCard'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['All', 'Emerging', 'Guidelines', 'Studies', 'Guides']

export default function JournalIndexPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);

  return (
    <main className="bg-[#f3f4f6] min-h-screen">
      {/* 1. Interactive Window Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[100dvh] flex flex-col items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden bg-white mb-24">
        
        {/* Background Marquee */}
        <div className="absolute bottom-4 left-0 w-full overflow-hidden whitespace-nowrap flex z-0 pointer-events-none">
          <div className="animate-marquee flex items-center whitespace-nowrap w-max opacity-[0.04]">
              {Array(4).fill(0).map((_, i) => (
                <span key={i} className="text-[12vw] lg:text-[7vw] xl:text-[5vw] font-serif uppercase tracking-tighter mx-8 text-ink">
                  RESEARCH &bull; GUIDELINES &bull; CLINICAL STUDIES &bull; 
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
            Science Journal
          </motion.h2>

          {/* The Interactive Window */}
          <motion.div 
            initial={{ width: '90%', height: '40vh', borderRadius: '3rem' }}
            whileHover={{ width: '98%', height: '60vh', borderRadius: '1.5rem' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden shadow-2xl cursor-pointer group my-8 md:my-12 max-w-[1600px] w-full"
            style={{ width: '85%' }}
          >
             <motion.div 
               className="w-full relative"
               style={{ height: '150%', top: '-25%', y: heroImageY }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             >
               <Image 
                 src="/img-1.webp" 
                 alt="Research documentation" 
                 fill 
                 className="object-cover object-center"
                 priority
               />
               <div className="absolute inset-0 bg-[#5984c4]/30 group-hover:bg-[#5984c4]/10 transition-colors duration-700" />
             </motion.div>
             
             {/* Center Overlay Text inside Window */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.h1 
                  className="text-center text-[10vw] sm:text-[12vw] md:text-[14vw] lg:text-[10vw] font-serif text-white leading-none tracking-tight mix-blend-overlay opacity-90 whitespace-nowrap transform-gpu"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  THE JOURNAL
                </motion.h1>
             </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-body-lg lg:text-xl text-ink/70 max-w-[720px] mx-auto text-center mt-6 sm:mt-12 leading-relaxed px-6"
          >
            Documented purity, detailed guidelines, and emerging studies in advanced peptide science.
          </motion.p>

        </div>
      </section>

      {/* Featured Post */}
      <section className="px-4 md:px-6 mb-12 md:mb-16 max-w-[1280px] mx-auto">
        <FadeUp delay={0.1}>
          <div className="mb-6 px-2 lg:px-4">
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#5984c4]">Featured Article</h2>
          </div>
          <Link href="/journal/the-case-for-nad-in-mitochondrial-research" className="group block relative w-full bg-white rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="relative w-full h-[35vh] min-h-[250px] md:h-[50vh] md:min-h-[400px] rounded-2xl md:rounded-3xl overflow-hidden mb-6 md:mb-8">
              <Image 
                src="/hero-image.png" 
                alt="Featured post" 
                fill 
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" 
              />
            </div>
            
            <div className="relative z-20 max-w-[960px] px-2 lg:px-6 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">Emerging</span>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">12 min read</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-ink mb-6 tracking-tight leading-tight group-hover:text-blue-600 transition-colors duration-300">
                The case for NAD+ in mitochondrial research
              </h2>
              <p className="text-lg text-gray-500 mb-8 line-clamp-2 leading-relaxed">
                A comprehensive review of NAD+ precursors and their impact on cellular respiration, longevity markers, and tissue repair guidelines.
              </p>
              <span className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2 group-hover:text-blue-600 transition-colors duration-300">
                Read the full article <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </Link>
        </FadeUp>
      </section>

      {/* Filter Chips */}
      <section className="px-4 md:px-6 mb-12 max-w-[1280px] mx-auto flex justify-center">
        <FadeUp delay={0.2} className="w-full md:w-auto">
          <div 
            className="flex md:inline-flex bg-white rounded-[2rem] md:rounded-full p-2 shadow-sm border border-gray-100 overflow-x-auto gap-2 snap-x w-full md:w-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 snap-start px-5 md:px-6 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-ink text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:text-ink hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* Grid */}
      <section className="px-4 md:px-6 max-w-[1280px] mx-auto mb-16 md:mb-24">
        <StaggerChildren staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div key={i} variants={staggerItemVariants} className="h-full">
              <BlogPostCard 
                slug={`sample-post-${i}`}
                title={`Guideline: Reconstitution and storage guidelines ${i}`}
                category={i % 2 === 0 ? 'Guidelines' : 'Studies'}
                excerpt="Best practices for maintaining peptide stability, minimizing degradation, and ensuring accurate dosing in clinical environments."
                imageSrc="/hero-image.png"
                readTime="5 min read"
              />
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* Infinite Scroll trigger area */}
      <section className="pb-24 flex justify-center">
        <FadeUp>
          <Button className="px-10 h-14 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold text-sm tracking-wider uppercase border-none">
            Load More Posts
          </Button>
        </FadeUp>
      </section>
    </main>
  )
}
