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

export interface Category {
  id: string | number
  name: string
  slug: string
}

export interface FilterSidebarProps {
  categories?: Category[]
}

function FilterSidebarInner({ categories = [] }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Local state for optimistic UI updates before pushing to URL
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [inStock, setInStock] = useState(false)
  const [onSale, setOnSale] = useState(false)

  // Sync from URL
  useEffect(() => {
    setActiveCategories(searchParams.getAll('category'))
    const minP = searchParams.get('minPrice')
    const maxP = searchParams.get('maxPrice')
    if (minP && maxP) setPriceRange([parseInt(minP), parseInt(maxP)])
    else setPriceRange([0, 500])
    
    setInStock(searchParams.get('inStock') === 'true')
    setOnSale(searchParams.get('onSale') === 'true')
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
    const next = activeCategories.includes(cat)
      ? activeCategories.filter(c => c !== cat)
      : [...activeCategories, cat]
    updateFilters('category', next)
  }

  const handlePriceCommit = (val: number[]) => {
    if (val.length === 2) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('minPrice', val[0].toString())
      params.set('maxPrice', val[1].toString())
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
      {/* Category Section */}
      <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-black border-b border-black/10 pb-3">
          Category
        </h4>
        <div className="flex flex-col gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`cat-${cat.slug}`} 
                checked={activeCategories.includes(cat.name)}
                onCheckedChange={() => toggleCategory(cat.name)}
              />
              <Label htmlFor={`cat-${cat.slug}`} className="text-sm font-medium text-black cursor-pointer leading-none">
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-black border-b border-black/10 pb-3">
          Price
        </h4>
        <div className="px-2 pt-4">
          <Slider 
            defaultValue={[0, 500]} 
            value={priceRange} 
            max={500} 
            step={1} 
            onValueChange={(val) => setPriceRange([val[0] || 0, val[1] || 500])}
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
          <h4 className="text-xs font-bold uppercase tracking-widest text-black border-b border-black/10 pb-3">
          Availability
        </h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="instock" 
              checked={inStock}
              onCheckedChange={(c) => updateFilters('inStock', c === true)}
            />
            <Label htmlFor="instock" className="text-sm font-medium text-black cursor-pointer">In stock</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="onsale" 
              checked={onSale}
              onCheckedChange={(c) => updateFilters('onSale', c === true)}
            />
            <Label htmlFor="onsale" className="text-sm font-medium text-black cursor-pointer">On sale</Label>
          </div>
        </div>
      </div>
      </div>
      
      {/* Footer / Clear Button */}
      <div className="pt-8 mt-8 border-t border-black/10 flex justify-end">
        <Button variant="link" onClick={clearAll} className="text-black/60 hover:text-black px-4 font-medium">
          Clear all filters
        </Button>
      </div>
    </div>
    </div>
  )
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  return (
    <Suspense fallback={<div className="w-[280px] hidden md:block shrink-0" />}>
      <FilterSidebarInner categories={categories} />
    </Suspense>
  )
}
