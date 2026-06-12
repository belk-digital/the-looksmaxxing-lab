'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Package, LifeBuoy, TrendingUp, Heart, Calendar, MapPin, Wallet, Users, BarChart3 } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { motion, Variants } from 'framer-motion'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface AccountOverviewProps {
  stats: {
    ordersPlaced: number;
    wishlistCount: number;
    maxxPoints: number;
    memberSince: string;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    date: string;
    status: string;
    total: number;
  }[];
  defaultAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  affiliateStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
}

export function AccountOverviewClient({ stats, recentOrders, defaultAddress, affiliateStatus = 'none' }: AccountOverviewProps) {
  // Animation variants
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }
  
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-12"
    >
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-amber-500">
            <Wallet size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Maxx Points</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{Number(stats.maxxPoints.toFixed(2))}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Package size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Orders Placed</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{stats.ordersPlaced}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-red-500">
            <Heart size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Wishlist Items</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{stats.wishlistCount}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-blue-500">
            <Calendar size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Member Since</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{stats.memberSince}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12 items-start">
        
        {/* Left Column: Recent Orders */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Recent Orders</h3>
            <Link href="/account/orders" className="text-[10px] font-bold uppercase tracking-[0.1em] text-purple-600 hover:text-purple-700 transition-colors bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100">
              View All
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentOrders.map((order, i) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-black/5 hover:border-gray-200 transition-all duration-300 gap-4 cursor-pointer relative overflow-hidden"
              >
                {/* Highlight bar on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                
                <div className="flex flex-col gap-2 pl-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-black">Order #{order.id}</span>
                  <span className="text-xs font-medium text-gray-500">{order.date}</span>
                </div>
                
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-sm text-black font-bold">${order.total.toFixed(2)}</span>
                  <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Processing' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">{order.status}</span>
                  </div>
                </div>
                
                <Link href={`/account/orders/${order.id}`} className="bg-black text-white rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-all duration-300 mt-2 sm:mt-0 whitespace-nowrap text-center shadow-md">
                  View Details
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Address & Quick Links */}
        <motion.div variants={itemVars} className="flex flex-col gap-12">
          
          {/* Default Address */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Default Address</h3>
              <Link href="/account/addresses" className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 hover:text-black transition-colors">
                Edit
              </Link>
            </div>
            
            {defaultAddress ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col text-sm text-gray-600 leading-relaxed hover:shadow-md transition-shadow">
                <span className="text-black font-bold mb-3 uppercase tracking-[0.15em] text-[11px] bg-gray-50 px-3 py-1.5 rounded-full self-start inline-flex items-center gap-2">
                  <MapPin size={12} className="text-gray-400" />
                  {defaultAddress.name}
                </span>
                <div className="flex flex-col gap-1 pl-1">
                  <span>{defaultAddress.street}</span>
                  <span>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}</span>
                  <span>{defaultAddress.country}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-4 text-gray-500">
                <p className="text-sm">You haven't saved any addresses yet.</p>
                <Link href="/account/addresses" className="text-[11px] font-bold uppercase tracking-[0.15em] text-black hover:underline">
                  Add Address
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-black border-b border-gray-200 pb-4">Support & Programs</h3>
            <div className="flex flex-col gap-3">
              
              {/* Affiliate Status Cards */}
              {affiliateStatus === 'approved' && (
                <Link href="/affiliates/dashboard" className="flex items-center justify-between p-5 border border-blue-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-[#f8faff] to-[#eef4ff] relative overflow-hidden">
                  <div className="flex items-center gap-4 text-black relative z-10">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm">
                      <BarChart3 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5984c4]">Affiliate Dashboard</span>
                      <span className="text-xs text-blue-900/60 mt-0.5">Manage links and payouts</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#5984c4] group-hover:translate-x-2 transition-all duration-300 relative z-10" />
                </Link>
              )}
              
              {affiliateStatus === 'none' && (
                <Link href="/affiliates" className="flex items-center justify-between p-5 border border-amber-100 rounded-2xl hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                  <div className="flex items-center gap-4 text-black relative z-10">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:bg-amber-600 transition-colors shadow-sm">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-600">Earn 15% Commission</span>
                      <span className="text-xs text-amber-900/60 mt-0.5">Join the Partner Program</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
                </Link>
              )}

              {affiliateStatus === 'pending' && (
                <div className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl bg-gray-50 relative overflow-hidden">
                  <div className="flex items-center gap-4 text-black relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shadow-sm">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">Partner Program</span>
                      <span className="text-xs text-gray-400 mt-0.5">Application under review</span>
                    </div>
                  </div>
                </div>
              )}
              
              <Link href="/track" className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-transparent hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 group bg-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="flex items-center gap-4 text-black relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                    <TrendingUp size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Track Order</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-all duration-300 group-hover:translate-x-2 relative z-10" />
              </Link>
              
              <Link href="/contact" className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-transparent hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 group bg-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="flex items-center gap-4 text-black relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                    <LifeBuoy size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Contact Us</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-all duration-300 group-hover:translate-x-2 relative z-10" />
              </Link>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}
