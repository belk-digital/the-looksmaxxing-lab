'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { ShoppingBag, Menu } from 'lucide-react'
import { MobileMenu } from './MobileMenu'
import { useCartStore } from '@/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function ClientHeader({ cartItemCount = 0, wishlistItemCount = 0 }) {
  const cartStore = useCartStore()
  const activeCartCount = cartStore.items.reduce((acc, i) => acc + i.quantity, 0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const difference = y - lastYRef.current
    if (Math.abs(difference) > 20) { // Require a 20px threshold before triggering
      if (difference > 0 && y > 150) {
        setHidden(true) // Scroll down and past 150px
      } else {
        setHidden(false) // Scroll up
      }
      lastYRef.current = y
    }
  })

  return (
    <div className="fixed top-6 inset-x-0 z-sticky flex justify-center pointer-events-none px-4">
      
      <motion.header
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        initial="hidden"
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[1100px] h-[60px] rounded-full bg-[#110915] shadow-2xl flex items-center justify-between px-6 md:px-8 pointer-events-auto border border-white/10"
      >
        {/* Mobile Hamburger */}
        <div className="flex md:hidden flex-1">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-white">
            <Menu size={20} />
          </button>
        </div>

        {/* Left: Logo (Mimicking the reference swirl) */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <svg width="48" height="24" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 15 C15 7, 45 7, 45 15 C45 23, 20 23, 20 15 C20 11, 40 11, 40 15 C40 19, 25 19, 25 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 15 C5 2, 55 2, 55 15 C55 28, 10 28, 10 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="58" cy="4" r="1.5" fill="white" />
            </svg>
          </Link>
        </div>

        {/* Center: Nav (Restored original site links) */}
        <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 flex-1">
          <Link href="/shop" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            SHOP
          </Link>
          <Link href="/peptide-calculator" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            CALCULATOR
          </Link>
          <Link href="/about" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            ABOUT
          </Link>
          <Link href="/journal" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            JOURNAL
          </Link>
          <Link href="/faq" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            FAQ
          </Link>
          <Link href="/contact" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            CONTACT
          </Link>
          <Link href="/affiliates" className="text-[9px] xl:text-[10px] font-sans font-medium text-white tracking-[0.2em] uppercase hover:text-white/70 transition-colors">
            AFFILIATES
          </Link>
        </nav>

        {/* Right: SHOP NOW Button & Cart */}
        <div className="flex items-center justify-end gap-5 flex-1 lg:flex-none">
          <button onClick={cartStore.openCart} className="p-1 text-white hover:text-white/70 transition-colors relative flex items-center justify-center">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <AnimatePresence>
              {activeCartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-[14px] h-[14px] flex items-center justify-center rounded-full"
                >
                  {activeCartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          <Link href="/shop" className="hidden md:inline-flex border border-white/30 rounded-full px-7 py-2.5 text-[9px] font-semibold tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all">
            SHOP NOW
          </Link>
        </div>
      </motion.header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <CartDrawer />
    </div>
  )
}
