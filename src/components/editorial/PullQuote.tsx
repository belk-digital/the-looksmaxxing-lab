import React from 'react'
import { cn } from '@/lib/utils'

export function PullQuote({
  children,
  attribution,
  className,
  showRule = true,
}: {
  children: React.ReactNode
  attribution?: string
  className?: string
  showRule?: boolean
}) {
  return (
    <figure className={cn("max-w-[720px] mx-auto my-20 flex flex-col items-center text-center", className)}>
      <div className="inline-flex flex-col items-center w-fit">
        {showRule && <div className="w-full h-[1px] bg-gold mb-8" />}
        <blockquote className="text-display-sm font-display italic text-ink">
          {children}
        </blockquote>
      </div>
      {attribution && (
        <figcaption className="text-label-md uppercase tracking-wider text-gold mt-6">
          {attribution}
        </figcaption>
      )}
    </figure>
  )
}
