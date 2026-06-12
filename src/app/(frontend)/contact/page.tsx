'use client'

import React, { useState } from 'react'
import { FadeUp } from '@/components/motion/FadeUp'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { FaqCarousel } from '@/components/shared/FaqCarousel'
import { submitContactForm } from './actions'
import { toast } from 'sonner'

const CONTACT_FAQS = [
  { question: 'When will my order ship?', answer: 'Orders placed before 2:00 PM EST Monday through Friday are shipped the same day. Orders placed after the cutoff or on weekends will ship the following business day.' },
  { question: 'Where is my tracking number?', answer: 'Tracking numbers are automatically emailed as soon as your shipping label is created. You can also view your tracking status by logging into your account dashboard.' },
  { question: 'My package was damaged in transit, what do I do?', answer: 'If your vials arrive compromised, please use the contact form above to reach out within 48 hours of delivery. Include your order number and we will request photos of the damaged items to expedite a replacement.' },
  { question: 'How can I get a copy of my batch COA?', answer: 'Certificates of Analysis (COAs) are included with every shipment and are also available digitally. You can download past COAs directly from your Order History in your account dashboard, or request them via the Quality & COAs contact email.' },
  { question: 'Do you offer wholesale pricing for laboratories?', answer: 'Yes, we offer special pricing tiers for bulk acquisition by licensed laboratories and academic institutions. Please select "Wholesale" in the contact form department dropdown or email wholesale@looksmaxxinglab.com directly.' },
  { question: 'Why was my order cancelled?', answer: 'Orders may be cancelled if our fraud detection system flags an issue with the payment method, or if there is any communication indicating the intent to misuse our research-only products for human consumption.' },
  { question: 'Do you ship internationally?', answer: 'Yes, we ship worldwide. However, it is the sole responsibility of the researcher to ensure that the importation of our research compounds complies with all local and national regulations in the destination country.' }
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const result = await submitContactForm(formData)

    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <main className="bg-[#f3f4f6] min-h-screen pt-32 lg:pt-40 pb-24">
      <section className="px-4 md:px-6 max-w-[1280px] mx-auto">
        
        {/* Header */}
        <div className="mb-12 lg:mb-20 max-w-2xl">
          <FadeUp>
            <span className="inline-block px-4 py-1.5 bg-white border border-gray-100 shadow-sm text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Support</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6 tracking-tight leading-tight">Contact the lab</h1>
            <p className="text-lg lg:text-xl text-gray-500 leading-relaxed font-light">
              Whether you need to report an issue with an order, request a specific batch COA, or inquire about bulk acquisition, our support team is available to assist.
            </p>
          </FadeUp>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <FadeUp delay={0.1} className="h-full">
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 lg:p-12 shadow-sm h-full">
                {submitted ? (
                  <div className="text-center h-full flex flex-col items-center justify-center py-12">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">Message received</h3>
                    <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
                      Your inquiry has been successfully routed to the appropriate department. A representative will contact you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Department Select */}
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-semibold text-ink ml-1">Department</Label>
                      <Select defaultValue="general" name="department">
                        <SelectTrigger id="department" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Order Support</SelectItem>
                          <SelectItem value="quality">Quality & COAs</SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-ink ml-1">Full Name <span className="text-[#5984c4]">*</span></Label>
                        <Input id="name" name="name" required placeholder="Dr. John Smith" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-ink ml-1">Email Address <span className="text-[#5984c4]">*</span></Label>
                        <Input id="email" name="email" type="email" required placeholder="john@example.com" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-semibold text-ink ml-1">Subject <span className="text-[#5984c4]">*</span></Label>
                      <Input id="subject" name="subject" required placeholder="Order #12345 Inquiry" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-semibold text-ink ml-1">Message <span className="text-[#5984c4]">*</span></Label>
                      <Textarea 
                        id="message" 
                        name="message"
                        required 
                        placeholder="How can we assist you?" 
                        className="min-h-[160px] rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] p-4 resize-none"
                      />
                    </div>

                    {/* Turnstile Placeholder */}
                    <div className="w-full h-[65px] bg-gray-50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                      [ Cloudflare Turnstile Placeholder ]
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full md:w-auto h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                        Submit Inquiry
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </FadeUp>
          </div>

          {/* Right Column: Direct Contacts */}
          <div className="lg:col-span-5">
            <FadeUp delay={0.2} className="h-full">
              <div className="bg-white p-6 md:p-10 lg:p-12 rounded-[1.5rem] md:rounded-[2.5rem] h-full shadow-sm">
                <h3 className="text-3xl font-bold text-ink mb-10 tracking-tight">Direct contacts</h3>
                
                <div className="space-y-10">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Order Support</span>
                    <a href="mailto:support@looksmaxxinglab.com" className="text-lg lg:text-xl font-medium text-ink hover:text-[#5984c4] transition-colors underline underline-offset-4">
                      support@looksmaxxinglab.com
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      Responses typically within 12 hours.
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quality & COAs</span>
                    <a href="mailto:quality@looksmaxxinglab.com" className="text-lg lg:text-xl font-medium text-ink hover:text-[#5984c4] transition-colors underline underline-offset-4">
                      quality@looksmaxxinglab.com
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      Include your batch number in the subject line.
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Wholesale</span>
                    <a href="mailto:wholesale@looksmaxxinglab.com" className="text-lg lg:text-xl font-medium text-ink hover:text-[#5984c4] transition-colors underline underline-offset-4">
                      wholesale@looksmaxxinglab.com
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      For laboratory bulk acquisition and academic institutions.
                    </p>
                  </div>
                </div>

                <div className="mt-16 pt-10 border-t border-gray-100">
                  <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Mailing Address</span>
                  <address className="text-base text-gray-600 not-italic leading-relaxed font-light">
                    The Looksmaxxing Lab<br />
                    123 Innovation Drive, Suite 400<br />
                    Research Triangle Park, NC 27709
                  </address>
                </div>
              </div>
            </FadeUp>
          </div>

        </div>
      </section>

      {/* FAQs Section */}
      <div className="pt-24">
        <FaqCarousel 
          faqs={CONTACT_FAQS} 
          title="Quick" 
          accentTitle="Answers" 
          description="Find answers to common questions about orders, shipping, and quality control." 
        />
      </div>
    </main>
  )
}
