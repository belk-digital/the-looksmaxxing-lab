import React from 'react'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'

const FAQS: FaqItem[] = [
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
    answer: "We utilize advanced solid-phase peptide synthesis (SPPS) and strict purification guidelines to ensure maximum stability and fidelity, resulting in research-grade compounds suitable for rigorous laboratory environments."
  }
]

export function FaqSection() {
  return (
    <FaqCarousel 
      faqs={FAQS} 
      title="Common"
      accentTitle="Questions"
      description="Find detailed information regarding our laboratory guidelines, purity standards, and ordering processes. For specific institutional inquiries, our support team is available."
      theme="light"
    />
  )
}
