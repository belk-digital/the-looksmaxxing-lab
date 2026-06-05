'use client'

import React from 'react'
import { Space_Grotesk } from 'next/font/google'
import { motion, Variants } from 'framer-motion'
import { Target } from 'lucide-react'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

interface ConversionsClientProps {
  conversions: {
    id: string;
    date: string;
    orderValue: number; // in cents
    commissionAmount: number; // in cents
    status: string;
  }[];
}

export function ConversionsClient({ conversions }: ConversionsClientProps) {
  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`

  // Animation variants
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }
  
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8"
    >
      <motion.div variants={itemVars}>
        <h1 className={`text-3xl font-bold tracking-tight text-black mb-2 ${spaceGrotesk.className}`}>
          Conversions
        </h1>
        <p className="text-gray-500">Track all orders generated from your referral links and coupon codes.</p>
      </motion.div>
      
      <div className="flex flex-col gap-4">
        {conversions.length === 0 ? (
          <motion.div variants={itemVars} className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-4 text-gray-500">
            <Target size={48} className="text-gray-200" />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-black">No Conversions Yet</h3>
              <p className="text-sm">Share your links to start earning commissions!</p>
            </div>
          </motion.div>
        ) : (
          conversions.map((conv) => (
            <motion.div 
              key={conv.id} 
              variants={itemVars}
              className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-black/5 hover:border-gray-200 transition-all duration-300 gap-6 cursor-pointer relative overflow-hidden"
            >
              {/* Highlight bar on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              
              <div className="flex flex-col gap-2 pl-2 md:w-1/4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Order ID</span>
                <span className="text-base font-bold text-black">#{conv.id.substring(0, 8)}</span>
              </div>

              <div className="flex flex-col gap-2 md:w-1/4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Date</span>
                <span className="text-sm font-medium text-gray-600">{conv.date}</span>
              </div>

              <div className="flex flex-col gap-2 md:w-1/4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Order Value</span>
                <span className="text-sm font-medium text-gray-600">{formatMoney(conv.orderValue)}</span>
              </div>
              
              <div className="flex flex-col md:items-end gap-2 md:w-1/4">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Commission</span>
                <div className="flex items-center gap-4">
                  <span className="text-base text-emerald-600 font-bold">+{formatMoney(conv.commissionAmount)}</span>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      conv.status === 'pending' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
                      conv.status === 'approved' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 
                      conv.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    }`} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">{conv.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
