'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { usePreloader } from './HomePreloaderWrapper'
import { Marquee } from '@/components/shared/Marquee'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

gsap.registerPlugin(useGSAP, ScrollTrigger);

const MagneticButton = ({ children, className, variant = "default", size = "default", href }: any) => {
  if (href) {
    return (
      <div className="inline-block">
        <Button variant={variant} size={size} className={className} asChild>
          <Link href={href}>{children}</Link>
        </Button>
      </div>
    )
  }
  return (
    <div className="inline-block">
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </div>
  )
}

const slides = [
  {
    image: '/New Images/longevia-hero.webp',
    alt: 'Longevia Research — Premium US-Synthesized Research Peptides',
    desktopBgClass: 'bg-[#F3F4F6]', // Light gray to match the image background
  },
  {
    image: '/New Images/motsc-and-retatrutide-on-ice.webp',
    alt: 'Longevia Research — MOTS-c and Retatrutide Research Peptides on Ice',
    desktopBgClass: 'bg-[#F9FAFB]', // Slightly different light gray
  }
]

export function Hero() {
  const { isReady } = usePreloader()
  const textContainerRef = useRef<HTMLDivElement>(null)
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  useGSAP(() => {
    if (!isReady) return;

    // Staggered text entrance
    const elements = textContainerRef.current?.querySelectorAll('.gsap-reveal')
    if (elements) {
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.2
        }
      )
    }
  }, [isReady])

  return (
    <section className="relative w-full h-[100dvh] min-h-[600px] lg:min-h-[min(800px,100dvh)] overflow-hidden bg-black lg:bg-white flex">
      
      {/* Background/Split */}
      <div className="absolute inset-0 w-full h-full z-0 flex flex-col lg:flex-row">
        
        {/* Left Half (Desktop Solid Color) */}
        <div className="hidden lg:block lg:w-[55%] h-full relative">
          {slides.map((slide, index) => (
             <div 
               key={slide.image}
               className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${slide.desktopBgClass} ${currentSlideIndex === index ? 'opacity-100' : 'opacity-0'}`}
             />
          ))}
        </div>

        {/* Right Half / Mobile Full Image */}
        <div className="w-full h-full lg:w-[45%] relative bg-black">
          {slides.map((slide, index) => (
            <Image
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              fill
              quality={100}
              className={`object-cover object-center transition-opacity duration-1000 ${
                currentSlideIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
              priority={index === 0}
            />
          ))}

          {/* Mobile Overlay */}
          <div className="absolute inset-0 bg-black/40 lg:hidden pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full h-full px-6 md:px-12 lg:px-16 flex flex-col items-center lg:items-start justify-center pt-32 lg:pt-[120px] pb-16 lg:pb-12 z-20">
        
        {/* Text & CTA restricted to left half on desktop */}
        <div ref={textContainerRef} className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left mt-4 lg:mt-0 drop-shadow-md lg:drop-shadow-none lg:pr-8 xl:pr-16">
          
          <div className="sr-only">
            Longevia Research - The official store supplying US-synthesized research peptides for scientific excellence.
          </div>


          <div className="gsap-reveal overflow-hidden mb-5 lg:mb-8">
            <h1 className={`text-[clamp(2rem,6vw,3rem)] lg:text-[clamp(3.5rem,4.5vw,5.25rem)] leading-[1.05] font-bold tracking-tighter text-white lg:text-ink ${spaceGrotesk.className}`}>
              Longevia Research: <br className="hidden lg:block" /> The Standard in US Peptides.
            </h1>
          </div>

          <div className="gsap-reveal overflow-hidden mb-8 lg:mb-12">
            <p className="text-sm md:text-base lg:text-body-lg text-white/90 lg:text-ink/80 max-w-[480px]">
              U.S.-manufactured compounds produced in cGMP- and ISO-certified laboratories. Independently verified for 99%+ purity. <br/><br/>Engineered for precision research. Trusted for consistency.
            </p>
          </div>

          <div className="gsap-reveal flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <MagneticButton href="/shop" variant="ghost" className="group w-full sm:w-auto px-6 py-4 sm:px-9 sm:py-6 rounded-full uppercase text-[10px] tracking-[0.25em] font-bold bg-white text-black lg:bg-ink lg:text-white lg:hover:bg-[#1a1a1a] hover:bg-white transition-all duration-300 flex items-center justify-center gap-3">
              SHOP RESEARCH PEPTIDES
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </MagneticButton>
            <MagneticButton href="/about" variant="ghost" className="group w-full sm:w-auto px-6 py-4 sm:px-9 sm:py-6 rounded-full uppercase text-[10px] tracking-[0.25em] font-bold border border-white/50 text-white lg:border-ink/20 lg:text-ink hover:bg-white hover:text-black lg:hover:bg-ink/5 transition-all duration-300 backdrop-blur-md bg-white/5 lg:bg-transparent lg:backdrop-blur-none flex items-center justify-center gap-3">
              DISCOVER THE LAB
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </MagneticButton>
          </div>

        </div>

      </div>

      {/* Modern White Marquee overlaying the bottom of the Hero */}
      <div className="absolute bottom-0 inset-x-0 z-30 shadow-[0_-10px_50px_rgba(0,0,0,0.2)] lg:shadow-none lg:border-t lg:border-ink/10">
        <Marquee 
          className="bg-white border-none py-5" 
          textClassName="text-black font-bold tracking-[0.35em]" 
          dotClassName="text-black/30 text-[14px]" 
        />
      </div>
    </section>
  )
}
