import * as React from "react"
import { cn } from "@/lib/utils"

export interface StockIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  stock: number
}

export function StockIndicator({ stock, className, ...props }: StockIndicatorProps) {
  let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock'
  let label = 'In Stock'
  let dotClass = 'bg-ink-muted'
  let textClass = 'text-ink-muted'

  if (stock === 0) {
    status = 'out-of-stock'
    label = 'Out of Stock'
    dotClass = 'bg-error'
    textClass = 'text-error'
  } else if (stock <= 5) {
    status = 'low-stock'
    label = `Low Stock: ${stock} remaining`
    dotClass = 'bg-gold'
    textClass = 'text-gold-dark'
  }

  return (
    <div className={cn("flex items-center gap-2 font-sans text-body-sm", textClass, className)} {...props}>
      <span className={cn("block size-2 rounded-full", dotClass)} />
      {label}
    </div>
  )
}
