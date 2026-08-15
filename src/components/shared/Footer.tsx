'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { toast } from 'sonner'

const FooterContent = () => {
  const targetRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end end"]
  })
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-25%"])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      toast.success('Successfully subscribed! Welcome to the lab.')
      setEmail('')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while subscribing.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
  <div ref={targetRef} className="bg-[#111111] text-cream pt-12 pb-0 w-full flex flex-col items-center overflow-hidden">
    <Container size="wide" className="flex flex-col w-full relative z-10 px-6 lg:px-12">
      
      {/* 1. Top Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 mb-12">
        
        {/* Left: Socials & Newsletter */}
        <div className="w-full lg:w-5/12 flex flex-col items-start text-left">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <span className="font-serif text-4xl lg:text-5xl font-bold tracking-tighter text-cream">Longevia</span>
          </div>

          <h2 className="text-sm font-medium mb-1 tracking-wide text-cream/90">
            Research uninterrupted — Stay Ahead of New Compounds
          </h2>
          <p className="text-xs text-cream/50 mb-6 max-w-[280px] leading-relaxed">
            Quiet updates on new compounds, lab notes, and exclusive availability.
          </p>
          <form className="flex w-full max-w-[280px] gap-0 border-b border-cream/20 hover:border-cream transition-colors pb-2" onSubmit={handleSubscribe}>
            <input
              type="email"
              aria-label="Research email address"
              placeholder="Enter your research email address"
              required
              disabled={isSubscribing}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none text-cream placeholder:text-cream/40 focus:outline-none flex-1 px-0 h-11 text-xs disabled:opacity-50"
            />
            <button type="submit" disabled={isSubscribing} aria-label="Subscribe to newsletter" className="shrink-0 flex items-center justify-center w-11 h-11 -mr-2 text-cream/70 hover:text-white transition-colors disabled:opacity-50">
              {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Right: Links Grid */}
        <div className="w-full lg:w-7/12 flex flex-wrap justify-between gap-x-8 gap-y-8">
          
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/80 font-medium">Shop</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/shop" className="text-sm text-cream/50 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop" className="text-sm text-cream/50 hover:text-white transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/80 font-medium">Connect</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/contact" className="text-sm text-cream/50 hover:text-white transition-colors">Contact</Link></li>
              <li><a href="mailto:support@longeviaresearch.com" className="text-sm text-cream/50 hover:text-white transition-colors">support@longeviaresearch.com</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/80 font-medium">The Lab</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/about" className="text-sm text-cream/50 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/journal" className="text-sm text-cream/50 hover:text-white transition-colors">Journal</Link></li>
              <li><Link href="/affiliates" className="text-sm text-cream/50 hover:text-white transition-colors">Affiliates</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/80 font-medium">Resources</h3>
            <ul className="flex flex-col gap-4">
              {/* <li><Link href="/peptide-calculator" className="text-sm text-cream/50 hover:text-white transition-colors">Peptide Calculator</Link></li> */}
              <li><Link href="/certificates" className="text-sm text-cream/50 hover:text-white transition-colors">COA Library</Link></li>
              <li><Link href="/faq" className="text-sm text-cream/50 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/journal/peptide-coa-hplc-purity-testing-guide" className="text-sm text-cream/50 hover:text-white transition-colors">COA & Purity Guide</Link></li>
              <li><Link href="/journal/peptide-reconstitution-storage-guide" className="text-sm text-cream/50 hover:text-white transition-colors">Reconstitution Guide</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* 2. Divider & Button */}
      <div className="w-full relative flex items-center mb-8">
        <div className="flex-1 h-[1px] bg-cream/20" />
        <Link href="/shop" className="absolute right-0 bg-white text-[#111111] px-6 lg:px-8 py-2 lg:py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-cream/90 transition-colors shadow-lg">
          Get Started
        </Link>
      </div>

      {/* 3. Bottom Row: FDA Disclaimer & Legal */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-12 mb-0">
        
        <div className="w-full lg:w-1/2 text-left">
          <p className="text-[10px] text-cream/70 leading-relaxed max-w-[500px]">
            <strong className="text-cream/90">FDA Disclaimer:</strong> These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease. All products offered are for laboratory and research use only. They are not intended for human consumption.
          </p>
        </div>

        <div className="w-full lg:w-1/2 flex flex-wrap justify-start lg:justify-end gap-x-8 gap-y-4">
          <Link href="/terms" className="text-[10px] text-cream/70 hover:text-white uppercase tracking-widest transition-colors font-medium">Terms</Link>
          <Link href="/privacy" className="text-[10px] text-cream/70 hover:text-white uppercase tracking-widest transition-colors font-medium">Privacy</Link>
          <Link href="/refund" className="text-[10px] text-cream/70 hover:text-white uppercase tracking-widest transition-colors font-medium">Refund</Link>
          <Link href="/disclaimer" className="text-[10px] text-cream/70 hover:text-white uppercase tracking-widest transition-colors font-medium">Disclaimer</Link>
          <div className="flex flex-col items-start lg:items-end w-full lg:w-auto mt-4 lg:mt-0 gap-1">
            <p className="text-[10px] text-cream/60 uppercase tracking-widest font-medium">
              © {new Date().getFullYear()} Longevia Research.
            </p>
            <p className="text-[10px] text-cream/60 uppercase tracking-widest font-medium">
              Designed and developed by <a href="https://www.belkdigital.com/" target="_blank" rel="noopener noreferrer" className="text-cream/80 underline underline-offset-2 hover:text-white transition-colors">Belk Digital</a>
            </p>
          </div>
        </div>

      </div>

    </Container>
    {/* 4. Massive Overflow Text */}
    <div className="w-full flex justify-center items-end leading-none select-none pointer-events-none translate-y-[30%]">
      <motion.div 
        style={{ x }}
        aria-hidden="true"
        className="text-[14vw] font-sans font-bold text-cream/20 tracking-tighter whitespace-nowrap m-0 p-0"
      >
        Longevia Research. Precision. Purity. Performance. &bull; Longevia Research. Precision. Purity. Performance.
      </motion.div>
    </div>
  </div>
  )
}

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
    <footer className="w-full relative z-40 bg-ink print:hidden" style={{ pointerEvents: 'auto' }}>
      <FooterContent />
    </footer>
  )
}
