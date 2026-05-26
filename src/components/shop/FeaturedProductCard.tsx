import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

export function FeaturedProductCard({ product, aspectRatio = '4/5' }: FeaturedProductCardProps) {
  return (
    <div className="group relative flex flex-col w-full h-full cursor-pointer bg-cream-warm">
      {/* Image Area */}
      <div 
        className={`relative w-full overflow-hidden bg-cream-warm ${aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        {/* Wishlist Heart fade in top right */}
        <button className="absolute top-4 right-4 p-2 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:text-gold z-10">
          <Heart size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Info Area */}
      <div className="flex flex-col p-8 md:p-12 flex-1">
        <span className="text-label-md uppercase tracking-wider text-gold mb-3">
          {product.category}
        </span>
        <h3 className="text-editorial-lg font-display text-ink mb-4">
          {product.name}
        </h3>
        <p className="text-body-md text-ink-muted line-clamp-2 mb-8 flex-1">
          {product.shortDescription}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-body-lg font-medium text-ink">
            {product.priceRange}
          </span>
          <Button variant="link" className="text-ink hover:text-gold px-0">
            View Product →
          </Button>
        </div>
      </div>
      
      {/* Absolute Link overlay so entire card is clickable */}
      <Link href={`/shop/${product.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">View {product.name}</span>
      </Link>
    </div>
  )
}
