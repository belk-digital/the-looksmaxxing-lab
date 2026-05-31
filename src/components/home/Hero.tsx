'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Sparkle } from 'lucide-react'

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Hero() {
  const marqueeItems = [
    "≥99% HPLC PURITY",
    "LC-MS VERIFIED",
    "COA WITH EVERY ORDER",
    "US-BASED FULFILLMENT",
    "2-DAY SHIPPING OVER $300"
  ]

  const renderMarqueeContent = () => (
    <div className="flex items-center">
      {[...marqueeItems, ...marqueeItems].map((item, index) => (
        <React.Fragment key={index}>
          <span className="mx-6 md:mx-8 whitespace-nowrap">{item}</span>
          <Sparkle className="w-8 h-8 md:w-12 md:h-12 shrink-0 opacity-80" strokeWidth={1.5} />
        </React.Fragment>
      ))}
    </div>
  )
  
  const vialRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // 1. Dramatic entrance drop with slight rotation and scale
    gsap.fromTo(vialRef.current, 
      { 
        y: -350, 
        scale: 1.15, 
        rotation: 12,
        opacity: 0,
        filter: 'blur(10px)'
      },
      { 
        y: 0, 
        scale: 1, 
        rotation: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.8, 
        ease: "back.out(1.2)", 
        delay: 0.1,
        onComplete: () => {
          // 2. Continuous elegant floating/breathing animation after settling
          const floatingAnim = gsap.to(vialRef.current, {
            y: -15,
            rotation: -1.5,
            duration: 3.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          })

          // 3. ScrollTrigger to attach to the 2nd section
          setTimeout(() => {
            const targetElement = document.getElementById('target-product-image');
            if (targetElement && vialRef.current) {
              
              // We create a scrubbed timeline
              const tl = gsap.timeline({
                scrollTrigger: {
                  trigger: document.body,
                  start: "top top",
                  endTrigger: targetElement,
                  end: "center center",
                  scrub: 1,
                  invalidateOnRefresh: true, // Recalculates flawlessly on mobile scroll/resize
                  onEnter: () => floatingAnim.pause(),
                  onLeaveBack: () => floatingAnim.play(),
                }
              });

              tl.to(vialRef.current, {
                x: () => {
                  const targetRect = targetElement.getBoundingClientRect();
                  // Measure from the static parent to avoid reading mid-animation transformed values
                  const parentRect = vialRef.current!.parentElement!.getBoundingClientRect();
                  return (targetRect.left + targetRect.width / 2) - (parentRect.left + parentRect.width / 2);
                },
                y: () => {
                  const targetRect = targetElement.getBoundingClientRect();
                  const parentRect = vialRef.current!.parentElement!.getBoundingClientRect();
                  return (targetRect.top + targetRect.height / 2) - (parentRect.top + parentRect.height / 2);
                },
                scale: () => {
                  const targetRect = targetElement.getBoundingClientRect();
                  const parentRect = vialRef.current!.parentElement!.getBoundingClientRect();
                  return (targetRect.height / parentRect.height) * 0.95;
                },
                rotation: 0,
                ease: "power1.inOut"
              })
              // Disappear at the end
              .to(vialRef.current, {
                opacity: 0,
                duration: 0.1
              }, "-=0.1");
              
            }
          }, 500); // slight delay to ensure target is rendered
        }
      }
    )
  }, [])

  return (
    <section className="relative w-full bg-white min-h-[100dvh] lg:h-[100dvh] z-[50] flex flex-col pt-24 lg:pt-32 pb-8 lg:pb-10">
      
      {/* The Big Text */}
      <div className="w-full text-center relative z-0 flex justify-center shrink-0">
        <h1 className="text-[16vw] lg:text-[13vw] font-sans font-medium tracking-tight text-ink leading-[0.8] whitespace-nowrap px-4 select-none">
          Peptide Lab
        </h1>
      </div>
      
      {/* The Middle Beige Section */}
      <div className="relative z-10 w-full max-w-[92%] lg:max-w-[90%] mx-auto flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between mt-6 lg:mt-8 mb-8 lg:mb-8 min-h-[500px] lg:min-h-0">
        
        {/* Background & Marquee Container */}
        <div className="absolute inset-0 bg-[#EBE0C5] rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden -z-10">
          {/* Marquee Background Text */}
          <div className="absolute bottom-4 lg:bottom-6 left-0 w-full overflow-hidden whitespace-nowrap flex text-[#D8CCA9] font-sans font-medium text-4xl lg:text-6xl uppercase opacity-80 pointer-events-none select-none">
            <div className="animate-marquee flex items-center whitespace-nowrap w-max">
               {renderMarqueeContent()}
               {renderMarqueeContent()}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="w-full h-full flex flex-col lg:flex-row relative z-20 px-6 lg:px-12 py-8 lg:py-0 items-center justify-between">
          
          {/* Spacer for Mobile Vial so it has space to pop out the top without overlapping text */}
          <div className="w-full lg:hidden min-h-[180px] sm:min-h-[240px] md:min-h-[300px] shrink-0" />

          {/* Left Column Text */}
          <div className="w-full lg:w-[30%] flex flex-col items-center lg:items-start text-center lg:text-left z-20 mb-8 lg:mb-0">
            <h2 className="text-label-md lg:text-label-lg font-bold uppercase tracking-widest text-ink mb-3 lg:mb-4">
              PREMIUM RESEARCH PEPTIDES
            </h2>
            <p className="text-body-sm lg:text-body-md text-ink/80 max-w-[280px]">
              Precision-synthesized for maximum efficacy, our premium peptides provide the reliability and consistency needed for rigorous research applications.
            </p>
          </div>

          {/* Right Column Text */}
          <div className="w-full lg:w-[30%] flex flex-col items-center lg:items-end text-center lg:text-right z-20">
            <p className="text-body-sm lg:text-body-md text-ink/80 max-w-[280px] mb-5 lg:mb-6">
              Elevate your research with our high-purity compounds, thoroughly verified by independent third-party testing to ensure absolute quality and safety.
            </p>
            <Button variant="dark" size="sm" className="px-8 py-6 rounded-full uppercase tracking-[0.15em] text-[10px] lg:text-sm font-bold transition-colors shadow-md pointer-events-auto">
              DISCOVER MORE
            </Button>
          </div>
        </div>

        {/* The Vial Image - Using GSAP for animations */}
        {/* On mobile: pops out of top. On desktop: anchored to bottom, popping out top naturally due to height */}
        <div className="absolute left-1/2 -top-[15%] sm:-top-[20%] md:-top-[25%] lg:top-auto lg:bottom-4 xl:bottom-8 w-full max-w-[140px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[260px] xl:max-w-[290px] -translate-x-1/2 z-30 pointer-events-none">
          <div 
            ref={vialRef}
            className="relative w-full aspect-[1/2.2]"
            style={{ opacity: 0 }}
          >
            <Image 
              src="/temp-homepage/hero-vial-image.webp" 
              alt="Premium Peptide Vial" 
              fill
              className="object-contain drop-shadow-2xl object-center" 
              priority
            />
          </div>
        </div>
        
      </div>

      {/* Bottom White Section */}
      <div className="w-full max-w-[92%] lg:max-w-[90%] mx-auto shrink-0 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-8 mt-auto">
        <div className="w-full lg:w-[25%] border-t lg:border-t-0 lg:border-l-2 border-ink/10 pt-5 lg:pt-0 lg:pl-6 text-center lg:text-left">
          <h3 className="text-label-sm lg:text-label-md font-bold uppercase tracking-widest text-ink leading-relaxed lg:max-w-[150px] mx-auto lg:mx-0">
            ADVANCED PROTOCOLS FOR OPTIMAL RESULTS
          </h3>
        </div>
        
        <div className="w-full lg:w-[45%] text-center lg:text-left">
          <p className="font-display text-ink leading-tight text-[26px] sm:text-[32px] lg:text-[40px] max-w-[400px] lg:max-w-none mx-auto">
            Curated performance compounds to elevate your research potential.
          </p>
        </div>
        
        <div className="w-full lg:w-[30%] flex gap-4 lg:gap-4 items-center justify-center lg:justify-end pb-4 lg:pb-0">
          {/* Preview Image Block */}
          <div className="relative w-16 lg:w-16 h-24 lg:h-24 rounded-lg overflow-hidden bg-cream-warm shadow-md shrink-0">
             <Image 
                src="/temp-homepage/hero-vial-image.webp" 
                fill 
                className="object-cover" 
                alt="Product Preview" 
             />
          </div>
          {/* Stats Block */}
          <div className="bg-[#EBE0C5] rounded-xl p-4 lg:p-4 flex flex-col gap-2 lg:gap-2 shadow-sm min-w-[120px] shrink-0">
             <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#EBE0C5] bg-[#C9B58E] overflow-hidden relative"></div>
                <div className="w-8 h-8 rounded-full border-2 border-[#EBE0C5] bg-[#A89570] overflow-hidden relative"></div>
                <div className="w-8 h-8 rounded-full border-2 border-[#EBE0C5] bg-[#8C7A55] overflow-hidden relative"></div>
             </div>
             <p className="text-ink">
               <span className="text-xl font-bold leading-none block mb-0.5">2K+</span>
               <span className="text-[10px] font-medium leading-tight block">Happy customers<br/>worldwide</span>
             </p>
          </div>
        </div>
      </div>
    </section>
  )
}
