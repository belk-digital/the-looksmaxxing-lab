import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FaqAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (!faqs || faqs.length === 0) return null
  return (
    <div className="rounded-2xl bg-white border border-border-subtle shadow-sm p-6 md:p-8 mt-12">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="h-px w-6 bg-gold" />
        <span className="text-label-md uppercase tracking-wider text-gold-dark font-semibold">FAQ</span>
      </div>
      <h3 className="text-editorial-lg font-serif text-ink mb-3">Frequently Asked Questions</h3>
      <Accordion type="single" collapsible className="mt-1">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-border-subtle">
            <AccordionTrigger className="hover:no-underline py-5 gap-4 [&>svg]:shrink-0">
              <span className="flex items-start gap-3.5 text-left text-body-lg font-medium text-ink">
                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-gold/12 text-gold-deep text-label-sm font-bold mt-0.5">
                  {i + 1}
                </span>
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pl-[2.375rem] text-body-md text-ink/75 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
