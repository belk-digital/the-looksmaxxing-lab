'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Container } from '@/components/ui/container'
import { motion, useScroll, useTransform } from 'framer-motion'

const CATEGORIES = [
  { name: 'Bioregulators', slug: 'bioregulators', number: '01' },
  { name: 'Cellular Health', slug: 'cellular-health', number: '02' },
  { name: 'Cognitive Function', slug: 'cognitive-function', number: '03' },
  { name: 'Essentials', slug: 'essentials', number: '04' },
  { name: 'Growth Factor', slug: 'growth-factor', number: '05' },
  { name: 'Metabolic', slug: 'metabolic', number: '06' },
  { name: 'Receptor Agonist', slug: 'receptor-agonist', number: '07' },
  { name: 'Recovery', slug: 'recovery', number: '08' }
]

// Re-using the premium generated images as placeholders
const TEMP_IMAGES = [
  '/temp-products/bpc-157.png',
  '/temp-products/tb-500.png',
  '/temp-products/ghk-cu.png',
  '/temp-products/semaglutide.png',
  '/temp-products/growth-factor.png',
  '/temp-products/metabolic.png',
  '/temp-products/receptor.png',
  '/temp-products/essentials.png'
]

const CARD_COLORS = [
  'bg-[#F5F1EB]', // Soft cream
  'bg-[#EBE5D9]', // Warm beige
  'bg-[#F0F0F2]', // Cool light gray
  'bg-[#E8EDE9]', // Sage tint
  'bg-[#F3EAE8]', // Blush tint
  'bg-[#E6E8E6]', // Neutral gray
  'bg-[#EAE4DC]', // Warm taupe
  'bg-[#F4F4F4]', // Off-white
]

function CategoryCard({ category, index }: { category: typeof CATEGORIES[0], index: number }) {
  const imageSrc = TEMP_IMAGES[index % TEMP_IMAGES.length]
  const num = parseInt(category.number, 10)
  const bgColor = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <Link href={`/shop/${category.slug}`} className="group flex flex-col w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-[9/14] overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] bg-white cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-500">
      
      {/* Top Half - Text Area */}
      <div className={`relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 h-[45%] transition-colors duration-500 ${bgColor}`}>
        {/* Top Row */}
        <div className="flex justify-between items-start text-[10px] sm:text-xs lg:text-sm font-medium text-ink leading-tight">
          {/* Left List */}
          <div className="hidden sm:flex flex-col gap-[2px]">
            <span className="font-bold">All</span>
            <span className="opacity-70">Research</span>
            <span className="opacity-70 group-hover:text-gold transition-colors">Peptides</span>
            <span className="opacity-70">Protocols</span>
          </div>
          {/* Center Circle */}
          <div className="hidden sm:block w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-ink mt-0.5" />
          {/* Right Text */}
          <div className="mt-0.5 font-bold opacity-80 uppercase tracking-wide">
            Cat ({num})
          </div>
        </div>
        
        {/* Bottom Row of Top Section */}
        <div className="flex justify-between items-end mt-auto">
          <h3 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-display text-ink tracking-tight leading-[0.9] mb-[-2px] sm:mb-[-4px] max-w-[80%]">
            {category.name}
          </h3>
          <span className="text-2xl sm:text-5xl lg:text-6xl xl:text-[5.5rem] font-display text-ink leading-[0.8] mb-[-2px] sm:mb-[-4px]">
            {num}
          </span>
        </div>
      </div>

      {/* Bottom Half - Image Area */}
      <div className="relative w-full h-[55%] overflow-hidden bg-cream-warm">
        <Image 
          src={imageSrc}
          alt={category.name}
          fill
          className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        />
        {/* Optional inset overlay if needed, currently leaving clean */}
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
    <section ref={containerRef} className="py-16 sm:py-24 lg:py-32 w-full max-w-[92%] lg:max-w-[90%] mx-auto overflow-visible">
      <div className="flex flex-col items-center text-center mb-10 lg:mb-20">
        <FadeUp>
          <span className="text-label-md uppercase tracking-wider text-gold mb-3 lg:mb-4 block">
            BY CATEGORY
          </span>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-[10vw] md:text-display-md font-display text-ink max-w-2xl mx-auto leading-tight">
            Eight research focuses
          </h2>
        </FadeUp>
      </div>

      <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mt-8">
        {CATEGORIES.map((cat, i) => {
          // Columns: 0, 1, 2, 3. Even/Odd logic creates the staggering alternating columns
          const isEven = i % 2 === 0;
          return (
            <motion.div variants={staggerItemVariants} key={cat.slug} className="w-full h-full">
              <motion.div style={{ y: isEven ? yEven : yOdd }} className="w-full h-full">
                <CategoryCard category={cat} index={i} />
              </motion.div>
            </motion.div>
          )
        })}
      </StaggerChildren>
    </section>
  )
}
