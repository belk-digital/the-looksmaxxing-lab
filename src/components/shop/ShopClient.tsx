'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Container } from '@/components/ui/container'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { ProductCard, StandardProduct } from '@/components/shop/ProductCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { motion, useInView } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

const GENERATE_PRODUCTS = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `prod-${startIndex + i}`,
    name: `Test Compound ${startIndex + i + 1}`,
    slug: `test-compound-${startIndex + i + 1}`,
    image: '/temp-products/product-image.png',
    descriptor: 'EXPERIMENTAL · 5MG',
    price: '$' + ((((startIndex + i) * 17) % 150) + 50) + '.00',
    badge: (startIndex + i) % 7 === 0 ? 'bestseller' : (startIndex + i) % 5 === 0 ? 'new' : undefined
  })) as StandardProduct[]
}

const INITIAL_PRODUCTS = GENERATE_PRODUCTS(24)
const MORE_PRODUCTS = GENERATE_PRODUCTS(23, 24)

function ShopClientInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<StandardProduct[]>(INITIAL_PRODUCTS)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  const loadMoreRef = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef, { margin: "400px" })

  // Infinite scroll trigger
  useEffect(() => {
    if (isInView && hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      // Fake network delay for smooth UX
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
    
    searchParams.getAll('category').forEach(cat => {
      chips.push({ key: `category-${cat}`, label: cat, value: cat })
    })
    
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
    <div className="w-full bg-cream min-h-screen">
      <Container size="page" className="py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-label-sm uppercase tracking-wider text-ink-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-ink">Shop</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-display-md font-display text-ink mb-4">All compounds</h1>
          <p className="text-body-lg text-ink-muted max-w-2xl">
            Explore our complete catalog of research-grade peptides and compounds. Filter by category, purity, and availability to find exactly what your protocol requires.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col md:flex-row gap-12 relative items-start">
          
          {/* Left: Filter Sidebar */}
          <FilterSidebar />

          {/* Right: Results Area */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <span className="text-body-sm text-ink-muted">
                Showing {products.length} of 47
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-label-sm uppercase tracking-wider text-ink-muted">Sort By</span>
                <div className="w-[180px]">
                  <Select defaultValue="featured">
                    <SelectTrigger className="bg-transparent border-border-subtle h-10">
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
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => removeFilter(chip.key.startsWith('category') ? 'category' : chip.key, chip.value)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-ink/5 hover:bg-ink/10 rounded-full transition-colors group"
                  >
                    <span className="text-label-sm text-ink uppercase tracking-wider">{chip.label}</span>
                    <X size={14} className="text-ink-muted group-hover:text-ink" />
                  </button>
                ))}
              </div>
            )}

            {products.length > 0 ? (
              <>
                {/* Product Grid */}
                <StaggerChildren staggerDelay={0.05} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <motion.div variants={staggerItemVariants} key={product.id} className="flex h-full">
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </StaggerChildren>

                {/* Infinite Scroll Trigger & Loader */}
                {hasMore && (
                  <div ref={loadMoreRef} className="w-full flex justify-center pt-24 pb-12">
                    {isLoadingMore && (
                      <div className="flex flex-col items-center gap-4">
                        <Spinner className="w-8 h-8 text-gold" />
                        <span className="text-label-sm text-ink-muted uppercase tracking-wider">Loading more...</span>
                      </div>
                    )}
                  </div>
                )}
                {!hasMore && (
                  <div className="w-full text-center pt-24 pb-12 text-label-md uppercase tracking-wider text-ink-muted">
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
                  <Button variant="outline" onClick={() => router.push('/shop')}>
                    Clear all filters
                  </Button>
                }
              />
            )}

          </div>
        </div>
      </Container>
    </div>
  )
}

export function ShopClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream w-full" />}>
      <ShopClientInner />
    </Suspense>
  )
}
