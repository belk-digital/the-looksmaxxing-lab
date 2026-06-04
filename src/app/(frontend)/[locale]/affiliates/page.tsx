'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'

const AFFILIATE_FAQS: FaqItem[] = [
  { question: 'How long do cookies last?', answer: 'Our affiliate tracking cookie remains active for 30 days after the initial click.' },
  { question: 'When do I get paid?', answer: 'Commissions have a 30-day pending period to account for potential returns. Once approved, you can request a payout anytime if you meet the minimum threshold.' },
  { question: 'What payment methods do you support?', answer: 'We process payouts globally via PayPal, Wise, Bank Wire, and major cryptocurrencies (BTC, ETH, USDT).' },
  { question: 'Do I get free products?', answer: 'Top-tier Gold and VIP affiliates receive seasonal research allocations for content creation. Standard affiliates do not receive free compounds initially.' },
]

export default function AffiliatesLandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);

  return (
    <main className="bg-[#f3f4f6] min-h-screen">
      {/* 1. Interactive Window Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[100dvh] flex flex-col items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden bg-white mb-24">
        
        {/* Background Marquee */}
        <div className="absolute bottom-4 left-0 w-full overflow-hidden whitespace-nowrap flex z-0 pointer-events-none">
          <div className="animate-marquee flex items-center whitespace-nowrap w-max opacity-[0.04]">
              {Array(4).fill(0).map((_, i) => (
                <span key={i} className="text-[12vw] lg:text-[7vw] xl:text-[5vw] font-serif uppercase tracking-tighter mx-8 text-ink">
                  PARTNER &bull; AFFILIATE &bull; RESEARCHER &bull; 
                </span>
             ))}
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 h-full flex-1">
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-label-md uppercase tracking-widest text-[#5984c4] mb-4 sm:mb-8 font-bold"
          >
            Partner Program
          </motion.h2>

          {/* The Interactive Window */}
          <motion.div 
            initial={{ width: '90%', height: '40vh', borderRadius: '3rem' }}
            whileHover={{ width: '98%', height: '60vh', borderRadius: '1.5rem' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden shadow-2xl cursor-pointer group my-8 md:my-12 max-w-[1600px] w-full"
            style={{ width: '85%' }}
          >
             <motion.div 
               className="w-full relative"
               style={{ height: '150%', top: '-25%', y: heroImageY }}
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             >
               <Image 
                 src="/affiliate-hero.webp" 
                 alt="Affiliate Program" 
                 fill 
                 className="object-cover object-center"
                 priority
               />
               <div className="absolute inset-0 bg-[#5984c4]/30 group-hover:bg-[#5984c4]/10 transition-colors duration-700" />
             </motion.div>
             
             {/* Center Overlay Text inside Window */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <motion.h1 
                  className="text-center text-[10vw] sm:text-[12vw] md:text-[14vw] lg:text-[10vw] font-serif text-white leading-none tracking-tight mix-blend-overlay opacity-90 drop-shadow-2xl whitespace-nowrap"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  PARTNERS
                </motion.h1>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl text-center px-4 md:px-6 mt-6 sm:mt-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-6 tracking-tight">Advancing independent research</h2>
            <p className="text-lg text-gray-500 font-light mb-8 leading-relaxed">
              Earn competitive commissions while providing your audience with exclusive access to verified, LC-MS tested research materials.
            </p>
            <Link href="#apply">
              <Button size="lg" className="h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                Apply to the Program
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 1.5 Application Form */}
      <section id="apply" className="px-4 md:px-6 py-12 max-w-[1000px] mx-auto scroll-mt-32">
        <FadeUp>
          <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-sm border border-gray-100">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-gray-100 text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Apply Now</span>
              <h2 className="text-3xl md:text-5xl font-bold text-ink mb-4 tracking-tight">Partner Application</h2>
              <p className="text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
                Apply to join the most rigorous peptide testing facility's affiliate program. We review applications weekly.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">Application Received</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed mb-10">
                  Your application has been submitted successfully. Our team will review your details and be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm font-semibold text-ink ml-1">Display Name <span className="text-[#5984c4]">*</span></Label>
                      <Input id="displayName" required placeholder="John Doe or Channel Name" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-sm font-semibold text-ink ml-1">Website URL</Label>
                      <Input id="websiteUrl" type="url" placeholder="https://example.com" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>
                </div>

                {/* 2. Social Links */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Primary Platform</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platform" className="text-sm font-semibold text-ink ml-1">Platform <span className="text-[#5984c4]">*</span></Label>
                      <Select defaultValue="youtube" required>
                        <SelectTrigger id="platform" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="twitter">Twitter / X</SelectItem>
                          <SelectItem value="reddit">Reddit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="socialUrl" className="text-sm font-semibold text-ink ml-1">Profile URL <span className="text-[#5984c4]">*</span></Label>
                      <Input id="socialUrl" type="url" required placeholder="https://youtube.com/c/..." className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Audience & Methods */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Audience & Strategy</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reach" className="text-sm font-semibold text-ink ml-1">Estimated Monthly Reach <span className="text-[#5984c4]">*</span></Label>
                      <Select defaultValue="1k-10k" required>
                        <SelectTrigger id="reach" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4">
                          <SelectValue placeholder="Select reach" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="<1k">Less than 1,000</SelectItem>
                          <SelectItem value="1k-10k">1,000 - 10,000</SelectItem>
                          <SelectItem value="10k-100k">10,000 - 100,000</SelectItem>
                          <SelectItem value="100k+">100,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="niche" className="text-sm font-semibold text-ink ml-1">Your Niche</Label>
                      <Input id="niche" placeholder="e.g. Biohacking, Fitness, Longevity" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methods" className="text-sm font-semibold text-ink ml-1">Promotion Methods <span className="text-[#5984c4]">*</span></Label>
                    <Textarea 
                      id="methods" 
                      required 
                      placeholder="How do you plan to promote our products?" 
                      className="min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] p-4 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whyJoin" className="text-sm font-semibold text-ink ml-1">Why do you want to join?</Label>
                    <Textarea 
                      id="whyJoin" 
                      placeholder="Tell us a little bit about yourself and why our lab is a good fit." 
                      className="min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] p-4 resize-none"
                    />
                  </div>
                </div>

                {/* 4. Terms & Submit */}
                <div className="pt-6 border-t border-gray-100 flex flex-col items-start gap-6">
                  <div className="flex flex-row items-start space-x-3 space-y-0 bg-gray-50 p-4 rounded-xl border border-transparent">
                    <Checkbox id="terms" required className="mt-1" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="terms" className="text-sm font-semibold text-ink cursor-pointer">
                        Accept terms and conditions
                      </Label>
                      <p className="text-xs text-gray-500 font-light">
                        I agree to the Affiliate Program Terms of Service and acknowledge that I will only promote products in accordance with legal and platform guidelines.
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-end">
                    <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full md:w-auto h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                      Submit Application
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </FadeUp>
      </section>

      {/* 2. How it works (3 steps) */}
      <section className="px-4 md:px-6 py-12 max-w-[1280px] mx-auto">
        <FadeUp>
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 lg:p-20 shadow-sm text-center">
            <span className="inline-block px-4 py-1.5 bg-gray-100 text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-16 tracking-tight">How it works</h2>
            
            <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-3xl font-black text-ink mb-6 group-hover:scale-110 transition-transform duration-300">1</div>
                <h3 className="text-2xl font-bold text-ink mb-4 tracking-tight">Apply</h3>
                <p className="text-gray-500 font-light leading-relaxed">Submit your application with your platform metrics. We review applications weekly to ensure audience alignment.</p>
              </motion.div>
              
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-3xl font-black text-ink mb-6 group-hover:scale-110 transition-transform duration-300">2</div>
                <h3 className="text-2xl font-bold text-ink mb-4 tracking-tight">Share</h3>
                <p className="text-gray-500 font-light leading-relaxed">Receive a dedicated 10% off coupon code and trackable referral links to share across your digital footprint.</p>
              </motion.div>
              
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-3xl font-black text-ink mb-6 group-hover:scale-110 transition-transform duration-300">3</div>
                <h3 className="text-2xl font-bold text-ink mb-4 tracking-tight">Earn</h3>
                <p className="text-gray-500 font-light leading-relaxed">Earn competitive percentage commissions on all eligible orders placed within 30 days of a referral click.</p>
              </motion.div>
            </StaggerChildren>
          </div>
        </FadeUp>
      </section>

      {/* 3. Commission Rates / Metrics (Bento Box) */}
      <section className="px-4 md:px-6 py-12 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Pitch Card */}
          <div className="lg:col-span-5 bg-ink rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-white flex flex-col justify-center shadow-xl">
            <FadeUp>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">Generous structures for serious partners</h2>
              <p className="text-lg text-gray-400 font-light leading-relaxed">
                Our baseline tier offers highly competitive rates. As your volume scales, we automatically upgrade your account to unlock higher commissions, dedicated support, and custom synthesis requests.
              </p>
            </FadeUp>
          </div>
          
          {/* Metrics Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FadeUp delay={0.1} className="h-full">
              <div className="bg-white rounded-[2rem] p-8 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-5xl md:text-6xl font-black text-ink mb-4 tracking-tighter group-hover:text-[#5984c4] transition-colors">10%</span>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Base Commission</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.2} className="h-full">
              <div className="bg-white rounded-[2rem] p-8 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-5xl md:text-6xl font-black text-ink mb-4 tracking-tighter group-hover:text-[#5984c4] transition-colors">30</span>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Day Cookie Life</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.3} className="h-full">
              <div className="bg-white rounded-[2rem] p-8 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-5xl md:text-6xl font-black text-ink mb-4 tracking-tighter group-hover:text-[#5984c4] transition-colors">$50</span>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Min. Payout</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.4} className="h-full">
              <div className="bg-white rounded-[2rem] p-8 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300">
                <span className="block text-5xl md:text-6xl font-black text-ink mb-4 tracking-tighter group-hover:text-[#5984c4] transition-colors">4</span>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Payout Methods</span>
              </div>
            </FadeUp>
          </div>
          
        </div>
      </section>

      {/* 4. FAQ */}
      <FaqCarousel 
        faqs={AFFILIATE_FAQS}
        title="Frequent"
        accentTitle="Inquiries"
        description="Everything you need to know about cookies, payouts, and our tiered commission structure."
        theme="light"
      />

      {/* 5. CTA */}
      <section className="px-4 md:px-6 py-16 mb-16 max-w-[1280px] mx-auto">
        <FadeUp>
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 shadow-sm text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6 tracking-tight">Ready to scale your influence?</h2>
            <p className="text-lg text-gray-500 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Applications are reviewed on a rolling basis. Partner with a lab that prioritizes verifiable purity and consistent results.
            </p>
            <Link href="#apply">
              <Button size="lg" className="h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                Submit Application
              </Button>
            </Link>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
