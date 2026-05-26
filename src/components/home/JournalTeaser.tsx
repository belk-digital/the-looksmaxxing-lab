'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const SAMPLE_POSTS = [
  {
    title: 'The Pharmacology of BPC-157 in Tendon Repair',
    slug: 'pharmacology-of-bpc-157',
    category: 'Clinical Reviews',
    excerpt: 'An in-depth analysis of Body Protection Compound-157 and its angiogenic mechanisms in accelerating connective tissue recovery.',
    readTime: '7 min read',
    image: '/temp-products/bpc-157.png'
  },
  {
    title: 'GHK-Cu: Beyond Cosmetic Applications',
    slug: 'ghk-cu-beyond-cosmetic',
    category: 'Research Notes',
    excerpt: 'Examining the systemic gene-modulating effects of the copper peptide complex and its implications for longevity protocols.',
    readTime: '12 min read',
    image: '/temp-products/ghk-cu.png'
  },
  {
    title: 'Navigating HPLC and LC-MS Purity Reports',
    slug: 'navigating-hplc-lcms',
    category: 'Methodology',
    excerpt: 'A comprehensive guide to reading and understanding third-party Certificate of Analysis documentation for synthetic peptides.',
    readTime: '5 min read',
    image: '/temp-products/about-lifestyle.png'
  }
]

function BlogPostCard({ post }: { post: typeof SAMPLE_POSTS[0] }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group flex flex-col w-full h-full cursor-pointer">
      {/* Image Area */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-cream-warm mb-8 rounded-sm">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1">
        <span className="text-label-md uppercase tracking-wider text-gold mb-4">
          {post.category}
        </span>
        <h3 className="text-editorial-md font-display text-ink mb-4 group-hover:text-gold transition-colors duration-300">
          {post.title}
        </h3>
        <p className="text-body-sm text-ink-muted line-clamp-2 mb-6 flex-1">
          {post.excerpt}
        </p>
        <div className="mt-auto">
          <span className="text-label-sm text-ink/60 uppercase tracking-wider">
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function JournalTeaser() {
  return (
    <section className="w-full py-32 bg-cream">
      <Container size="page">
        {/* Header Block */}
        <div className="flex flex-col items-center text-center mb-16">
          <FadeUp>
            <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">
              SCIENCE JOURNAL
            </span>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="text-display-md font-display text-ink max-w-2xl mx-auto">
              Clinical reviews & protocols
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-body-md text-ink-muted mt-6 max-w-2xl mx-auto">
              Deep dives into molecular mechanisms, purity testing methodology, and the latest clinical literature surrounding synthetic peptides.
            </p>
          </FadeUp>
        </div>

        {/* Grid Block */}
        <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-16">
          {SAMPLE_POSTS.map((post) => (
            <motion.div variants={staggerItemVariants} key={post.slug} className="flex h-full">
              <BlogPostCard post={post} />
            </motion.div>
          ))}
        </StaggerChildren>

        {/* CTA Block */}
        <div className="flex justify-center mt-20">
          <FadeUp delay={0.4}>
            <Button variant="secondary" size="lg">
              View The Journal →
            </Button>
          </FadeUp>
        </div>
      </Container>
    </section>
  )
}
