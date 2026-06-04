'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface Variant {
  id: string
  title: string
  price: string
  salePrice?: string
  inStock: boolean
}

interface VariantSelectorProps {
  variants: Variant[]
  value: string
  onChange: (id: string) => void
  label?: string
  theme?: 'light' | 'dark'
}

export function VariantSelector({ variants, value, onChange, label = 'Size', theme = 'light' }: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className="text-label-md uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
      <div className="grid grid-cols-2 gap-3">
        {variants.map((variant) => {
          const isSelected = value === variant.id
          return (
            <button
              key={variant.id}
              onClick={() => variant.inStock && onChange(variant.id)}
              disabled={!variant.inStock}
              className={cn(
                "flex flex-col items-center justify-center w-full px-4 py-3 border rounded-sm transition-all duration-300 text-center",
                isSelected 
                  ? theme === 'dark' ? "border-white bg-white text-ink" : "border-ink bg-ink text-cream" 
                  : theme === 'dark' ? "border-white/20 bg-transparent text-white hover:border-white" : "border-border-default bg-transparent text-ink hover:border-ink",
                !variant.inStock && (theme === 'dark' ? "opacity-40 cursor-not-allowed bg-transparent text-white/50 border-white/10 hover:border-white/10" : "opacity-40 cursor-not-allowed bg-transparent text-ink-muted border-border-subtle hover:border-border-subtle")
              )}
            >
              <span className={cn(
                "text-label-md uppercase tracking-wider mb-1",
                !variant.inStock && "line-through"
              )}>
                {variant.title}
              </span>
              <span className="text-body-sm font-medium opacity-80">
                {variant.inStock ? variant.price : 'OUT OF STOCK'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
