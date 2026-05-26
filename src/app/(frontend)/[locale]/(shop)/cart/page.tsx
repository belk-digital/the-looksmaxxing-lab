import React from 'react'
import { CartClient } from './CartClient'

export const metadata = {
  title: 'Your Cart | The Looksmaxxing Lab',
}

export default function CartPage() {
  return (
    <div className="pt-20">
      <CartClient />
    </div>
  )
}
