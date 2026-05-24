// src/components/auth/AuthCard.tsx

import React from 'react'
import { cn } from '@/lib/utils' // simple classnames helper, create if missing

/**
 * Glass‑morphism card used on all auth pages.
 * It has a semi‑transparent dark background with a subtle backdrop blur.
 */
export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'w-full max-w-md space-y-6 p-8',
        'rounded-xl border border-gray-700 bg-gray-900/70 backdrop-blur-lg',
        'shadow-2xl',
      )}
    >
      {children}
    </div>
  )
}
