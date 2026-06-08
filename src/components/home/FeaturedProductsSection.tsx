'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { PrimaryProductCard, Product } from '@/components/shop/PrimaryProductCard'
import { FadeUp } from '@/components/motion/FadeUp'
import { Container } from '@/components/ui/container'
import { Space_Grotesk } from 'next/font/google'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export function FeaturedProductsSection({ products = [] }: { products?: Product[] }) {
  // Use provided products or fallback to empty array
  const CAROUSEL_PRODUCTS = products.length > 0 ? products : []

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 }
    }
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on('reInit', onInit)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onInit, onSelect])

  if (CAROUSEL_PRODUCTS.length === 0) return null;

  return (
    <section className="w-full bg-white relative z-20 py-24 sm:py-32">
      <Container size="wide" className="px-6 md:px-12 lg:px-16">
        
        {/* Header matching reference image */}
        <div className="flex flex-col items-center justify-center w-full mb-12 sm:mb-16 relative text-center">
          <FadeUp>
            <span className="text-label-sm sm:text-label-md font-bold tracking-[0.2em] text-[#5984c4] uppercase mb-4 block">
              DISCOVER BEST SELLERS
            </span>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className={`text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-bold tracking-tight text-ink mb-6 leading-tight ${spaceGrotesk.className}`}>
              Discover Best-Selling Research Peptides
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-body-md text-ink/70 max-w-2xl mx-auto mb-8">
              Every compound in our best-seller lineup is independently verified by third-party HPLC and LC-MS analysis. Browse our most-requested research peptides — each shipped from US-based facilities with a lot-specific Certificate of Analysis.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <Link href="/shop" className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-[#5984c4] uppercase hover:text-[#3d65a0] transition-colors inline-flex items-center gap-2">
              VIEW ALL RESEARCH PEPTIDES <span className="text-[14px] leading-none mb-0.5">&rarr;</span>
            </Link>
          </FadeUp>
        </div>

        {/* Carousel */}
        <FadeUp delay={0.1}>
          <div className="relative w-full mx-auto px-0 sm:px-8">
            
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4 sm:-ml-8">
                {CAROUSEL_PRODUCTS.map((product, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4 sm:pl-8 p-4">
                    <PrimaryProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={scrollPrev} 
              className="hidden sm:flex absolute left-0 top-[40%] -translate-y-1/2 p-2 text-slate-400 hover:text-black transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={36} strokeWidth={1} />
            </button>
            <button 
              onClick={scrollNext} 
              className="hidden sm:flex absolute right-0 top-[40%] -translate-y-1/2 p-2 text-slate-400 hover:text-black transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={36} strokeWidth={1} />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2 mt-12 sm:mt-16">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    index === selectedIndex ? 'bg-[#5984c4] w-2 h-2' : 'bg-slate-200 hover:bg-slate-300 w-1.5 h-1.5'
                  }`}
                />
              ))}
            </div>

          </div>
        </FadeUp>

      </Container>
    </section>
  )
}
