import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PlanSelector } from '@/components/subscriptions/PlanSelector'
import { PlanLineBadge } from '@/components/subscriptions/PlanLineBadge'

const PLANS = [
  { months: 1, label: 'Every month', discountPercent: 25 },
  { months: 3, label: 'Every 3 months', discountPercent: 20 },
  { months: 6, label: 'Every 6 months', discountPercent: 15 },
]

const html = (selected: number | null = null) =>
  renderToStaticMarkup(React.createElement(PlanSelector, { plans: PLANS, unitPrice: 90, selected, onSelect: () => undefined }))

describe('the plan options on a product page', () => {
  it('say what the customer gets: "Deliver every month / every 3 months / every 6 months"', () => {
    const out = html()
    expect(out).toContain('Deliver every month')
    expect(out).toContain('Deliver every 3 months')
    expect(out).toContain('Deliver every 6 months')
    expect(out).not.toContain('Subscribe ·')
  })

  it('show the discount and the price of ONE order for each plan', () => {
    const out = html()
    for (const [pct, price] of [[25, '$67.50'], [20, '$72.00'], [15, '$76.50']] as const) {
      expect(out).toContain(`Save ${pct}%`)
      expect(out).toContain(price)
    }
    expect(out).toContain('/ order')
    expect(out).toContain('$90.00') // the one-time price, and the struck-through original
  })

  it('keeps the small print short, and does not repeat the title', () => {
    const out = html()
    expect(out).toContain('Subscription · pay one order at a time · pause anytime')
    expect(out).not.toContain('A new order every')
  })

  it('explains the terms only once a plan is chosen, and says it continues until paused', () => {
    expect(html(null)).not.toContain('data-testid="plan-explainer"')
    const chosen = html(3)
    expect(chosen).toContain('data-testid="plan-explainer"')
    expect(chosen).toContain('It continues until you pause it')
    expect(chosen).toContain('We never charge your card automatically')
    expect(chosen).not.toMatch(/week/i) // the real lead time is a setting in the admin
  })

  it('offers no plan at all when there is no price to show', () => {
    expect(renderToStaticMarkup(React.createElement(PlanSelector, { plans: PLANS, unitPrice: 0, selected: null, onSelect: () => undefined }))).toBe('')
  })
})

describe('the plan badge on a cart or checkout line', () => {
  it('says how often it is delivered', () => {
    for (const [months, words] of [[1, 'Delivered every month'], [3, 'Delivered every 3 months'], [6, 'Delivered every 6 months']] as const) {
      const out = renderToStaticMarkup(React.createElement(PlanLineBadge, { months }))
      expect(out).toContain(words)
      expect(out).toContain('data-testid="plan-line-badge"')
    }
  })
  it('shows nothing for a one-time purchase', () => {
    expect(renderToStaticMarkup(React.createElement(PlanLineBadge, { months: null }))).toBe('')
  })
})
