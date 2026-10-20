'use client'

import React from 'react'
import { Check, Repeat } from 'lucide-react'
import { applyPlanDiscount } from '@/lib/subscriptions/discount'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'

export interface PlanOption {
  months: number
  label: string
  discountPercent: number
  badge?: string | null
}

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

/**
 * "One-time purchase" vs "Subscribe & save" on a product page.
 * Prices come from the same cents math the server uses (applyPlanDiscount), so what the customer sees here
 * is exactly what the server will charge for month one.
 */
export function PlanSelector({
  plans,
  unitPrice,
  selected,
  onSelect,
}: {
  plans: PlanOption[]
  /** Current live price of the selected size (per unit, before any plan discount). */
  unitPrice: number
  selected: number | null
  onSelect: (months: number | null) => void
}) {
  if (!plans.length || !(unitPrice > 0)) return null

  const card = (active: boolean) =>
    `w-full text-left rounded-2xl border p-4 transition-all flex items-start gap-4 ${active ? 'border-ink bg-ink/[0.03] shadow-sm' : 'border-ink/10 bg-white hover:border-ink/30'}`

  const dot = (active: boolean) => (
    <span className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border flex items-center justify-center ${active ? 'bg-ink border-ink text-white' : 'border-ink/30'}`}>
      {active && <Check size={12} strokeWidth={3} />}
    </span>
  )

  return (
    <div className="mb-8" data-testid="plan-selector">
      <span className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-ink">
        Purchase options
        <InfoTip label="What is a subscription?">{HELP.whatIsSubscription}</InfoTip>
      </span>
      <div className="flex flex-col gap-3">
        <button type="button" className={card(selected === null)} onClick={() => onSelect(null)} data-testid="plan-one-time">
          {dot(selected === null)}
          <span className="flex-1 flex justify-between gap-3">
            <span className="font-bold text-ink">One-time purchase</span>
            <span className="font-bold text-ink">{money(unitPrice)}</span>
          </span>
        </button>

        {plans.map((plan) => {
          const active = selected === plan.months
          const perMonth = applyPlanDiscount(unitPrice, plan.discountPercent)
          return (
            <button key={plan.months} type="button" className={card(active)} onClick={() => onSelect(plan.months)} data-testid={`plan-${plan.months}`}>
              {dot(active)}
              <span className="flex-1">
                <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="font-bold text-ink flex items-center gap-2">
                    <Repeat size={14} /> Subscribe &middot; {plan.label}
                    {plan.discountPercent > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                        Save {plan.discountPercent}%
                      </span>
                    )}
                    {plan.badge ? <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{plan.badge}</span> : null}
                  </span>
                  <span className="font-bold text-ink">
                    {plan.discountPercent > 0 && <span className="text-ink/30 line-through font-normal mr-2">{money(unitPrice)}</span>}
                    {money(perMonth)}
                    <span className="text-xs font-medium text-ink/50"> / month</span>
                  </span>
                </span>
                <span className="block text-xs text-ink/50 mt-1">
                  {`${plan.months} monthly orders · billed month by month, not all at once`}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <ul className="mt-4 text-xs text-ink/60 leading-relaxed list-disc pl-5 space-y-1" data-testid="plan-explainer">
          <li>You pay month 1 today. Each following month we email an invoice about a week before it is due, and your order ships once it is paid.</li>
          <li>We never charge your card automatically - you pay each invoice yourself, by card or Zelle.</li>
          <li>Each invoice uses that month&apos;s store price, minus your plan discount.</li>
          <li>Pause, skip a month or order the next month early anytime from your account.</li>
        </ul>
      )}
    </div>
  )
}
