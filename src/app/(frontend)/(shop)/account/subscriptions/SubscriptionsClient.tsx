'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { EmptyState } from '@/components/shared/EmptyState'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'
import { everyLabel, ordersCount } from '@/lib/subscriptions/labels'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface SubscriptionCard {
  id: string
  reference: string
  planMonths: number
  discountPercent: number
  products: string[]
  status: string
  statusLabel: string
  statusTone: 'green' | 'amber' | 'blue' | 'red' | 'gray'
  ordersPaid: number
  help: string
  needsPayment: boolean
}

export const TONES: Record<SubscriptionCard['statusTone'], string> = {
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
}

export function SubscriptionsClient({ subscriptions }: { subscriptions: SubscriptionCard[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-full"
    >
      <div className="flex flex-col gap-2 mb-10 border-b border-gray-200 pb-6">
        <h1 className={`text-4xl text-black font-bold tracking-tighter flex items-center gap-2 ${spaceGrotesk.className}`}>
          My Subscriptions
          <InfoTip label="What is a subscription?" align="center">{HELP.whatIsSubscription}</InfoTip>
        </h1>
        <p className="text-sm text-gray-500">Your subscriptions. Each order is invoiced by email when it is due and ships after it is paid.</p>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No subscriptions yet"
          description="Choose 'Subscribe & save' on a product page to get a regular delivery - every month, every 3 months or every 6 months - at a lower price."
          action={
            <Link href="/shop" className="bg-black text-white rounded-full px-8 py-3 text-[11px] font-bold uppercase tracking-[0.15em]">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {subscriptions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 justify-between"
            >
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  {`${s.reference} · Delivered ${everyLabel(s.planMonths)} · ${s.discountPercent}% off`}
                </span>
                <span className="text-lg font-bold text-black truncate">{s.products.join(', ') || 'Subscription'}</span>
                <span className="text-sm text-gray-500">{s.help}</span>
              </div>

              <div className="flex flex-col gap-3 md:items-end shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit ${TONES[s.statusTone]}`}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{s.statusLabel}</span>
                  </div>
                  <InfoTip label="What does this status mean?" align="right">{HELP.status[s.status] || s.help}</InfoTip>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                  <span>
                    <strong>{ordersCount(s.ordersPaid)}</strong> paid
                  </span>
                  <InfoTip label="What counts as a paid order?" align="right">{HELP.ordersPaid}</InfoTip>
                </span>
                <Link
                  href={`/account/subscriptions/${s.id}`}
                  className="bg-black text-white rounded-full px-8 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-center"
                >
                  {s.needsPayment ? 'Pay / Manage' : 'Manage'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
