'use client'

import React, { useState } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { motion, Variants } from 'framer-motion'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

interface LinksClientProps {
  referralLink: string;
  couponCode: string;
  customerDiscount: number;
  commissionRate: number;
}

export function LinksClient({ referralLink, couponCode, customerDiscount, commissionRate }: LinksClientProps) {
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
      className="flex flex-col gap-8 max-w-3xl"
    >
      <motion.div variants={itemVars}>
        <h1 className={`text-3xl font-bold tracking-tight text-black mb-2 ${spaceGrotesk.className}`}>
          Links & Creatives
        </h1>
        <p className="text-gray-500">Share your personalized links and codes to start earning commissions.</p>
      </motion.div>
      
      {/* Referral Link Card */}
      <motion.div variants={itemVars} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-black">Your Standard Referral Link</h3>
          <p className="text-sm text-gray-500">Share this link. Anyone who clicks it will be tracked as your referral.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3.5 text-sm font-mono text-gray-700 break-all border border-gray-200/50 flex items-center">
            {referralLink}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              onClick={() => handleCopy(referralLink, 'link')}
              variant="outline" 
              className="rounded-xl h-12 px-6 text-xs font-bold uppercase tracking-widest gap-2 bg-white"
            >
              {copiedLink ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copiedLink ? 'Copied!' : 'Copy'}
            </Button>
            <Link href={referralLink} target="_blank" className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors">
              <ExternalLink size={18} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Coupon Code Card */}
      <motion.div variants={itemVars} className="bg-gradient-to-br from-[#f8faff] to-[#eef4ff] p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col gap-1 relative z-10">
          <h3 className="text-lg font-bold text-[#5984c4]">Your Custom Coupon Code</h3>
          <p className="text-sm text-blue-900/60">
            Share this coupon code with your audience. They get <strong className="text-[#5984c4]">{customerDiscount}% off</strong>, and you earn <strong className="text-[#5984c4]">{commissionRate}% commission</strong>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2 relative z-10">
          <div className="flex-1 bg-white rounded-xl px-4 py-3.5 text-lg font-mono font-bold text-[#5984c4] border border-blue-100/50 flex items-center justify-center sm:justify-start">
            {couponCode}
          </div>
          <Button 
            onClick={() => handleCopy(couponCode, 'code')}
            className="rounded-xl h-12 px-8 text-xs font-bold uppercase tracking-widest gap-2 bg-[#5984c4] hover:bg-blue-600 text-white border-none shadow-md shrink-0 w-full sm:w-auto"
          >
            {copiedCode ? <Check size={16} /> : <Copy size={16} />}
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>
      </motion.div>

    </motion.div>
  )
}
