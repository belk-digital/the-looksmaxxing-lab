'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { useCartStore } from '@/lib/cart/store'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag } from 'lucide-react'
import { useLenis } from 'lenis/react'

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity } = useCartStore()
  const lenis = useLenis()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isOpen])

  // Esc key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [closeCart])

  const subtotal = items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0)
  const FREE_SHIPPING_THRESHOLD = 300
  const progressToFreeShipping = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#F5F5F7] md:rounded-l-[2rem] z-[101] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 bg-white shrink-0 shadow-sm z-10 relative">
              <h2 className="text-label-md uppercase tracking-widest text-ink font-bold">
                Your Cart <span className="text-ink/60 font-medium ml-1">({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </h2>
              <button 
                onClick={closeCart}
                className="p-2 -mr-2 bg-cream-warm/50 hover:bg-cream-warm rounded-full text-ink/60 hover:text-ink transition-all focus:outline-none"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {items.length === 0 ? (
              /* Empty State */
              <div className="flex-1 flex flex-col bg-[#F5F5F7]">
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    description="Looks like you haven't added any compounds to your cart yet."
                    action={
                      <Link href="/shop" onClick={closeCart} className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-ink text-white hover:bg-ink/80 transition-colors uppercase tracking-[0.15em] text-sm font-bold shadow-md">
                        Browse Products
                      </Link>
                    }
                  />
              </div>
            ) : (
              /* Populated Cart */
              <>
                {/* Shipping Progress */}
                <div className="px-6 md:px-8 py-5 bg-[#F5F5F7] shrink-0">
                  <p className="text-sm font-medium text-ink text-center mb-3">
                    {amountToFreeShipping > 0 
                      ? `Add $${amountToFreeShipping.toFixed(2)} more for free 2-day shipping`
                      : "You've unlocked free 2-day shipping!"}
                  </p>
                  <div className="w-full h-1.5 bg-border-subtle/60 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#C9B58E] to-[#A89570] rounded-full shadow-[0_0_10px_rgba(201,181,142,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToFreeShipping}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-6 md:px-8 py-2" data-lenis-prevent="true">
                  <div className="flex flex-col gap-4 pb-4">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div 
                          key={item.lineId}
                          layout
                          initial={{ opacity: 0, scale: 0.95, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95, height: 0 }}
                          className="flex gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-black/[0.02]"
                        >
                          <div className="relative w-[88px] h-[88px] bg-[#F5F5F7] rounded-xl shrink-0 overflow-hidden">
                            <Image src={item.product?.imageUrl || '/placeholder.png'} alt={item.product?.name || 'Product'} fill unoptimized className="object-cover" />
                          </div>
                          <div className="flex flex-col flex-1 justify-between py-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex flex-col">
                                <Link href={`/products/${item.productId}`} onClick={closeCart} className="text-body-md font-bold font-display text-ink hover:text-[#C9B58E] transition-colors line-clamp-1">
                                  {item.product?.name}
                                </Link>
                                <span className="text-[10px] uppercase tracking-wider text-ink/60 mt-1 font-medium">
                                  {item.variantSku}
                                </span>
                              </div>
                              <button 
                                onClick={() => removeItem(item.lineId)}
                                className="text-ink/40 hover:text-error transition-colors p-1"
                                aria-label="Remove item"
                              >
                                <X size={16} strokeWidth={2} />
                              </button>
                            </div>
                            <div className="flex items-end justify-between mt-3">
                              <QuantityStepper 
                                value={item.quantity} 
                                onChange={(val) => updateQuantity(item.lineId, val)} 
                              />
                              <span className="text-body-md font-bold text-ink">
                                ${(item.priceSnapshot * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sticky Summary */}
                <div className="p-6 md:p-8 bg-white shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.06)] z-10 relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-body-md font-medium text-ink/70">Subtotal</span>
                    <span className="text-lg text-ink font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-body-md font-medium text-ink/70">Shipping</span>
                    <span className="text-body-md text-ink font-bold">
                      {amountToFreeShipping > 0 ? 'Calculated at checkout' : 'Free'}
                    </span>
                  </div>
                  <Link href="/checkout" onClick={closeCart} className="flex items-center justify-center w-full px-8 py-4 rounded-full bg-ink text-white hover:bg-ink/80 transition-colors uppercase tracking-[0.15em] text-sm font-bold shadow-md mb-4">
                    CHECKOUT
                  </Link>
                  <Link href="/cart" onClick={closeCart} className="flex items-center justify-center w-full text-ink/50 hover:text-ink text-sm font-bold transition-colors">
                    VIEW CART
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
