'use client'

import React from 'react'
import Link from 'next/link'
import { BadgePercent } from 'lucide-react'
import { MEMBER_DISCOUNT_LABEL, MEMBER_DISCOUNT_PERCENT, memberDiscountLabel } from '@/lib/membership/discount'
import { withNext } from '@/lib/auth/safeRedirect'

/**
 * The member discount as it appears in the cart and checkout summaries.
 * The amounts come from src/lib/membership/discount.ts (the same maths the server uses to charge the order).
 */

/** "Member discount (20%)  -$12.00" - the line for a logged-in customer. Same look as the coupon line. */
export function MemberDiscountRow({ amount, className = '' }: { amount: number; className?: string }) {
  if (!(amount > 0)) return null
  return (
    <div
      data-testid="member-discount-row"
      className={`flex justify-between items-center text-sm font-medium text-green-600 ${className}`}
    >
      <span className="py-1 flex items-center gap-1.5">
        <BadgePercent size={14} aria-hidden="true" /> {memberDiscountLabel()}
      </span>
      <span className="py-1 font-bold">-${amount.toFixed(2)}</span>
    </div>
  )
}

/** Shown with a discount code that is NOT used because the member discount saves the same or more. */
export function CouponNotUsedNote({ className = '' }: { className?: string }) {
  return (
    <span data-testid="coupon-not-used-note" className={`text-xs font-semibold text-ink/70 ${className}`}>
      {`Not used: your ${MEMBER_DISCOUNT_LABEL.toLowerCase()} (${MEMBER_DISCOUNT_PERCENT}%) saves more. `}Discounts can&apos;t be combined.
    </span>
  )
}

/** Shown with a discount code that REPLACED the member discount because it saves more. */
export function MemberNotUsedNote({ className = '' }: { className?: string }) {
  return (
    <span data-testid="member-not-used-note" className={`text-xs font-semibold text-ink/70 ${className}`}>
      Your {MEMBER_DISCOUNT_LABEL.toLowerCase()} isn&apos;t added: this code saves more. Discounts can&apos;t be combined.
    </span>
  )
}

/**
 * For a visitor who is not logged in: what logging in would save on this order, with a link that brings them back.
 * (Shown only when there is something to save and the cart is an ordinary order, not a subscription.)
 */
export function MemberDiscountNudge({ savings, returnTo, className = '' }: { savings: number; returnTo: '/cart' | '/checkout'; className?: string }) {
  if (!(savings > 0)) return null
  return (
    <div
      data-testid="member-discount-nudge"
      className={`flex items-center justify-between gap-3 rounded-xl border border-[#5984c4]/25 bg-[#5984c4]/[0.06] px-4 py-3 text-sm ${className}`}
    >
      <span className="flex items-center gap-2 text-ink/80">
        <BadgePercent size={16} className="shrink-0 text-[#5984c4]" aria-hidden="true" />
        <span>
          Members save <strong className="text-ink">{MEMBER_DISCOUNT_PERCENT}%</strong> on every order
          <span className="hidden sm:inline"> (${savings.toFixed(2)} on this one; can&apos;t be combined with other discounts)</span>.
        </span>
      </span>
      <Link
        href={withNext('/login', returnTo)}
        className="shrink-0 text-xs font-bold uppercase tracking-widest text-ink underline underline-offset-4 hover:text-ink/70"
      >
        Log in
      </Link>
    </div>
  )
}
