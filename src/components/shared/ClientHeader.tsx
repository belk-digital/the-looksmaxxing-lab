'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { Search, Heart, User, ShoppingBag, Menu, X } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { MobileMenu } from './MobileMenu'
import { useCartStore } from '@/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function ClientHeader({ cartItemCount = 0, wishlistItemCount = 0 }) {
  const cartStore = useCartStore()
  const activeCartCount = cartStore.items.reduce((acc, i) => acc + i.quantity, 0)
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50)
  })

  // Mega menu timers
  const enterTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const leaveTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current)
    enterTimeout.current = setTimeout(() => setMegaMenuOpen(true), 100)
  }

  const handleMouseLeave = () => {
    if (enterTimeout.current) clearTimeout(enterTimeout.current)
    leaveTimeout.current = setTimeout(() => setMegaMenuOpen(false), 300)
  }

  return (
    <div className="fixed top-0 inset-x-0 z-sticky flex flex-col pointer-events-none">
      
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-ink flex items-center justify-center relative overflow-hidden pointer-events-auto"
          >
            <span className="text-cream text-label-md">Order over $300 — complimentary 2-day shipping</span>
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="absolute right-4 text-cream hover:text-gold transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        animate={{
          backgroundColor: scrolled ? 'rgba(250, 247, 242, 0.85)' : 'rgba(250, 247, 242, 0)',
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
          borderBottom: scrolled ? '1px solid rgba(216, 205, 184, 0.5)' : '1px solid transparent',
          color: scrolled ? '#0A0A0A' : '#FAF7F2',
        }}
        transition={{ duration: 0.3 }}
        className="h-20 w-full relative pointer-events-auto"
      >
        <Container size="wide" className="h-full flex items-center justify-between">
          
          {/* Mobile Left: Hamburger */}
          <div className="flex md:hidden flex-1">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2">
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Left / Center Mobile: Logo */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <Link href="/" className="font-sans text-label-lg uppercase tracking-wider hover:opacity-80 transition-opacity">
              THE LOOKSMAXXING LAB
            </Link>
          </div>

          {/* Center Desktop: Nav */}
          <nav className="hidden md:flex items-center justify-center gap-12 flex-1 h-full">
            <div 
              className="h-full flex items-center relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/shop" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer">
                SHOP
              </Link>
            </div>
            <Link href="/peptide-calculator" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              CALCULATOR
            </Link>
            <Link href="/about" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              ABOUT
            </Link>
            <Link href="/journal" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              JOURNAL
            </Link>
            <Link href="/faq" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              FAQ
            </Link>
            <Link href="/contact" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              CONTACT
            </Link>
            <Link href="/affiliates" className="text-label-lg uppercase tracking-wider hover:opacity-70 transition-opacity">
              AFFILIATES
            </Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center justify-end gap-4 flex-1 md:flex-none">
            <button className="hidden md:block p-2 hover:opacity-70 transition-opacity">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/account/wishlist" className="hidden md:flex p-2 hover:opacity-70 transition-opacity relative items-center justify-center">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistItemCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
              )}
            </Link>
            <Link href="/account" className="hidden md:flex p-2 hover:opacity-70 transition-opacity items-center justify-center">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <button onClick={cartStore.openCart} className="p-2 hover:opacity-70 transition-opacity relative flex items-center justify-center focus:outline-none">
              <ShoppingBag size={20} strokeWidth={1.5} />
              <AnimatePresence>
                {activeCartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-gold text-ink text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                  >
                    {activeCartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

        </Container>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {megaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute top-full inset-x-0 bg-cream text-ink shadow-lg border-t border-border-subtle overflow-hidden"
            >
              <Container size="wide" className="py-12 flex gap-16">
                <div className="w-1/3">
                  <h3 className="text-label-md uppercase tracking-wider text-ink-muted mb-6">By Category</h3>
                  <ul className="space-y-4">
                    {['Bioregulators', 'Cellular Health', 'Cognitive', 'Essentials', 'Growth Factor', 'Metabolic', 'Receptor Agonist', 'Recovery'].map(cat => (
                      <li key={cat}>
                        <Link href={`/shop/${cat.toLowerCase().replace(' ', '-')}`} className="text-body-md hover:text-gold-dark transition-colors">
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <h3 className="text-label-md uppercase tracking-wider text-ink-muted mb-6">Featured</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <Link href="/products/bpc-157-blend" className="group relative aspect-[4/5] bg-cream-warm rounded-sm overflow-hidden block">
                      <Image 
                        src="/temp-products/header-promo-1.png" 
                        alt="Best Seller Promo" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-ink/60 to-transparent">
                        <span className="text-cream text-label-md uppercase tracking-wider">Best Seller</span>
                      </div>
                    </Link>
                    <Link href="/products/tb-500" className="group relative aspect-[4/5] bg-cream-warm rounded-sm overflow-hidden block">
                      <Image 
                        src="/temp-products/header-promo-2.png" 
                        alt="New Arrival Promo" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-ink/60 to-transparent">
                        <span className="text-cream text-label-md uppercase tracking-wider">New Arrival</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <CartDrawer />
    </div>
  )
}
