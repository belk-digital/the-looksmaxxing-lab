import React from 'react'
import { Info, Lightbulb, TriangleAlert } from 'lucide-react'

const STYLES = {
  info: { icon: Info, accent: 'bg-info', tint: 'bg-info/10', iconColor: 'text-info', label: 'Info' },
  tip: { icon: Lightbulb, accent: 'bg-gold-dark', tint: 'bg-gold/12', iconColor: 'text-gold-deep', label: 'Tip' },
  warning: { icon: TriangleAlert, accent: 'bg-warning', tint: 'bg-warning/12', iconColor: 'text-warning', label: 'Note' },
} as const

// The calloutBox block's `text` field is a plain string in Payload (not richText),
// so **bold** markers from the content-markdown source never get parsed into real
// bold elsewhere in the pipeline — render them here instead of showing literal asterisks.
function renderWithBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    return m ? <strong key={i} className="font-semibold text-ink">{m[1]}</strong> : <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export function CalloutBox({ style = 'info', text }: { style?: 'info' | 'tip' | 'warning'; text: string }) {
  const { icon: Icon, accent, tint, iconColor, label } = STYLES[style] || STYLES.info
  return (
    <div className="not-prose relative overflow-hidden rounded-xl bg-white border border-border-subtle shadow-sm my-8">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${accent}`} />
      <div className="flex gap-3.5 p-5 md:p-6 pt-6">
        <div className={`shrink-0 flex items-center justify-center size-8 rounded-lg ${tint} ${iconColor}`}>
          <Icon className="size-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <span className={`block text-label-sm uppercase tracking-wider font-semibold mb-1.5 ${iconColor}`}>{label}</span>
          <p className="text-body-md text-ink/80 leading-relaxed">{renderWithBold(text)}</p>
        </div>
      </div>
    </div>
  )
}
