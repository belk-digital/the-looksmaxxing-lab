'use client' // Error components must be Client Components

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Global Error Boundary caught an error:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
      <h1 className="text-[100px] sm:text-[120px] md:text-[160px] leading-none font-serif text-gold mb-4 sm:mb-6 drop-shadow-sm">500</h1>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink mb-4 sm:mb-6">Internal Server Error.</h2>
      <p className="text-base sm:text-lg text-ink/70 max-w-[500px] mx-auto mb-10 sm:mb-12 px-4">
        We encountered an unexpected error while processing your request. Please try again later or return to the homepage.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm mx-auto">
        <Button variant="dark" size="lg" onClick={() => reset()} className="w-full sm:w-auto rounded-full uppercase tracking-widest text-xs h-14 px-8 text-white">
          Try Again
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8 border-ink/20 hover:border-ink">Return Home</Button>
        </Link>
      </div>
    </main>
  )
}

