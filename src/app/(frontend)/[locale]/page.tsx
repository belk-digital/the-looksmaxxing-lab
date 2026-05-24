import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react'

export default function Homepage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="w-full max-w-5xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-md">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-indigo-500"></span>
          New: BPC-157 Blend Now Available
        </div>
        
        <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Premium Peptides for <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Peak Performance
          </span>
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
          Elevate your research and capabilities with the purest, highest-quality peptides synthesized in state-of-the-art facilities. 99.9% purity guaranteed.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link 
            href="/shop" 
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/40 sm:w-auto"
          >
            Shop Now
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/about" 
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-8 border-t border-white/10 pt-16 sm:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">99.9% Purity</h3>
          <p className="mt-2 text-sm text-gray-400">Third-party lab tested for maximum efficacy and safety.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Fast Shipping</h3>
          <p className="mt-2 text-sm text-gray-400">Same-day dispatch for orders placed before 2 PM EST.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/10 text-pink-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Secure Checkout</h3>
          <p className="mt-2 text-sm text-gray-400">End-to-end encryption for your peace of mind.</p>
        </div>
      </section>
    </div>
  )
}
