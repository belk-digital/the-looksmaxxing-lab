'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { MinimalHeader } from './MinimalHeader'
import { MinimalFooter } from './MinimalFooter'

export function LayoutClientWrapper({ 
  children,
  header,
  footer
}: { 
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const isCheckout = pathname.includes('/checkout')

  return (
    <div className="flex min-h-screen flex-col relative z-0 isolate">
      {isCheckout ? <MinimalHeader /> : header}
      <main className="flex-1 flex flex-col relative z-10 isolate">
        {children}
      </main>
      <div className="relative z-[99999] isolate">
        {isCheckout ? <MinimalFooter /> : footer}
      </div>
    </div>
  )
}
