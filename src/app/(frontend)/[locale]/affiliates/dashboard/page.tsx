'use client'

import React, { useState } from 'react'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const MOCK_STATS = [
  { label: 'Total Clicks', value: '1,247' },
  { label: 'Unique Clicks', value: '423' },
  { label: 'Conversions', value: '32' },
  { label: 'Conversion Rate', value: '7.6%' },
]

const MOCK_EARNINGS = [
  { label: 'Pending (Locked)', value: '$345.00' },
  { label: 'Approved', value: '$890.00' },
  { label: 'Total Paid', value: '$1,340.00' },
]

const RECENT_CONVERSIONS = [
  { id: 'ORD-1092', date: 'May 24, 2026', amount: '$45.00', status: 'Pending' },
  { id: 'ORD-1088', date: 'May 21, 2026', amount: '$120.00', status: 'Approved' },
  { id: 'ORD-1081', date: 'May 18, 2026', amount: '$15.00', status: 'Approved' },
  { id: 'ORD-1075', date: 'May 10, 2026', amount: '$85.00', status: 'Paid' },
  { id: 'ORD-1062', date: 'May 02, 2026', amount: '$210.00', status: 'Paid' },
]

export default function AffiliateDashboardOverview() {
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

  return (
    <div className="space-y-16">
      
      {/* Performance Stats */}
      <section>
        <h2 className="text-editorial-md font-serif text-ink mb-6">Performance (30 Days)</h2>
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOCK_STATS.map((stat, i) => (
            <motion.div key={i} variants={staggerItemVariants} className="bg-cream-warm border border-border-subtle rounded-md p-6 flex flex-col items-center text-center">
              <span className="text-display-sm font-serif text-ink mb-2">{stat.value}</span>
              <span className="text-label-sm uppercase tracking-wider text-ink-muted">{stat.label}</span>
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* Earnings Stats */}
      <section>
        <h2 className="text-editorial-md font-serif text-ink mb-6">Earnings</h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_EARNINGS.map((stat, i) => (
            <motion.div key={i} variants={staggerItemVariants} className="bg-cream-warm border border-border-subtle rounded-md p-6 flex flex-col items-center text-center">
              <span className="text-display-md font-serif text-gold mb-2">{stat.value}</span>
              <span className="text-label-sm uppercase tracking-wider text-ink-muted">{stat.label}</span>
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* Quick Links */}
      <section className="bg-cream-sand border border-border-strong p-8 rounded-sm">
        <h2 className="text-editorial-md font-serif text-ink mb-8">Share Tools</h2>
        <div className="space-y-8">
          
          <div>
            <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-2">Your Referral Link</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 bg-cream px-4 py-3 border border-border-subtle rounded-sm font-mono text-body-md text-ink truncate">
                https://looksmaxxinglab.com/ref/dr-john-smith
              </div>
              <Button 
                variant="secondary" 
                onClick={() => handleCopy('https://looksmaxxinglab.com/ref/dr-john-smith', 'link')}
                className="gap-2 shrink-0"
              >
                {copiedLink ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div>
            <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-2">Your Coupon Code (10% Off)</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 bg-cream px-4 py-3 border border-border-subtle rounded-sm font-mono text-body-md text-ink">
                DRJOHN10
              </div>
              <Button 
                variant="secondary" 
                onClick={() => handleCopy('DRJOHN10', 'code')}
                className="gap-2 shrink-0"
              >
                {copiedCode ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* Recent Conversions */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-editorial-md font-serif text-ink">Recent Conversions</h2>
          <Link href="/affiliates/dashboard/conversions">
            <Button variant="link" className="text-ink-muted">View All</Button>
          </Link>
        </div>
        
        <div className="w-full overflow-x-auto bg-cream-warm border border-border-subtle rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-strong bg-cream">
                <th className="py-4 px-6 text-label-md uppercase tracking-wider text-ink-muted font-normal">Order</th>
                <th className="py-4 px-6 text-label-md uppercase tracking-wider text-ink-muted font-normal">Date</th>
                <th className="py-4 px-6 text-label-md uppercase tracking-wider text-ink-muted font-normal">Commission</th>
                <th className="py-4 px-6 text-label-md uppercase tracking-wider text-ink-muted font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_CONVERSIONS.map((conv) => (
                <tr key={conv.id} className="border-b border-border-subtle hover:bg-cream-sand transition-colors duration-fast">
                  <td className="py-5 px-6 text-body-md font-mono text-ink">{conv.id}</td>
                  <td className="py-5 px-6 text-body-md text-ink-muted">{conv.date}</td>
                  <td className="py-5 px-6 text-body-md text-ink">{conv.amount}</td>
                  <td className="py-5 px-6 text-right">
                    <span className={`inline-flex px-3 py-1 rounded-sm text-label-sm uppercase tracking-wider ${
                      conv.status === 'Paid' ? 'bg-ink text-cream' :
                      conv.status === 'Approved' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                      'bg-border-strong text-ink-muted'
                    }`}>
                      {conv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
