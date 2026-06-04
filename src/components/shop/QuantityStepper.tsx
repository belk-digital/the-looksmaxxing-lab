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
  theme?: 'light' | 'dark'
}

export function QuantityStepper({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  className,
  theme = 'light'
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
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button 
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      
      <div className="w-4 flex items-center justify-center font-medium text-body-md select-none text-ink">
        {value}
      </div>
      
      <button 
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
