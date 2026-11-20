'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { UnifiedJournalPost } from '@/lib/blog/types'

/** What one card needs. The home page passes the newest posts from the same list the /journal page uses. */
export type JournalTeaserPost = Pick<UnifiedJournalPost, 'slug' | 'title' | 'category' | 'readTime' | 'heroImage'>

/** Tailwind's "xl": from here the section is pinned and the cards slide sideways as the page scrolls. */
const PINNED_MEDIA_QUERY = '(min-width: 1280px)'

// Defined outside the section so the cards are not rebuilt (and their images reloaded) every time it re-renders.
function JournalCard({ post }: { post: JournalTeaserPost }) {
  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group flex flex-col w-[68vw] sm:w-[45vw] md:w-[35vw] xl:w-[24vw] max-w-[280px] xl:max-w-[220px] 2xl:max-w-[400px] shrink-0 snap-start cursor-pointer"
    >
      <div className="relative w-full aspect-[4/5] md:aspect-[3/4] max-h-[50vh] xl:max-h-[45vh] 2xl:max-h-[60vh] overflow-hidden rounded-2xl md:rounded-[1.5rem] bg-white border border-slate-100 mb-4 md:mb-8 xl:mb-4 2xl:mb-8 shadow-sm">
        <Image
          src={post.heroImage}
          alt={post.title}
          fill
          sizes="(min-width: 1536px) 400px, (min-width: 1280px) 220px, 280px"
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
}

/**
 * The journal row on the home page.
 *
 * - Phones and tablets (below 1280px): an ordinary section. The heading and button sit on top and the cards are a plain
 *   swipeable row underneath (native horizontal scrolling that snaps card by card, no scrollbar). Nothing is pinned, so
 *   the page scrolls normally.
 * - Wide screens (1280px and up): the original effect. The section is pinned and the cards slide sideways as the page scrolls.
 *
 * The cards are the newest posts, passed in by the home page (see getLatestJournalPosts).
 */
export function JournalTeaser({ posts }: { posts: JournalTeaserPost[] }) {
  const targetRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxScroll, setMaxScroll] = useState(0)
  // Only the wide layout moves the track with JavaScript. Below it the browser's own horizontal scrolling does the job,
  // so the scroll-driven movement must be off there (it would shift the row while the visitor scrolls down the page).
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(PINNED_MEDIA_QUERY)
    const update = () => setPinned(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

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
  }, [posts, pinned])

  const { scrollYProgress } = useScroll({
    target: targetRef,
  })

  const x = useTransform(scrollYProgress, [0, 1], [0, -maxScroll])

  if (posts.length === 0) return null

  return (
    <section ref={targetRef} className="relative bg-[#f8fafd] xl:h-[300vh]">

      {/* Wide screens: the sticky viewport that holds the heading and the sliding cards. Below that: a plain stack. */}
      <div className="flex flex-col w-full bg-[#f8fafd] xl:sticky xl:top-0 xl:h-screen xl:flex-row xl:overflow-hidden">

        {/* Heading panel (on wide screens: a solid block that slides over the cards) */}
        <div className="relative z-20 flex w-full flex-col justify-center bg-white px-6 py-12 sm:px-12 sm:py-16 border-b border-slate-100 xl:absolute xl:left-0 xl:top-0 xl:h-screen xl:w-[40vw] xl:border-b-0 xl:border-r xl:px-10 xl:py-0 2xl:pl-24 xl:shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)]">
           <span className="text-[10px] xl:text-[10px] 2xl:text-label-md uppercase tracking-widest text-[#2563EB] mb-2 xl:mb-4 2xl:mb-6 block font-bold">
             SCIENCE JOURNAL
           </span>
           <h2 className="text-4xl sm:text-5xl xl:text-4xl 2xl:text-7xl font-display text-ink leading-[0.9] tracking-tight mb-4 xl:mb-4 2xl:mb-8 max-w-[90%] drop-shadow-sm">
             Clinical Reviews & Research Guidelines
           </h2>
           <p className="text-sm xl:text-xs 2xl:text-body-md text-ink/70 mb-6 xl:mb-6 2xl:mb-12 max-w-md xl:max-w-sm 2xl:max-w-xl">
             Our journal publishes peer-reviewed literature summaries, compound mechanism deep dives, and methodology guides covering purity testing, reconstitution, and storage. Written for researchers who need the science, not the hype.
           </p>

           {/* Scroll prompt: only for the pinned layout, where scrolling the page moves the cards. On phones the cards peek in from the edge. */}
           <div className="hidden xl:flex items-center gap-3 mb-12">
             <div className="w-5 h-8 rounded-full border-[1.5px] border-[#5984c4]/30 flex justify-center pt-1.5 shrink-0">
               <motion.div
                 animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="w-1 h-1.5 bg-[#5984c4] rounded-full"
               />
             </div>
             <span className="text-[9px] font-sans uppercase tracking-[0.25em] font-bold text-[#2563EB]">
               Scroll to Explore
             </span>
           </div>

           <div>
            <Button variant="outline" asChild className="border-slate-300 text-ink hover:bg-[#5984c4] hover:border-[#5984c4] hover:text-white rounded-full px-6 xl:px-8 py-4 uppercase tracking-widest text-[10px] xl:text-xs font-bold transition-all duration-300 shadow-sm">
               <Link href="/journal">View the Full Journal →</Link>
             </Button>
           </div>
        </div>

        {/* Cards. Below 1280px: a normal horizontally scrolling row that snaps card by card. From 1280px: the pinned, sliding track. */}
        <div
          role="region"
          aria-label="Latest journal articles"
          className="relative z-10 w-full overflow-x-auto overscroll-x-contain hide-scrollbar snap-x snap-mandatory scroll-pl-6 sm:scroll-pl-12 py-8 sm:py-10 xl:absolute xl:left-[40vw] xl:top-0 xl:flex xl:h-screen xl:w-[60vw] xl:items-center xl:overflow-visible xl:snap-none xl:py-0"
        >
          <motion.div
            ref={trackRef}
            style={pinned ? { x, willChange: 'transform' } : undefined}
            className="flex gap-4 md:gap-8 xl:gap-8 2xl:gap-12 pl-6 sm:pl-12 xl:pl-8 2xl:pl-12 pr-6 sm:pr-12 w-max xl:transform-gpu"
          >
            {posts.map((post) => (
              <JournalCard key={post.slug} post={post} />
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  )
}
