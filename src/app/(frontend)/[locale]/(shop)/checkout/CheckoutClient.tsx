'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, Lock, Loader2, ArrowRight, ShieldCheck, Tag, ShoppingCart } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore } from '@/lib/cart/store'
import { verifyCoupon, getUserDefaultAddress } from '../actions'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

export function CheckoutClient() {
  const { items } = useCartStore()
  const { user } = useUser()
  
  // Mobile summary toggle
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    marketing: true,
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  })

  // Prefill user data
  useEffect(() => {
    async function prefillData() {
      if (!user) return

      // Prefill Clerk basic info
      setFormData(prev => ({
        ...prev,
        email: user.primaryEmailAddress?.emailAddress || prev.email,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
      }))

      // Fetch saved address from Payload DB
      const savedAddress = await getUserDefaultAddress()
      if (savedAddress) {
        setFormData(prev => ({
          ...prev,
          firstName: savedAddress.firstName || prev.firstName,
          lastName: savedAddress.lastName || prev.lastName,
          address: savedAddress.line1 || prev.address,
          apartment: savedAddress.line2 || prev.apartment,
          city: savedAddress.city || prev.city,
          state: savedAddress.state || prev.state,
          zip: savedAddress.postalCode || prev.zip,
          phone: savedAddress.phone || prev.phone,
        }))
      }
    }
    
    prefillData()
  }, [user])

  // Shipping State
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const shippingCost = shippingMethod === 'standard' ? 0 : 25

  // Coupon State
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; freeShipping: boolean; description: string } | null>(null)
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false)

  // Order Calculations
  const subtotal = items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0)
  const finalShipping = appliedCoupon?.freeShipping ? 0 : shippingCost
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const tax = subtotalAfterDiscount * 0.08
  const total = subtotalAfterDiscount + finalShipping + tax

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setIsVerifyingCoupon(true)
    try {
      const result = await verifyCoupon(couponCode.trim(), subtotal)
      if (result.valid) {
        setAppliedCoupon({
          code: result.code || couponCode.trim(),
          discount: result.discount || 0,
          freeShipping: result.freeShipping || false,
          description: result.description || 'Coupon applied'
        })
        setCouponCode('')
        toast.success(result.description || 'Coupon applied successfully')
      } else {
        toast.error(result.error || 'Invalid coupon code')
      }
    } catch (err) {
      toast.error('Failed to verify coupon')
    } finally {
      setIsVerifyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.info('Coupon removed')
  }

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-display-sm font-display text-ink mb-4">Your cart is empty</h1>
          <p className="text-body-md text-ink-muted mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/products">
            <Button variant="dark" className="rounded-full h-14 px-8 tracking-widest text-sm uppercase">
              Shop Now
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-24 bg-white min-h-screen">
      <Container size="page">
        
        {/* Mobile Summary Accordion */}
        <div className="lg:hidden mb-8 bg-white rounded-3xl p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink/5">
          <button 
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full p-4 flex items-center justify-between text-ink"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="text-ink/60" />
              <span className="text-sm font-bold uppercase tracking-widest">Order Summary</span>
              <motion.div animate={{ rotate: mobileSummaryOpen ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </div>
            <span className="text-lg font-bold">${total.toFixed(2)}</span>
          </button>
          
          <AnimatePresence>
            {mobileSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-ink/5 flex flex-col gap-4">
                  {items.map((item) => (
                    <div key={item.lineId} className="flex gap-4">
                      <div className="relative w-16 h-16 bg-cream shrink-0 rounded-2xl overflow-hidden border border-ink/5">
                        <Image src={item.product?.imageUrl || '/placeholder.png'} alt={item.product?.name || 'Product'} fill className="object-cover" />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-ink text-cream rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 justify-center">
                        <span className="text-sm font-bold text-ink leading-tight">{item.product?.name}</span>
                        <span className="text-xs uppercase tracking-wider text-ink/60 mt-0.5">{item.variantSku}</span>
                      </div>
                      <span className="text-sm text-ink font-bold self-center">
                        ${(item.priceSnapshot * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 lg:gap-20">
          
          {/* Left Column: Flow */}
          <div className="flex flex-col gap-10">
            
            {/* Express Checkout */}
            <div className="flex flex-col gap-4 p-8 bg-white rounded-3xl border border-ink/10 shadow-sm items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Express Checkout</span>
              <div className="flex w-full gap-3">
                <Button variant="dark" className="flex-1 h-12 rounded-full bg-[#000] text-white hover:bg-black/80 transition-colors shadow-sm">
                  Apple Pay
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-full bg-white text-ink border-ink/20 hover:border-ink/40 transition-colors shadow-sm">
                  Google Pay
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2 opacity-50">
              <div className="flex-1 h-px bg-ink/10" />
              <span className="text-xs font-bold uppercase tracking-widest text-ink/60">OR PAY WITH CARD</span>
              <div className="flex-1 h-px bg-ink/10" />
            </div>

            {/* Continuous Form */}
            <form className="flex flex-col gap-10" onSubmit={(e) => e.preventDefault()}>
              
              {/* Contact */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-display font-bold text-ink mb-2">Contact Information</h2>
                <Input 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address" 
                  type="email" 
                  className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-ink"
                  required
                />
                <div className="flex items-start gap-3 mt-1 px-1">
                  <Checkbox 
                    id="marketing" 
                    name="marketing"
                    checked={formData.marketing}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketing: !!checked }))}
                    className="mt-0.5 rounded-md data-[state=checked]:bg-ink data-[state=checked]:border-ink" 
                  />
                  <label htmlFor="marketing" className="text-sm text-ink/60 cursor-pointer select-none">
                    Email me with news and exclusive offers.
                  </label>
                </div>
              </section>

              {/* Delivery */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-display font-bold text-ink mb-2">Delivery Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                  <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                </div>
                <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                <Input name="apartment" value={formData.apartment} onChange={handleInputChange} placeholder="Apartment, suite, etc. (optional)" className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" />
                <div className="grid grid-cols-6 gap-4">
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="col-span-3 sm:col-span-2 h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                  <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" className="col-span-3 sm:col-span-2 h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                  <Input name="zip" value={formData.zip} onChange={handleInputChange} placeholder="ZIP Code" className="col-span-6 sm:col-span-2 h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
                </div>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone (for delivery updates)" type="tel" className="h-14 rounded-2xl border-ink/10 bg-white shadow-sm focus-visible:ring-ink" required />
              </section>

              {/* Shipping Method */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-display font-bold text-ink mb-2">Shipping Method</h2>
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center justify-between p-5 rounded-2xl border transition-colors cursor-pointer shadow-sm ${shippingMethod === 'standard' ? 'border-ink bg-ink/5' : 'border-ink/10 bg-white hover:border-ink/30'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="shipping" 
                        value="standard" 
                        checked={shippingMethod === 'standard'} 
                        onChange={() => setShippingMethod('standard')}
                        className="w-4 h-4 text-ink border-ink/20 focus:ring-ink focus:ring-offset-0" 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-ink">Standard Secured Shipping</span>
                        <span className="text-xs text-ink/60 mt-0.5">3-5 business days</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-ink">Free</span>
                  </label>

                  <label className={`flex items-center justify-between p-5 rounded-2xl border transition-colors cursor-pointer shadow-sm ${shippingMethod === 'express' ? 'border-ink bg-ink/5' : 'border-ink/10 bg-white hover:border-ink/30'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="shipping" 
                        value="express" 
                        checked={shippingMethod === 'express'} 
                        onChange={() => setShippingMethod('express')}
                        className="w-4 h-4 text-ink border-ink/20 focus:ring-ink focus:ring-offset-0" 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-ink">Priority Overnight</span>
                        <span className="text-xs text-ink/60 mt-0.5">1-2 business days</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-ink">$25.00</span>
                  </label>
                </div>
              </section>

              {/* Payment */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-display font-bold text-ink mb-2">Payment</h2>
                <p className="text-xs font-medium text-ink/50 mb-2 flex items-center gap-1.5"><Lock size={12} /> All transactions are 256-bit encrypted and secure.</p>
                <div className="w-full h-56 bg-white border border-ink/10 rounded-3xl flex items-center justify-center flex-col gap-3 shadow-sm relative overflow-hidden">
                  <ShieldCheck size={32} className="text-ink/20" />
                  <span className="text-sm font-bold text-ink/40">Secure Stripe Element Loader</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-ink/[0.02] pointer-events-none" />
                </div>
              </section>

              {/* Submit */}
              <section className="flex flex-col gap-6 pt-4">
                <Button variant="dark" size="lg" className="w-full h-16 rounded-full text-sm tracking-widest uppercase shadow-[0_8px_20px_rgb(0,0,0,0.15)] hover:-translate-y-0.5 transition-all text-white">
                  Pay Now <ArrowRight size={18} className="ml-2" />
                </Button>
                <p className="text-center text-xs text-ink/40 font-medium">
                  By completing your purchase, you agree to our Terms of Service and strictly acknowledge these products are for Research Use Only.
                </p>
              </section>

            </form>
          </div>

          {/* Right Column: Sticky Summary (Desktop) */}
          <div className="hidden lg:block relative">
            <div className="sticky top-32 bg-[#fafafa] p-8 rounded-[2rem] border border-ink/10 shadow-lg flex flex-col gap-8">
              
              {/* Items List */}
              <div className="flex flex-col gap-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.lineId} className="flex gap-4 group">
                    <div className="relative w-20 h-20 bg-cream shrink-0 border border-ink/5 rounded-2xl overflow-hidden transition-transform group-hover:scale-105">
                      <Image src={item.product?.imageUrl || '/placeholder.png'} alt={item.product?.name || 'Product'} fill className="object-cover" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-ink text-cream rounded-full flex items-center justify-center text-[11px] font-bold z-10 shadow-sm border-2 border-white">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 justify-center py-1">
                      <span className="text-sm font-bold text-ink leading-tight">{item.product?.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mt-1">{item.variantSku}</span>
                    </div>
                    <span className="text-sm text-ink font-bold self-center">
                      ${(item.priceSnapshot * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="flex flex-col gap-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-500/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Tag size={16} className="text-green-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-700">{appliedCoupon.code}</span>
                        <span className="text-xs font-medium text-green-600/70">{appliedCoupon.description}</span>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-xs font-bold text-green-700 hover:text-green-800 uppercase tracking-widest transition-colors">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Discount code or gift card" 
                      className="flex-1 h-12 rounded-2xl border-ink/10 bg-cream/50 focus-visible:ring-ink shadow-inner-sm" 
                    />
                    <Button 
                      type="submit" 
                      variant="dark" 
                      disabled={!couponCode.trim() || isVerifyingCoupon}
                      className="h-12 px-6 rounded-2xl text-xs uppercase tracking-widest disabled:opacity-100 disabled:bg-ink/5 disabled:text-ink/40 disabled:border-transparent transition-colors"
                    >
                      {isVerifyingCoupon ? <Loader2 size={16} className="animate-spin text-ink/40" /> : 'Apply'}
                    </Button>
                  </form>
                )}
              </div>

              <div className="w-full h-px bg-ink/5" />

              {/* Totals */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm font-medium text-ink/70">
                  <span>Subtotal</span>
                  <span className="text-ink font-bold">${subtotal.toFixed(2)}</span>
                </div>
                
                <AnimatePresence>
                  {appliedCoupon && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="flex justify-between items-center text-sm font-medium text-green-600 overflow-hidden"
                    >
                      <span className="py-1">Discount ({appliedCoupon.code})</span>
                      <span className="py-1 font-bold">-${appliedCoupon.discount.toFixed(2)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center text-sm font-medium text-ink/70">
                  <span>Shipping</span>
                  <span className="text-ink font-bold">{finalShipping === 0 ? 'Free' : `$${finalShipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-ink/70">
                  <span>Estimated Tax</span>
                  <span className="text-ink font-bold">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full h-px bg-ink/5" />

              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-ink">Total</span>
                <span className="text-3xl font-display font-bold text-ink tracking-tight">${total.toFixed(2)}</span>
              </div>
              
            </div>
          </div>

        </div>
      </Container>
    </div>
  )
}
