'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface Variant {
  id: string
  title: string
  price: string
  inStock: boolean
}

interface VariantSelectorProps {
  variants: Variant[]
  value: string
  onChange: (id: string) => void
  label?: string
}

export function VariantSelector({ variants, value, onChange, label = 'Size' }: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className="text-label-md uppercase tracking-wider text-ink-muted">
          {label}
        </span>
      )}
      <div className="flex flex-col gap-2">
        {variants.map((variant) => {
          const isSelected = value === variant.id
          return (
            <button
              key={variant.id}
              onClick={() => variant.inStock && onChange(variant.id)}
              disabled={!variant.inStock}
              className={cn(
                "flex items-center w-full px-4 py-3 border rounded-sm transition-colors text-left",
                isSelected 
                  ? "border-ink bg-cream-warm" 
                  : "border-border-subtle bg-transparent hover:border-ink/50",
                !variant.inStock && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Custom Radio Circle */}
                <div className={cn(
                  "w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0",
                  isSelected ? "border-ink" : "border-border-subtle"
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-ink" />}
                </div>
                
                <span className={cn(
                  "text-body-md text-ink flex-1",
                  !variant.inStock && "line-through"
                )}>
                  {variant.title} <span className="mx-2">·</span> {variant.price}
                  {!variant.inStock && <span className="ml-2 uppercase text-label-sm tracking-wider">· OUT OF STOCK</span>}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
