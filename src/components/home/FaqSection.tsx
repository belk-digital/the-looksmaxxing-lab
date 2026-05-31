'use client'

import React from 'react'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "What is the purity standard for your peptides?",
    answer: "Every peptide we offer must meet or exceed a strictly enforced 99% purity threshold. We verify this through independent, third-party High-Performance Liquid Chromatography (HPLC) and Mass Spectrometry (LC-MS) testing for every batch."
  },
  {
    question: "How can I access the Certificate of Analysis (COA)?",
    answer: "COAs for every active batch are publicly available in our COA Library. Additionally, every order includes a batch number that corresponds directly to its specific testing document."
  },
  {
    question: "Are these products intended for human consumption?",
    answer: "No. All products sold by The Looksmaxxing Lab are strictly for laboratory and research use only. They are not intended to diagnose, treat, cure, or prevent any disease, and are not for human or animal consumption."
  },
  {
    question: "What are your shipping and fulfillment times?",
    answer: "All orders are fulfilled from our US-based facilities. We offer standard shipping (3-5 business days) and expedited 2-day shipping. Orders placed before 2 PM EST typically ship the same day."
  },
  {
    question: "Do you offer bulk pricing for research institutions?",
    answer: "Yes, we provide tiered wholesale pricing for qualified research institutions, clinics, and approved wholesale accounts. Please contact our support team to apply for an institutional account."
  },
  {
    question: "How are the products synthesized?",
    answer: "We utilize advanced solid-phase peptide synthesis (SPPS) and strict purification protocols to ensure maximum stability and fidelity, resulting in research-grade compounds suitable for rigorous laboratory environments."
  }
]

export function FaqSection() {
  return (
    <section className="w-full bg-[#EAE4DC] py-24 md:py-32 relative z-10 overflow-visible">
      <Container size="wide">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 relative items-start">
          
          {/* Left Column - Sticky Header */}
          <div className="w-full lg:w-5/12 flex-shrink-0">
            <div className="lg:sticky lg:top-32">
              <FadeUp>
                <span className="text-label-md uppercase tracking-widest text-gold mb-4 block font-bold">
                  INQUIRIES
                </span>
              </FadeUp>
              <FadeUp delay={0.1}>
                <h2 className="text-display-sm lg:text-[4.5rem] font-display text-ink mb-6 leading-[0.9] tracking-tight">
                  Common<br className="hidden lg:block"/> Questions
                </h2>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="text-body-md text-ink/70 leading-relaxed mb-8 lg:max-w-[85%]">
                  Find detailed information regarding our laboratory protocols, purity standards, and ordering processes. For specific institutional inquiries, our support team is available.
                </p>
                <button className="text-sm font-bold uppercase tracking-widest text-ink hover:text-gold transition-colors border-b-2 border-ink hover:border-gold pb-1">
                  Contact Support
                </button>
              </FadeUp>
            </div>
          </div>

          {/* Right Column - Accordion List */}
          <div className="w-full lg:w-7/12 pt-4 lg:pt-0">
            <FadeUp delay={0.3} className="w-full">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-ink/20 py-2 lg:py-4">
                    <AccordionTrigger className="text-left text-xl lg:text-2xl font-display text-ink hover:text-gold transition-colors py-6 [&>svg]:text-ink hover:[&>svg]:text-gold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-body-md text-ink/70 leading-relaxed pb-6 pr-6 md:pr-12">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>
          </div>

        </div>
      </Container>
    </section>
  )
}
