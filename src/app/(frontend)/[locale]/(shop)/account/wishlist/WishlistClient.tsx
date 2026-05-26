'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { X, ShoppingBag, Heart } from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

const MOCK_WISHLIST = [
  {
    id: 'prod-1',
    name: 'BPC-157',
    slug: 'bpc-157',
    image: '/temp-products/bpc-157.png',
    descriptor: 'RECOVERY PEPTIDE',
    price: '$75.00',
  },
  {
    id: 'prod-2',
    name: 'GHK-Cu',
    slug: 'ghk-cu',
    image: '/temp-products/ghk-cu.png',
    descriptor: 'COPPER PEPTIDE',
    price: '$95.00',
  },
  {
    id: 'prod-3',
    name: 'TB-500',
    slug: 'tb-500',
    image: '/temp-products/tb-500.png',
    descriptor: 'HEALING FACTOR',
    price: '$80.00',
  }
]

export function WishlistClient() {
  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border-subtle pb-4">
        <div className="flex flex-col">
          <h1 className="text-label-xl uppercase tracking-wider text-ink mb-1">
            My Wishlist
          </h1>
          <span className="text-body-sm text-ink-muted">{MOCK_WISHLIST.length} items</span>
        </div>
        
        <Button variant="dark" className="gap-2 w-full sm:w-auto">
          <ShoppingBag size={16} />
          Move All to Cart
        </Button>
      </div>

      {MOCK_WISHLIST.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {MOCK_WISHLIST.map(product => (
            <div key={product.id} className="group relative flex flex-col w-full h-full">
              
              {/* Image Area */}
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-cream-warm mb-6">
                <Link href={`/products/${product.slug}`}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
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
                </Link>

                {/* Remove Button Overlay */}
                <button className="absolute top-4 right-4 z-10 p-2 bg-cream text-ink-muted hover:text-red-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <X size={18} />
                </button>
              </div>

              {/* Info Area */}
              <div className="flex flex-col flex-1">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-editorial-md font-display text-ink mb-2 transition-colors duration-300 group-hover:text-gold">
                    {product.name}
                  </h3>
                  <span className="text-label-md uppercase tracking-wider text-ink-muted mb-4 line-clamp-1">
                    {product.descriptor}
                  </span>
                </Link>
                <div className="mt-auto flex items-center justify-between gap-4">
                  <span className="text-body-lg font-medium text-ink">
                    {product.price}
                  </span>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    Add to Cart
                  </Button>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you want to buy later by clicking the heart icon on any product page."
          action={
            <Link href="/shop" className={buttonVariants({ variant: 'dark', size: 'lg' })}>
              Start Browsing
            </Link>
          }
        />
      )}

    </div>
  )
}
