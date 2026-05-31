'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'

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

export function JournalTeaser() {
  const targetRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxScroll, setMaxScroll] = useState(0)

  useEffect(() => {
    const updateMeasurements = () => {
      if (trackRef.current && trackRef.current.parentElement) {
        const scrollWidth = trackRef.current.scrollWidth
        const viewportWidth = trackRef.current.parentElement.offsetWidth
        // Calculate exactly how much the track needs to shift left to show the last card
        setMaxScroll(Math.max(0, scrollWidth - viewportWidth))
      }
    }
    
    // Initial measurement
    updateMeasurements()
    
    // Remeasure on window resize
    window.addEventListener('resize', updateMeasurements)
    return () => window.removeEventListener('resize', updateMeasurements)
  }, [])
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    // Start animation when top of section hits top of viewport, end when bottom hits bottom
  })

  // Translate exactly by the measured pixel amount
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxScroll])

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-cream">
      
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col md:flex-row overflow-hidden bg-cream">
        
        {/* Left / Top Panel: Solid Sticky Block (Slides over the cards) */}
        <div className="absolute top-0 left-0 w-full h-[40vh] md:w-[40vw] md:h-screen bg-cream z-20 flex flex-col justify-center px-6 sm:px-12 md:pl-16 lg:pl-24 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)] md:shadow-[20px_0_40px_-20px_rgba(0,0,0,0.15)]">
           <span className="text-label-md uppercase tracking-widest text-gold mb-4 md:mb-6 block font-bold">
             SCIENCE JOURNAL
           </span>
           <h2 className="text-[10vw] md:text-5xl lg:text-6xl xl:text-7xl font-display text-ink leading-[0.9] tracking-tight mb-6 md:mb-8 max-w-[90%]">
             Clinical reviews & protocols
           </h2>
           <p className="text-body-sm md:text-body-md text-ink-muted mb-8 md:mb-12 max-w-md">
             Deep dives into molecular mechanisms, purity testing methodology, and the latest clinical literature surrounding synthetic peptides.
           </p>
           <div>
             <Button variant="outline" className="border-ink/20 text-ink hover:bg-ink hover:text-white rounded-[1.5rem] px-8 py-6 backdrop-blur-md">
               View The Journal
             </Button>
           </div>
        </div>

        {/* Right / Bottom Track: Horizontally Scrolling Cards */}
        <div className="absolute top-[40vh] md:top-0 left-0 md:left-[40vw] w-full md:w-[60vw] h-[60vh] md:h-screen flex items-center z-10 overflow-visible">
          
          <motion.div 
            ref={trackRef}
            style={{ x }} 
            className="flex gap-6 md:gap-12 pl-6 md:pl-12 pr-6 md:pr-12 w-max"
          >
            {SAMPLE_POSTS.map((post) => (
              <Link 
                href={`/journal/${post.slug}`} 
                key={post.slug}
                className="group flex flex-col w-[80vw] sm:w-[60vw] md:w-[35vw] lg:w-[28vw] shrink-0 cursor-pointer"
              >
                {/* Image Area */}
                <div className="relative w-full aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-white mb-6 md:mb-8 shadow-sm">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                  {/* Subtle dark overlay for premium feel */}
                  <div className="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-colors duration-500" />
                </div>

                {/* Content Area */}
                <div className="flex flex-col px-2">
                  <span className="text-label-sm uppercase tracking-widest text-gold mb-3 md:mb-4 font-bold">
                    {post.category}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display text-ink mb-4 group-hover:text-gold transition-colors duration-500 leading-tight">
                    {post.title}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-label-sm text-ink/50 uppercase tracking-widest font-medium">
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
          
        </div>

      </div>
    </section>
  )
}
