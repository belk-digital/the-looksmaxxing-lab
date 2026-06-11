'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package, RotateCcw, MapPin, CreditCard, Truck } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { motion } from 'framer-motion'
import { useCartStore } from '@/lib/cart/store'
import { useRouter } from 'next/navigation'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

type OrderStatus = 'Placed' | 'Processing' | 'Shipped' | 'Delivered'
const STATUS_STEPS: OrderStatus[] = ['Placed', 'Processing', 'Shipped', 'Delivered']

export interface OrderDetailProps {
  order: any; // We use any here to safely traverse the dynamic payload object
}

function getMappedStatus(payloadStatus: string): OrderStatus {
  switch (payloadStatus) {
    case 'shipped': return 'Shipped'
    case 'completed': return 'Delivered'
    case 'pending': return 'Placed'
    case 'refunded':
    case 'cancelled':
      return 'Placed' // Technically an edge case for the timeline
    case 'paid':
    case 'fulfilled':
    default:
      return 'Processing'
  }
}

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const addItem = useCartStore(state => state.addItem)
  const openCart = useCartStore(state => state.openCart)

  const handleReorder = () => {
    if (!order.items) return
    for (const item of order.items) {
      const product = item.product || item.productSnapshot || {}
      if (product.id) {
        const title = product.title || product.name || 'Unknown Product'
        const imageUrl = product.images?.[0]?.image?.url || product.images?.[0]?.url || '/temp-products/product-image.png'
        const price = typeof item.price === 'number' ? item.price : (product.basePrice || product.price || 0)
        addItem(
          { id: product.id, name: title, imageUrl },
          item.variant || null, // variantSku
          item.quantity || 1,
          price
        )
      }
    }
    openCart()
    router.push('/cart')
  }

  const currentStepIndex = STATUS_STEPS.indexOf(getMappedStatus(order.status))
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(order.createdAt))

  const subtotal = order.subtotal || 0
  const shipping = order.shippingTotal || 0
  const processingFee = (order.feeTotal ? order.feeTotal / 100 : order.taxTotal) || 0
  const total = order.total || 0

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col max-w-5xl"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-2">
          <Link href="/account/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-black transition-colors mb-4 w-fit bg-gray-50 px-4 py-2 rounded-full">
            <ArrowLeft size={14} />
            Back to Orders
          </Link>
          <h1 className={`text-4xl text-black font-bold tracking-tighter ${spaceGrotesk.className}`}>
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500">Placed on {formattedDate}</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReorder}
            className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all shadow-lg"
          >
            <Package size={14} />
            Reorder All
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Items and Timeline */}
        <div className="flex flex-col gap-8 flex-1 w-full">
          
          {/* Tracking Timeline */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black mb-8 border-b border-gray-100 pb-4">Tracking Status</h2>
            <div className="relative flex justify-between px-4 sm:px-8">
              {/* Connecting Line (Background) */}
              <div className="absolute top-4 left-8 right-8 h-[2px] bg-gray-100 -z-10 rounded-full" />
              
              {/* Connecting Line (Progress) */}
              <div 
                className="absolute top-4 left-8 h-[2px] bg-black -z-10 transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `calc(${(Math.max(currentStepIndex, 0) / (STATUS_STEPS.length - 1)) * 100}% - 4rem)` }} 
              />

              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                
                return (
                  <div key={step} className="flex flex-col items-center gap-3 bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                      isCompleted ? 'bg-black text-white border-none' : 'bg-white border-2 border-gray-100 text-gray-300'
                    }`}>
                      {isCompleted && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      isCurrent ? 'text-black' : isCompleted ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {order.status === 'cancelled' && (
              <div className="mt-8 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                This order has been cancelled.
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-black mb-6 border-b border-gray-100 pb-4">Items Ordered</h2>
            <div className="flex flex-col gap-6">
              {order.items?.map((item: any) => {
                // Prioritize the live populated product relation to get the actual image media objects
                const product = item.product || item.productSnapshot || {}
                const title = product.title || product.name || 'Unknown Product'
                const price = typeof item.price === 'number' ? item.price : (product.basePrice || product.price || 0)
                const imageUrl = product.images?.[0]?.image?.url || product.images?.[0]?.url || '/temp-products/product-image.png'
                
                let displayVariant = item.variant || 'Standard';
                if (product?.variants?.length) {
                  for (const v of product.variants) {
                    const vTitle = v.options?.map((o:any) => o.value).join(' ') || `Variant`;
                    if (displayVariant === v.sku) {
                       displayVariant = vTitle;
                       break;
                    }
                    if (displayVariant.startsWith(`${v.sku} - `)) {
                       displayVariant = displayVariant.replace(`${v.sku} - `, `${vTitle} - `);
                       break;
                    }
                  }
                }
                
                return (
                  <div key={item.id || Math.random()} className="flex items-center gap-6 group">
                    <Link href={`/products/${product.slug || ''}`} className="relative w-20 h-20 bg-gray-50 shrink-0 border border-gray-100 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <Image src={imageUrl} alt={title} fill className="object-contain p-2" sizes="80px" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 border-2 border-white shadow-sm">
                        {item.quantity}
                      </div>
                    </Link>
                    
                    <div className="flex flex-col flex-1">
                      <Link href={`/products/${product.slug || ''}`}>
                        <span className={`text-lg text-black font-bold tracking-tight hover:text-purple-600 transition-colors ${spaceGrotesk.className}`}>
                          {title}
                        </span>
                      </Link>
                      {displayVariant && !['DEFAULT', 'DEFAULT TITLE'].includes(displayVariant.toUpperCase()) && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">
                          {displayVariant}
                        </span>
                      )}
                    </div>
                    
                    <span className={`text-xl font-bold text-black tracking-tighter ${spaceGrotesk.className}`}>
                      ${(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>

        {/* Right Column: Summaries */}
        <div className="flex flex-col gap-8 w-full lg:w-[340px] shrink-0">
          
          {/* Shipping Summary */}
          {order.shippingAddress && (
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 text-black">
                <Truck size={16} />
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]">Shipping Info</h2>
              </div>
              
              <div className="flex flex-col gap-1 text-sm text-gray-500 leading-relaxed">
                <span className={`text-lg text-black font-bold tracking-tight mb-2 ${spaceGrotesk.className}`}>
                  {order.customerFirstName} {order.customerLastName}
                </span>
                <span>{order.shippingAddress.line1}</span>
                {order.shippingAddress.line2 && <span>{order.shippingAddress.line2}</span>}
                <span>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</span>
                <span>{order.shippingAddress.country}</span>
              </div>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 text-black">
              <CreditCard size={16} />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em]">Order Summary</h2>
            </div>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {!!order.discountTotal && order.discountTotal > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-${order.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className={`flex justify-between text-gray-500 ${!order.redeemedPoints ? 'border-b border-gray-100 pb-4' : ''}`}>
                <span>Processing Fee</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              {!!order.redeemedPoints && order.redeemedPoints > 0 && (
                <div className="flex justify-between text-green-500 border-b border-gray-100 pb-4 mt-1">
                  <span>Maxx Points</span>
                  <span>-${order.redeemedPoints.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-black font-bold mt-2">
                <span className="text-sm">Total</span>
                <span className={`text-3xl tracking-tighter ${spaceGrotesk.className}`}>${total.toFixed(2)}</span>
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-2 rounded-lg mt-2 text-center border ${
                ['captured', 'paid', 'succeeded'].includes(order.paymentStatus) ? 'bg-green-50 text-green-600 border-green-100' :
                order.paymentStatus === 'refunded' ? 'bg-red-50 text-red-600 border-red-100' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {['captured', 'paid', 'succeeded'].includes(order.paymentStatus) ? 'Payment Successful' : 
                 order.paymentStatus === 'refunded' ? 'Refunded' : 
                 'Payment Processing'}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  )
}
