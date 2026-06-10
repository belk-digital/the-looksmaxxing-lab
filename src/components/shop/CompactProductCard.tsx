'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useWishlistStore } from '@/lib/wishlist/store'

export interface StandardProduct {
  id: string
  name: string
  slug: string
  image: string
  hoverImage?: string
  descriptor: string
  price: string
  originalPrice?: string
  discountPercentage?: number
  badge?: 'sale' | 'new' | 'bestseller'
}

export function CompactProductCard({ product }: { product: StandardProduct }) {
  const addItem = useWishlistStore(state => state.addItem)
  const removeItem = useWishlistStore(state => state.removeItem)
  const inWishlist = useWishlistStore(state => product.id ? state.hasItem(product.id) : false)

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!product.id) return

    if (inWishlist) {
      removeItem(product.id)
      toast('Removed from wishlist', {
        description: `${product.name} has been removed.`,
      })
    } else {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        priceRange: product.price || ''
      })
      toast.success('Added to wishlist', {
        description: `${product.name} is now in your wishlist.`,
        action: {
          label: 'View Wishlist',
          onClick: () => window.location.href = '/account/wishlist',
        },
      })
    }
  }

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
            <motion.div
              variants={
                product.hoverImage
                  ? { rest: { x: 0 }, hover: { x: '-100%' } }
                  : { rest: { x: 0 }, hover: { x: 0 } }
              }
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>

            {product.hoverImage && (
              <motion.div
                variants={{
                  rest: { x: '100%' },
                  hover: { x: 0 },
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={product.hoverImage}
                  alt={`${product.name} alternate view`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
            )}
          </motion.div>

          {/* DEBUG INDICATOR - Temporary */}
          {product.hoverImage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-1 rounded text-xs z-50 font-mono pointer-events-none shadow-xl border border-white/20 whitespace-nowrap">
              DEBUG: HOVER IMAGE LOADED
            </div>
          )}

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
              onClick={handleWishlistClick}
              className={`p-2 transition-colors ${inWishlist ? 'text-red-500' : 'text-ink hover:text-red-500'}`}
            >
              <Heart size={24} strokeWidth={1.5} fill={inWishlist ? 'currentColor' : 'none'} />
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
          <div className="mt-auto flex items-center gap-2">
            {product.originalPrice ? (
              <>
                <span className="text-body-sm text-ink/30 line-through">
                  {product.originalPrice}
                </span>
                <span className="text-body-lg font-medium text-ink">
                  {product.price}
                </span>
                {product.discountPercentage && (
                  <span className="ml-auto text-[10px] font-bold tracking-widest px-2 py-1 bg-ink/5 text-ink rounded-md">
                    -{product.discountPercentage}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-body-lg font-medium text-ink">
                {product.price}
              </span>
            )}
          </div>
        </div>
        
      </Link>
    </motion.div>
  )
}
