'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  'Bioregulators', 'Cellular Health', 'Cognitive Function', 
  'Essentials', 'Growth Factor', 'Metabolic', 
  'Receptor Agonist', 'Recovery'
]

function FilterSidebarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Local state for optimistic UI updates before pushing to URL
  const [categories, setCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [inStock, setInStock] = useState(false)
  const [onSale, setOnSale] = useState(false)
  const [backorder, setBackorder] = useState(false)
  const [purity, setPurity] = useState<string>('All')

  // Sync from URL
  useEffect(() => {
    setCategories(searchParams.getAll('category'))
    const minP = searchParams.get('minPrice')
    const maxP = searchParams.get('maxPrice')
    if (minP && maxP) setPriceRange([parseInt(minP), parseInt(maxP)])
    else setPriceRange([0, 500])
    
    setInStock(searchParams.get('inStock') === 'true')
    setOnSale(searchParams.get('onSale') === 'true')
    setBackorder(searchParams.get('backorder') === 'true')
    setPurity(searchParams.get('purity') || 'All')
  }, [searchParams])

  const updateFilters = useCallback((key: string, value: string | string[] | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === false || (Array.isArray(value) && value.length === 0)) {
      params.delete(key)
    } else if (Array.isArray(value)) {
      params.delete(key)
      value.forEach(v => params.append(key, v))
    } else {
      params.set(key, String(value))
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const toggleCategory = (cat: string) => {
    const next = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat]
    updateFilters('category', next)
  }

  const handlePriceCommit = (val: number[]) => {
    if (val.length === 2) {
      updateFilters('minPrice', val[0].toString())
      updateFilters('maxPrice', val[1].toString())
    }
  }

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  const Content = () => (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      {/* Category Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-label-md uppercase tracking-wider text-ink border-b border-border-subtle pb-2">
          Category
        </h4>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map(cat => (
            <div key={cat} className="flex items-center space-x-3">
              <Checkbox 
                id={`cat-${cat}`} 
                checked={categories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              <Label htmlFor={`cat-${cat}`} className="text-body-sm text-ink cursor-pointer leading-none">
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-label-md uppercase tracking-wider text-ink border-b border-border-subtle pb-2">
          Price
        </h4>
        <div className="px-2 pt-4">
          <Slider 
            defaultValue={[0, 500]} 
            value={[priceRange[0], priceRange[1]]} 
            max={500} 
            step={10} 
            onValueChange={(val) => setPriceRange([val[0], val[1]])}
            onValueCommit={handlePriceCommit}
          />
          <div className="flex justify-between items-center mt-4 text-body-sm text-ink-muted">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1] === 500 ? '500+' : priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Availability Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-label-md uppercase tracking-wider text-ink border-b border-border-subtle pb-2">
          Availability
        </h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="instock" 
              checked={inStock}
              onCheckedChange={(c) => updateFilters('inStock', c === true)}
            />
            <Label htmlFor="instock" className="text-body-sm text-ink cursor-pointer">In stock</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="onsale" 
              checked={onSale}
              onCheckedChange={(c) => updateFilters('onSale', c === true)}
            />
            <Label htmlFor="onsale" className="text-body-sm text-ink cursor-pointer">On sale</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="backorder" 
              checked={backorder}
              onCheckedChange={(c) => updateFilters('backorder', c === true)}
            />
            <Label htmlFor="backorder" className="text-body-sm text-ink cursor-pointer">Available to backorder</Label>
          </div>
        </div>
      </div>

      {/* Purity Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-label-md uppercase tracking-wider text-ink border-b border-border-subtle pb-2">
          Purity
        </h4>
        <RadioGroup value={purity} onValueChange={(v) => updateFilters('purity', v === 'All' ? null : v)}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="All" id="r-all" />
            <Label htmlFor="r-all" className="text-body-sm text-ink cursor-pointer">All</Label>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <RadioGroupItem value="≥99%" id="r-99" />
            <Label htmlFor="r-99" className="text-body-sm text-ink cursor-pointer">≥99%</Label>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <RadioGroupItem value="≥99.5%" id="r-995" />
            <Label htmlFor="r-995" className="text-body-sm text-ink cursor-pointer">≥99.5%</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-4">
        <Button variant="link" onClick={clearAll} className="w-full text-ink-muted hover:text-ink px-0">
          Clear all filters
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[280px] shrink-0 sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto pr-6 custom-scrollbar">
        <Content />
      </aside>

      {/* Mobile Full-Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-cream p-6 overflow-y-auto md:hidden pt-24"
          >
            <h2 className="text-display-sm font-display text-ink mb-8">Filters</h2>
            <Content />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-ink text-cream rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label="Toggle filters"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="filter"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Filter size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  )
}

export function FilterSidebar() {
  return (
    <Suspense fallback={<div className="w-[280px] hidden md:block shrink-0" />}>
      <FilterSidebarInner />
    </Suspense>
  )
}
