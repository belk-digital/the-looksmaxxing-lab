'use client'

import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const PreloaderContext = createContext({ isReady: true })
export const usePreloader = () => useContext(PreloaderContext)

const QUOTES = [
  "Gravity is a myth. Peptides are real.",
  "My people need me. Taking the peptides...",
  "Yeeting the purity levels into orbit...",
  "What goes up... is probably 99.9% pure.",
]

export function HomePreloaderWrapper({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [quote, setQuote] = useState("")
  const preloaderRef = useRef<HTMLDivElement>(null)
  const vialRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }, [])

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsReady(true)
        gsap.to(preloaderRef.current, { opacity: 0, display: 'none', duration: 0.6, ease: 'power2.inOut' })
      }
    })

    // 1. Entrance Fade & Rise
    tl.fromTo(vialRef.current, 
      { y: 100, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.2 }
    )
    
    // Pulse the glow as tension builds
    tl.to(glowRef.current, {
      scale: 1.2,
      opacity: 0.3,
      duration: 1.5,
      ease: "power2.in"
    }, "<") // Start same time as entrance
    
    // Fade in branding
    tl.to(brandRef.current, {
      opacity: 1,
      duration: 1.2,
      ease: "power2.out"
    }, "<")

    // Fade out branding right before the pull
    tl.to(brandRef.current, { opacity: 0, duration: 0.3 }, "+=0.5")

    // Fade in the humorous quote
    tl.fromTo(quoteRef.current, 
      { opacity: 0, y: 0 }, 
      { opacity: 1, y: -20, duration: 0.4, ease: "power2.out" }, 
      "<"
    )

    // 2. The Magnetic Pull (Vibrating while slowly levitating)
    // Slowly lift up as if caught in a beam
    tl.to(vialRef.current, {
      y: -80, // Lift slowly
      duration: 1.25, // 25 repeats * 0.05s
      ease: "power1.inOut"
    }, "<")

    // Very tight vibration (reduced shake)
    tl.to(vialRef.current, {
      x: "random(-2, 2)",
      rotation: "random(-1, 1)",
      duration: 0.05,
      repeat: 25,
      repeatRefresh: true,
      ease: "none"
    }, "<")

    // Stabilize just before the violent pull
    tl.set(vialRef.current, { x: 0, rotation: 0 })

    // 3. The Attraction Launch (Violently sucked straight up)
    tl.to(vialRef.current, {
      y: -window.innerHeight - 400,
      scale: 0.9, // Shrink slightly as it gets pulled away
      duration: 0.35, // Very fast suck
      ease: "power4.in", // Exponential acceleration upwards
    })
    
    // The quote shoots up with it!
    tl.to(quoteRef.current, {
      y: -window.innerHeight - 400,
      scale: 0.9,
      duration: 0.35,
      ease: "power4.in",
    }, "<")
    
    // Fade out glow instantly as it launches
    tl.to(glowRef.current, { opacity: 0, duration: 0.2 }, "<")

  }, [])

  return (
    <PreloaderContext.Provider value={{ isReady }}>
      {/* Background Page Content */}
      {children}

      {/* Fullscreen Overlay */}
      <div 
        ref={preloaderRef}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ink overflow-hidden"
      >
         <div className="relative flex items-center justify-center flex-1 w-full">
           {/* Ambient Glow behind vial */}
           <div 
             ref={glowRef}
             className="absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gradient-to-tr from-[#A89570] to-gold rounded-full blur-[100px] opacity-10 -z-10" 
           />
           
           {/* The Vial */}
           <div 
             ref={vialRef}
             className="relative w-[140px] sm:w-[180px] lg:w-[240px] aspect-[1/2.2]"
             style={{ opacity: 0, willChange: 'transform' }}
           >
             <Image 
               src="/temp-homepage/hero-vial-image.webp"
               alt="Vial Preloader"
               fill
               className="object-contain"
               priority
             />
           </div>
         </div>

         {/* Branding Footer */}
         <div 
           ref={brandRef}
           className="absolute bottom-12 md:bottom-[10%] flex flex-col items-center gap-4 text-white/50"
           style={{ opacity: 0 }}
         >
           <svg width="48" height="24" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 15 C15 7, 45 7, 45 15 C45 23, 20 23, 20 15 C20 11, 40 11, 40 15 C40 19, 25 19, 25 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 15 C5 2, 55 2, 55 15 C55 28, 10 28, 10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="58" cy="4" r="1.5" fill="currentColor" />
           </svg>
           <span className="text-[10px] md:text-label-sm uppercase tracking-[0.3em] font-bold text-center">
             The Looksmaxxing Lab
           </span>
         </div>

         {/* Humorous Quote (Fades in to replace branding, shoots up with vial) */}
         <div 
           ref={quoteRef}
           className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[90%] text-center pointer-events-none"
           style={{ opacity: 0 }}
         >
           <span className="text-xs md:text-sm font-sans uppercase tracking-[0.2em] font-bold text-gold drop-shadow-md">
             {quote}
           </span>
         </div>
      </div>
    </PreloaderContext.Provider>
  )
}
