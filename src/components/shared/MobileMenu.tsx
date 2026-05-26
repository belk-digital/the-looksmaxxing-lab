'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Search, Heart, User } from 'lucide-react'
import Link from 'next/link'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [activeView, setActiveView] = useState<'main' | 'shop'>('main')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEsc)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleEsc)
      }
    } else {
      // Reset view when closed so it opens fresh next time
      const timer = setTimeout(() => setActiveView('main'), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const menuVariants = {
    closed: { x: '100%' },
    open: { x: 0 },
  }

  const panelVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-cream flex flex-col overflow-hidden pointer-events-auto"
        >
          {/* Top Bar */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
            <button onClick={onClose} className="p-2 -ml-2 text-ink hover:text-gold transition-colors">
              <X size={24} strokeWidth={1.5} />
            </button>
            <span className="font-sans text-label-md uppercase tracking-wider text-ink text-center flex-1 pr-6">
              THE LOOKSMAXXING LAB
            </span>
          </div>

          {/* Main Content Area */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence initial={false}>
              {activeView === 'main' && (
                <motion.div
                  key="main"
                  initial={{ x: '-20%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-20%', opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 overflow-y-auto flex flex-col px-6 py-8"
                >
                  <nav className="flex flex-col gap-6 mb-12">
                    <button 
                      onClick={() => setActiveView('shop')}
                      className="flex items-center justify-between text-left font-display text-display-sm text-ink group"
                    >
                      SHOP
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </button>
                    <Link href="/peptide-calculator" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      CALCULATOR
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                    <Link href="/about" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      ABOUT
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                    <Link href="/journal" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      JOURNAL
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                    <Link href="/faq" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      FAQ
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                    <Link href="/contact" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      CONTACT
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                    <Link href="/affiliates" onClick={onClose} className="flex items-center justify-between text-left font-display text-display-sm text-ink group">
                      AFFILIATES
                      <ChevronRight size={24} className="text-ink-muted group-hover:text-gold transition-colors" strokeWidth={1.5} />
                    </Link>
                  </nav>

                  <div className="h-px bg-border-subtle w-full mb-8" />

                  <div className="flex flex-col gap-6">
                    <button className="flex items-center gap-4 text-body-lg text-ink hover:text-gold transition-colors text-left">
                      <Search size={20} strokeWidth={1.5} /> Search
                    </button>
                    <Link href="/wishlist" onClick={onClose} className="flex items-center gap-4 text-body-lg text-ink hover:text-gold transition-colors">
                      <Heart size={20} strokeWidth={1.5} /> Wishlist
                    </Link>
                    <Link href="/account" onClick={onClose} className="flex items-center gap-4 text-body-lg text-ink hover:text-gold transition-colors">
                      <User size={20} strokeWidth={1.5} /> Account
                    </Link>
                  </div>

                  <div className="mt-auto pt-12 pb-8">
                    <div className="flex items-center gap-4 text-label-md font-sans text-ink-muted uppercase tracking-wider">
                      <button className="text-ink hover:text-gold transition-colors">EN</button>
                      <span className="text-border-subtle">|</span>
                      <button className="hover:text-gold transition-colors">ES</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'shop' && (
                <motion.div
                  key="shop"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={panelVariants}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-cream overflow-y-auto px-6 py-8 flex flex-col z-10"
                >
                  <button 
                    onClick={() => setActiveView('main')}
                    className="flex items-center gap-2 text-label-md font-sans uppercase tracking-wider text-ink-muted mb-10 hover:text-gold transition-colors"
                  >
                    <ChevronLeft size={16} strokeWidth={1.5} /> Back
                  </button>

                  <h3 className="font-display text-display-sm text-ink mb-8">SHOP</h3>

                  <ul className="flex flex-col gap-6 pb-8">
                    {['Bioregulators', 'Cellular Health', 'Cognitive', 'Essentials', 'Growth Factor', 'Metabolic', 'Receptor Agonist', 'Recovery'].map(cat => (
                      <li key={cat}>
                        <Link 
                          href={`/shop/${cat.toLowerCase().replace(' ', '-')}`} 
                          onClick={onClose}
                          className="text-body-lg text-ink hover:text-gold transition-colors block"
                        >
                          {cat}
                        </Link>
                      </li>
                    ))}
                    <li className="pt-4 mt-2 border-t border-border-subtle">
                      <Link href="/shop" onClick={onClose} className="text-body-lg text-ink font-medium hover:text-gold transition-colors block">
                        View All Products
                      </Link>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
