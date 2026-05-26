'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function QuantityStepper({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  className
}: QuantityStepperProps) {
  
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    if (value > min) onChange(value - 1)
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    if (value < max) onChange(value + 1)
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <button 
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-sm text-ink hover:border-ink hover:text-gold transition-colors disabled:opacity-40 disabled:hover:border-border-subtle disabled:hover:text-ink"
        aria-label="Decrease quantity"
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      
      <div className="w-8 h-8 flex items-center justify-center font-mono text-body-md text-ink select-none">
        {value}
      </div>
      
      <button 
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-sm text-ink hover:border-ink hover:text-gold transition-colors disabled:opacity-40 disabled:hover:border-border-subtle disabled:hover:text-ink"
        aria-label="Increase quantity"
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
