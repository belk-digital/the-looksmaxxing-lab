import React from 'react'
import { CartClient } from './CartClient'

export const metadata = {
  title: 'Your Cart | The Looksmaxxing Lab',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="pt-20">
        <CartClient />
      </div>
    </div>
  )
}
