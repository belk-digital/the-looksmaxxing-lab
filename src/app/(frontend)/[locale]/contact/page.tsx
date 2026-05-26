'use client'

import React, { useState } from 'react'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
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

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <section className="px-6 max-w-page mx-auto">
        
        {/* Header */}
        <div className="mb-16">
          <FadeUp>
            <EyebrowHeading gold>Support</EyebrowHeading>
            <h1 className="text-display-md font-serif text-ink mt-4 mb-6">Contact the lab</h1>
            <p className="text-body-lg text-ink-muted max-w-content">
              Whether you need to report an issue with an order, request a specific batch COA, or inquire about bulk acquisition, our support team is available to assist.
            </p>
          </FadeUp>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <FadeUp delay={0.1}>
              {submitted ? (
                <div className="bg-cream-warm border border-border-subtle rounded-md p-12 text-center h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-cream border border-gold rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-gold text-2xl font-serif">✓</span>
                  </div>
                  <h3 className="text-editorial-md font-serif text-ink mb-4">Message received</h3>
                  <p className="text-body-md text-ink-muted">
                    Your inquiry has been successfully routed to the appropriate department. A representative will contact you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Department Select */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select defaultValue="general">
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <Label htmlFor="name">Full Name <span className="text-gold">*</span></Label>
                      <Input id="name" required placeholder="Dr. John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-gold">*</span></Label>
                      <Input id="email" type="email" required placeholder="john@example.com" />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject <span className="text-gold">*</span></Label>
                    <Input id="subject" required placeholder="Order #12345 Inquiry" />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message <span className="text-gold">*</span></Label>
                    <Textarea 
                      id="message" 
                      required 
                      placeholder="How can we assist you?" 
                      className="min-h-[160px] bg-cream-warm"
                    />
                  </div>

                  {/* Turnstile Placeholder */}
                  <div className="w-full h-[65px] bg-cream-warm border border-border-subtle rounded-sm flex items-center justify-center text-body-xs text-ink-muted">
                    [ Cloudflare Turnstile Placeholder ]
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" variant="dark" size="lg" isLoading={isSubmitting} className="w-full md:w-auto">
                      Submit Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </FadeUp>
          </div>

          {/* Right Column: Direct Contacts */}
          <div className="lg:col-span-5">
            <FadeUp delay={0.2} className="bg-cream-sand p-8 md:p-12 rounded-sm h-full border border-border-subtle">
              <h3 className="text-editorial-md font-serif text-ink mb-10">Direct contacts</h3>
              
              <div className="space-y-10">
                <div>
                  <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-3">Order Support</span>
                  <a href="mailto:support@looksmaxxinglab.com" className="text-body-lg text-ink hover:text-gold-dark transition-colors underline underline-offset-4">
                    support@looksmaxxinglab.com
                  </a>
                  <p className="text-body-sm text-ink-muted mt-2">
                    Responses typically within 12 hours.
                  </p>
                </div>

                <div>
                  <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-3">Quality & COAs</span>
                  <a href="mailto:quality@looksmaxxinglab.com" className="text-body-lg text-ink hover:text-gold-dark transition-colors underline underline-offset-4">
                    quality@looksmaxxinglab.com
                  </a>
                  <p className="text-body-sm text-ink-muted mt-2">
                    Include your batch number in the subject line.
                  </p>
                </div>

                <div>
                  <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-3">Wholesale</span>
                  <a href="mailto:wholesale@looksmaxxinglab.com" className="text-body-lg text-ink hover:text-gold-dark transition-colors underline underline-offset-4">
                    wholesale@looksmaxxinglab.com
                  </a>
                  <p className="text-body-sm text-ink-muted mt-2">
                    For laboratory bulk acquisition and academic institutions.
                  </p>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-border-strong">
                <span className="block text-label-md uppercase tracking-wider text-ink-muted mb-4">Mailing Address</span>
                <address className="text-body-md text-ink not-italic leading-relaxed">
                  The Looksmaxxing Lab<br />
                  123 Innovation Drive, Suite 400<br />
                  Research Triangle Park, NC 27709
                </address>
              </div>
            </FadeUp>
          </div>

        </div>
      </section>
    </main>
  )
}
