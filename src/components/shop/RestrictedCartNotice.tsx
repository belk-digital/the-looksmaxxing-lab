'use client'

import React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Lock } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { cartHasRestricted } from '@/lib/access/restrictedProducts'
import { withNext } from '@/lib/auth/safeRedirect'

/**
 * Shown on the cart and checkout pages to a logged-out visitor whose basket holds a nasal-spray product
 * (added before they logged out, or from a saved basket). Nasal sprays can only be ordered by a logged-in
 * customer: the server refuses the order otherwise, so this explains why and gives them the way forward.
 */
export function RestrictedCartNotice({ returnTo }: { returnTo: '/cart' | '/checkout' }) {
  const { status } = useSession()
  const items = useCartStore((state) => state.items)

  if (status !== 'unauthenticated' || !cartHasRestricted(items)) return null

  return (
    <div
      role="alert"
      className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#5984c4]/25 bg-[#5984c4]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
          <Lock size={16} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">Your basket has nasal spray products</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            These can only be ordered by logged-in customers. Log in or create a free account to check out.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href={withNext('/login', returnTo)}
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ink/85"
        >
          Log in
        </Link>
        <Link
          href={withNext('/register', returnTo)}
          className="inline-flex items-center justify-center rounded-full border border-ink/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink/5"
        >
          Create account
        </Link>
      </div>
    </div>
  )
}
