'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Container } from '@/components/ui/container'
import { motion, useScroll, useTransform } from 'framer-motion'

const CATEGORIES = [
  { name: 'Longevity Research', displayName: 'Longevity Research', slug: 'longevity-research', number: '01', description: 'Compounds targeting cellular aging and longevity protocols.' },
  { name: 'Hormonal Health', displayName: 'Hormonal Health', slug: 'hormonal-health', number: '02', description: 'Peptides studied for endocrine system support and balance.' },
  { name: 'Cognitive & Nootropic', displayName: 'Cognitive & Nootropic', slug: 'cognitive-nootropic', number: '03', description: 'Peptides associated with neurological and cognitive function research.' },
  { name: 'Mitochondrial & Cellular Energy', displayName: 'Mitochondrial & Cellular Energy', slug: 'mitochondrial-cellular-energy', number: '04', description: 'Compounds targeting mitochondrial optimization and ATP production.' },
  { name: 'Growth Hormone Secretagogues', displayName: 'Growth Hormone Secretagogues', slug: 'growth-hormone-secretagogues', number: '05', description: 'Growth factor peptides for tissue and recovery research. LC-MS verified.' },
  { name: 'Metabolic Research', displayName: 'Metabolic Research', slug: 'metabolic-research', number: '06', description: 'GLP-1 and metabolic peptides for body composition and metabolic research.' },
  { name: 'Immune Regulation', displayName: 'Immune Regulation', slug: 'immune-regulation', number: '07', description: 'Peptides investigated for immune system modulation and support.' },
  { name: 'Recovery & Tissue Repair', displayName: 'Recovery & Tissue Repair', slug: 'recovery-tissue-repair', number: '08', description: 'Tissue repair and recovery peptides. Includes BPC-157 and TB-500.' }
]

// Re-using the premium generated images as placeholders
const CATEGORY_IMAGES = [
  '/Featured%20Images/thick-gel-pouring.webp', // 1
  '/Featured%20Images/blue-petri-dishes.webp', // 2
  '/Featured%20Images/white-blue-dna-helix.webp', // 3
  '/Featured%20Images/category-4.JPG', // 4
  '/Featured%20Images/microscopic-liquid-drops.webp', // 5
  '/Featured%20Images/category-6.png', // 6
  '/Featured%20Images/clear-dropper-side-profile.webp', // 7
  '/Featured%20Images/category-8.png' // 8
]

const CARD_COLORS = [
  'bg-[#F5F1EB]', // Soft beige
  'bg-[#f2f6fc]', // Sky blue
  'bg-[#FAF7F2]', // Light cream
  'bg-[#eef3fb]', // Soft sky blue
  'bg-[#EBE5D9]', // Warm beige
  'bg-[#e9f0f8]', // Deeper baby blue
  'bg-[#F2EDE4]', // Smooth beige
  'bg-[#edf2f9]', // Subtle blue-gray
]

function CategoryCard({ category, index }: { category: typeof CATEGORIES[0], index: number }) {
  const imageSrc = CATEGORY_IMAGES[index % CATEGORY_IMAGES.length]
  const num = parseInt(category.number, 10)
  const bgColor = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <Link href={`/shop?category=${encodeURIComponent(category.name)}`} className="group relative flex flex-col w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-[9/14] overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] bg-white cursor-pointer shadow-md hover:shadow-xl border border-slate-100 transition-all duration-500">

      {/* Top Half - Text Area */}
      <div className={`relative p-4 sm:p-6 lg:p-8 h-[45%] transition-colors duration-500 ${bgColor}`}>
        {/* Top: Category Name */}
        <h3 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-display text-ink tracking-tight leading-[0.95] max-w-[80%]">
          {category.displayName}
        </h3>
        
        {/* Bottom: Number */}
        <div className="absolute bottom-2 right-3 sm:bottom-3 sm:right-4 lg:bottom-4 lg:right-5">
          <span className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-display text-ink leading-[0.8]">
            {num}
          </span>
        </div>
      </div>

      {/* Bottom Half - Image Area */}
      <div className="relative w-full h-[55%] overflow-hidden bg-white">
        <Image
          src={imageSrc}
          alt={`${category.displayName} peptide research category — ${category.name}`}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out-quart group-hover:scale-110"
        />
      </div>
      
      {/* Modern Hover Description Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 w-[90%] sm:w-[85%] z-30 pointer-events-none overflow-hidden rounded-xl">
        <div className="bg-ink/95 backdrop-blur-md text-white/90 text-[11px] sm:text-[13px] leading-snug text-center p-3 sm:p-4 rounded-xl translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out-quart shadow-2xl border border-white/10">
          {category.description}
        </div>
      </div>
      
    </Link>
  )
}

export function CategoriesSection() {
  const containerRef = useRef<HTMLElement>(null)
  
  // Track the scroll progress of the entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Odd columns move up faster, Even columns move down slightly (relative to scroll)
  const yEven = useTransform(scrollYProgress, [0, 1], [0, 100])
  const yOdd = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <div className="w-full bg-white">
      <section ref={containerRef} className="pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 lg:pb-32 w-full max-w-[92%] lg:max-w-[90%] mx-auto overflow-visible">
        <div className="flex flex-col items-center text-center mb-10 lg:mb-20">
          <FadeUp>
            <span className="text-label-md uppercase tracking-wider text-[#5984c4] mb-3 lg:mb-4 block font-bold">
              SHOP BY RESEARCH FOCUS
            </span>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-ink max-w-2xl mx-auto leading-tight">
              Eight Research Focuses: Shop by Category
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-body-md text-slate-500 max-w-[600px] mx-auto mt-4 leading-relaxed">
              From bioregulators and growth factors to metabolic and recovery compounds, each category is stocked with research peptides meeting our strict 99%+ purity standard. Every product ships with an independently verified COA.
            </p>
          </FadeUp>
        </div>

        <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mt-8">
          {CATEGORIES.map((cat, i) => {
            // Columns: 0, 1, 2, 3. Even/Odd logic creates the staggering alternating columns
            const isEven = i % 2 === 0;
            return (
              <motion.div variants={staggerItemVariants} key={cat.slug} className="w-full h-full">
                <motion.div style={{ y: isEven ? yEven : yOdd, willChange: 'transform' }} className="w-full h-full transform-gpu">
                  <CategoryCard category={cat} index={i} />
                </motion.div>
              </motion.div>
            )
          })}
        </StaggerChildren>
      </section>
    </div>
  )
}
