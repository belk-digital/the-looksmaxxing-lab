'use client'

import React from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { ArrowRight, Package, LifeBuoy } from 'lucide-react'

export function AccountOverviewClient() {
  // Hardcoded sample data
  const stats = {
    ordersPlaced: 4,
    wishlistCount: 12,
    memberSince: '2025'
  }
  
  const recentOrders = [
    { id: 'LL-2026-X8F9A', date: 'May 20, 2026', status: 'Processing', total: 410.40 },
    { id: 'LL-2026-B4291', date: 'Apr 12, 2026', status: 'Delivered', total: 125.00 },
    { id: 'LL-2026-Z7103', date: 'Jan 05, 2026', status: 'Delivered', total: 640.20 },
  ]
  
  const defaultAddress = {
    name: 'Alex Sterling',
    street: '123 Biohack Way, Apt 4',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    country: 'United States'
  }

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream-warm p-6 rounded-sm flex flex-col justify-center border border-border-subtle">
          <span className="text-display-sm font-display text-ink leading-none mb-3">{stats.ordersPlaced}</span>
          <span className="text-label-md uppercase tracking-wider text-ink-muted">Orders Placed</span>
        </div>
        <div className="bg-cream-warm p-6 rounded-sm flex flex-col justify-center border border-border-subtle">
          <span className="text-display-sm font-display text-ink leading-none mb-3">{stats.wishlistCount}</span>
          <span className="text-label-md uppercase tracking-wider text-ink-muted">Wishlist Items</span>
        </div>
        <div className="bg-cream-warm p-6 rounded-sm flex flex-col justify-center border border-border-subtle">
          <span className="text-display-sm font-display text-ink leading-none mb-3">{stats.memberSince}</span>
          <span className="text-label-md uppercase tracking-wider text-ink-muted">Member Since</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-12 items-start">
        
        {/* Left Column: Recent Orders */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h3 className="text-label-lg uppercase tracking-wider text-ink">Recent Orders</h3>
            <Link href="/account/orders" className="text-label-sm uppercase tracking-wider text-ink-muted hover:text-ink transition-colors">
              View All
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-border-subtle rounded-sm hover:bg-cream-warm/50 transition-colors gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-label-md uppercase tracking-wider text-ink">Order #{order.id}</span>
                  <span className="text-body-sm text-ink-muted">{order.date}</span>
                </div>
                
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="text-body-sm text-ink font-medium">${order.total.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${order.status === 'Processing' ? 'bg-gold' : 'bg-ink'}`} />
                    <span className="text-body-xs uppercase tracking-wider text-ink-muted">{order.status}</span>
                  </div>
                </div>
                
                <Link href={`/account/orders/${order.id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-2 sm:mt-0 whitespace-nowrap shrink-0' })}>
                  View Order
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Address & Quick Links */}
        <div className="flex flex-col gap-12">
          
          {/* Default Address */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-label-lg uppercase tracking-wider text-ink">Default Address</h3>
              <Link href="/account/addresses" className="text-label-sm uppercase tracking-wider text-ink-muted hover:text-ink transition-colors">
                Edit
              </Link>
            </div>
            
            <div className="bg-cream-warm p-6 rounded-sm border border-border-subtle flex flex-col text-body-sm text-ink-muted leading-relaxed">
              <span className="text-ink font-medium text-body-md mb-2">{defaultAddress.name}</span>
              <span>{defaultAddress.street}</span>
              <span>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}</span>
              <span>{defaultAddress.country}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-label-lg uppercase tracking-wider text-ink border-b border-border-subtle pb-4">Need Help?</h3>
            <div className="flex flex-col gap-3">
              <Link href="/track" className="flex items-center justify-between p-4 border border-border-subtle rounded-sm hover:border-ink transition-colors group">
                <div className="flex items-center gap-3 text-ink">
                  <Package size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
                  <span className="text-label-sm uppercase tracking-wider">Track an Order</span>
                </div>
                <ArrowRight size={16} className="text-ink-muted group-hover:text-ink transition-colors group-hover:translate-x-1" />
              </Link>
              
              <Link href="/contact" className="flex items-center justify-between p-4 border border-border-subtle rounded-sm hover:border-ink transition-colors group">
                <div className="flex items-center gap-3 text-ink">
                  <LifeBuoy size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
                  <span className="text-label-sm uppercase tracking-wider">Contact Support</span>
                </div>
                <ArrowRight size={16} className="text-ink-muted group-hover:text-ink transition-colors group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
