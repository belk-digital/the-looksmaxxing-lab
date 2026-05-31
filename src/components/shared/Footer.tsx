'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { ArrowRight } from 'lucide-react'

const FooterContent = () => (
  <div className="bg-ink text-cream pt-16 pb-8 w-full flex flex-col items-center overflow-hidden">
    <Container size="wide" className="flex flex-col w-full relative z-10">
      
      {/* 1. Top Grid: Newsletter (Left) & Links (Right) */}
      <div className="flex flex-col lg:flex-row justify-between gap-12 mb-12">
        
        {/* Newsletter */}
        <div className="w-full lg:w-5/12 flex flex-col items-start text-left">
          <span className="text-[10px] uppercase tracking-widest text-gold mb-4 font-bold">STAY UPDATED</span>
          <h2 className="font-display text-4xl mb-4 leading-[0.9] tracking-tight">
            Research uninterrupted.
          </h2>
          <p className="text-xs text-cream/60 mb-8 max-w-sm leading-relaxed">
            Quiet updates on new compounds, lab notes, and exclusive availability. No marketing noise.
          </p>
          <form className="flex w-full max-w-sm gap-0 border-b border-cream/20 hover:border-gold transition-colors pb-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email address" 
              required
              className="bg-transparent border-none text-cream placeholder:text-cream/40 focus:outline-none flex-1 px-0 h-8 text-xs"
            />
            <button type="submit" className="shrink-0 flex items-center justify-center w-8 h-8 text-gold hover:translate-x-1 transition-transform group">
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>
        </div>

        {/* Links Grid */}
        <div className="w-full lg:w-7/12 flex flex-wrap justify-between lg:justify-end gap-x-8 xl:gap-x-16 gap-y-8">
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] uppercase tracking-widest text-gold font-bold">Shop</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/shop" className="text-xs text-cream/60 hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop" className="text-xs text-cream/60 hover:text-white transition-colors">Best Sellers</Link></li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] uppercase tracking-widest text-gold font-bold">Connect</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/contact" className="text-xs text-cream/60 hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="text-xs text-cream/60 hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] uppercase tracking-widest text-gold font-bold">The Lab</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/about" className="text-xs text-cream/60 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/journal" className="text-xs text-cream/60 hover:text-white transition-colors">Journal</Link></li>
                <li><Link href="/affiliates" className="text-xs text-cream/60 hover:text-white transition-colors">Affiliates</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] uppercase tracking-widest text-gold font-bold">Resources</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/peptide-calculator" className="text-xs text-cream/60 hover:text-white transition-colors">Peptide Calculator</Link></li>
                <li><Link href="/certificates" className="text-xs text-cream/60 hover:text-white transition-colors">COA Library</Link></li>
                <li><Link href="/faq" className="text-xs text-cream/60 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>

        </div>
      </div>



      {/* 3. Bottom Row: Copyright, Credits, Legal */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
          <p className="text-[9px] sm:text-[10px] text-cream/40 uppercase tracking-widest">
            © {new Date().getFullYear()} The Looksmaxxing Lab.
          </p>
          <span className="hidden md:block text-cream/10">|</span>
          <p className="text-[9px] sm:text-[10px] text-cream/40 uppercase tracking-widest">
            Designed by <a href="https://belkdigital.com" target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-gold transition-colors font-bold">Belk Digital</a>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
          <Link href="/terms" className="text-[9px] sm:text-[10px] text-cream/40 hover:text-white uppercase tracking-widest transition-colors">Terms</Link>
          <Link href="/privacy" className="text-[9px] sm:text-[10px] text-cream/40 hover:text-white uppercase tracking-widest transition-colors">Privacy</Link>
          <Link href="/refund" className="text-[9px] sm:text-[10px] text-cream/40 hover:text-white uppercase tracking-widest transition-colors">Refund</Link>
          <Link href="/disclaimer" className="text-[9px] sm:text-[10px] text-cream/40 hover:text-white uppercase tracking-widest transition-colors">Disclaimer</Link>
        </div>
      </div>

      {/* 4. FDA Disclaimer Box */}
      <div className="w-full text-center text-[9px] leading-relaxed text-cream/30">
        <p className="max-w-4xl mx-auto">
          <strong className="text-cream/50">FDA Disclaimer:</strong> These statements have not been evaluated by the FDA. Products are strictly for laboratory and research use only. Not intended to diagnose, treat, cure, or prevent any disease, and not for human or animal consumption.
        </p>
      </div>

    </Container>
  </div>
)

export function Footer() {
  const [footerHeight, setFooterHeight] = useState(0)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!footerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      setFooterHeight(entries[0].contentRect.height)
    })
    resizeObserver.observe(footerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <>
      <div 
        className="w-full relative pointer-events-none" 
        style={{ height: footerHeight ? `${footerHeight}px` : '100vh' }} 
      />
      <footer 
        ref={footerRef}
        className="fixed bottom-0 left-0 w-full z-[-1] bg-ink"
      >
        <FooterContent />
      </footer>
    </>
  )
}
