import React from 'react'
import { cn } from '@/lib/utils'

export function EyebrowHeading({
  children,
  gold = false,
  showRule = true,
  className,
}: {
  children: React.ReactNode
  gold?: boolean
  showRule?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn(
        "text-label-md uppercase tracking-wider",
        gold ? "text-gold" : "text-ink-muted"
      )}>
        {children}
      </span>
      {showRule && (
        <div className={cn(
          "w-6 h-[1px] mt-2 mb-4",
          gold ? "bg-gold" : "bg-ink-muted"
        )} />
      )}
    </div>
  )
}
