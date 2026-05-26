'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AffiliateApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate network submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      <section className="px-6 max-w-[720px] mx-auto">
        <FadeUp>
          {submitted ? (
            <div className="bg-cream-warm border border-border-subtle rounded-md p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-16 h-16 bg-cream border border-gold rounded-full flex items-center justify-center mb-6">
                <span className="text-gold text-2xl font-serif">✓</span>
              </div>
              <h1 className="text-display-sm font-serif text-ink mb-4">Application received</h1>
              <p className="text-body-lg text-ink-muted mb-8 max-w-[480px]">
                We review all applications weekly. If your audience aligns with our research standards, you will receive an approval email containing your dashboard link and custom referral codes.
              </p>
              <Link href="/">
                <Button variant="secondary">Return to Lab</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <EyebrowHeading gold>Application</EyebrowHeading>
                <h1 className="text-display-md font-serif text-ink mt-4 mb-4">Join the network</h1>
                <p className="text-body-lg text-ink-muted">
                  Please provide details about your platform, audience, and promotion strategies. We strictly partner with creators focused on clinical research, biohacking, and verifiable science.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                {/* 1. Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-editorial-md font-serif text-ink pb-2 border-b border-border-subtle">Identity</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Brand or Display Name <span className="text-gold">*</span></Label>
                    <Input id="displayName" required placeholder="Dr. John Smith / Peak Performance Blog" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Primary Website URL</Label>
                    <Input id="websiteUrl" type="url" placeholder="https://example.com" />
                  </div>
                </div>

                {/* 2. Social Links */}
                <div className="space-y-6">
                  <h3 className="text-editorial-md font-serif text-ink pb-2 border-b border-border-subtle">Primary Social Platform</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="socialPlatform">Platform</Label>
                      <Select defaultValue="youtube">
                        <SelectTrigger id="socialPlatform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="socialUrl">Profile URL</Label>
                      <Input id="socialUrl" type="url" placeholder="https://youtube.com/@handle" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedMonthlyReach">Estimated Monthly Reach <span className="text-gold">*</span></Label>
                    <Select required>
                      <SelectTrigger id="estimatedMonthlyReach">
                        <SelectValue placeholder="Select your reach" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1k">Under 1,000</SelectItem>
                        <SelectItem value="1k-10k">1,000 - 10,000</SelectItem>
                        <SelectItem value="10k-100k">10,000 - 100,000</SelectItem>
                        <SelectItem value="100k+">100,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. Strategy */}
                <div className="space-y-6">
                  <h3 className="text-editorial-md font-serif text-ink pb-2 border-b border-border-subtle">Strategy</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="niche">Content Niche / Audience Type</Label>
                    <Input id="niche" placeholder="e.g. Longevity, Sports Medicine, Biohacking" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promotionMethods">How do you plan to promote us? <span className="text-gold">*</span></Label>
                    <Textarea 
                      id="promotionMethods" 
                      required 
                      placeholder="Will you write reviews? Mention us on a podcast? Create video protocols?"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whyJoin">Why The Looksmaxxing Lab?</Label>
                    <Textarea 
                      id="whyJoin" 
                      placeholder="Why do you want to partner specifically with us?"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* 4. Terms */}
                <div className="bg-cream-warm p-6 rounded-md border border-border-subtle flex items-start space-x-3">
                  <Checkbox id="agreedToTerms" required className="mt-1" />
                  <div className="leading-none">
                    <label
                      htmlFor="agreedToTerms"
                      className="text-body-md font-medium text-ink cursor-pointer"
                    >
                      I agree to the Affiliate Terms and Conditions
                    </label>
                    <p className="text-body-sm text-ink-muted mt-2 leading-relaxed">
                      By applying, you agree not to bid on branded search terms, make false medical claims, or promote products for human consumption.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex justify-end">
                  <Button type="submit" variant="dark" size="lg" isLoading={isSubmitting} className="w-full md:w-auto">
                    Submit Application
                  </Button>
                </div>
              </form>
            </>
          )}
        </FadeUp>
      </section>
    </main>
  )
}
