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
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
      <h1 className="text-[80px] md:text-[120px] leading-none font-serif text-gold mb-6">500</h1>
      <h2 className="text-editorial-lg font-serif text-ink mb-6">Something went wrong.</h2>
      <p className="text-body-lg text-ink-muted max-w-[480px] mx-auto mb-12">
        We encountered an unexpected error while processing your request. Please try again or return to the home page.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Button variant="dark" size="lg" onClick={() => reset()}>
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" size="lg">Return Home</Button>
        </Link>
      </div>
    </main>
  )
}
