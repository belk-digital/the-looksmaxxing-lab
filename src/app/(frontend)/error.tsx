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
      <h1 className="text-[80px] md:text-[120px] leading-none font-serif text-gold mb-6 drop-shadow-sm">500</h1>
      <h2 className="text-display-lg font-serif text-ink mb-6">Server is Looksmaxxing.</h2>
      <p className="text-body-lg text-ink-muted max-w-[500px] mx-auto mb-12">
        Something broke on our end. Our developers are currently being punished with 100 extra reps of jawline chewing. Try again while they suffer.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm mx-auto">
        <Button variant="dark" size="lg" onClick={() => reset()} className="w-full sm:w-auto rounded-full uppercase tracking-widest text-xs h-14 px-8">
          Try Again
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8 border-ink/20 hover:border-ink">Return to Base</Button>
        </Link>
      </div>
    </main>
  )
}
