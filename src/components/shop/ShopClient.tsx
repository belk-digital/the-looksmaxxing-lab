'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { FeaturedProductCard, Product } from '@/components/shop/FeaturedProductCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { motion, useInView } from 'framer-motion'
import { X, ChevronRight, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const GENERATE_PRODUCTS = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }).map((_, i) => ({
    name: `Compound ${startIndex + i + 1}`,
    slug: `test-compound-${startIndex + i + 1}`,
    image: '/temp-products/product-image.png',
    shortDescription: 'Highly purified research compound for laboratory use.',
    priceRange: '$' + ((((startIndex + i) * 17) % 150) + 50) + '.00',
    category: 'Research'
  })) as Product[]
}

const INITIAL_PRODUCTS = GENERATE_PRODUCTS(24)
const MORE_PRODUCTS = GENERATE_PRODUCTS(23, 24)

function ShopClientInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
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

  // Infinite scroll trigger
  useEffect(() => {
    if (isInView && hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      setTimeout(() => {
        const nextBatch = MORE_PRODUCTS.slice(products.length - 24, products.length - 24 + 8)
        if (nextBatch.length > 0) {
          setProducts(prev => [...prev, ...nextBatch])
          if (products.length + nextBatch.length >= 47) {
            setHasMore(false)
          }
        } else {
          setHasMore(false)
        }
        setIsLoadingMore(false)
      }, 1000)
    }
  }, [isInView, hasMore, isLoadingMore, products.length])

  // Active chips extraction
  const getActiveChips = () => {
    const chips: { key: string, label: string, value: string }[] = []
    searchParams.getAll('category').forEach(cat => chips.push({ key: `category-${cat}`, label: cat, value: cat }))
    if (searchParams.get('inStock') === 'true') chips.push({ key: 'inStock', label: 'In Stock', value: 'true' })
    if (searchParams.get('onSale') === 'true') chips.push({ key: 'onSale', label: 'On Sale', value: 'true' })
    if (searchParams.get('backorder') === 'true') chips.push({ key: 'backorder', label: 'Available to Backorder', value: 'true' })
    const purity = searchParams.get('purity')
    if (purity) chips.push({ key: 'purity', label: `Purity: ${purity}`, value: purity })
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
    <div className="w-full bg-[#F5F5F7] min-h-screen">
      <Container size="page" className="pt-32 pb-12 md:pt-40">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-label-sm uppercase tracking-wider text-ink/60 mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-ink">Shop</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-display-md font-display text-ink mb-4">All compounds</h1>
          <p className="text-body-lg text-ink/70 max-w-2xl">
            Explore our complete catalog of research-grade peptides and compounds. Filter by category, purity, and availability to find exactly what your guideline requires.
          </p>
        </div>

        {/* Top Toolbar */}
        <div className={`flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 bg-white/95 backdrop-blur-xl border border-ink/10 p-3 sm:p-4 rounded-2xl shadow-sm sticky z-30 transition-all duration-300 ${isScrollingDown ? 'top-4' : 'top-20 sm:top-24'}`}>
          {/* Top Row: Buttons */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full px-4 sm:px-6 gap-2 border-border-subtle hover:bg-ink/5 text-sm sm:text-base">
                    <Filter size={16} />
                    Filters {activeChips.length > 0 && `(${activeChips.length})`}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-border-subtle bg-cream">
                  <div className="p-6 border-b border-border-subtle bg-cream z-10 relative">
                    <SheetTitle className="text-display-xs font-display text-ink">Filters</SheetTitle>
                  </div>
                  <div className="h-[calc(100vh-80px)] p-6 pt-0 overflow-hidden bg-cream relative z-0">
                     <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
              
              <span className="text-body-sm text-ink/60 hidden md:inline-block whitespace-nowrap">
                {products.length} Products
              </span>
            </div>

            <Select defaultValue="featured">
              <SelectTrigger className="w-auto min-w-[140px] sm:w-[180px] bg-transparent border-none focus:ring-0 shadow-none hover:bg-ink/5 rounded-full px-2 sm:px-4 h-10 text-sm sm:text-base justify-end sm:justify-between gap-2">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Best Rated</SelectItem>
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
            <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <motion.div variants={staggerItemVariants} key={product.slug} className="flex h-full w-full">
                  <FeaturedProductCard product={product} />
                </motion.div>
              ))}
            </StaggerChildren>

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

export function ShopClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7] w-full" />}>
      <ShopClientInner />
    </Suspense>
  )
}
