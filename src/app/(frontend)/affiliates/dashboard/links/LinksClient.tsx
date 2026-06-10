'use client'

import React, { useState } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { Copy, Check, ExternalLink, Edit2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { updateCouponCode } from './actions'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

interface LinksClientProps {
  referralLink: string;
  couponCode: string;
  customerDiscount: number;
  commissionRate: number;
}

export function LinksClient({ referralLink, couponCode: initialCouponCode, customerDiscount, commissionRate }: LinksClientProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Edit states
  const [couponCode, setCouponCode] = useState(initialCouponCode)
  const [isEditing, setIsEditing] = useState(false)
  const [newCode, setNewCode] = useState(initialCouponCode)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSaveCode = async () => {
    setError(null)
    setIsSaving(true)
    
    try {
      const result = await updateCouponCode(newCode)
      
      if (result.success && result.code) {
        setCouponCode(result.code)
        setNewCode(result.code)
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to update code.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNewCode(couponCode)
    setIsEditing(false)
    setError(null)
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
            <a href={referralLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors">
              <ExternalLink size={18} />
            </a>
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
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col gap-2"
              >
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. JOHN20"
                  maxLength={20}
                  className="w-full bg-white rounded-xl px-4 py-3.5 text-lg font-mono font-bold text-[#5984c4] border-2 border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                  autoFocus
                />
                {error && <span className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg w-fit">{error}</span>}
              </motion.div>
            ) : (
              <motion.div 
                key="view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 bg-white rounded-xl px-4 py-3.5 text-lg font-mono font-bold text-[#5984c4] border border-blue-100/50 flex items-center justify-between shadow-sm"
              >
                <span>{couponCode}</span>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit custom code"
                >
                  <Edit2 size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="edit-actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex gap-2 shrink-0 w-full sm:w-auto h-[52px]"
              >
                <Button 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-xl h-full px-6 text-xs font-bold uppercase tracking-widest gap-2 bg-white text-gray-500 border-gray-200"
                >
                  <X size={16} />
                </Button>
                <Button 
                  onClick={handleSaveCode}
                  disabled={isSaving}
                  className="flex-1 sm:w-32 rounded-xl h-full px-8 text-xs font-bold uppercase tracking-widest gap-2 bg-[#5984c4] hover:bg-blue-600 text-white border-none shadow-md"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {isSaving ? 'Saving' : 'Save'}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="copy-action"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="shrink-0 w-full sm:w-auto h-[52px]"
              >
                <Button 
                  onClick={() => handleCopy(couponCode, 'code')}
                  className="w-full rounded-xl h-full px-8 text-xs font-bold uppercase tracking-widest gap-2 bg-[#5984c4] hover:bg-blue-600 text-white border-none shadow-md"
                >
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  )
}
