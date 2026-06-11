'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, CreditCard, ShoppingBag, ArrowRight, Loader2, Check, Trash2, Lock, ShieldCheck, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui/container'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { useCartStore } from '@/lib/cart/store'
import { PrimaryProductCard } from '@/components/shop/PrimaryProductCard'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })



export function CartClient() {
  const { items, removeItem, updateQuantity, couponCode: storedCouponCode, setCoupon } = useCartStore()

  // Dynamic Data States
  const [shippingCost, setShippingCost] = useState<number | null>(null)
  const [taxAmount, setTaxAmount] = useState<number>(0)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Coupon States
  const [couponCode, setCouponCode] = useState('')
  const [couponState, setCouponState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [couponMessage, setCouponMessage] = useState('')
  const [activeCoupon, setActiveCoupon] = useState<any>(null)

  // Related Products State
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  // Base Subtotal
  const subtotal = items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0)

  // Fetch Shipping and Tax on mount
  useEffect(() => {
    async function fetchCartData() {
      try {
        // Fetch Shipping Zones to get an estimated base shipping cost
        const shippingRes = await fetch('/api/shippingzones')
        const shippingData = await shippingRes.json()
        
        let estimatedShipping = 15 // Fallback
        if (shippingData?.docs?.length > 0) {
          // Grab the first available shipping method price from the first zone
          const firstZone = shippingData.docs[0]
          if (firstZone.methods?.length > 0) {
            estimatedShipping = firstZone.methods[0].price / 100 // Convert cents to dollars
          }
        }
        
        // Fetch Processing Fees (Taxes/Fees)
        const feesRes = await fetch('/api/processing-fees')
        const feesData = await feesRes.json()
        
        let calculatedTax = 0
        if (feesData?.docs?.length > 0) {
          feesData.docs.forEach((fee: any) => {
            if (fee.isActive && !fee.isOptional) {
              if (fee.type === 'percentage') {
                calculatedTax += subtotal * (fee.amount / 100)
              } else if (fee.type === 'fixed_amount') {
                calculatedTax += (fee.amount / 100) // Assuming amount is in cents
              }
            }
          })
        }

        setShippingCost(estimatedShipping)
        setTaxAmount(calculatedTax)
      } catch (err) {
        console.error("Error fetching dynamic cart data", err)
        setShippingCost(15) // Fallback
      } finally {
        setIsLoadingData(false)
      }
    }

    async function fetchRelatedProducts() {
      try {
        const res = await fetch('/api/products?limit=4&depth=1')
        const data = await res.json()
        if (data?.docs?.length > 0) {
          const mapped = data.docs.map((p: any) => {
            let displayPrice = typeof p.price === 'number' ? p.price : 0
            let displaySalePrice = typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : undefined
            let isFrom = false

            if (p.hasVariants && p.variants && p.variants.length > 0) {
              const prices = p.variants.map((v: any) => typeof v.salePrice === 'number' && v.salePrice > 0 ? v.salePrice : v.price).filter(Boolean)
              if (prices.length > 0) {
                const minVariantPrice = Math.min(...prices)
                const maxVariantPrice = Math.max(...prices)
                if (minVariantPrice !== maxVariantPrice) {
                  isFrom = true
                }
                displayPrice = minVariantPrice
                
                const cheapestVariant = p.variants.find((v: any) => (v.salePrice || v.price) === minVariantPrice)
                if (cheapestVariant && typeof cheapestVariant.salePrice === 'number' && cheapestVariant.salePrice > 0) {
                  displaySalePrice = cheapestVariant.salePrice
                  displayPrice = cheapestVariant.price
                } else {
                  displaySalePrice = undefined
                }
              }
            }

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              image: p.images?.[0]?.image?.url || p.imageUrl || '/placeholder.png',
              hoverImage: p.images?.[1]?.image?.url || undefined,
              shortDescription: p.shortDescription || p.description || p.descriptor || '',
              priceRange: displaySalePrice 
                ? `${isFrom ? 'From ' : ''}$${displaySalePrice.toFixed(2)}` 
                : `${isFrom ? 'From ' : ''}$${displayPrice.toFixed(2)}`,
              originalPrice: (displaySalePrice && !isFrom)
                ? `$${displayPrice.toFixed(2)}` 
                : undefined,
              discountPercentage: (displaySalePrice && displayPrice > 0)
                ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100)
                : undefined,
              category: typeof p.category === 'object' ? p.category?.name : 'Category',
            }
          })
          setRelatedProducts(mapped)
        }
      } catch (err) {
        console.error("Error fetching related products", err)
      }
    }

    fetchCartData()
    fetchRelatedProducts()
  }, [subtotal])

  // Handle Coupon Application
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = typeof codeToApply === 'string' ? codeToApply : couponCode;
    if (!code) return
    
    setCouponState('loading')
    setCouponMessage('')
    
    try {
      // Use 'like' for case-insensitive partial match from payload, then strict exact match on the client
      const res = await fetch(`/api/coupons?where[code][like]=${code.trim()}`)
      const data = await res.json()
      
      const coupon = data?.docs?.find((c: any) => c.code.toLowerCase() === code.trim().toLowerCase())
      
      if (coupon) {
        
        // Validate Expiration
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          setCouponState('error')
          setCouponMessage('This coupon code has expired.')
          return
        }
        
        // Validate Usage Limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          setCouponState('error')
          setCouponMessage('This coupon has reached its usage limit.')
          return
        }
        
        // Validate Min Spend (assuming minSpend is in cents)
        if (coupon.minSpend && (subtotal * 100) < coupon.minSpend) {
          setCouponState('error')
          setCouponMessage(`Minimum spend of $${(coupon.minSpend / 100).toFixed(2)} required.`)
          return
        }

        setActiveCoupon(coupon)
        setCouponState('success')
        setCouponMessage('Coupon applied successfully!')
        setCoupon(coupon.code)
      } else {
        setCouponState('error')
        setCouponMessage('Invalid coupon code.')
      }
    } catch (err) {
      setCouponState('error')
      setCouponMessage('Error validating coupon. Please try again.')
    }
  }

  const handleRemoveCoupon = () => {
    setActiveCoupon(null)
    setCouponCode('')
    setCouponState('idle')
    setCouponMessage('')
    setCoupon(null)
  }

  // Pre-fill stored coupon and re-validate on subtotal change
  useEffect(() => {
    if (activeCoupon) {
      // Re-validate minSpend locally
      if (activeCoupon.minSpend && (subtotal * 100) < activeCoupon.minSpend) {
        setActiveCoupon(null)
        setCouponCode('')
        setCouponState('error')
        setCouponMessage(`Minimum spend of $${(activeCoupon.minSpend / 100).toFixed(2)} required.`)
        setCoupon(null) // Remove from global store
      }
    } else if (storedCouponCode && couponState === 'idle') {
      setCouponCode(storedCouponCode)
      handleApplyCoupon(storedCouponCode)
    }
  }, [subtotal, storedCouponCode, activeCoupon, couponState])

  // Calculate Discounts
  let discountAmount = 0
  let isFreeShipping = false
  let eligibleSubtotal = 0

  if (activeCoupon) {
    if (activeCoupon.freeShipping) {
      isFreeShipping = true
    }
    
    // Calculate eligible subtotal
    items.forEach(item => {
      let eligible = true
      
      if (activeCoupon.excludeSaleItems && (item.product as any)?.salePrice) {
        eligible = false
      }
      
      if (activeCoupon.applicableProductTypes && activeCoupon.applicableProductTypes !== 'all') {
        const isBulkBundle = typeof item.variantSku === 'string' && item.variantSku.includes(' - ')
        if (activeCoupon.applicableProductTypes === 'normal_only' && isBulkBundle) {
          eligible = false
        } else if (activeCoupon.applicableProductTypes === 'bulk_only' && !isBulkBundle) {
          eligible = false
        }
      }
      
      if (eligible && activeCoupon.appliesTo === 'specific_products') {
        const allowedProductIds = (activeCoupon.products || []).map((p: any) => typeof p.product === 'object' ? p.product.id : p.product)
        if (!allowedProductIds.includes(item.productId)) eligible = false
      }
      
      if (eligible && activeCoupon.appliesTo === 'specific_categories') {
        // Simple check: we don't have full category data in cart item, but this is a best-effort frontend display.
        // The backend `actions.ts` will rigorously validate it anyway.
        // We will assume it's eligible on the frontend unless we explicitly know it's not.
      }
      
      if (eligible) {
        eligibleSubtotal += item.priceSnapshot * item.quantity
      }
    })

    if (activeCoupon.type === 'percentage') {
      discountAmount = eligibleSubtotal * (activeCoupon.value / 100)
    } else if (activeCoupon.type === 'fixed_amount') {
      discountAmount = Math.min((activeCoupon.value / 100), eligibleSubtotal)
    }
  }

  // Final Total Calculations
  const finalShipping = (isFreeShipping || subtotal === 0) ? 0 : (shippingCost || 0)
  const finalTotal = Math.max(0, subtotal - discountAmount + finalShipping + taxAmount)

  if (items.length === 0) {
    return (
      <Container size="page" className="py-24 md:py-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-32 h-32 rounded-full bg-[#f4f7fb] flex items-center justify-center mb-8 text-[#5984c4]"
        >
          <ShoppingBag size={48} strokeWidth={1} />
        </motion.div>
        <h1 className={`text-4xl md:text-5xl font-bold tracking-tight text-ink mb-4 ${spaceGrotesk.className}`}>
          Your cart is empty
        </h1>
        <p className="text-lg text-ink/60 mb-12 max-w-md mx-auto font-light">
          You haven't added any compounds to your cart yet. Discover our collection of high-purity research materials.
        </p>
        <Link 
          href="/shop" 
          className="bg-ink text-white px-8 py-4 rounded-full font-medium tracking-wide flex items-center gap-2 hover:bg-ink/90 transition-all hover:scale-105 active:scale-95"
        >
          BROWSE PRODUCTS
          <ArrowRight size={18} />
        </Link>
      </Container>
    )
  }

  return (
    <Container size="page" className="py-16 md:py-24">
      <div className="flex items-end justify-between mb-12">
        <h1 className={`text-4xl md:text-5xl font-bold tracking-tight text-ink ${spaceGrotesk.className}`}>
          Your Cart <span className="text-ink/30 ml-2 font-normal">({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20">
        {/* Left Column: Items */}
        <div className="flex flex-col">
          <div className="border-t border-slate-100">
            {items.map((item) => (
              <div key={item.lineId} className="flex flex-row gap-4 sm:gap-8 py-6 sm:py-8 border-b border-slate-100 group">
                {/* Product Image Thumbnail */}
                <Link href={`/products/${item.productId}`} className="relative w-24 sm:w-32 md:w-36 aspect-[4/5] bg-[#F5F5F7] shrink-0 rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden">
                  <Image 
                    src={item.product?.imageUrl || '/placeholder.png'} 
                    alt={item.product?.name || 'Product'} 
                    fill 
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                  />
                </Link>
                
                {/* Product Details */}
                <div className="flex flex-col flex-1 justify-between py-1 sm:py-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1 sm:gap-1.5 pr-4 sm:pr-0">
                      <Link href={`/products/${item.productId}`} className={`text-base sm:text-xl md:text-2xl font-bold text-ink hover:text-[#5984c4] transition-colors leading-tight ${spaceGrotesk.className}`}>
                        {item.product?.name}
                      </Link>
                      {(item.variantTitle || item.variantSku) && !['DEFAULT', 'DEFAULT TITLE'].includes((item.variantTitle || item.variantSku || '').toUpperCase()) && (
                        <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 line-clamp-1">
                          {item.variantTitle || item.variantSku}
                        </span>
                      )}
                    </div>
                    <span className="text-sm sm:text-lg md:text-xl font-medium text-ink mt-1 sm:mt-0 whitespace-nowrap">
                      ${item.priceSnapshot.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 sm:mt-auto">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="scale-90 sm:scale-100 origin-left">
                        <QuantityStepper 
                          value={item.quantity} 
                          onChange={(val) => updateQuantity(item.lineId, val)} 
                        />
                      </div>
                      <button 
                        onClick={() => removeItem(item.lineId)}
                        className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink/30 hover:text-red-500 transition-colors mt-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                    
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-1">Total</span>
                      <span className="text-lg text-ink font-semibold">
                        ${(item.priceSnapshot * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 hidden sm:block">
            <Link href="/shop" className="text-sm font-semibold tracking-wider uppercase text-ink/60 hover:text-ink transition-colors flex items-center gap-2">
              <ArrowRight size={16} className="rotate-180" />
              Continue Exploring
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="relative">
          <div className="sticky top-32 bg-[#F5F5F7]/40 p-8 md:p-10 rounded-[2rem] border border-slate-100">
            <h2 className={`text-2xl font-bold text-ink mb-8 ${spaceGrotesk.className}`}>
              Order Summary
            </h2>
            
            <div className="flex flex-col gap-5 mb-8 border-b border-slate-200/60 pb-8">
              <div className="flex justify-between items-center text-ink/80">
                <span className="font-light">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Row */}
              <AnimatePresence>
                {activeCoupon && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex justify-between items-center text-[#5984c4] overflow-hidden"
                  >
                    <span className="font-medium flex items-center gap-2">
                      Discount
                      <button onClick={handleRemoveCoupon} className="hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </span>
                    <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center text-ink/80">
                <span className="font-light">Estimated Shipping</span>
                <span className="font-medium">
                  {isLoadingData ? <Loader2 size={16} className="animate-spin" /> : (finalShipping === 0 ? 'Free' : `$${finalShipping.toFixed(2)}`)}
                </span>
              </div>
              <div className="flex justify-between items-center text-ink/80">
                <span className="font-light">Processing Fee</span>
                <span className="font-medium">
                  {isLoadingData ? <Loader2 size={16} className="animate-spin" /> : `$${taxAmount.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-10">
              <span className="text-sm font-bold uppercase tracking-widest text-ink/60">Total</span>
              <span className={`text-4xl font-bold text-ink ${spaceGrotesk.className}`}>
                ${finalTotal.toFixed(2)}
              </span>
            </div>

            {/* Coupon Code Engine */}
            <div className="flex flex-col gap-3 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">Coupon Code</span>
              <div className="relative flex items-center w-full">
                <Input 
                  placeholder="Enter code..." 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={activeCoupon !== null || couponState === 'loading'}
                  className="w-full bg-white border-transparent focus-visible:ring-1 focus-visible:ring-ink/10 rounded-full h-14 pl-6 pr-28 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] text-sm font-medium uppercase placeholder:normal-case" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCoupon()
                  }}
                />
                <button 
                  onClick={activeCoupon ? handleRemoveCoupon : () => handleApplyCoupon()}
                  disabled={(!couponCode && !activeCoupon) || couponState === 'loading'}
                  className={`absolute right-2 top-2 bottom-2 px-5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                    activeCoupon 
                      ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' 
                      : 'bg-ink text-white hover:bg-ink/90 disabled:opacity-30 disabled:bg-slate-200 disabled:text-slate-500'
                  }`}
                >
                  {couponState === 'loading' ? <Loader2 size={14} className="animate-spin mx-auto" /> : (activeCoupon ? 'Remove' : 'Apply')}
                </button>
              </div>
              <AnimatePresence>
                {couponMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-sm font-medium mt-1 ${couponState === 'error' ? 'text-red-500' : 'text-[#5984c4]'}`}
                  >
                    {couponMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              href="/checkout" 
              className="w-full bg-ink text-white h-14 rounded-full font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-ink/90 transition-all hover:scale-[1.02] active:scale-[0.98] mb-6 shadow-lg shadow-ink/20"
            >
              SECURE CHECKOUT
              <ArrowRight size={18} />
            </Link>

            {/* Premium Trust Signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-ink/50 mt-2">
              <div className="flex items-center gap-1.5">
                <Lock size={14} strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Encrypted</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-1.5">
                <Package size={14} strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Discreet Shipping</span>
              </div>
            </div>

            {/* Mobile Continue Exploring */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 sm:hidden text-center">
              <Link href="/shop" className="text-[11px] font-bold tracking-widest uppercase text-ink/60 hover:text-ink transition-colors flex items-center justify-center gap-2">
                <ArrowRight size={14} className="rotate-180" />
                Continue Exploring
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Sells: Also Considered */}
      {relatedProducts.length > 0 && (
        <div className="mt-32 pt-24 border-t border-slate-100">
          <div className="mb-12">
            <span className="text-[#5984c4] text-[11px] uppercase tracking-[0.2em] font-bold mb-3 block">Complete Your Research</span>
            <h2 className={`text-4xl md:text-5xl font-bold tracking-tight text-ink ${spaceGrotesk.className}`}>
              Also Considered.
            </h2>
          </div>
          
          <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {relatedProducts.map((p) => (
              <motion.div variants={staggerItemVariants} key={p.id}>
                {/* @ts-ignore */}
                <PrimaryProductCard product={p} aspectRatio="4/5" />
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      )}
    </Container>
  )
}
