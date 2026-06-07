'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Heart } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Space_Grotesk } from 'next/font/google'
import { useWishlistStore } from '@/lib/wishlist/store'
import { useEffect, useState } from 'react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  descriptor: string;
  price: string;
}

export interface AccountWishlistProps {
  items: WishlistItem[];
}

export function WishlistClient({ items: serverItems }: AccountWishlistProps) {
  const { items: localItems, removeItem } = useWishlistStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayItems = mounted ? localItems : []

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-full"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-2">
          <h1 className={`text-4xl text-black font-bold tracking-tighter ${spaceGrotesk.className}`}>
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500">You have {displayItems.length} items saved for later.</p>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all w-full sm:w-auto shadow-lg">
          <ShoppingBag size={14} />
          Move All to Cart
        </button>
      </div>

      <AnimatePresence>
        {displayItems.length > 0 ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayItems.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col w-full bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-gray-200 transition-all duration-500"
              >
                
                {/* Image Area */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50">
                  <Link href={`/products/${product.slug}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      removeItem(product.id)
                    }}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-white flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Info Area */}
                <div className="flex flex-col flex-1 p-6">
                  <Link href={`/products/${product.slug}`}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block">
                      {/* @ts-ignore */}
                      {product.descriptor || 'Product'}
                    </span>
                    <h3 className={`text-2xl font-bold text-black mb-1 transition-colors duration-300 group-hover:text-purple-600 tracking-tight ${spaceGrotesk.className}`}>
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <span className={`text-xl font-bold text-black tracking-tighter ${spaceGrotesk.className}`}>
                      {/* @ts-ignore */}
                      {product.price || product.priceRange || ''}
                    </span>
                    <button className="bg-gray-50 hover:bg-black text-black hover:text-white rounded-full px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors shrink-0">
                      Add to Cart
                    </button>
                  </div>
                </div>
                
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12"
          >
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save items you want to buy later by clicking the heart icon on any product page."
              action={
                <Link href="/shop" className="inline-flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-full px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors shadow-lg">
                  Start Browsing
                </Link>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
