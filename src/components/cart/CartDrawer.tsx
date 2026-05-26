'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { useCartStore } from '@/store/cartStore'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag } from 'lucide-react'

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity } = useCartStore()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
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

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
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
            className="fixed inset-0 bg-ink/55 z-[100]"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-cream z-[101] shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle shrink-0">
              <h2 className="text-label-lg uppercase tracking-wider text-ink">
                Your Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
              <button 
                onClick={closeCart}
                className="p-2 -mr-2 text-ink-muted hover:text-ink transition-colors focus:outline-none"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {items.length === 0 ? (
              /* Empty State */
              <EmptyState
                  icon={ShoppingBag}
                  title="Your cart is empty"
                  description="Looks like you haven't added any compounds to your cart yet."
                  action={
                    <Link href="/shop" onClick={closeCart} className={buttonVariants({ variant: 'dark' })}>
                      Browse Products
                    </Link>
                  }
                />
            ) : (
              /* Populated Cart */
              <>
                {/* Shipping Progress */}
                <div className="p-6 bg-cream-warm border-b border-border-subtle shrink-0">
                  <p className="text-body-sm text-ink text-center mb-3">
                    {amountToFreeShipping > 0 
                      ? `Add $${amountToFreeShipping.toFixed(2)} more for free 2-day shipping`
                      : "You've unlocked free 2-day shipping!"}
                  </p>
                  <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToFreeShipping}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  <div className="flex flex-col">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div 
                          key={item.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-4 py-6 border-b border-border-subtle last:border-0"
                        >
                          <div className="relative w-20 h-20 bg-cream-warm shrink-0 border border-border-subtle">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col flex-1 justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex flex-col">
                                <Link href={`/products/${item.productId}`} onClick={closeCart} className="text-editorial-sm font-display text-ink hover:text-gold transition-colors">
                                  {item.name}
                                </Link>
                                <span className="text-label-sm uppercase tracking-wider text-ink-muted mt-1">
                                  {item.variantName}
                                </span>
                              </div>
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="text-ink-muted hover:text-error transition-colors"
                                aria-label="Remove item"
                              >
                                <X size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                              <QuantityStepper 
                                value={item.quantity} 
                                onChange={(val) => updateQuantity(item.id, val)} 
                              />
                              <span className="text-body-md font-medium text-ink">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sticky Summary */}
                <div className="p-6 bg-cream border-t border-border-subtle shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-body-md text-ink-muted">Subtotal</span>
                    <span className="text-body-md text-ink font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-body-md text-ink-muted">Shipping</span>
                    <span className="text-body-md text-ink">
                      {amountToFreeShipping > 0 ? 'Calculated at checkout' : 'Free'}
                    </span>
                  </div>
                  <Link href="/checkout" className={buttonVariants({ variant: 'dark', size: 'lg', className: "w-full h-14 mb-3 text-label-lg" })}>
                    CHECKOUT →
                  </Link>
                  <Link href="/cart" onClick={closeCart} className={buttonVariants({ variant: 'link', className: "w-full text-ink-muted hover:text-ink text-label-md" })}>
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
