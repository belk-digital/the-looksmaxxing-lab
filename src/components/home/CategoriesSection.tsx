'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Container } from '@/components/ui/container'
import { motion } from 'framer-motion'

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

function CategoryCard({ category, index }: { category: typeof CATEGORIES[0], index: number }) {
  const imageSrc = TEMP_IMAGES[index % TEMP_IMAGES.length]

  return (
    <Link href={`/shop/${category.slug}`} className="group relative block aspect-square w-full overflow-hidden bg-cream-warm">
      <Image 
        src={imageSrc}
        alt={category.name}
        fill
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-ink/20 transition-colors duration-500 group-hover:bg-ink/40" />

      {/* Number Badge */}
      <div className="absolute top-6 left-6 text-label-sm text-gold font-sans tracking-widest">
        {category.number}
      </div>

      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-editorial-md font-display text-cream mb-3">
          {category.name}
        </h3>
        <div className="overflow-hidden">
          <span className="block text-label-md uppercase tracking-wider text-cream translate-y-full opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CategoriesSection() {
  return (
    <Container size="page" className="py-32">
      <div className="flex flex-col items-center text-center mb-16">
        <FadeUp>
          <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">
            BY CATEGORY
          </span>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-display-md font-display text-ink max-w-2xl mx-auto">
            Eight research focuses
          </h2>
        </FadeUp>
      </div>

      <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
        {CATEGORIES.map((cat, i) => (
          <motion.div variants={staggerItemVariants} key={cat.slug} className="w-full">
            <CategoryCard category={cat} index={i} />
          </motion.div>
        ))}
      </StaggerChildren>
    </Container>
  )
}
