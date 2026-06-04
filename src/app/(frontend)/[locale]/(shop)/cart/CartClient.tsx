'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { Container } from '@/components/ui/container'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { useCartStore } from '@/lib/cart/store'
import { ProductCard } from '@/components/shop/ProductCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'

// Sample related products for the bottom row
const RELATED_PRODUCTS = [
  {
    id: 'rp1',
    name: 'BPC-157 Blend',
    slug: 'bpc-157-blend',
    image: '/temp-products/bpc-157.png',
    descriptor: 'EXPERIMENTAL · 5MG',
    price: '$120.00',
    badge: 'bestseller' as const
  },
  {
    id: 'rp2',
    name: 'GHK-Cu Copper Peptide',
    slug: 'ghk-cu',
    image: '/temp-products/ghk-cu.png',
    descriptor: 'EXPERIMENTAL · 50MG',
    price: '$85.00'
  },
  {
    id: 'rp3',
    name: 'Semaglutide',
    slug: 'semaglutide',
    image: '/temp-products/semaglutide.png',
    descriptor: 'METABOLIC · 3MG',
    price: '$200.00'
  },
  {
    id: 'rp4',
    name: 'NAD+',
    slug: 'nad-plus',
    image: '/temp-products/product-image.png',
    descriptor: 'CELLULAR · 500MG',
    price: '$150.00'
  }
]

export function CartClient() {
  const { items, removeItem, updateQuantity } = useCartStore()

  const subtotal = items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0)
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 15 // $15 flat rate unless >= 300
  const tax = subtotal * 0.08 // 8% estimate
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    return (
      <Container size="page" className="py-24 md:py-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-32 h-32 rounded-full border border-gold flex items-center justify-center mb-8 text-gold">
          <span className="text-display-lg">!</span>
        </div>
        <h1 className="text-display-md font-display text-ink mb-4">Your cart is empty</h1>
        <p className="text-body-lg text-ink-muted mb-12 max-w-md mx-auto">
          You haven't added any compounds to your cart yet. Discover our collection of high-purity research materials.
        </p>
        <Link href="/shop" className={buttonVariants({ variant: 'dark', size: 'lg' })}>
          BROWSE PRODUCTS
        </Link>
      </Container>
    )
  }

  return (
    <Container size="page" className="py-12 md:py-24">
      <h1 className="text-display-md font-display text-ink mb-12">
        Cart ({items.reduce((acc, i) => acc + i.quantity, 0)} Items)
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-24">
        {/* Left Column: Items */}
        <div className="flex flex-col">
          <div className="border-t border-border-subtle">
            {items.map((item) => (
              <div key={item.lineId} className="flex flex-col sm:flex-row gap-6 py-8 border-b border-border-subtle">
                <div className="relative w-full sm:w-32 aspect-square bg-cream-warm shrink-0 border border-border-subtle rounded-sm overflow-hidden">
                  <Image src={item.product?.imageUrl || '/placeholder.png'} alt={item.product?.name || 'Product'} fill className="object-cover" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <Link href={`/products/${item.productId}`} className="text-editorial-lg font-display text-ink hover:text-gold transition-colors">
                        {item.product?.name}
                      </Link>
                      <span className="text-label-md uppercase tracking-wider text-ink-muted">
                        {item.variantSku}
                      </span>
                    </div>
                    <span className="text-body-lg font-medium text-ink">
                      ${item.priceSnapshot.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-6 sm:mt-auto pt-4">
                    <QuantityStepper 
                      value={item.quantity} 
                      onChange={(val) => updateQuantity(item.lineId, val)} 
                    />
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex flex-col text-right">
                        <span className="text-label-sm uppercase tracking-wider text-ink-muted">Total</span>
                        <span className="text-body-lg text-ink font-medium">
                          ${(item.priceSnapshot * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeItem(item.lineId)}
                        className="text-ink-muted hover:text-error transition-colors p-2 sm:-mr-2 flex items-center justify-center"
                        aria-label="Remove item"
                      >
                        <X size={20} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 hidden sm:block">
            <Link href="/shop" className={buttonVariants({ variant: 'link' })}>
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="relative">
          <div className="sticky top-28 bg-cream-warm p-8 rounded-sm border border-border-subtle">
            <h2 className="text-label-lg uppercase tracking-wider text-ink mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 mb-6 border-b border-border-subtle pb-6">
              <div className="flex justify-between items-center text-body-md text-ink">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-body-md text-ink">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between items-center text-body-md text-ink">
                <span>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-label-lg uppercase tracking-wider text-ink">Total</span>
              <span className="text-display-xs text-ink font-medium">${total.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <span className="text-label-sm uppercase tracking-wider text-ink-muted">Promo Code</span>
              <div className="flex gap-2">
                <Input placeholder="Enter code" className="bg-transparent border-border-subtle focus-visible:border-ink rounded-sm" />
                <Button variant="secondary" className="rounded-sm">Apply</Button>
              </div>
            </div>

            <Link href="/checkout" className={buttonVariants({ variant: 'dark', size: 'lg', className: 'w-full mb-6' })}>
              CHECKOUT →
            </Link>

            {/* Payment Icons */}
            <div className="flex items-center justify-center gap-2 text-ink-muted">
              <CreditCard size={20} strokeWidth={1.5} />
              <span className="text-label-sm uppercase tracking-wider ml-1">Secure Checkout</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-ink-muted/50">
              {/* Fake payment SVGs using text or simple shapes since we don't have SVGs handy */}
              <div className="text-xs font-bold border border-current px-2 py-1 rounded-sm">VISA</div>
              <div className="text-xs font-bold border border-current px-2 py-1 rounded-sm">MC</div>
              <div className="text-xs font-bold border border-current px-2 py-1 rounded-sm">AMEX</div>
            </div>
          </div>
          
          <div className="mt-8 sm:hidden">
            <Link href="/shop" className={buttonVariants({ variant: 'dark', className: 'w-full' })}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-32 pt-24 border-t border-border-subtle">
        <h2 className="text-label-lg uppercase tracking-wider text-ink mb-12">Also Considered</h2>
        <StaggerChildren staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {RELATED_PRODUCTS.map((p) => (
            <motion.div variants={staggerItemVariants} key={p.id}>
              <ProductCard product={p as any} />
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </Container>
  )
}
