'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { name: 'Overview', href: '/account' },
  { name: 'Orders', href: '/account/orders' },
  { name: 'Addresses', href: '/account/addresses' },
  { name: 'Wishlist', href: '/account/wishlist' },
  { name: 'Settings', href: '/account/settings' },
]

export function AccountSidebar({ userName = 'User' }: { userName?: string }) {
  const pathname = usePathname() || ''
  
  return (
    <aside className="w-full flex flex-col gap-8">
      {/* Greeting */}
      <h2 className="text-body-lg font-display text-ink hidden lg:block">
        Welcome, {userName}
      </h2>
      
      {/* Mobile: Horizontal scroll, Desktop: Vertical list */}
      <nav className="flex overflow-x-auto lg:flex-col lg:overflow-visible gap-4 lg:gap-0 pb-4 lg:pb-0 scrollbar-hide border-b border-border-subtle lg:border-b-0">
        {NAV_ITEMS.map((item) => {
          // Strict exact match for root /account
          const isActive = item.href === '/account' 
            ? pathname.endsWith('/account') 
            : pathname.includes(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                shrink-0 py-3 text-label-md uppercase tracking-wider transition-colors
                lg:border-b lg:border-border-subtle lg:pl-4 lg:-ml-px
                ${isActive 
                  ? 'text-ink border-b-2 border-ink lg:border-b lg:border-l-2' 
                  : 'text-ink-muted hover:text-ink border-b-2 border-transparent lg:border-b lg:border-l-2 lg:border-l-transparent'
                }
              `}
            >
              {item.name}
            </Link>
          )
        })}
        
        {/* Sign out */}
        <button className="shrink-0 py-3 text-label-md uppercase tracking-wider text-ink-muted hover:text-ink transition-colors lg:border-b lg:border-border-subtle text-left lg:border-l-2 lg:border-l-transparent lg:pl-4 lg:-ml-px">
          Sign out
        </button>
      </nav>
    </aside>
  )
}
