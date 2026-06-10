import React, { useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  X, Search, Heart, User, LogIn, ArrowUpRight, 
  Activity, Dna, Brain, ShieldPlus, Sparkles, Zap, Network, BatteryCharging,
  ShoppingBag, Calculator, BookOpen, Microscope,
  HelpCircle, Mail, Users
} from 'lucide-react'
import Link from 'next/link'

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  isLoggedIn?: boolean
  onSearchClick?: () => void
}

const CATEGORIES = [
  { name: 'Bioregulators', icon: Activity },
  { name: 'Cellular Health', icon: Dna },
  { name: 'Cognitive', icon: Brain },
  { name: 'Essentials', icon: ShieldPlus },
  { name: 'Growth Factor', icon: Sparkles },
  { name: 'Metabolic', icon: Zap },
  { name: 'Receptor Agonist', icon: Network },
  { name: 'Recovery', icon: BatteryCharging }
]

const DISCOVER_LINKS = [
  { label: 'Shop All Formulations', href: '/shop', icon: ShoppingBag },
  { label: 'Peptide Calculator', href: '/peptide-calculator', icon: Calculator },
  { label: 'Scientific Journal', href: '/journal', icon: BookOpen },
  { label: 'Our Laboratory', href: '/about', icon: Microscope },
]

const SUPPORT_LINKS = [
  { label: 'F.A.Q', href: '/faq', icon: HelpCircle },
  { label: 'Contact Support', href: '/contact', icon: Mail },
  { label: 'Affiliate Program', href: '/affiliates', icon: Users },
]

export function MobileMenu({ isOpen, onClose, isLoggedIn = false, onSearchClick }: MobileMenuProps) {

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
    }
  }, [isOpen, onClose])

  const menuVariants: Variants = {
    closed: { opacity: 0, scale: 0.96, y: 10 },
    open: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.04,
        delayChildren: 0.1
      } 
    },
    exit: { opacity: 0, scale: 0.98, y: 5, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
  }

  const itemVariants: Variants = {
    closed: { y: 15, opacity: 0, scale: 0.98 },
    open: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="exit"
          variants={menuVariants}
          className="fixed inset-0 z-[100] bg-white flex flex-col pointer-events-auto"
        >
          {/* Header Block - Close button on Right to match new hamburger position! */}
          <motion.div variants={itemVariants} className="h-[72px] flex items-center justify-between px-6 border-b border-black/5 shrink-0 bg-white">
            <div className="flex-1" /> {/* Spacer to perfectly center the Directory text */}
            
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink flex-1 text-center">
              Directory
            </span>
            
            <div className="flex flex-1 justify-end">
              <button onClick={onClose} className="p-2 -mr-2 text-ink hover:bg-black/5 transition-colors rounded-full">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>

          {/* Scrollable Main Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FAFAFA]">
            
            {/* Categories Section */}
            <motion.div variants={itemVariants} className="flex flex-col border-b border-black/5 bg-white">
              <div className="px-6 py-4 border-b border-black/5 bg-[#F5F5F5]">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Shop by Category</h3>
              </div>
              <div className="grid grid-cols-2">
                {CATEGORIES.map((cat, i) => (
                  <Link 
                    key={cat.name}
                    href={`/shop/${cat.name.toLowerCase().replace(' ', '-')}`} 
                    onClick={onClose}
                    className={`flex flex-col gap-3 items-start px-6 py-5 hover:bg-black/5 transition-colors border-b border-black/5 ${i % 2 === 0 ? 'border-r' : ''}`}
                  >
                    <div className="p-2 rounded-full bg-black/5 text-ink">
                      <cat.icon size={16} strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-ink">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Discover Section */}
            <motion.div variants={itemVariants} className="flex flex-col border-b border-black/5 bg-white mt-4">
              <div className="px-6 py-4 border-b border-black/5 bg-[#F5F5F5]">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Discover</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {DISCOVER_LINKS.map((link, i) => (
                  <Link 
                    key={link.label}
                    href={link.href} 
                    onClick={onClose}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-black/5 transition-colors border-b border-black/5 ${i % 2 === 0 ? 'sm:border-r' : ''} last:border-b-0 sm:last:border-b`}
                  >
                    <div className="p-2 rounded-full bg-black/5 text-ink">
                      <link.icon size={16} strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] font-medium text-ink flex-1">{link.label}</span>
                    <ArrowUpRight size={12} className="text-ink/30" strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Support Section */}
            <motion.div variants={itemVariants} className="flex flex-col border-b border-black/5 bg-white mt-4 mb-24">
              <div className="px-6 py-4 border-b border-black/5 bg-[#F5F5F5]">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Support</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {SUPPORT_LINKS.map((link, i) => (
                  <Link 
                    key={link.label}
                    href={link.href} 
                    onClick={onClose}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-black/5 transition-colors border-b border-black/5 ${i % 2 === 0 ? 'sm:border-r' : ''}`}
                  >
                    <link.icon size={16} strokeWidth={1.5} className="text-ink/50" />
                    <span className="text-[12px] font-medium text-ink/70">{link.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Footer Utility Dock */}
          <motion.div 
            variants={itemVariants} 
            className="absolute bottom-0 left-0 right-0 border-t border-black/10 bg-white/95 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe"
          >
            <div className="grid grid-cols-3 h-[72px]">
              <button 
                onClick={() => {
                  onClose();
                  onSearchClick?.();
                }}
                className="flex flex-col items-center justify-center gap-1.5 text-ink/60 hover:text-ink hover:bg-black/5 transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Search</span>
              </button>
              
              <Link href="/account/wishlist" onClick={onClose} className="flex flex-col items-center justify-center gap-1.5 text-ink/60 hover:text-ink hover:bg-black/5 transition-colors border-l border-r border-black/10">
                <Heart size={18} strokeWidth={1.5} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Wishlist</span>
              </Link>
              
              {isLoggedIn ? (
                <Link href="/account" onClick={onClose} className="flex flex-col items-center justify-center gap-1.5 text-ink/60 hover:text-ink hover:bg-black/5 transition-colors">
                  <User size={18} strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Account</span>
                </Link>
              ) : (
                <Link href="/login" onClick={onClose} className="flex flex-col items-center justify-center gap-1.5 text-ink/60 hover:text-ink hover:bg-black/5 transition-colors">
                  <LogIn size={18} strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Login</span>
                </Link>
              )}
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
