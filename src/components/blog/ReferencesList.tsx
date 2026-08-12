import React from 'react'

export function ReferencesList({ references }: { references: { citationText: string; url: string }[] }) {
  if (!references || references.length === 0) return null
  return (
    <div className="mt-12 pt-8 border-t border-border-subtle">
      <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">References</span>
      <ol className="space-y-2 list-decimal list-inside">
        {references.map((ref, i) => (
          <li key={i} className="text-body-sm text-ink/70 leading-relaxed">
            <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-gold transition-colors underline underline-offset-2">
              {ref.citationText}
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
