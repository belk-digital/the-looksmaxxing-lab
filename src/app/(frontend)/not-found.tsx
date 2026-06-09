import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
      <h1 className="text-[120px] md:text-[180px] leading-none font-serif text-gold mb-6">404</h1>
      <h2 className="text-editorial-lg font-serif text-ink mb-6">This page doesn't exist.</h2>
      <p className="text-body-lg text-ink-muted max-w-[480px] mx-auto mb-12">
        The link may be outdated, or the page may have been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link href="/">
          <Button variant="dark" size="lg">Return Home</Button>
        </Link>
        <Link href="/shop">
          <Button variant="secondary" size="lg">Browse Shop</Button>
        </Link>
      </div>
    </main>
  )
}
