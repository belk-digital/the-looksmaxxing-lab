import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
      <h1 className="text-[100px] sm:text-[120px] md:text-[160px] leading-none font-serif text-gold mb-4 sm:mb-6 drop-shadow-sm">404</h1>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-ink mb-4 sm:mb-6">Page Not Found.</h2>
      <p className="text-base sm:text-lg text-ink/70 max-w-[500px] mx-auto mb-10 sm:mb-12 px-4">
        The page you are looking for doesn't exist or has been moved. Please check the URL or return to the homepage to continue exploring.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm mx-auto">
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="dark" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8 text-white">Return Home</Button>
        </Link>
        <Link href="/shop" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full rounded-full uppercase tracking-widest text-xs h-14 px-8 border-ink/20 hover:border-ink">Browse Shop</Button>
        </Link>
      </div>
    </main>
  )
}
