'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore } from '@/lib/cart/store'

// A small component to render each section block
function CheckoutSection({
  stepNumber,
  title,
  isActive,
  isCompleted,
  children
}: {
  stepNumber: number
  title: string
  isActive: boolean
  isCompleted: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`transition-colors duration-300 border p-6 md:p-8 rounded-sm ${isActive ? 'border-ink shadow-sm bg-white/40' : isCompleted ? 'border-border-subtle bg-transparent' : 'border-border-subtle/50 opacity-50 bg-transparent pointer-events-none'}`}>
      <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-ink text-cream' : isActive ? 'bg-ink text-cream' : 'bg-border-subtle text-ink-muted'}`}>
          {isCompleted ? <Check size={12} strokeWidth={3} /> : stepNumber}
        </div>
        <h2 className="text-label-lg uppercase tracking-wider text-ink m-0">
          {title}
        </h2>
      </div>
      <div className={isActive || isCompleted ? 'opacity-100' : 'opacity-0'}>
        {children}
      </div>
    </div>
  )
}

export function CheckoutClient() {
  const { items } = useCartStore()
  const [activeStep, setActiveStep] = useState(1)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.priceSnapshot * item.quantity, 0)
  const shipping = subtotal >= 300 || subtotal === 0 ? 0 : 15
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="pt-20"> {/* Offset for MinimalHeader */}
      <Container size="page" className="py-8 md:py-16">
        
        {/* Mobile Summary Accordion (Hidden on Desktop) */}
        <div className="lg:hidden mb-8 border border-border-subtle rounded-sm bg-cream-warm overflow-hidden">
          <button 
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full p-4 flex items-center justify-between text-ink"
          >
            <div className="flex items-center gap-2">
              <span className="text-label-md uppercase tracking-wider">Order Summary</span>
              {mobileSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <span className="text-body-lg font-medium">${total.toFixed(2)}</span>
          </button>
          
          <AnimatePresence>
            {mobileSummaryOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border-subtle border-dashed">
                  {items.map((item) => (
                    <div key={item.lineId} className="flex justify-between items-center py-2 text-body-sm">
                      <span className="text-ink-muted">{item.product?.name} x {item.quantity}</span>
                      <span className="text-ink">${(item.priceSnapshot * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
          
          {/* Left Column: Flow */}
          <div className="flex flex-col gap-6">
            
            {/* Express Checkout */}
            <div className="flex flex-col gap-3 p-6 border border-border-subtle rounded-sm bg-cream-warm items-center">
              <span className="text-label-sm uppercase tracking-wider text-ink-muted mb-2">Express Checkout</span>
              <div className="flex w-full gap-3">
                <Button variant="dark" className="flex-1 bg-black text-white hover:bg-black/90">
                  <span className="font-sans normal-case tracking-normal">Apple Pay</span>
                </Button>
                <Button variant="dark" className="flex-1 bg-black text-white hover:bg-black/90">
                  <span className="font-sans normal-case tracking-normal">Google Pay</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-label-sm uppercase tracking-wider text-ink-muted">OR PAY ANOTHER WAY</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Section 1: Contact */}
            <CheckoutSection 
              stepNumber={1} 
              title="Contact" 
              isActive={activeStep === 1} 
              isCompleted={activeStep > 1}
            >
              <div className="flex flex-col gap-4">
                <Input placeholder="Email Address" type="email" />
                <div className="flex items-start gap-3 mt-2">
                  <Checkbox id="marketing" className="mt-1" />
                  <label htmlFor="marketing" className="text-body-sm text-ink-muted leading-tight">
                    Email me with news and offers from The Looksmaxxing Lab.
                  </label>
                </div>
                {activeStep === 1 && (
                  <Button variant="dark" className="mt-4 self-start" onClick={() => setActiveStep(2)}>
                    Continue to Shipping
                  </Button>
                )}
              </div>
            </CheckoutSection>

            {/* Section 2: Shipping Address */}
            <CheckoutSection 
              stepNumber={2} 
              title="Shipping Address" 
              isActive={activeStep === 2} 
              isCompleted={activeStep > 2}
            >
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                </div>
                <Input placeholder="Address" />
                <Input placeholder="Apartment, suite, etc. (optional)" />
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="City" className="col-span-1" />
                  <Input placeholder="State" className="col-span-1" />
                  <Input placeholder="ZIP code" className="col-span-1" />
                </div>
                <Input placeholder="Phone (for delivery updates)" type="tel" />
                
                {activeStep === 2 && (
                  <Button variant="dark" className="mt-4 self-start" onClick={() => setActiveStep(3)}>
                    Continue to Shipping Method
                  </Button>
                )}
              </div>
            </CheckoutSection>

            {/* Section 3: Shipping Method */}
            <CheckoutSection 
              stepNumber={3} 
              title="Shipping Method" 
              isActive={activeStep === 3} 
              isCompleted={activeStep > 3}
            >
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-4 border border-ink rounded-sm bg-cream-warm cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" defaultChecked className="w-4 h-4 text-ink focus:ring-ink" />
                    <span className="text-body-md text-ink font-medium">Standard Shipping (3-5 days)</span>
                  </div>
                  <span className="text-body-md text-ink font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </label>
                <label className="flex items-center justify-between p-4 border border-border-subtle rounded-sm hover:bg-cream-warm/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" className="w-4 h-4 text-ink focus:ring-ink" />
                    <span className="text-body-md text-ink">Express Shipping (2 days)</span>
                  </div>
                  <span className="text-body-md text-ink font-medium">$25.00</span>
                </label>
                
                {activeStep === 3 && (
                  <Button variant="dark" className="mt-4 self-start" onClick={() => setActiveStep(4)}>
                    Continue to Payment
                  </Button>
                )}
              </div>
            </CheckoutSection>

            {/* Section 4: Payment */}
            <CheckoutSection 
              stepNumber={4} 
              title="Payment" 
              isActive={activeStep === 4} 
              isCompleted={activeStep > 4}
            >
              <div className="flex flex-col gap-4">
                <p className="text-body-sm text-ink-muted mb-2">All transactions are secure and encrypted.</p>
                <div className="w-full h-48 bg-border-subtle/30 border border-dashed border-border-subtle rounded-sm flex items-center justify-center flex-col gap-2">
                  <span className="text-label-md uppercase text-ink-muted">Stripe Payment Element</span>
                  <span className="text-body-xs text-ink-muted/50">(Placeholder)</span>
                </div>
                
                {activeStep === 4 && (
                  <Button variant="dark" className="mt-4 self-start" onClick={() => setActiveStep(5)}>
                    Review Order
                  </Button>
                )}
              </div>
            </CheckoutSection>

            {/* Section 5: Acknowledgement */}
            <CheckoutSection 
              stepNumber={5} 
              title="Acknowledgement" 
              isActive={activeStep === 5} 
              isCompleted={false}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="ruo" className="mt-1" />
                  <label htmlFor="ruo" className="text-body-sm text-ink leading-tight">
                    I acknowledge that these products are for Research Use Only (RUO) and are not intended for human consumption or therapeutic use.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="age" className="mt-1" />
                  <label htmlFor="age" className="text-body-sm text-ink leading-tight">
                    I confirm that I am at least 21 years of age.
                  </label>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <Button variant="dark" size="lg" className="w-full text-label-lg">
                    PLACE ORDER
                  </Button>
                  <p className="text-center text-body-xs text-ink-muted mt-4">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </CheckoutSection>

          </div>

          {/* Right Column: Sticky Summary (Desktop) */}
          <div className="hidden lg:block relative">
            <div className="sticky top-28 bg-cream-warm p-8 rounded-sm border border-border-subtle">
              <h2 className="text-label-lg uppercase tracking-wider text-ink mb-6">Order Summary</h2>
              
              {/* Items List */}
              <div className="flex flex-col gap-4 mb-6 border-b border-border-subtle pb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.lineId} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-cream shrink-0 border border-border-subtle rounded-sm overflow-hidden">
                      <Image src={item.product?.imageUrl || '/placeholder.png'} alt={item.product?.name || 'Product'} fill className="object-cover" />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-ink text-cream rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                      <span className="text-editorial-sm font-display text-ink leading-tight">{item.product?.name}</span>
                      <span className="text-label-xs uppercase tracking-wider text-ink-muted mt-0.5">{item.variantSku}</span>
                    </div>
                    <span className="text-body-sm text-ink font-medium self-center">
                      ${(item.priceSnapshot * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="flex gap-2 mb-6 border-b border-border-subtle pb-6">
                <Input placeholder="Promo code" className="bg-transparent border-border-subtle focus-visible:border-ink rounded-sm" />
                <Button variant="secondary" className="rounded-sm shrink-0">Apply</Button>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-3 mb-6 border-b border-border-subtle pb-6">
                <div className="flex justify-between items-center text-body-sm text-ink">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm text-ink">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center text-body-sm text-ink">
                  <span>Estimated Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <span className="text-label-lg uppercase tracking-wider text-ink">Total</span>
                <span className="text-display-xs text-ink font-medium">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </div>
  )
}
