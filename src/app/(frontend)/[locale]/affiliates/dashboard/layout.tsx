'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FadeUp } from '@/components/motion/FadeUp'

const NAV_LINKS = [
  { name: 'Overview', href: '/affiliates/dashboard' },
  { name: 'Links & Assets', href: '/affiliates/dashboard/links' },
  { name: 'Conversions', href: '/affiliates/dashboard/conversions' },
  { name: 'Earnings', href: '/affiliates/dashboard/earnings' },
  { name: 'Payouts', href: '/affiliates/dashboard/payouts' },
  { name: 'Settings', href: '/affiliates/dashboard/settings' },
]

export default function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <div className="px-6 max-w-[1440px] mx-auto">
        
        {/* Header */}
        <FadeUp>
          <div className="mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-border-strong pb-6 gap-4">
            <div>
              <h1 className="text-display-md font-serif text-ink">Affiliate Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="bg-cream-warm border border-gold px-3 py-1 rounded-sm text-label-md uppercase tracking-wider text-gold-dark shadow-sm">
                GOLD TIER
              </span>
            </div>
          </div>
        </FadeUp>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Sidebar Navigation */}
          <div className="md:col-span-3 lg:col-span-2 overflow-x-auto md:overflow-visible">
            <FadeUp delay={0.1}>
              <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 pb-4 md:pb-0">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        'whitespace-nowrap px-4 py-2 text-label-md uppercase tracking-wider rounded-sm transition-colors duration-fast border',
                        isActive
                          ? 'bg-ink text-cream border-ink'
                          : 'bg-transparent text-ink-muted border-transparent hover:bg-cream-warm hover:text-ink border-border-subtle hover:border-ink'
                      )}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </nav>
            </FadeUp>
          </div>
          
          {/* Main Content Area */}
          <div className="md:col-span-9 lg:col-span-10 min-h-[50vh]">
            <FadeUp delay={0.2} className="h-full">
              {children}
            </FadeUp>
          </div>
          
        </div>
      </div>
    </main>
  )
}
