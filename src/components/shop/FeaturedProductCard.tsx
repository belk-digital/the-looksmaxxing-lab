import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface Product {
  id?: number
  name: string
  slug: string
  image: string
  shortDescription: string
  priceRange: string
  category: string
}

export interface FeaturedProductCardProps {
  product: Product
  id?: string
  index?: number
}

export function FeaturedProductCard({ product, id, index = 0 }: FeaturedProductCardProps) {
  return (
    <Link 
      href={`/products/${product.slug}`}
      id={id}
      className="group block relative w-full h-[460px] sm:h-[500px] rounded-[32px] bg-white p-2 sm:p-3 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 border border-slate-100"
    >
      {/* Inner Container */}
      <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-white">
        
        {/* Heart Icon */}
        <button 
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center z-30 text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
          onClick={(e) => e.preventDefault()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>

        {/* Product Image */}
        {/* Simple hardware-accelerated transform. No layout shifting. */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="relative w-full h-full scale-[1.25] -translate-y-6 group-hover:scale-[1.35] group-hover:translate-y-2 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-contain mix-blend-darken contrast-[1.05]"
            />
          </div>
        </div>

        {/* Fading Glass Background Layer */}
        {/* Decoupled from the text so we can use a CSS mask-image. This creates a smooth gradient fade-out for the blur at the top, removing any harsh rectangular edges. */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[200px] rounded-b-[24px] bg-white group-hover:bg-white/60 group-hover:backdrop-blur-2xl transition-all duration-500 z-20 pointer-events-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          }}
        />

        {/* Bottom Content Area */}
        {/* Text and buttons sit cleanly on top of the fading glass layer without fading themselves. */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-5">
          
          <div>
            <h3 className="text-[15px] sm:text-[16px] font-bold text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            {/* Force description container to always be 2 lines tall for perfect cross-card alignment */}
            <div className="h-[36px]">
              <p className="text-[12px] sm:text-[13px] text-gray-500 mt-1 line-clamp-2 leading-[18px]">
                {product.shortDescription || product.category}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[16px] sm:text-[18px] font-bold text-gray-900">
              {product.priceRange}
            </span>
            <button 
              className="pointer-events-auto px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#1c1a24] text-white hover:bg-black group-hover:bg-white group-hover:text-gray-900 text-[12px] sm:text-[13px] font-bold transition-all duration-300 shadow-sm border border-transparent group-hover:border-gray-200"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Buy
            </button>
          </div>

        </div>
      </div>
    </Link>
  )
}
