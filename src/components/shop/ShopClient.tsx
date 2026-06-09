'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { PrimaryProductCard, Product } from '@/components/shop/PrimaryProductCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { X, ChevronRight, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu'

import { Category } from '@/components/shop/FilterSidebar'
import { getShopProducts } from '@/app/(frontend)/(shop)/actions'

export interface ShopClientProps {
  initialProducts: Product[]
  totalPages: number
  categories: Category[]
}

function ShopClientInner({ initialProducts, totalPages, categories }: ShopClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsScrollingDown(true)
        } else if (currentScrollY < lastScrollY) {
          setIsScrollingDown(false)
        }
        setLastScrollY(currentScrollY)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])
  
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, { margin: "400px" })

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);

  // Filter update trigger
  useEffect(() => {
    // When searchParams change, reset to page 1 and fetch new products
    const fetchFiltered = async () => {
      const categoriesParam = searchParams.getAll('category')
      const minP = searchParams.get('minPrice')
      const maxP = searchParams.get('maxPrice')
      
      const res = await getShopProducts({
        page: 1,
        categories: categoriesParam.length > 0 ? categoriesParam : undefined,
        inStock: searchParams.get('inStock') === 'true',
        onSale: searchParams.get('onSale') === 'true',
        minPrice: minP ? parseInt(minP) : undefined,
        maxPrice: maxP ? parseInt(maxP) : undefined,
        sort: searchParams.get('sort') || undefined,
      })

      if (res.success) {
        setProducts(res.products as Product[])
        setCurrentPage(1)
        setHasMore(res.hasNextPage || false)
      }
    }
    fetchFiltered()
  }, [searchParams])

  // Infinite scroll trigger
  useEffect(() => {
    if (isInView && hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      const fetchMore = async () => {
        const nextPage = currentPage + 1
        const categoriesParam = searchParams.getAll('category')
        const minP = searchParams.get('minPrice')
        const maxP = searchParams.get('maxPrice')

        const res = await getShopProducts({
          page: nextPage,
          categories: categoriesParam.length > 0 ? categoriesParam : undefined,
          inStock: searchParams.get('inStock') === 'true',
          onSale: searchParams.get('onSale') === 'true',
          minPrice: minP ? parseInt(minP) : undefined,
          maxPrice: maxP ? parseInt(maxP) : undefined,
          sort: searchParams.get('sort') || undefined,
        })

        if (res.success && res.products) {
          setProducts(prev => [...prev, ...(res.products as Product[])])
          setCurrentPage(nextPage)
          setHasMore(res.hasNextPage || false)
        } else {
          setHasMore(false)
        }
        setIsLoadingMore(false)
      }
      fetchMore()
    }
  }, [isInView, hasMore, isLoadingMore, currentPage, searchParams])

  // Active chips extraction
  const getActiveChips = () => {
    const chips: { key: string, label: string, value: string }[] = []
    searchParams.getAll('category').forEach(cat => chips.push({ key: `category-${cat}`, label: cat, value: cat }))
    if (searchParams.get('inStock') === 'true') chips.push({ key: 'inStock', label: 'In Stock', value: 'true' })
    if (searchParams.get('onSale') === 'true') chips.push({ key: 'onSale', label: 'On Sale', value: 'true' })
    return chips
  }

  const removeFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key.startsWith('category-')) {
      const currentCats = params.getAll('category').filter(c => c !== value)
      params.delete('category')
      currentCats.forEach(c => params.append('category', c))
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const activeChips = getActiveChips()

  return (
    <div className="w-full bg-[#f3f4f6] min-h-screen">
      {/* 1. Interactive Window Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[100dvh] flex flex-col items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden bg-white mb-12">
        
        {/* Background Marquee */}
        <div className="absolute bottom-4 left-0 w-full overflow-hidden whitespace-nowrap flex z-0 pointer-events-none">
          <div className="animate-marquee flex items-center whitespace-nowrap w-max opacity-[0.04]">
              {Array(4).fill(0).map((_, i) => (
                <span key={i} className="text-[12vw] lg:text-[7vw] xl:text-[5vw] font-serif uppercase tracking-tighter mx-8 text-ink">
                  PEPTIDES &bull; COMPOUNDS &bull; PURITY &bull; 
                </span>
             ))}
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 h-full flex-1">
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-label-md uppercase tracking-widest text-[#5984c4] mb-4 sm:mb-8 font-bold"
          >
            Our Catalog
          </motion.h2>

          {/* The Interactive Window */}
          <motion.div 
            initial={{ width: '90%', height: '40vh', borderRadius: '3rem' }}
            whileHover={{ width: '98%', height: '60vh', borderRadius: '1.5rem' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden shadow-2xl cursor-pointer group my-8 md:my-12 max-w-[1600px] w-full transform-gpu"
            style={{ width: '85%' }}
          >
             <motion.div 
               className="w-full relative transform-gpu"
               style={{ height: '150%', top: '-25%', y: heroImageY, willChange: 'transform' }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             >
               <Image 
                 src="/hero-image.png" 
                 alt="Research Catalog" 
                 fill 
                 className="object-cover object-center"
                 priority
               />
               <div className="absolute inset-0 bg-[#5984c4]/20 group-hover:bg-[#5984c4]/10 transition-colors duration-700" />
             </motion.div>
             
             {/* Center Overlay Text inside Window */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.h1 
                  className="text-center text-[6vw] sm:text-[7vw] md:text-[8vw] lg:text-[6vw] font-serif text-white leading-none tracking-tight mix-blend-overlay opacity-90 whitespace-nowrap transform-gpu"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  THE COMPLETE COLLECTION
                </motion.h1>
             </div>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-body-lg lg:text-xl text-ink/70 max-w-[720px] mx-auto text-center mt-6 sm:mt-12 leading-relaxed px-6"
          >
            Explore our complete catalog of research-grade peptides and compounds. Filter by category, purity, and availability to find exactly what your guideline requires.
          </motion.p>

        </div>
      </section>

      <Container size="page" className="pb-12" id="products-grid">
        {/* Top Toolbar */}
        <div className={`flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 bg-white/95 backdrop-blur-xl border border-ink/10 p-3 sm:p-4 rounded-2xl shadow-sm sticky z-30 transition-all duration-300 ${isScrollingDown ? 'top-4 sm:top-6' : 'top-[110px] sm:top-[120px]'}`}>
          {/* Top Row: Buttons */}
          <div className="flex items-center justify-start md:justify-between gap-3 sm:gap-4 w-full">
            <div className="flex items-center gap-3 sm:gap-4 w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-auto rounded-full px-4 sm:px-6 gap-2 border-border-subtle hover:bg-ink/5 text-sm sm:text-base">
                    <Filter size={16} />
                    Filters {activeChips.length > 0 && `(${activeChips.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  sideOffset={8} 
                  className="w-[95vw] sm:w-[90vw] md:max-w-[900px] p-0 rounded-2xl border border-ink/10 ring-0 shadow-2xl bg-white/75 overflow-hidden"
                  style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                >
                  {/* Noise Texture Overlay */}
                  <div 
                    className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
                  />
                  <div className="relative z-10 max-h-[75vh] p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar">
                     <FilterSidebar categories={categories} />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <span className="text-body-sm text-ink/60 hidden md:inline-block whitespace-nowrap">
                {products.length} Products
              </span>
            </div>

            <Select 
              defaultValue={searchParams.get('sort') || 'newest'}
              onValueChange={(val) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('sort', val)
                router.push(`${pathname}?${params.toString()}`, { scroll: false })
              }}
            >
              <SelectTrigger className="w-auto min-w-[140px] bg-white/75 backdrop-blur-xl border border-ink/10 focus:ring-0 shadow-sm hover:bg-white/90 rounded-full px-3 sm:px-4 h-10 text-sm sm:text-base justify-between gap-2 transition-all">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white/75 backdrop-blur-xl border-ink/10 rounded-2xl shadow-2xl p-2">
                <SelectItem value="newest" className="rounded-xl cursor-pointer">Newest</SelectItem>
                <SelectItem value="price-asc" className="rounded-xl cursor-pointer">Price: Low to High</SelectItem>
                <SelectItem value="price-desc" className="rounded-xl cursor-pointer">Price: High to Low</SelectItem>
                <SelectItem value="name-asc" className="rounded-xl cursor-pointer">Alphabetical A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Chips Row */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-ink/5 w-full">
              {activeChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => removeFilter(chip.key.startsWith('category') ? 'category' : chip.key, chip.value)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-ink/5 hover:bg-ink/10 rounded-full transition-colors group text-xs sm:text-sm"
                >
                  <span className="text-ink uppercase tracking-wider">{chip.label}</span>
                  <X size={12} className="text-ink/60 group-hover:text-ink" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        {products.length > 0 ? (
          <>
            {/* Product Grid - Full Width */}
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, index) => (
                <motion.div 
                  key={product.slug} 
                  className="flex h-full w-full"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -50px 0px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (index % 12) * 0.05 }}
                >
                  <PrimaryProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Trigger & Loader */}
            {hasMore && (
              <div ref={loadMoreRef} className="w-full flex justify-center pt-24 pb-12">
                {isLoadingMore && (
                  <div className="flex flex-col items-center gap-4">
                    <Spinner className="w-8 h-8 text-ink" />
                    <span className="text-label-sm text-ink/60 uppercase tracking-wider">Loading more...</span>
                  </div>
                )}
              </div>
            )}
            {!hasMore && (
              <div className="w-full text-center pt-24 pb-12 text-label-md uppercase tracking-wider text-ink/60">
                You've reached the end of the catalog.
              </div>
            )}
          </>
        ) : (
          <EmptyState 
            icon={Search} 
            title="No products found" 
            description="Try adjusting your filters to find what you're looking for." 
            action={
              <Button variant="outline" onClick={() => router.push('/shop')} className="rounded-full">
                Clear all filters
              </Button>
            }
          />
        )}
      </Container>
    </div>
  )
}

export function ShopClient(props: ShopClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7] w-full" />}>
      <ShopClientInner {...props} />
    </Suspense>
  )
}
