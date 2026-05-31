import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export interface Product {
  name: string
  slug: string
  image: string
  shortDescription: string
  priceRange: string
  category: string
}

export interface FeaturedProductCardProps {
  product: Product
  aspectRatio?: '4/5' | '16/10'
  size?: 'tall' | 'small'
  id?: string
}

export function FeaturedProductCard({ product, size = 'small', id }: FeaturedProductCardProps) {
  const imageAspectClass = size === 'tall' ? 'aspect-[4/5]' : 'aspect-[16/10]';

  return (
    <div 
      className="group relative flex flex-col w-full bg-white p-3 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] cursor-pointer"
    >
      {/* Invisible Spacers for Layout */}
      <div className={`w-full ${imageAspectClass}`} />
      <div className="h-[190px] w-full" />

      {/* Animated Image Area */}
      <div id={id} className="absolute top-3 left-3 right-3 bottom-[202px] group-hover:bottom-3 overflow-hidden bg-[#F5F5F7] rounded-[2rem] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <button className="absolute top-7 right-7 p-2.5 rounded-full bg-white/50 backdrop-blur-sm text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:bg-white z-20">
        <Heart size={20} strokeWidth={1.5} />
      </button>

      {/* Info Area - Fixed at bottom */}
      <div className="absolute bottom-3 left-3 right-3 h-[190px] flex flex-col px-4 pt-6 pb-2 z-10 pointer-events-none">
        <h3 className="text-xl sm:text-2xl font-bold mb-3 text-ink group-hover:text-white transition-colors duration-500">{product.name}</h3>
        <p className="text-sm text-ink/70 group-hover:text-white/80 line-clamp-2 mb-8 transition-colors duration-500">
          {product.shortDescription}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-ink group-hover:text-white transition-colors duration-500">
            {product.priceRange}
          </span>
          <button className="pointer-events-auto px-6 py-2.5 rounded-[1.5rem] bg-ink text-white group-hover:bg-white group-hover:text-ink hover:bg-ink/80 transition-colors font-medium shadow-md">
            Buy
          </button>
        </div>
      </div>

      {/* Absolute Link overlay so entire card is clickable */}
      <Link href={`/shop/${product.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>
    </div>
  )
}
