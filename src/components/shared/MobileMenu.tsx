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
      const timer = setTimeout(() => setActiveView('main'), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const drawerVariants = {
    closed: { x: '100%', opacity: 1 },
    open: { x: 0, opacity: 1 },
  }

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '-20%', opacity: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-[420px] z-[100] bg-[#FAF7F2] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Top Bar */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-[#D8CCA9]/30 shrink-0">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]">
                MENU
              </span>
              <button onClick={onClose} className="p-2 -mr-2 text-[#0A0A0A] hover:opacity-60 transition-opacity bg-white/50 rounded-full">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                {activeView === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ x: '-10%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-10%', opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 overflow-y-auto flex flex-col px-8 py-10"
                  >
                    <nav className="flex flex-col gap-8 mb-12">
                      <button 
                        onClick={() => setActiveView('shop')}
                        className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group"
                      >
                        Shop
                        <ChevronRight size={24} className="text-[#0A0A0A]/30 group-hover:text-[#0A0A0A] transition-colors" strokeWidth={1} />
                      </button>
                      <Link href="/en/peptide-calculator" onClick={onClose} className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group">
                        Calculator
                      </Link>
                      <Link href="/en/about" onClick={onClose} className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group">
                        About
                      </Link>
                      <Link href="/en/journal" onClick={onClose} className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group">
                        Journal
                      </Link>
                      <Link href="/en/faq" onClick={onClose} className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group">
                        FAQ
                      </Link>
                      <Link href="/en/contact" onClick={onClose} className="flex items-center justify-between text-left text-2xl md:text-3xl font-serif text-[#0A0A0A] group">
                        Contact
                      </Link>
                    </nav>

                    <div className="h-px bg-[#D8CCA9]/40 w-full mb-10" />

                    <div className="flex flex-col gap-6">
                      <button className="flex items-center gap-4 text-[11px] font-sans tracking-[0.15em] uppercase text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors text-left">
                        <Search size={16} strokeWidth={1.5} /> SEARCH
                      </button>
                      <Link href="/en/account/wishlist" onClick={onClose} className="flex items-center gap-4 text-[11px] font-sans tracking-[0.15em] uppercase text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors">
                        <Heart size={16} strokeWidth={1.5} /> WISHLIST
                      </Link>
                      <Link href="/en/account" onClick={onClose} className="flex items-center gap-4 text-[11px] font-sans tracking-[0.15em] uppercase text-[#0A0A0A]/70 hover:text-[#0A0A0A] transition-colors">
                        <User size={16} strokeWidth={1.5} /> ACCOUNT
                      </Link>
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
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 bg-[#FAF7F2] overflow-y-auto px-8 py-10 flex flex-col z-10"
                  >
                    <button 
                      onClick={() => setActiveView('main')}
                      className="flex items-center gap-2 text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]/50 mb-10 hover:text-[#0A0A0A] transition-colors"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} /> BACK
                    </button>

                    <h3 className="font-serif text-3xl text-[#0A0A0A] mb-8 pb-6 border-b border-[#D8CCA9]/30">Shop</h3>

                    <ul className="flex flex-col gap-6 pb-8">
                      {['Bioregulators', 'Cellular Health', 'Cognitive', 'Essentials', 'Growth Factor', 'Metabolic', 'Receptor Agonist', 'Recovery'].map(cat => (
                        <li key={cat}>
                          <Link 
                            href={`/en/shop/${cat.toLowerCase().replace(' ', '-')}`} 
                            onClick={onClose}
                            className="text-lg font-sans text-[#0A0A0A] hover:text-[#0A0A0A]/60 transition-colors block"
                          >
                            {cat}
                          </Link>
                        </li>
                      ))}
                      <li className="pt-6 mt-4 border-t border-[#D8CCA9]/30">
                        <Link href="/en/shop" onClick={onClose} className="text-sm font-sans font-semibold uppercase tracking-wider text-[#0A0A0A] hover:opacity-70 transition-opacity flex items-center justify-between">
                          View All Products
                          <ChevronRight size={16} className="text-[#0A0A0A]/30" strokeWidth={1.5} />
                        </Link>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
