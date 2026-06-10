import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
      <h1 className="text-[120px] md:text-[180px] leading-none font-serif text-gold mb-6 drop-shadow-sm">404</h1>
      <h2 className="text-display-lg font-serif text-ink mb-6">Sub-8 Page Detected.</h2>
      <p className="text-body-lg text-ink-muted max-w-[500px] mx-auto mb-12">
        Just kidding. But this page is definitely a 404. It either moved on to better things, or it never existed in the first place—kinda like your skincare routine before you found us. 
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm mx-auto">
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="dark" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8">Return to Base</Button>
        </Link>
        <Link href="/products" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8 border-ink/20 hover:border-ink">Shop Instead</Button>
        </Link>
      </div>
    </main>
  )
}
