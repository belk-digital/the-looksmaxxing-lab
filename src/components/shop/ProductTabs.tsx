'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface ProductTabsProps {
  tabs: Tab[]
}

export function ProductTabs({ tabs }: ProductTabsProps) {
  const [openTab, setOpenTab] = useState(tabs[0]?.id)

  if (!tabs || tabs.length === 0) return null

  const activeTabContent = tabs.find(t => t.id === openTab)?.content

  return (
    <div className="w-full flex flex-col items-center">
      {/* Floating Tab Container */}
      <div className="flex flex-wrap gap-2 items-center justify-center bg-white border border-blue-100/50 p-2 rounded-[2rem] shadow-sm max-w-fit mx-auto relative z-20">
        {tabs.map((tab) => {
          const isActive = openTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setOpenTab(tab.id)}
              className={cn(
                "relative px-6 md:px-8 py-3 md:py-4 rounded-[1.5rem] text-label-sm uppercase tracking-wider transition-colors font-bold z-10",
                isActive ? "text-white" : "text-[#5984c4]/70 hover:text-[#5984c4]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#5984c4] rounded-[1.5rem] -z-10 shadow-md shadow-[#5984c4]/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Card */}
      <div className="w-full mt-8 md:mt-12 bg-white border border-blue-100/50 shadow-sm rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 lg:p-24 min-h-[400px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={openTab}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full text-body-lg text-ink-muted leading-relaxed"
          >
            {activeTabContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
