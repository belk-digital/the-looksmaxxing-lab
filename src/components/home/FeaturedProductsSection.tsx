'use client'

import React from 'react'
import { FeaturedProductCard, Product } from '@/components/shop/FeaturedProductCard'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { motion } from 'framer-motion'

const SAMPLE_PRODUCTS: Product[] = [
  {
    name: 'BPC-157 Blend',
    slug: 'bpc-157-blend',
    image: '/temp-products/product-image.png',
    shortDescription: 'The ultimate recovery protocol. Enhanced tissue repair and joint support formulated for maximum bioavailability.',
    priceRange: '$120 - $300',
    category: 'Recovery'
  },
  {
    name: 'TB-500',
    slug: 'tb-500',
    image: '/temp-products/product-image.png',
    shortDescription: 'Systemic healing and inflammation modulation. Frequently stacked with BPC-157 for synergistic effects.',
    priceRange: '$140 - $350',
    category: 'Recovery'
  },
  {
    name: 'GHK-Cu Copper Peptide',
    slug: 'ghk-cu',
    image: '/temp-products/product-image.png',
    shortDescription: 'Advanced cellular health and collagen synthesis. A foundational peptide for longevity protocols.',
    priceRange: '$85 - $200',
    category: 'Cellular Health'
  },
  {
    name: 'Semaglutide',
    slug: 'semaglutide',
    image: '/temp-products/product-image.png',
    shortDescription: 'GLP-1 receptor agonist for optimized metabolic function and lean mass preservation.',
    priceRange: '$200 - $500',
    category: 'Metabolic'
  }
]

export function FeaturedProductsSection() {
  return (
    <Container size="page" className="py-32">
      <div className="flex flex-col items-center text-center mb-16">
        <FadeUp>
          <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">
            FEATURED PROTOCOLS
          </span>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="text-display-md font-display text-ink max-w-2xl mx-auto">
            Most-studied compounds
          </h2>
        </FadeUp>
      </div>

      <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {SAMPLE_PRODUCTS.map((product, index) => (
          <motion.div variants={staggerItemVariants} key={product.slug} className="flex h-full">
            <FeaturedProductCard 
              product={product} 
              aspectRatio={index % 2 === 0 ? '4/5' : '16/10'} 
            />
          </motion.div>
        ))}
      </StaggerChildren>

      <div className="flex justify-center mt-16">
        <FadeUp delay={0.4}>
          <Button variant="secondary" size="lg">
            View All Products
          </Button>
        </FadeUp>
      </div>
    </Container>
  )
}
