'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface StandardProduct {
  id: string
  name: string
  slug: string
  image: string
  descriptor: string
  price: string
  badge?: 'sale' | 'new' | 'bestseller'
}

export function ProductCard({ product }: { product: StandardProduct }) {
  return (
    <motion.div
      whileHover="hover"
      initial="rest"
      variants={{
        rest: {},
        hover: {},
      }}
      className="group relative flex flex-col w-full h-full cursor-pointer"
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
        
        {/* Image Area */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-white mb-6">
          {/* Zooming Circle Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] aspect-square rounded-full bg-cream transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" />
          
          <motion.div
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.04 },
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>

          {/* Optional Badge */}
          {product.badge && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant={product.badge}>
                {product.badge === 'bestseller' ? 'Best Seller' : product.badge}
              </Badge>
            </div>
          )}

          {/* Wishlist Heart */}
          <motion.div
            variants={{
              rest: { opacity: 0 },
              hover: { opacity: 1 },
            }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-10"
          >
            {/* The button catches the click so it doesn't navigate */}
            <button 
              onClick={(e) => {
                e.preventDefault()
                // Stub for wishlist functionality
                console.log('Added to wishlist', product.id)
              }}
              className="p-2 text-ink hover:text-gold transition-colors"
            >
              <Heart size={24} strokeWidth={1.5} />
            </button>
          </motion.div>
        </div>

        {/* Info Area */}
        <div className="flex flex-col flex-1">
          <h3 className="text-editorial-md font-display text-ink mb-2 transition-colors duration-300 group-hover:text-gold">
            {product.name}
          </h3>
          <span className="text-label-md uppercase tracking-wider text-ink-muted mb-4 line-clamp-1">
            {product.descriptor}
          </span>
          <div className="mt-auto">
            <span className="text-body-lg font-medium text-ink">
              {product.price}
            </span>
          </div>
        </div>
        
      </Link>
    </motion.div>
  )
}
