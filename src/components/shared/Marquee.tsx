import React from 'react'

export interface MarqueeProps {
  items?: string[]
}

const DEFAULT_ITEMS = [
  '≥99% HPLC PURITY',
  'LC-MS VERIFIED',
  'COA WITH EVERY ORDER',
  'US-BASED FULFILLMENT',
  '2-DAY SHIPPING OVER $300'
]

export function Marquee({ items = DEFAULT_ITEMS }: MarqueeProps) {
  return (
    <div className="bg-ink py-3 overflow-hidden flex whitespace-nowrap border-y border-border-subtle">
      <div className="flex w-max motion-safe:animate-marquee motion-reduce:animate-none">
        {[...items, ...items].map((item, index) => (
          <React.Fragment key={index}>
            <span className="text-cream text-label-md uppercase tracking-wider mx-8">
              {item}
            </span>
            <span className="text-gold mx-4" aria-hidden="true">
              ·
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
