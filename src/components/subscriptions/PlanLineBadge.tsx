'use client'

import React from 'react'
import { Repeat } from 'lucide-react'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'
import { everyLabel } from '@/lib/subscriptions/labels'

/** Small label shown under a cart / checkout line that is a subscription plan, with an explanation. */
export function PlanLineBadge({ months, className = '' }: { months?: number | null; className?: string }) {
  if (!months) return null
  return (
    <span className={`mt-1.5 inline-flex w-fit items-center gap-1 ${className}`}>
      <span
        className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
        data-testid="plan-line-badge"
      >
        <Repeat size={10} /> {`Delivered ${everyLabel(months)}`}
      </span>
      <InfoTip label="How often will I be invoiced?">{HELP.billedEvery}</InfoTip>
    </span>
  )
}
