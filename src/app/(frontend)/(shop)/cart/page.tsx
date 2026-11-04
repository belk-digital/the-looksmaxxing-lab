import React from 'react'
import { CartClient } from './CartClient'

export const metadata = {
  title: 'Your Cart',
  robots: { index: false, follow: false },
}

// Never cached: built fresh on every visit. Without this line Next.js saves the page at build time
// and serves that saved copy until the next deploy.
export const dynamic = 'force-dynamic'

export default function CartPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="pt-20">
        <CartClient />
      </div>
    </div>
  )
}
