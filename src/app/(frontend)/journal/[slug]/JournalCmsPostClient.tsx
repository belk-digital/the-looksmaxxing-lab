'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { BlogPostCard } from '@/components/editorial/BlogPostCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { PostRichText } from '@/components/blog/PostRichText'
import { KeyTakeaways } from '@/components/blog/KeyTakeaways'
import { FaqAccordion } from '@/components/blog/FaqAccordion'
import { ReferencesList } from '@/components/blog/ReferencesList'
import { RelatedProductsSlider } from '@/components/blog/RelatedProductsSlider'
import { Button } from '@/components/ui/button'
import type { Product as ShopProduct } from '@/components/shop/PrimaryProductCard'
import type { UnifiedJournalPost } from '@/lib/blog/types'

export interface CmsJournalPostData {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  authorName: string
  imageUrl: string
  content: any
  keyTakeaways: string[]
  faqs: { question: string; answer: string }[]
  references: { citationText: string; url: string }[]
}

export default function JournalCmsPostClient({
  post,
  relatedProducts,
  relatedPosts,
}: {
  post: CmsJournalPostData
  relatedProducts: ShopProduct[]
  relatedPosts: UnifiedJournalPost[]
}) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroImageY = useTransform(heroScroll, [0, 1], ['-8%', '18%'])

  return (
    <main className="bg-[#FAFAFA] min-h-screen pb-32">
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-gold z-[100] origin-left" style={{ scaleX }} />

      <div ref={heroRef} className="relative w-full min-h-[60vh] md:min-h-[70vh] flex flex-col justify-end pt-32 pb-16 md:pb-24 mb-12 md:mb-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <Image src={post.imageUrl} alt={post.title} fill className="object-cover scale-[1.15]" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/50 to-ink/90" />

        <div className="relative z-10 px-6 max-w-[800px] mx-auto w-full">
          <nav aria-label="Breadcrumb" className="mb-8 md:mb-10">
            <ol className="flex flex-wrap items-center justify-center gap-2 text-label-sm uppercase tracking-wider text-cream-sand">
              <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-cream/40">/</li>
              <li><Link href="/journal" className="hover:text-gold transition-colors">Journal</Link></li>
              <li aria-hidden="true" className="text-cream/40">/</li>
              <li aria-current="page" className="text-cream truncate max-w-[200px] md:max-w-none">{post.title}</li>
            </ol>
          </nav>

          <FadeUp>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-label-sm md:text-label-md uppercase tracking-wider text-gold mb-6 text-center">
              <span>{post.category}</span>
              <span className="text-cream/40">·</span>
              <span className="text-cream/80">{post.date}</span>
              <span className="text-cream/40">·</span>
              <span className="text-cream/80">{post.readTime}</span>
            </div>

            <h1 className="text-editorial-lg md:text-display-sm lg:text-display-md font-serif text-cream mb-6 md:mb-8 text-center leading-[1.2] md:leading-[1.1]">
              {post.title}
            </h1>

            <div className="text-body-sm md:text-body-md text-cream/80 text-center mb-8">
              By <span className="text-cream font-medium">{post.authorName}</span>
            </div>

            <div className="flex justify-center">
              <Button
                asChild
                variant="outline"
                size="md"
                className="border-gold/50 text-cream hover:bg-gold hover:text-ink hover:border-gold rounded-full backdrop-blur-md bg-white/5"
              >
                <Link href="/shop">Shop Research Peptides</Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </div>

      <article className="px-6 max-w-prose mx-auto pb-16">
        <FadeUp>
          <KeyTakeaways items={post.keyTakeaways} />
          <RelatedProductsSlider products={relatedProducts} />
          <PostRichText content={post.content} />
          <FaqAccordion faqs={post.faqs} />
          <ReferencesList references={post.references} />
        </FadeUp>
      </article>

      {relatedPosts.length > 0 && (
        <section className="px-6 max-w-[1280px] mx-auto mt-32 pt-16 border-t border-border-subtle">
          <div className="mb-12">
            <span className="text-label-md uppercase tracking-wider text-gold mb-2 block">Related</span>
            <h3 className="text-editorial-lg font-serif text-ink">Continue reading</h3>
          </div>

          <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost) => (
              <motion.div key={relatedPost.slug} variants={staggerItemVariants} className="h-full">
                <BlogPostCard
                  slug={relatedPost.slug}
                  title={relatedPost.title}
                  category={relatedPost.category}
                  excerpt={relatedPost.excerpt}
                  imageSrc={relatedPost.heroImage}
                  readTime={relatedPost.readTime}
                />
              </motion.div>
            ))}
          </StaggerChildren>
        </section>
      )}
    </main>
  )
}
