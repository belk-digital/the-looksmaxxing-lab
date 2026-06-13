'use client'

import React, { useEffect } from 'react'
import { useCartStore } from '@/lib/cart/store'

export function LayoutClientWrapper({ 
  children,
  header,
  footer
}: { 
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
}) {
  const setCoupon = useCartStore(state => state.setCoupon)
  const couponCode = useCartStore(state => state.couponCode)

  useEffect(() => {
    // Check if we have an auto_coupon cookie
    const match = document.cookie.match(new RegExp('(^| )affiliate_auto_coupon=([^;]+)'))
    if (match) {
      const code = decodeURIComponent(match[2])
      if (code && !couponCode) {
        setCoupon(code)
      }
      // Delete the cookie so it doesn't run again or prevent user from removing the coupon
      document.cookie = 'affiliate_auto_coupon=; Max-Age=0; path=/;'
    }
  }, [setCoupon, couponCode])

  return (
    <div className="flex min-h-screen flex-col relative z-0 isolate">
      {header}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      <div className="relative z-40 isolate">
        {footer}
      </div>
    </div>
  )
}
