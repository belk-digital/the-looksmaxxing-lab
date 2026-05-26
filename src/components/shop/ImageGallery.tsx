'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DialogClose } from '@radix-ui/react-dialog'

export interface ImageGalleryProps {
  images: string[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  // Embla for mobile swipe
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setActiveIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi, setActiveIndex])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollTo = useCallback((index: number) => {
    setActiveIndex(index)
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  if (!images || images.length === 0) return null

  return (
    <div className="flex flex-col w-full gap-4">
      
      {/* Desktop: Cross-fade Primary View */}
      <div 
        className="hidden md:block relative w-full aspect-[4/5] bg-cream-warm rounded-sm overflow-hidden cursor-zoom-in" 
        onClick={() => setLightboxOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image 
              src={images[activeIndex]} 
              alt={`Product view ${activeIndex + 1}`}
              fill
              priority={activeIndex === 0}
              className="object-cover"
              sizes="50vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile: Swipeable Embla Carousel */}
      <div className="md:hidden relative w-full aspect-[4/5] bg-cream-warm rounded-sm overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="relative min-w-0 shrink-0 grow-0 basis-full h-full cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              <Image 
                src={img} 
                alt={`Product view ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          {images.map((img, idx) => {
            const isActive = activeIndex === idx
            return (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                onMouseEnter={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                    scrollTo(idx)
                  }
                }}
                className={cn(
                  "relative w-20 h-20 shrink-0 bg-cream-warm rounded-sm overflow-hidden transition-all duration-200 snap-start",
                  isActive ? "border border-ink opacity-100" : "border border-border-subtle opacity-70 hover:opacity-100"
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <Image 
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-7xl w-full h-[90vh] bg-ink/95 border-none p-0 flex items-center justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Image 
              src={images[activeIndex]}
              alt={`Fullscreen view`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <DialogClose className="absolute top-4 right-4 p-2 z-50 text-cream hover:text-gold transition-colors focus:outline-none">
            <X size={24} />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
