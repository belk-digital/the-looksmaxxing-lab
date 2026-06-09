'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { Button, buttonVariants } from '@/components/ui/button'

type OrderItem = {
  id: string
  name: string
  variant: string
  quantity: number
  price: number
  image: string
}

type OrderData = {
  id: string
  customerName: string
  email: string
  shippingAddress: {
    line1: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  estimatedDelivery: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentMethod: string
}

export function OrderConfirmationClient({ order }: { order: OrderData }) {
  return (
    <Container size="content" className="py-24 md:py-32 flex flex-col items-center">
      
      {/* Animated Checkmark */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-full border-2 border-gold flex items-center justify-center text-gold mb-8 shadow-[0_0_40px_rgba(201,160,80,0.15)]"
      >
        <Check size={48} strokeWidth={1.5} />
      </motion.div>

      <div className="text-center mb-12">
        <FadeUp delay={0.3}>
          <h1 className="text-display-md font-display text-ink mb-4">
            Thank you, {order.customerName}.
          </h1>
        </FadeUp>
        
        <FadeUp delay={0.4}>
          <p className="text-body-lg text-ink-muted mb-2">
            Your order is confirmed.
          </p>
        </FadeUp>
        
        <FadeUp delay={0.5}>
          <p className="text-body-md text-ink-muted/70 max-w-md mx-auto">
            Order #{order.id} <br/>
            We've sent a confirmation email to <span className="text-ink font-medium">{order.email}</span> with your receipt and tracking details.
          </p>
        </FadeUp>
      </div>

      <FadeUp delay={0.6} className="w-full">
        <div className="w-full h-px bg-border-subtle mb-12" />
        
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-12 text-left">
          
          {/* Items List */}
          <div>
            <h2 className="text-label-md uppercase tracking-wider text-ink mb-6 border-b border-border-subtle pb-2">Order Details</h2>
            <div className="flex flex-col gap-6">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-cream-warm shrink-0 border border-border-subtle rounded-sm overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-ink text-cream rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-editorial-sm font-display text-ink leading-tight">{item.name}</span>
                    <span className="text-label-xs uppercase tracking-wider text-ink-muted mt-0.5">{item.variant}</span>
                  </div>
                  <span className="text-body-sm text-ink font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-cream-warm p-8 rounded-sm border border-border-subtle">
            {/* Shipping Info */}
            <div className="flex flex-col gap-2 text-body-sm">
              <span className="text-label-sm uppercase tracking-wider text-ink-muted mb-2">Shipping To</span>
              <span className="text-ink font-medium">{order.customerName}</span>
              <span className="text-ink-muted">{order.shippingAddress.line1}</span>
              <span className="text-ink-muted">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</span>
              <span className="text-ink-muted">{order.shippingAddress.country}</span>
              <div className="mt-4 flex flex-col">
                <span className="text-label-sm uppercase tracking-wider text-ink-muted mb-1">Estimated Delivery</span>
                <span className="text-ink font-medium">{order.estimatedDelivery}</span>
              </div>
            </div>
            
            {/* Payment & Totals */}
            <div className="flex flex-col gap-3 text-body-sm">
              <div className="flex flex-col mb-4">
                <span className="text-label-sm uppercase tracking-wider text-ink-muted mb-2">Payment Method</span>
                <span className="text-ink">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-ink-muted border-b border-border-subtle pb-3">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink font-medium mt-1">
                <span>Total</span>
                <span className="text-label-lg">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </FadeUp>

      <FadeUp delay={0.7} className="mt-16 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href={`/account/orders/${order.id}`} className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto min-w-[200px]' })}>
          VIEW ORDER
        </Link>
        <Link href="/shop" className={buttonVariants({ variant: 'dark', size: 'lg', className: 'w-full sm:w-auto min-w-[200px]' })}>
          CONTINUE BROWSING
        </Link>
      </FadeUp>
      
    </Container>
  )
}
