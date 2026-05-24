'use client'

import React from 'react'

/**
 * Wraps all auth pages with a dark‑mode‑first layout.
 * Uses the `next-themes` package to respect user system preference,
 * but defaults to dark.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      {children}
    </div>
  )
}
