'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { JOURNAL_POSTS } from '@/data/journal-posts'

// Always the 5 most recently dated posts — recalculated from JOURNAL_POSTS on every render,
// so new journal entries automatically surface here with no manual wiring.
const RECENT_POSTS = [...JOURNAL_POSTS]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5)
  .map((post) => ({
    title: post.title,
    slug: post.slug,
    category: post.category,
    excerpt: post.excerpt,
    readTime: post.readTime,
    image: post.heroImage
  }))

export function JournalTeaser() {
  const targetRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxScroll, setMaxScroll] = useState(0)

  useEffect(() => {
    const updateMeasurements = () => {
      if (trackRef.current && trackRef.current.parentElement) {
        const scrollWidth = trackRef.current.scrollWidth
        const viewportWidth = trackRef.current.parentElement.offsetWidth
        setMaxScroll(Math.max(0, scrollWidth - viewportWidth))
      }
    }

    updateMeasurements()
    let timeout: ReturnType<typeof setTimeout>
    const debouncedUpdate = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updateMeasurements, 150)
    }
    window.addEventListener('resize', debouncedUpdate)
    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      clearTimeout(timeout)
    }
  }, [])
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  })

  const x = useTransform(scrollYProgress, [0, 1], [0, -maxScroll])

  // Shared Card Component
  const JournalCard = ({ post }: { post: typeof RECENT_POSTS[0] }) => (
    <Link 
      href={`/journal/${post.slug}`} 
      className="group flex flex-col w-[60vw] sm:w-[45vw] md:w-[35vw] xl:w-[24vw] max-w-[280px] xl:max-w-[220px] 2xl:max-w-[400px] shrink-0 cursor-pointer"
    >
      <div className="relative w-full aspect-[4/5] md:aspect-[3/4] max-h-[50vh] xl:max-h-[45vh] 2xl:max-h-[60vh] overflow-hidden rounded-2xl md:rounded-[1.5rem] bg-white border border-slate-100 mb-4 md:mb-8 xl:mb-4 2xl:mb-8 shadow-sm">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 ease-out-quart group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[#5984c4]/5 group-hover:bg-transparent transition-colors duration-500 mix-blend-multiply" />
      </div>
      <div className="flex flex-col px-1 md:px-2">
        <span className="text-[10px] md:text-label-sm xl:text-[9px] 2xl:text-label-sm uppercase tracking-widest text-[#2563EB] mb-2 md:mb-4 xl:mb-2 2xl:mb-4 font-bold">
          {post.category}
        </span>
        <h3 className="text-xl md:text-3xl xl:text-xl 2xl:text-3xl font-display text-ink mb-2 md:mb-4 xl:mb-2 2xl:mb-4 group-hover:text-[#2563EB] transition-colors duration-500 leading-tight">
          {post.title}
        </h3>
        <div className="mt-auto">
          <span className="text-[10px] md:text-label-sm xl:text-[9px] 2xl:text-label-sm text-ink/70 uppercase tracking-widest font-medium">
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-[#f8fafd]">
      
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col xl:flex-row overflow-hidden bg-[#f8fafd]">
        
        {/* Left / Top Panel: Solid Sticky Block (Slides over the cards) */}
        <div className="absolute top-0 left-0 w-full h-[40vh] xl:w-[40vw] xl:h-screen bg-white z-20 flex flex-col justify-center px-6 sm:px-12 xl:px-10 2xl:pl-24 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)] border-r border-slate-100">
           <span className="text-[10px] xl:text-[10px] 2xl:text-label-md uppercase tracking-widest text-[#2563EB] mb-2 xl:mb-4 2xl:mb-6 block font-bold">
             SCIENCE JOURNAL
           </span>
           <h2 className="text-4xl sm:text-5xl xl:text-4xl 2xl:text-7xl font-display text-ink leading-[0.9] tracking-tight mb-4 xl:mb-4 2xl:mb-8 max-w-[90%] drop-shadow-sm">
             Clinical Reviews & Research Guidelines
           </h2>
           <p className="text-xs xl:text-xs 2xl:text-body-md text-ink/70 mb-6 xl:mb-6 2xl:mb-12 max-w-md xl:max-w-sm 2xl:max-w-xl">
             Our journal publishes peer-reviewed literature summaries, compound mechanism deep dives, and methodology guides covering purity testing, reconstitution, and storage. Written for researchers who need the science, not the hype.
           </p>
           
           {/* Interactive Scroll Prompt */}
           <div className="flex items-center gap-3 mb-6 xl:mb-12">
             <div className="w-5 h-8 rounded-full border-[1.5px] border-[#5984c4]/30 flex justify-center pt-1.5 shrink-0 scale-75 xl:scale-100 origin-left">
               <motion.div 
                 animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }} 
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="w-1 h-1.5 bg-[#5984c4] rounded-full"
               />
             </div>
             <span className="text-[8px] xl:text-[9px] font-sans uppercase tracking-[0.25em] font-bold text-[#2563EB]">
               Scroll to Explore
             </span>
           </div>

           <div>
            <Button variant="outline" asChild className="border-slate-300 text-ink hover:bg-[#5984c4] hover:border-[#5984c4] hover:text-white rounded-full px-6 xl:px-8 py-4 uppercase tracking-widest text-[10px] xl:text-xs font-bold transition-all duration-300 shadow-sm">
               <Link href="/journal">View the Full Journal →</Link>
             </Button>
           </div>
        </div>

        {/* Right / Bottom Track: Horizontally Scrolling Cards */}
        <div className="absolute top-[40vh] xl:top-0 left-0 xl:left-[40vw] w-full xl:w-[60vw] h-[60vh] xl:h-screen flex items-center z-10 overflow-visible">
          
          <motion.div 
            ref={trackRef}
            style={{ x, willChange: 'transform' }}
            className="flex gap-4 md:gap-8 xl:gap-8 2xl:gap-12 pl-6 md:pl-12 xl:pl-8 2xl:pl-12 pr-6 md:pr-12 w-max transform-gpu"
          >
            {RECENT_POSTS.map((post) => (
              <JournalCard key={post.slug} post={post} />
            ))}
          </motion.div>
          
        </div>

      </div>
    </section>
  )
}
