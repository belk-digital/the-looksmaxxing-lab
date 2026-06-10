'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, ChevronRight, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { useWishlistStore } from '@/lib/wishlist/store'
import { useCartStore } from '@/lib/cart/store'
import { toast } from 'sonner'

export interface Product {
  id?: string // added id to support wishlist
  name: string
  slug: string
  image: string
  hoverImage?: string
  shortDescription: string
  priceRange: string
  originalPrice?: string
  discountPercentage?: number
  category: string
}

export interface PrimaryProductCardProps {
  product: Product
  aspectRatio?: '4/5' | '16/10' | '3/4'
  size?: 'tall' | 'small'
  id?: string
}

function SlideToAddButton({ product }: { product: Product }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAdded, setIsAdded] = useState(false)
  const cartStore = useCartStore()

  const handleAdd = () => {
    cartStore.addItem(
      { id: product.id || product.slug, name: product.name, imageUrl: product.image },
      'Default',
      1,
      parseFloat(product.priceRange.replace(/[^0-9.]/g, '')) || 0
    )
    setIsAdded(true)
    toast.success('Added to cart', { 
      action: { label: 'VIEW', onClick: cartStore.openCart } 
    })
    cartStore.openCart()
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 40) {
      handleAdd()
    }
  }

  React.useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const stop = (e: Event) => e.stopPropagation()
    // Stop native events from bubbling up to Embla Carousel
    node.addEventListener('pointerdown', stop)
    node.addEventListener('touchstart', stop, { passive: false })
    node.addEventListener('mousedown', stop)
    return () => {
      node.removeEventListener('pointerdown', stop)
      node.removeEventListener('touchstart', stop)
      node.removeEventListener('mousedown', stop)
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[40px] sm:h-[52px] bg-[#F1F1F1] rounded-full flex items-center overflow-hidden pointer-events-auto z-20 mt-auto border border-black/5"
    >
      <div className="absolute inset-0 flex items-center justify-center pl-8 sm:pl-10 text-[9px] sm:text-[12px] lg:text-[13px] font-semibold text-ink/40 pointer-events-none select-none tracking-tight">
        Slide to add <ChevronRight size={14} className="inline ml-0.5" />
      </div>
      
      <motion.button
        type="button"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragSnapToOrigin={true}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        className={`absolute left-1 w-[32px] h-[32px] sm:w-[44px] sm:h-[44px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-sm transition-colors duration-300 ${
          isAdded ? 'bg-green-600 text-white' : 'bg-[#1A1A1A] text-white'
        }`}
      >
        {isAdded ? <Check size={14} className="sm:w-4 sm:h-4" /> : <ShoppingCart size={14} className="sm:w-4 sm:h-4" />}
      </motion.button>
    </div>
  )
}

