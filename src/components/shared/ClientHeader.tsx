'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { ShoppingBag, Menu, Search, X, User } from 'lucide-react'
import { MobileMenu } from './MobileMenu'
import { useCartStore } from '@/lib/cart/store'
import { useWishlistStore } from '@/lib/wishlist/store'
import dynamic from 'next/dynamic'
import { SearchOverlay } from './SearchOverlay'

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer').then(mod => mod.CartDrawer), { ssr: false })

const ANNOUNCEMENTS = [
  "FREE SHIPPING ON ORDERS OVER $300",
  "NEW PEPTIDE BLENDS JUST DROPPED",
  "SUBSCRIBE FOR 15% OFF YOUR FIRST ORDER"
]

export function ClientHeader({ cartItemCount = 0, wishlistItemCount = 0, isLoggedIn = false, categories: initialCategories = [], initialWishlistItems = [], initialCartItems = [] }: any) {
  const cartStore = useCartStore()
  const setCartItems = useCartStore((state) => state.setItems)
  const setWishlistItems = useWishlistStore((state) => state.setItems)
  const activeCartCount = cartStore.items.reduce((acc: any, i: any) => acc + i.quantity, 0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [announcementClosed, setAnnouncementClosed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  const [categoriesData, setCategoriesData] = useState<any[]>(initialCategories)
  const [isLoadingMenu, setIsLoadingMenu] = useState(initialCategories.length === 0)

  useEffect(() => {
    if (initialCategories.length === 0) {
      import('@/app/(frontend)/actions/megaMenu').then(module => {
        module.getMegaMenuData().then(data => {
          setCategoriesData(data)
          setIsLoadingMenu(false)
        })
      })
    }
  }, [initialCategories])

  const cartHydrated = useRef(false)
  const wishlistHydrated = useRef(false)

  // Sync Cart with Backend
  useEffect(() => {
    if (isLoggedIn && !cartHydrated.current) {
      const localItems = cartStore.items
      if (initialCartItems.length > 0) {
        // Backend has a cart, use it
        setCartItems(initialCartItems)
      } else if (localItems.length > 0) {
        // Backend cart is empty, but local has items (e.g. they added items before logging in)
        // Push local items to backend
        import('@/app/(frontend)/actions/cart').then(m => m.syncCartToPayload(localItems))
      }
      cartHydrated.current = true
    }
  }, [isLoggedIn, initialCartItems]) // removed setCartItems and cartStore.items from deps to prevent loop

  // Sync Wishlist with Backend
  useEffect(() => {
    if (isLoggedIn && !wishlistHydrated.current) {
      const localItems = useWishlistStore.getState().items
      if (initialWishlistItems.length > 0) {
        setWishlistItems(initialWishlistItems)
      } else if (localItems.length > 0) {
        // Push local items to backend one by one, since there's no bulk sync for wishlist
        import('@/app/(frontend)/actions/wishlist').then(m => {
          localItems.forEach(item => m.toggleWishlistInPayload(item.id, true))
        })
      }
      wishlistHydrated.current = true
    }
  }, [isLoggedIn, initialWishlistItems])

  // Global Search Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === '/en'

  useEffect(() => {
    const isClosed = sessionStorage.getItem('announcement_closed') === 'true'
    setAnnouncementClosed(isClosed)
    setMounted(true)
    
    if (!isClosed) {
      const timer = setInterval(() => {
        setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length)
      }, 4000)
      return () => clearInterval(timer)
    }
  }, [])

  const closeAnnouncement = () => {
    setAnnouncementClosed(true)
    sessionStorage.setItem('announcement_closed', 'true')
  }
  
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const scrolled = y > 50
    setIsScrolled((prev) => prev === scrolled ? prev : scrolled)
    const difference = y - lastYRef.current
    if (Math.abs(difference) > 20) {
      const shouldHide = difference > 0 && y > 150
      setHidden((prev) => prev === shouldHide ? prev : shouldHide)
      lastYRef.current = y
    }
  })

  const isTransparent = !isScrolled && isHome;
  const headerClasses = `w-full h-[72px] flex items-center justify-between px-6 md:px-12 lg:px-16 pointer-events-auto transition-colors duration-300 relative ${
    isTransparent
      ? 'bg-transparent border-transparent'
      : 'bg-white border-b border-black/10 shadow-sm'
  }`

  const textColor = isTransparent ? 'text-white' : 'text-ink';
  const textHoverColor = isTransparent ? 'hover:text-white/70' : 'hover:text-ink/70';
  const iconColor = isTransparent ? 'white' : 'black';
  const searchBg = isTransparent ? 'bg-white/10 border-white/20 placeholder:text-white/50 focus:border-white/40' : 'bg-black/5 border-black/10 placeholder:text-ink/40 focus:border-black/30';
  const buttonBorder = isTransparent ? 'border-white/30 hover:bg-white hover:text-black' : 'border-black/30 hover:bg-black hover:text-white';

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-sticky flex flex-col pointer-events-none print:hidden">
        
        <motion.div
          variants={{
            visible: { y: 0, opacity: 1 },
            hidden: { y: -100, opacity: 0 }
          }}
          initial="hidden"
          animate={hidden ? "hidden" : "visible"}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full flex flex-col transform-gpu"
        >
          {/* Announcement Bar */}
          {!announcementClosed && (
            <div className="w-full bg-black text-white h-[32px] flex items-center justify-center pointer-events-auto overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={announcementIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9px] font-bold tracking-[0.2em] uppercase absolute text-center w-full px-4"
                >
                  {ANNOUNCEMENTS[announcementIndex]}
                </motion.p>
              </AnimatePresence>
              <button 
                onClick={closeAnnouncement}
                className="absolute right-4 text-white/70 hover:text-white transition-colors"
                aria-label="Close announcement"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          <header className={headerClasses}>
          {/* Left: Logo (Mimicking the reference swirl) */}
          <div className="flex-1 xl:flex-none flex justify-start">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="font-serif text-xl font-bold tracking-tighter" style={{ color: iconColor }}>TLML</span>
            </Link>
          </div>

          {/* Center: Nav (Restored original site links) */}
          <nav className="hidden xl:flex items-center justify-center gap-4 xl:gap-8 flex-1 h-full">
            {(() => {
              const getNavLinkClass = (path: string) => {
                const targetPath = path.replace('/en', '');
                const isActive = targetPath === '' ? pathname === '/en' || pathname === '/' : pathname.includes(targetPath);
                return `text-[9px] xl:text-[10px] font-sans tracking-[0.2em] uppercase transition-all h-full flex items-center border-b-[3px] mt-[3px] ${
                  isActive 
                    ? `font-bold border-current ${textColor} opacity-100` 
                    : `font-medium border-transparent ${textColor} opacity-50 hover:opacity-100`
                }`;
              };

              return (
                <>
                  <Link href="/shop" className={getNavLinkClass('/shop')}>
                    SHOP
                  </Link>
                  
                  <div 
                    className="h-full flex items-center cursor-pointer"
                    onMouseEnter={() => setIsMegaMenuOpen(true)}
                    onMouseLeave={() => setIsMegaMenuOpen(false)}
                  >
                    <Link href="/shop" onClick={() => setIsMegaMenuOpen(false)} className={`flex items-center gap-1 text-[9px] xl:text-[10px] font-sans tracking-[0.2em] uppercase transition-all h-full border-b-[3px] mt-[3px] font-medium border-transparent ${textColor} opacity-50 hover:opacity-100`}>
                      CATEGORIES
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><path d="m6 9 6 6 6-6"/></svg>
                    </Link>
                  </div>
                  
                  <Link href="/peptide-calculator" className={getNavLinkClass('/peptide-calculator')}>
                    CALCULATOR
                  </Link>
                  <Link href="/about" className={getNavLinkClass('/about')}>
                    ABOUT
                  </Link>
                  <Link href="/journal" className={getNavLinkClass('/journal')}>
                    JOURNAL
                  </Link>
                  <Link href="/faq" className={getNavLinkClass('/faq')}>
                    FAQ
                  </Link>
                  <Link href="/contact" className={getNavLinkClass('/contact')}>
                    CONTACT
                  </Link>
                  <Link href="/affiliates" className={getNavLinkClass('/affiliates')}>
                    AFFILIATES
                  </Link>
                </>
              )
            })()}
          </nav>

          {/* Right: Search, SHOP NOW Button & Cart */}
          <div className="flex items-center justify-end gap-4 xl:gap-5 flex-1 xl:flex-none">
            {/* Search Button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className={`p-1 transition-colors relative flex items-center justify-center ${textColor} ${textHoverColor}`}
              aria-label="Open search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <button onClick={cartStore.openCart} aria-label="Open cart" className={`p-1 transition-colors relative flex items-center justify-center ${textColor} ${textHoverColor}`}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              <AnimatePresence>
                {activeCartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute -top-1 -right-1 text-[9px] font-bold w-[14px] h-[14px] flex items-center justify-center rounded-full ${isTransparent ? 'bg-white text-black' : 'bg-black text-white'}`}
                  >
                    {activeCartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            {mounted && isLoggedIn ? (
              <Link href="/account" className={`p-1 transition-colors flex items-center justify-center ${textColor} ${textHoverColor}`}>
                <User size={18} strokeWidth={1.5} />
              </Link>
            ) : mounted ? (
              <Link href="/login" className={`hidden md:inline-flex px-7 py-2.5 text-[9px] font-semibold tracking-[0.2em] uppercase transition-all shadow-md ${isTransparent ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
                LOGIN
              </Link>
            ) : null}
            
            <Link href="/shop" className={`hidden md:inline-flex border rounded-none px-7 py-2.5 text-[9px] font-semibold tracking-[0.2em] uppercase transition-all ${textColor} ${buttonBorder}`}>
              SHOP NOW
            </Link>

            {/* Mobile Hamburger */}
            <button onClick={() => setMobileMenuOpen(true)} className={`xl:hidden p-1 -mr-1 transition-colors ${textColor}`}>
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
          </header>
        </motion.div>

      </div>

      {/* Render the Mega Menu OUTSIDE the motion.div wrapper so backdrop-filter is NOT broken by the stacking context! */}
      {/* Dynamic top calculation: 72px base header height + 32px announcement bar if open */}
      <div 
        className="fixed inset-x-0 z-[45] transition-transform duration-300 ease-out"
        style={{ 
          top: announcementClosed ? '72px' : '104px',
          transform: hidden ? 'translateY(-100px)' : 'translateY(0)'
        }}
      >
        {/* Background Blur Overlay for Mega Menu */}
        <div
          className={`fixed inset-0 bg-black/10 transition-opacity duration-300 ${isMegaMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={isMegaMenuOpen ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : undefined}
          onMouseEnter={() => setIsMegaMenuOpen(false)}
        />

        {/* Full-Width Mega Menu Dropdown */}
        <div
          className={`absolute left-0 right-0 w-full bg-white border-b border-gray-100 shadow-xl transition-all duration-300 overflow-hidden ${isMegaMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-2'}`}
          onMouseEnter={() => setIsMegaMenuOpen(true)}
          onMouseLeave={() => setIsMegaMenuOpen(false)}
        >
          {/* Noise Texture Overlay */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

          <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 lg:px-16 pt-8 pb-10 flex gap-12 xl:gap-20 relative z-10">
              
              {/* Left: Category List */}
              <div className="w-1/4 flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Explore</h4>
                {isLoadingMenu ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="h-4 w-48 bg-gray-100 animate-pulse rounded-sm" />
                    </div>
                  ))
                ) : categoriesData.map((cat: any, index: number) => {
                  const isActive = activeCategory === cat.id || (activeCategory === null && index === 0);
                  return (
                    <Link 
                      key={cat.id ? `${cat.id}-${index}` : index} 
                      href={`/shop?category=${encodeURIComponent(cat.name)}#products-grid`}
                      onClick={() => setIsMegaMenuOpen(false)}
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      className={`group/link flex items-center justify-between py-3 border-b border-gray-100 transition-colors ${isActive ? 'text-black border-black' : 'text-gray-400 hover:text-black hover:border-gray-300'}`}
                    >
                      <span className="text-[14px] xl:text-[16px] font-light uppercase tracking-[0.15em]">{cat.name}</span>
                      <svg 
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                        className={`transition-transform duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-50'}`}
                      >
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </Link>
                  )
                })}
              </div>

              {/* Right: Products Area */}
              <div className="w-3/4 flex flex-col relative min-h-[400px]">
                {isLoadingMenu ? (
                  <div className="flex flex-col w-full h-full">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <div className="h-6 w-64 bg-gray-100 animate-pulse rounded-sm mb-3" />
                        <div className="h-3 w-32 bg-gray-50 animate-pulse rounded-sm" />
                      </div>
                      <div className="h-4 w-24 bg-gray-100 animate-pulse rounded-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-8 xl:gap-12 flex-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-4">
                          <div className="w-full aspect-[3/4] bg-gray-100 animate-pulse rounded-sm" />
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-4 w-32 bg-gray-100 animate-pulse rounded-sm" />
                            <div className="h-3 w-16 bg-gray-50 animate-pulse rounded-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : categoriesData.map((cat: any, index: number) => {
                  const isActive = activeCategory === cat.id || (activeCategory === null && index === 0);
                  return (
                    <div 
                      key={cat.id ? `${cat.id}-${index}` : index} 
                      className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
                    >
                      <div className="flex justify-between items-end mb-8">
                        <Link 
                          href={`/shop?category=${encodeURIComponent(cat.name)}#products-grid`}
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="group/collection-title block"
                        >
                          <h3 className="text-2xl font-light text-black mb-2 group-hover/collection-title:text-gray-600 transition-colors">{cat.name} Collection</h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Featured Selections</p>
                        </Link>
                        <Link 
                          href={`/shop?category=${encodeURIComponent(cat.name)}#products-grid`}
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="text-[10px] font-bold text-black uppercase tracking-[0.2em] border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors"
                        >
                          Shop All {cat.name} &rarr;
                        </Link>
                      </div>
                      
                      {cat.products && cat.products.length > 0 ? (
                        <div className="grid grid-cols-3 gap-8 xl:gap-12 flex-1">
                          {cat.products.slice(0, 3).map((prod: any, prodIndex: number) => (
                            <Link 
                              key={prod.id ? `${prod.id}-${prodIndex}` : prodIndex} 
                              href={`/products/${prod.slug}`}
                              onClick={() => setIsMegaMenuOpen(false)}
                              className="group/product flex flex-col cursor-pointer"
                            >
                              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative mb-5 mix-blend-multiply bg-transparent transition-transform duration-700 group-hover/product:-translate-y-2">
                                {/* Subtle glowing aura behind bottle on hover */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full bg-white opacity-0 group-hover/product:opacity-50 blur-2xl transition-opacity duration-700 z-0" />
                                
                                <Image 
                                  src={prod.image} 
                                  alt={prod.name} 
                                  fill 
                                  className="object-cover transition-all duration-700 group-hover/product:scale-105 z-10" 
                                />
                              </div>
                              <div className="flex flex-col items-start px-1 border-l border-transparent group-hover/product:border-black transition-colors duration-300 pl-3">
                                <h5 className="text-[11px] xl:text-[12px] font-bold text-black uppercase tracking-[0.15em] mb-1.5 line-clamp-1">{prod.name}</h5>
                                <div className="flex items-center gap-3">
                                  <p className="text-[10px] font-bold text-gray-500 tracking-widest">${prod.price}</p>
                                  <span className="text-[10px] text-black opacity-0 -translate-x-2 group-hover/product:opacity-100 group-hover/product:translate-x-0 transition-all duration-300">&rarr;</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F5F7] border border-dashed border-gray-300">
                          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">New formulations arriving soon</span>
                          <Link 
                            href={`/shop?category=${encodeURIComponent(cat.name)}#products-grid`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                          >
                            View Catalog
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
      </div>
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        isLoggedIn={isLoggedIn}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <CartDrawer />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
