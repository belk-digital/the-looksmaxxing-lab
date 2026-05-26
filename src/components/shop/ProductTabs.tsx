'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
  const [activeTab, setActiveTab] = useState(tabs[0]?.id)

  if (!tabs || tabs.length === 0) return null

  return (
    <div className="w-full flex flex-col">
      <div className="w-full border-b border-border-subtle overflow-x-auto scrollbar-none">
        <div className="flex gap-8 min-w-max px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-4 text-label-lg uppercase tracking-wider transition-colors",
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="product-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="py-8 text-body-md text-ink">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tabs.find(t => t.id === activeTab)?.content}
        </motion.div>
      </div>
    </div>
  )
}
