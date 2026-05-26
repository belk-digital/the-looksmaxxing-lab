import React from 'react'
import { OrderConfirmationClient } from './OrderConfirmationClient'
export const metadata = {
  title: 'Order Confirmed | The Looksmaxxing Lab',
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Hard-coded sample order for testing visually
  const mockOrder = {
    id: id || 'LL-2026-X8F9A',
    customerName: 'Alex',
    email: 'alex@example.com',
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

  return (
    <div className="pt-20">
      <OrderConfirmationClient order={mockOrder} />
    </div>
  )
}
