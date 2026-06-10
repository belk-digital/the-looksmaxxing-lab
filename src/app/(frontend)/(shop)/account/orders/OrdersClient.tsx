'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Filter, Package } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface OrderItem {
  id: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
}

export interface AccountOrdersProps {
  orders: OrderItem[];
}

export function OrdersClient({ orders }: AccountOrdersProps) {
  const [filter, setFilter] = useState('all')

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filter)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-full"
    >
      
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-2">
          <h1 className={`text-4xl text-black font-bold tracking-tighter ${spaceGrotesk.className}`}>
            Order History
          </h1>
          <p className="text-sm text-gray-500">Track, manage, and return your recent purchases.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <div className="pl-4 hidden sm:flex items-center justify-center">
            <Filter size={14} className="text-gray-400" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] bg-transparent border-none shadow-none focus:ring-0 text-[11px] font-bold uppercase tracking-[0.1em] text-black">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl shadow-black/5">
              <SelectItem value="all" className="text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg">All Orders</SelectItem>
              <SelectItem value="processing" className="text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg">Processing</SelectItem>
              <SelectItem value="delivered" className="text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg">Delivered</SelectItem>
              <SelectItem value="returned" className="text-[11px] font-bold uppercase tracking-[0.1em] rounded-lg text-red-500">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredOrders.length > 0 ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {filteredOrders.map((order, i) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-gray-200 transition-all duration-300 gap-6 cursor-pointer relative overflow-hidden"
              >
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 flex-1">
                  
                  {/* Order Number & Date */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Order Placed</span>
                    <span className="text-sm font-medium text-black">{order.date}</span>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">#{order.id}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hidden md:block">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                        order.status === 'Processing' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                        order.status === 'Shipped' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                        order.status === 'Placed' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                        order.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                        ['Cancelled', 'Returned'].includes(order.status) ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'Processing' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                          order.status === 'Shipped' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
                          order.status === 'Placed' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
                          order.status === 'Delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                          ['Cancelled', 'Returned'].includes(order.status) ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{order.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-auto">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hidden md:block text-right">Total</span>
                    <div className="flex items-end gap-2 md:justify-end">
                      <span className={`text-2xl font-bold text-black tracking-tight ${spaceGrotesk.className}`}>
                        ${order.total.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium text-gray-400 mb-1">({order.itemCount} items)</span>
                    </div>
                  </div>

                </div>
                
                {/* Action */}
                <div className="flex items-center shrink-0 mt-4 md:mt-0">
                  <Link href={`/account/orders/${order.id}`} className="w-full md:w-auto bg-gray-50 group-hover:bg-black text-black group-hover:text-white rounded-full px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap text-center flex items-center justify-center gap-2">
                    View Details
                  </Link>
                </div>

              </motion.div>
            ))}
            
            {/* Pagination Scaffolding */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-8 gap-4">
              <span className="text-xs font-medium text-gray-500">
                Showing <span className="font-bold text-black">1</span> to <span className="font-bold text-black">{filteredOrders.length}</span> of <span className="font-bold text-black">{filteredOrders.length}</span> results
              </span>
              <div className="flex items-center gap-2">
                <button disabled className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <button disabled className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12"
          >
            <EmptyState
              icon={Package}
              title="No orders found"
              description="You haven't placed any orders that match this filter."
              action={
                <Link href="/shop" className="inline-flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-full px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors shadow-lg">
                  Start Shopping
                </Link>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
