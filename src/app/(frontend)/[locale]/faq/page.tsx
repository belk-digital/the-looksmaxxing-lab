'use client'

import React, { useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { FadeUp } from '@/components/motion/FadeUp'
import { EmptyState } from '@/components/shared/EmptyState'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
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
    title: 'Returns',
    items: [
      { q: 'Can I return an open vial?', a: 'Due to the strict quality control protocols required for research materials, we absolutely cannot accept returns on open or reconstituted products. This ensures that every researcher receives pristine, untampered compounds.' },
      { q: 'My order arrived damaged, what should I do?', a: 'If your vials arrive compromised, please contact our support team within 48 hours of delivery. Include high-resolution photos of the damaged items and the packaging. We will expedite a replacement.' }
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
    <main className="bg-cream min-h-screen pt-32 pb-24">
      {/* Header & Search */}
      <section className="px-6 mb-24 max-w-prose mx-auto flex flex-col items-center">
        <FadeUp className="w-full flex flex-col items-center">
          <EyebrowHeading gold className="items-center mb-4 text-center">Support</EyebrowHeading>
          <h1 className="text-display-md font-serif text-ink mb-6 text-center">Frequently Asked Questions</h1>
          <p className="text-body-lg text-ink-muted text-center mb-10 max-w-content">
            Everything you need to know about our research compounds, purity standards, and ordering protocols.
          </p>
          
          <div className="relative w-full max-w-[480px]">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
            <Input 
              type="text" 
              placeholder="Search for an answer..." 
              className="pl-12 bg-cream-warm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </FadeUp>
      </section>

      {/* FAQ Accordions */}
      <section className="px-6 max-w-[720px] mx-auto mb-24">
        <FadeUp delay={0.1}>
          {filteredCategories.length === 0 ? (
            <div className="py-12 bg-cream-warm/30 border border-border-subtle rounded-sm">
              <EmptyState 
                icon={SearchIcon} 
                title="No results found" 
                description={`We couldn't find any answers matching "${searchQuery}".`} 
              />
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {filteredCategories.map((category) => (
                <div key={category.title}>
                  <h2 className="text-editorial-md font-serif text-ink mb-6">{category.title}</h2>
                  <Accordion type="multiple" className="w-full">
                    {category.items.map((item, i) => (
                      <AccordionItem key={i} value={`${category.title}-${i}`}>
                        <AccordionTrigger className="text-body-lg font-sans text-ink">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-body-md text-ink-muted leading-relaxed pb-8">
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
