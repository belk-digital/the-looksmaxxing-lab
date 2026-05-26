'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { buttonVariants, Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Filter, Package } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Hardcoded mock data
const MOCK_ORDERS = [
  { id: 'LL-2026-X8F9A', date: 'May 20, 2026', status: 'Processing', total: 410.40, itemCount: 3 },
  { id: 'LL-2026-B4291', date: 'Apr 12, 2026', status: 'Delivered', total: 125.00, itemCount: 1 },
  { id: 'LL-2026-Z7103', date: 'Jan 05, 2026', status: 'Delivered', total: 640.20, itemCount: 5 },
  { id: 'LL-2025-C1934', date: 'Dec 18, 2025', status: 'Returned', total: 85.00, itemCount: 1 },
  { id: 'LL-2025-A8821', date: 'Nov 02, 2025', status: 'Delivered', total: 210.00, itemCount: 2 },
]

export function OrdersClient() {
  const [filter, setFilter] = useState('all')

  const filteredOrders = filter === 'all' 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(o => o.status.toLowerCase() === filter)

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-label-xl uppercase tracking-wider text-ink border-b border-border-subtle pb-2 sm:border-0 sm:pb-0">
          Order History
        </h1>
        
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-ink-muted hidden sm:block" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-transparent border-border-subtle rounded-sm focus:ring-ink">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-cream border-border-subtle rounded-sm">
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block w-full overflow-x-auto border border-border-subtle rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-warm border-b border-border-subtle">
                  <th className="py-4 px-6 text-label-sm uppercase tracking-wider text-ink font-medium">Order Number</th>
                  <th className="py-4 px-6 text-label-sm uppercase tracking-wider text-ink font-medium">Date</th>
                  <th className="py-4 px-6 text-label-sm uppercase tracking-wider text-ink font-medium">Status</th>
                  <th className="py-4 px-6 text-label-sm uppercase tracking-wider text-ink font-medium">Total</th>
                  <th className="py-4 px-6 text-label-sm uppercase tracking-wider text-ink font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle last:border-0 hover:bg-cream-warm/30 transition-colors">
                    <td className="py-5 px-6 text-body-md text-ink font-medium">#{order.id}</td>
                    <td className="py-5 px-6 text-body-sm text-ink-muted">{order.date}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          order.status === 'Processing' ? 'bg-gold' : 
                          order.status === 'Delivered' ? 'bg-ink' : 'bg-red-900'
                        }`} />
                        <span className="text-body-sm text-ink">{order.status}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-body-sm text-ink">
                      ${order.total.toFixed(2)} <span className="text-ink-muted ml-1">({order.itemCount} items)</span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <Link href={`/account/orders/${order.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border border-border-subtle rounded-sm p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-label-md uppercase tracking-wider text-ink">Order #{order.id}</span>
                    <span className="text-body-sm text-ink-muted">{order.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      order.status === 'Processing' ? 'bg-gold' : 
                      order.status === 'Delivered' ? 'bg-ink' : 'bg-red-900'
                    }`} />
                    <span className="text-body-xs uppercase tracking-wider text-ink">{order.status}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-2 pt-4 border-t border-border-subtle">
                  <div className="flex flex-col gap-1">
                    <span className="text-label-sm uppercase tracking-wider text-ink-muted">Total</span>
                    <span className="text-body-md font-medium text-ink">${order.total.toFixed(2)}</span>
                  </div>
                  <Link href={`/account/orders/${order.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="border border-border-subtle rounded-sm bg-cream-warm/20">
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You haven't placed any orders that match this filter."
            action={
              <Link href="/shop" className={buttonVariants({ variant: 'dark' })}>
                Start Shopping
              </Link>
            }
          />
        </div>
      )}

      {/* Pagination Scaffolding */}
      {filteredOrders.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-border-subtle pt-6">
          <span className="text-body-sm text-ink-muted">
            Showing <span className="font-medium text-ink">1</span> to <span className="font-medium text-ink">{filteredOrders.length}</span> of <span className="font-medium text-ink">{filteredOrders.length}</span> results
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled className="w-8 h-8 rounded-sm">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" disabled className="w-8 h-8 rounded-sm">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
