'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { X, Maximize2 } from 'lucide-react'
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

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const cursorXSpring = useSpring(cursorX, { damping: 25, stiffness: 250 })
  const cursorYSpring = useSpring(cursorY, { damping: 25, stiffness: 250 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const localX = e.clientX - left
    const localY = e.clientY - top
    
    // Update custom cursor position
    cursorX.set(localX)
    cursorY.set(localY)

    // Panning logic
    const x = (localX / width) * 100
    const y = (localY / height) * 100
    
    const img = e.currentTarget.querySelector('img')
    if (img) {
      img.style.transformOrigin = `${x}% ${y}%`
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = e.currentTarget.querySelector('img')
    if (img) {
      img.style.transformOrigin = 'center center'
      // Reset scale is handled by CSS group-hover removing the scale class
    }
  }

  if (!images || images.length === 0) return null

  return (
    <div className="flex flex-col w-full gap-4 lg:gap-6">
      {/* Main Large Image */}
      <div 
        className="relative w-full aspect-square lg:aspect-[4/5] bg-white rounded-[2rem] overflow-hidden" 
        ref={emblaRef}
      >
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="relative min-w-0 shrink-0 grow-0 basis-full h-full cursor-none group overflow-hidden"
              onClick={() => setLightboxOpen(true)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <Image 
                src={img} 
                alt={`Product view ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.75]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Custom Modern Cursor */}
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  x: cursorXSpring,
                  y: cursorYSpring,
                  translateX: '-50%',
                  translateY: '-50%',
                }}
              >
                <Maximize2 size={18} strokeWidth={2.5} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex bg-white rounded-3xl p-3 gap-3 overflow-x-auto scrollbar-none self-start max-w-full">
          {images.map((img, idx) => {
            const isActive = activeIndex === idx
            return (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={cn(
                  "relative w-20 h-20 shrink-0 bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300",
                  isActive 
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-white" 
                    : "opacity-60 hover:opacity-100"
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <Image 
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80px, 80px"
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
