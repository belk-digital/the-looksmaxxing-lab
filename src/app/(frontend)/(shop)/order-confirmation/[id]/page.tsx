import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { OrderConfirmationClient } from './OrderConfirmationClient'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Order Confirmed | The Looksmaxxing Lab',
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id || id === 'success') {
    return notFound()
  }

  const payload = await getPayload({ config: configPromise })
  
  let order;
  try {
     const numericId = parseInt(id, 10)
     order = await payload.findByID({
       collection: 'orders',
       id: isNaN(numericId) ? id : numericId,
       depth: 2
     })
  } catch (e) {
     return notFound()
  }

  if (!order) return notFound()

  // Format order items
  const formattedItems = (order.items || []).map((item: any, i: number) => {
     // Use product object since depth > 0 populates relationships
     const productData = typeof item.product === 'object' ? item.product : item.productSnapshot
     
     return {
        id: item.id || String(i),
        name: productData?.title || productData?.name || 'Product',
        variant: 'Standard', 
        quantity: item.quantity,
        price: productData?.price || productData?.basePrice || 0,
        image: productData?.images?.[0]?.image?.url || productData?.images?.[0]?.url || '/temp-products/product-image.png'
     }
  })

  // Format OrderData
  const orderData = {
    id: order.orderNumber || String(order.id),
    customerName: `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim() || 'Customer',
    email: order.guestEmail || '',
    shippingAddress: {
      line1: order.shippingAddress?.line1 || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      postalCode: order.shippingAddress?.postalCode || '',
      country: order.shippingAddress?.country || 'US'
    },
    estimatedDelivery: order.shippingMethod === 'express' ? '1-3 Business Days' : '5-7 Business Days',
    items: formattedItems,
    subtotal: order.subtotal || 0,
    shipping: order.shippingTotal || 0,
    processingFee: (order.feeTotal ? order.feeTotal / 100 : order.taxTotal) || 0,
    total: order.total || 0,
    discountTotal: order.discountTotal || 0,
    redeemedPoints: order.redeemedPoints || 0,
    couponCode: order.couponCode || '',
    paymentMethod: 'Credit Card' 
  }

  return (
    <div className="pt-20">
      <OrderConfirmationClient order={orderData} />
    </div>
  )
}
