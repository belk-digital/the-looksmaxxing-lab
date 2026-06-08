'use client'

import React, { useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { FadeUp } from '@/components/motion/FadeUp'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const FAQ_DATA = [
  {
    title: 'Products & Purity',
    items: [
      { q: 'What is research-use-only?', a: 'Our products are strictly intended for in-vitro and laboratory research applications. They are not intended for human consumption, therapeutic use, or any form of diagnostic application. By purchasing, you acknowledge the inherent risks associated with these compounds and your responsibility to handle them in a controlled laboratory environment.' },
      { q: 'What purity level is research-grade?', a: 'We guarantee a minimum of 99% purity across our entire catalog. This standard is enforced through mandatory third-party HPLC (High-Performance Liquid Chromatography) and LC-MS (Liquid Chromatography-Mass Spectrometry) testing.' },
      { q: 'How are COAs verified?', a: 'Every batch synthesized undergoes independent analysis at an ISO-certified US laboratory. The resulting Certificate of Analysis (COA) verifies both the exact sequence structure and the overall purity percentage. COAs are publicly available in our verification library and included with every shipment.' }
    ]
  },
  {
    title: 'Ordering & Shipping',
    items: [
      { q: 'Do you ship internationally?', a: 'Yes, we offer worldwide shipping. However, it is the sole responsibility of the researcher to ensure that the importation of research peptides complies with all local, state, and national regulations.' },
      { q: 'What is the cutoff time for same-day shipping?', a: 'Orders successfully placed and verified before 2:00 PM EST (Monday through Friday) will be dispatched on the same business day.' },
      { q: 'Is a signature required for delivery?', a: 'To ensure the secure chain of custody for research materials, all orders exceeding $500 automatically require a signature upon delivery.' }
    ]
  },

  {
    title: 'Research Use',
    items: [
      { q: 'Can I use these for human consumption?', a: 'No. Under no circumstances should these compounds be used for human consumption. Any communication indicating intent to misuse these products will result in immediate cancellation of your order and a permanent ban from our platform.' },
      { q: 'How should I store unmixed peptides?', a: 'Lyophilized (powdered) peptides should be stored in a freezer at -20°C away from light and moisture. For short-term storage (under 30 days), refrigeration at 4°C is acceptable.' }
    ]
  },
  {
    title: 'Account',
    items: [
      { q: 'How do I access my past COAs?', a: 'Log in to your account dashboard and navigate to your Order History. Digital copies of the specific COAs associated with your batches are available for download there.' },
      { q: 'How do I reset my password?', a: 'Click the "Forgot Password" link on the login portal. You will receive a secure reset link via the email associated with your account.' }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = FAQ_DATA.map(cat => {
    return {
      ...cat,
      items: cat.items.filter(item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  }).filter(cat => cat.items.length > 0)

  return (
    <main className="bg-[#f3f4f6] min-h-screen pt-32 lg:pt-40 pb-24">
      {/* Header & Search */}
      <section className="px-6 mb-16 lg:mb-24 max-w-2xl mx-auto flex flex-col items-center">
        <FadeUp className="w-full flex flex-col items-center">
          <span className="px-4 py-1.5 bg-white border border-gray-100 shadow-sm text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Support Center</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6 text-center tracking-tight leading-tight">Frequently Asked Questions</h1>
          <p className="text-lg lg:text-xl text-gray-500 text-center mb-10 max-w-xl font-light leading-relaxed">
            Everything you need to know about our research compounds, purity standards, and ordering guidelines.
          </p>
          
          <div className="relative w-full max-w-[540px]">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search for an answer..." 
              className="w-full h-14 pl-14 pr-6 rounded-full bg-white border-transparent shadow-sm hover:shadow-md focus:border-[#5984c4] focus:ring-1 focus:ring-[#5984c4] transition-all duration-300 text-lg placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </FadeUp>
      </section>

      {/* FAQ Accordions */}
      <section className="px-4 md:px-6 max-w-[800px] mx-auto mb-24">
        <FadeUp delay={0.1}>
          {filteredCategories.length === 0 ? (
            <div className="py-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center">
              <EmptyState 
                icon={SearchIcon} 
                title="No results found" 
                description={`We couldn't find any answers matching "${searchQuery}".`} 
              />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {filteredCategories.map((category) => (
                <div key={category.title} className="bg-white rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-10 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-full bg-[#5984c4]/10 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5984c4]" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">{category.title}</h2>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {category.items.map((item, i) => (
                      <AccordionItem key={i} value={`${category.title}-${i}`} className="border-b border-gray-100 last:border-0">
                        <AccordionTrigger className="text-lg md:text-xl font-medium text-ink hover:text-[#5984c4] transition-colors duration-300 py-6 text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-base md:text-lg text-gray-500 leading-relaxed pb-8 font-light">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </FadeUp>
      </section>
    </main>
  )
}
