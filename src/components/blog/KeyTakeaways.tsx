import React from 'react'
import { Check } from 'lucide-react'

export function KeyTakeaways({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-2xl bg-white border border-border-subtle shadow-sm p-6 md:p-8 mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-px w-6 bg-gold" />
        <span className="text-label-md uppercase tracking-wider text-gold-dark font-semibold">Key Takeaways</span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-3 text-body-md text-ink/80 leading-relaxed">
            <span className="shrink-0 flex items-center justify-center size-5 rounded-full bg-gold/12 mt-0.5">
              <Check className="size-3 text-gold-deep" strokeWidth={3} />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
