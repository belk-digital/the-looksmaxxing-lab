'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export interface Faq {
  id: string
  question: string
  answer: string
}

interface ProductFaqsProps {
  faqs?: Faq[]
}

export function ProductFaqs({ faqs }: ProductFaqsProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  if (!faqs || faqs.length === 0) return null

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col border-t border-border-subtle pt-16">
      <h3 className="text-display-sm font-display text-ink mb-8">Frequently Asked Questions</h3>
      
      <div className="flex flex-col border-t border-border-subtle">
        {faqs.map((faq) => {
          const isOpen = openFaq === faq.id
          return (
            <div key={faq.id} className="border-b border-border-subtle">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between py-6 group text-left"
              >
                <span className="text-body-lg text-ink group-hover:text-gold transition-colors">{faq.question}</span>
                <span className="text-ink-muted group-hover:text-gold transition-colors shrink-0 ml-4">
                  {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pt-2 text-body-lg text-ink-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
