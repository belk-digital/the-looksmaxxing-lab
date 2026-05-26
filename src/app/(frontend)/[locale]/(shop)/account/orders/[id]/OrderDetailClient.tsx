'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants, Button } from '@/components/ui/button'
import { ArrowLeft, Package, RotateCcw } from 'lucide-react'

type OrderStatus = 'Ordered' | 'Processing' | 'Shipped' | 'Delivered'

// Mock Data
const MOCK_ORDER = {
  id: 'LL-2026-X8F9A',
  date: 'May 20, 2026',
  status: 'Processing' as OrderStatus,
  customerName: 'Alex Sterling',
  shippingAddress: {
    line1: '123 Biohack Way',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'USA'
  },
  estimatedDelivery: 'May 30, 2026',
  items: [
    {
      id: 'item-1',
      name: 'TB-500',
      variant: '5MG',
      quantity: 1,
      price: 80.00,
      image: '/temp-products/tb-500.png'
    },
    {
      id: 'item-2',
      name: 'NAD+',
      variant: '500MG',
      quantity: 2,
      price: 150.00,
      image: '/temp-products/product-image.png'
    }
  ],
  subtotal: 380.00,
  shipping: 0.00,
  tax: 30.40,
  total: 410.40,
  paymentMethod: 'Visa ending in 4242'
}

const STATUS_STEPS: OrderStatus[] = ['Ordered', 'Processing', 'Shipped', 'Delivered']

export function OrderDetailClient({ id }: { id: string }) {
  // Override ID with requested parameter, but keep the mock data for UI display
  const order = { ...MOCK_ORDER, id: id.toUpperCase() }
  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <Link href="/account/orders" className="flex items-center gap-2 text-label-sm uppercase tracking-wider text-ink-muted hover:text-ink transition-colors mb-2">
            <ArrowLeft size={14} />
            Back to Orders
          </Link>
          <h1 className="text-display-xs font-display text-ink leading-none">Order #{order.id}</h1>
          <span className="text-body-sm text-ink-muted">Placed on {order.date}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RotateCcw size={16} />
            Request Return
          </Button>
          <Button variant="dark" className="gap-2">
            <Package size={16} />
            Reorder All
          </Button>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-cream-warm border border-border-subtle p-8 rounded-sm mb-12">
        <h2 className="text-label-md uppercase tracking-wider text-ink mb-8">Tracking Status</h2>
        <div className="relative flex justify-between">
          {/* Connecting Line (Background) */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border-subtle -z-10" />
          
          {/* Connecting Line (Progress) */}
          <div 
            className="absolute top-4 left-0 h-0.5 bg-ink -z-10 transition-all duration-1000 ease-out-quart" 
            style={{ width: `${(Math.max(currentStepIndex, 0) / (STATUS_STEPS.length - 1)) * 100}%` }} 
          />

          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            
            return (
              <div key={step} className="flex flex-col items-center gap-3 bg-cream-warm px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  isCompleted ? 'bg-ink text-cream' : 'bg-cream border-2 border-border-subtle text-ink-muted'
                }`}>
                  {isCompleted && (
                    <div className="w-2 h-2 bg-cream rounded-full" />
                  )}
                </div>
                <span className={`text-label-sm uppercase tracking-wider ${
                  isCurrent ? 'text-ink font-medium' : isCompleted ? 'text-ink-muted' : 'text-ink-muted/50'
                }`}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Section (Reused layout style from Checkout) */}
      <div className="w-full h-px bg-border-subtle mb-12" />
        
      <div className="w-full flex flex-col gap-12 text-left">
        
        {/* Items List */}
        <div>
          <h2 className="text-label-md uppercase tracking-wider text-ink mb-6 border-b border-border-subtle pb-2">Items Ordered</h2>
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

    </div>
  )
}
