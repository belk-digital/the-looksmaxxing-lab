'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MousePointerClick, Target, DollarSign, Wallet, Copy, Check, ExternalLink } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface DashboardClientProps {
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: string;
    totalCommissionPending: number; // in cents
    totalCommissionApproved: number; // in cents
    totalCommissionPaid: number; // in cents
    referralSlug: string;
    couponCode: string;
  };
  recentConversions: {
    id: string;
    date: string;
    amount: number; // commission amount in cents
    status: string;
  }[];
}

export function DashboardClient({ stats, recentConversions }: DashboardClientProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopy = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // Formatting helpers
  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const [baseUrl, setBaseUrl] = useState('https://thelooksmaxxinglab.com')
  
  React.useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const referralUrl = `${baseUrl}/ref/${stats.referralSlug}`

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
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-blue-500">
            <MousePointerClick size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Total Clicks</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{stats.totalClicks}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-emerald-500">
            <Target size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Conversions</span>
            <div className="flex items-end gap-3">
              <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{stats.totalConversions}</span>
              <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md mb-1">{stats.conversionRate}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-amber-500">
            <DollarSign size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Pending Commission</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{formatMoney(stats.totalCommissionPending)}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-purple-500">
            <Wallet size={64} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Total Paid Out</span>
            <span className={`text-5xl text-black leading-none font-bold tracking-tighter ${spaceGrotesk.className}`}>{formatMoney(stats.totalCommissionPaid)}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12 items-start">
        
        {/* Left Column: Recent Conversions */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-black">Recent Conversions</h3>
            <Link href="/affiliates/dashboard/conversions" className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5984c4] hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100">
              View All
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {recentConversions.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-4 text-gray-500">
                <Target size={32} className="text-gray-300" />
                <p className="text-sm">No conversions recorded yet.</p>
                <p className="text-xs text-gray-400">Share your referral link to start earning!</p>
              </div>
            ) : (
              recentConversions.map((conv, i) => (
                <motion.div 
                  key={conv.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-black/5 hover:border-gray-200 transition-all duration-300 gap-4 cursor-pointer relative overflow-hidden"
                >
                  {/* Highlight bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                  
                  <div className="flex flex-col gap-2 pl-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-black">Order #{conv.id.substring(0, 8)}</span>
                    <span className="text-xs font-medium text-gray-500">{conv.date}</span>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className="text-sm text-emerald-600 font-bold">+{formatMoney(conv.amount)}</span>
                    <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-full">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        conv.status === 'pending' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
                        conv.status === 'approved' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">{conv.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right Column: Share Tools */}
        <motion.div variants={itemVars} className="flex flex-col gap-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-black border-b border-gray-200 pb-4">Share Tools</h3>
          
          {/* Referral Link */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Your Referral Link</span>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 break-all border border-gray-200/50">
                {referralUrl}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCopy(referralUrl, 'link')}
                  variant="outline" 
                  className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-widest gap-2 bg-white"
                >
                  {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copiedLink ? 'Copied!' : 'Copy'}
                </Button>
                <a href={referralUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          {stats.couponCode && (
            <div className="flex flex-col gap-3 mt-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Your Coupon Code (15% Off)</span>
              <div className="bg-gradient-to-br from-[#f8faff] to-[#eef4ff] p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
                <div className="bg-white rounded-xl px-4 py-3 text-lg font-mono font-bold text-[#5984c4] text-center border border-blue-100/50 relative z-10">
                  {stats.couponCode}
                </div>
                <Button 
                  onClick={() => handleCopy(stats.couponCode, 'code')}
                  className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-widest gap-2 bg-[#5984c4] hover:bg-blue-600 text-white border-none shadow-md"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </motion.div>
  )
}
