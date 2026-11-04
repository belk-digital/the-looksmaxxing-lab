import React from 'react'
import { CheckoutClient } from './CheckoutClient'

export const metadata = {
  title: 'Secure Checkout',
  robots: { index: false, follow: false },
}

// Never cached: built fresh on every visit. Without this line Next.js saves the page at build time
// and serves that saved copy until the next deploy.
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return <CheckoutClient />
}
