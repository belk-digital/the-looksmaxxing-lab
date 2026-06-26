import React from 'react'
import { CheckoutClient } from './CheckoutClient'

export const metadata = {
  title: 'Secure Checkout | The Looksmaxxing Lab',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