export function PrimaryProductCard({ product, size = 'small', id }: PrimaryProductCardProps) {
  const imageAspectClass = size === 'tall' ? 'aspect-[4/5]' : 'aspect-[3/4]';
  
  const addItem = useWishlistStore(state => state.addItem)
  const removeItem = useWishlistStore(state => state.removeItem)
  const isWishlistedGlobal = useWishlistStore(state => product.id ? state.hasItem(product.id) : false)
  const { isSignedIn } = useAuth()
  
  const [inWishlist, setInWishlist] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [isPending, setIsPending] = useState(false)

  React.useEffect(() => {
    setInWishlist(isWishlistedGlobal)
  }, [isWishlistedGlobal])

  const handleWishlistClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isSignedIn) {
      toast.error('Sign in required', {
        description: 'Please log in to add items to your wishlist.',
      })
      return
    }

    if (!product.id) {
      toast.error('Product ID missing', {
        description: 'Unable to add this product to wishlist.',
      })
      return
    }

    setIsPending(true)

    try {
      if (inWishlist) {
        await removeItem(product.id)
        toast('Removed from wishlist', {
          id: `wishlist-${product.id}`,
          description: `${product.name} has been removed.`,
        })
      } else {
        await addItem({
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          priceRange: product.priceRange || ''
        })
        setShowParticles(true)
        setTimeout(() => setShowParticles(false), 1000)
        toast.success('Added to wishlist', {
          id: `wishlist-${product.id}`,
          description: `${product.name} is now in your wishlist.`,
          action: {
            label: 'View Wishlist',
            onClick: () => window.location.href = '/account/wishlist',
          },
        })
      }
    } catch (error: any) {
      toast.error('Failed to update wishlist', {
        description: error.message || 'An unexpected error occurred.',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div 
      id={id}
      className="group relative flex flex-col w-full bg-white p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] transition-shadow duration-300 cursor-pointer"
    >
      {/* Image Area */}
      <div className={`relative w-full ${imageAspectClass} overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-[#F5F5F7] mb-4 sm:mb-6`}>
        
        {/* SALE Badge */}
        {(product.originalPrice || product.discountPercentage) && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
            <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm">
              Sale
            </span>
          </div>
        )}

        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${product.hoverImage ? 'group-hover:-translate-x-full' : 'group-hover:scale-105'}`}
        />
        {product.hoverImage && (
          <Image
            src={product.hoverImage}
            alt={`${product.name} alternate view`}
            fill
            unoptimized
            className="object-cover absolute inset-0 translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0"
          />
        )}
        
        {/* Wishlist Button */}
        <motion.button 
          disabled={isPending}
          whileHover={isPending ? {} : { scale: 1.05 }}
          whileTap={isPending ? {} : { scale: 0.9 }}
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2.5 rounded-full backdrop-blur-xl transition-colors z-20 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border flex items-center justify-center disabled:opacity-70 ${
            inWishlist 
              ? 'bg-red-500/15 text-red-500 border-red-500/20 hover:bg-red-500/25' 
              : 'bg-white/30 text-[#8A95A5] border-white/40 hover:text-red-500 hover:bg-white/50'
          }`}
        >
          {/* Particle Spray */}
          <AnimatePresence>
            {showParticles && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-red-400 rounded-full"
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(angle) * 35,
                        y: Math.sin(angle) * 35,
                        scale: [0, 1.5, 0],
                        opacity: [1, 1, 0]
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  )
                })}
              </div>
            )}
          </AnimatePresence>

          <motion.div
            initial={false}
            animate={inWishlist && !isPending ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Heart strokeWidth={inWishlist ? 2 : 1.5} className={`w-4 h-4 sm:w-5 sm:h-5 ${inWishlist ? 'fill-current' : ''}`} />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Info Area */}
      <div className="flex flex-col px-1 sm:px-2 flex-1 relative z-20 pointer-events-none">
        {/* Title */}
        <h3 className="text-base sm:text-xl font-bold text-ink leading-tight tracking-tight mb-1">
          {product.name}
        </h3>
        
        {/* Description - ALWAYS VISIBLE */}
        <p className="text-[11px] sm:text-sm text-ink/60 line-clamp-2 mb-3 sm:mb-4 font-light leading-relaxed">
          {product.shortDescription || `Experience the pure benefits of ${product.name}.`}
        </p>
        
        {/* Price Area - Pushed to bottom above slider */}
        <div className="flex items-center justify-between mt-auto mb-3 sm:mb-4 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {product.originalPrice && (
              <span className="text-xs sm:text-sm font-medium text-ink/40 line-through">
                {product.originalPrice}
              </span>
            )}
            <span className="text-sm sm:text-lg font-bold text-ink whitespace-nowrap">
              {product.priceRange}
            </span>
            {product.discountPercentage && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-ink/5 text-ink text-xs font-bold tracking-tight whitespace-nowrap hidden sm:inline-block">
                -{product.discountPercentage}%
              </span>
            )}
          </div>
        </div>
        
        <SlideToAddButton product={product} />
      </div>

      {/* Absolute Link overlay so entire card is clickable */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>
    </div>
  )
}
