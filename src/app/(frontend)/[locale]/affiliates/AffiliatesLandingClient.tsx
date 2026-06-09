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
import { CheckCircle2, DollarSign, Clock, ShieldCheck, Activity, BarChart3, Link as LinkIcon, XCircle, AlertTriangle, FileText } from 'lucide-react'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'
import { submitAffiliateApplication } from './actions'
import { useRouter } from 'next/navigation'

const AFFILIATE_FAQS: FaqItem[] = [
  { question: 'How does the affiliate program work?', answer: 'The Looks Maxxing Lab affiliate program is a referral-based marketing system where you earn commission by directing customers to our website. You receive unique tracking links and discount codes that identify purchases from your referrals. When someone uses your link or code to buy research peptides, you earn 15% commission on their order value. Our automated system tracks everything and calculates your earnings in real-time.' },
  { question: 'How do I get paid as an affiliate?', answer: 'Payouts are available via PayPal, Stripe, or bank transfer once your approved commissions reach $30. You control how and when you receive payments through your affiliate dashboard settings.' },
  { question: 'When do I receive commissions?', answer: 'Commissions are paid on the first week of each month for the previous month\'s approved sales (e.g., January sales are paid the first week of February), after a 14-day protection period.' },
  { question: 'Can beginners join this affiliate program?', answer: 'Yes! There is zero technical setup required, and we provide dedicated affiliate support. It is perfect for beginners exploring affiliate marketing.' },
  { question: 'How are referrals tracked?', answer: 'We use a dual attribution system with both referral links and personalized discount codes to ensure you never miss a commission.' },
  { question: 'What is cookie duration and why does it matter?', answer: 'We offer a 7-day cookie duration. If a customer clicks your link but buys within 7 days, you still receive full commission credit.' },
  { question: 'Are there any costs to join the affiliate program?', answer: 'No, there are zero upfront costs or technical setup requirements. Just straightforward affiliate marketing opportunities.' },
  { question: 'What marketing methods can I use?', answer: 'You can promote through your website, blog, email list, social media, or scientific community platforms, ensuring you maintain a scientific tone and comply with our content standards.' },
  { question: 'Can I use my own discount code?', answer: 'Yes, you will have access to a dashboard to generate custom referral links and personalized discount codes for your audience.' },
  { question: 'What products should I promote as an affiliate?', answer: 'You can promote our premium research peptides, positioning all products as "research use only" without any medical or athletic performance claims.' },
  { question: 'How do I maximize my affiliate earnings?', answer: 'Share your custom 15% discount code widely; it provides genuine value to your audience and significantly improves conversion rates.' },
  { question: 'What happens if someone uses another affiliate\'s code after clicking my link?', answer: 'Our dual tracking system ensures accurate attribution. Typically, the custom discount code used at checkout takes precedence.' },
  { question: 'Can I promote on social media?', answer: 'Yes, social media promotion is encouraged. However, avoid bodybuilding, performance enhancement, or athletic language, and include appropriate disclaimers.' },
]

export type UserAffiliateStatus = 'guest' | 'user' | 'pending_application' | 'affiliate_approved' | 'affiliate_pending' | 'affiliate_rejected'

interface Props {
  userStatus: UserAffiliateStatus;
}

export function AffiliatesLandingClient({ userStatus }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const result = await submitAffiliateApplication(formData)
    
    setIsSubmitting(false)
    
    if (result.success) {
      setSubmitted(true)
    } else {
      if (result.error === 'Unauthorized. Please log in to apply.') {
        router.push('/login?redirect=/affiliates#apply')
      } else {
        setError(result.error || 'Something went wrong.')
      }
    }
  }

  // Hero Parallax
  const { scrollYProgress: heroScroll } = useScroll({
    offset: ["start start", "end start"]
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ["0%", "100%"]);

  return (
    <main className="bg-[#f3f4f6] min-h-screen">
      {/* 1. Interactive Window Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-[100dvh] flex flex-col items-center justify-center pt-24 lg:pt-32 pb-16 overflow-hidden bg-white">
        
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
            Affiliate Program
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
                 src="/Featured%20Images/affiliates-hero.webp" 
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
            className="max-w-3xl text-center px-4 md:px-6 mt-6 sm:mt-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink mb-6 tracking-tight">Earn Passive Income Promoting Premium Research Peptides</h2>
            <p className="text-lg text-gray-500 font-light mb-8 leading-relaxed">
              Partner with The Looks Maxxing Lab and unlock a lucrative affiliate marketing opportunity in the growing life sciences industry.
            </p>
            <Link href="#apply">
              <Button size="lg" className="h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                Join the Affiliate Program Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 1.5 Highlights Banner */}
      <section className="bg-[#f8fafd] text-ink py-12 border-y border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <StaggerChildren className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-gray-200">
            <motion.div variants={staggerItemVariants} className="px-4">
              <span className="block text-3xl font-black text-[#5984c4] mb-2">15%</span>
              <p className="text-sm text-gray-500">Commission on sales</p>
            </motion.div>
            <motion.div variants={staggerItemVariants} className="px-4 border-l-0 md:border-l border-gray-200">
              <span className="block text-3xl font-black text-[#5984c4] mb-2">15%</span>
              <p className="text-sm text-gray-500">Customer discount</p>
            </motion.div>
            <motion.div variants={staggerItemVariants} className="px-4 border-l-0 md:border-l border-gray-200">
              <span className="block text-3xl font-black text-[#5984c4] mb-2">7 Days</span>
              <p className="text-sm text-gray-500">Cookie duration</p>
            </motion.div>
            <motion.div variants={staggerItemVariants} className="px-4 border-l-0 md:border-l border-gray-200">
              <span className="block text-3xl font-black text-[#5984c4] mb-2">Real-time</span>
              <p className="text-sm text-gray-500">Commission tracking</p>
            </motion.div>
            <motion.div variants={staggerItemVariants} className="px-4 col-span-2 md:col-span-1 border-l-0 md:border-l border-gray-200 pt-6 md:pt-0">
              <span className="block text-3xl font-black text-[#5984c4] mb-2">Monthly</span>
              <p className="text-sm text-gray-500">Reliable payouts</p>
            </motion.div>
          </StaggerChildren>
        </div>
      </section>

      {/* 2. How it works (4 steps) */}
      <section className="px-4 md:px-6 py-20 max-w-[1280px] mx-auto">
        <FadeUp>
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 lg:p-20 shadow-sm text-center">
            <span className="inline-block px-4 py-1.5 bg-gray-100 text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6 tracking-tight">How the Affiliate Program Works</h2>
            <p className="text-lg text-gray-500 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
              A win-win referral model that creates strong conversion rates by offering genuine value to both you and your audience.
            </p>
            
            <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-black text-ink mb-6 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-300">1</div>
                <h3 className="text-xl font-bold text-ink mb-3 tracking-tight">Join the Program</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed">Complete our simple registration form. Approval is typically instant. No technical setup required.</p>
              </motion.div>
              
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-black text-ink mb-6 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-300">2</div>
                <h3 className="text-xl font-bold text-ink mb-3 tracking-tight">Get Your Links</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed">Access your dashboard to generate custom referral links and personalized discount codes.</p>
              </motion.div>
              
              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-black text-ink mb-6 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-300">3</div>
                <h3 className="text-xl font-bold text-ink mb-3 tracking-tight">Share Your Links</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed">Promote through your website, blog, email list, social media, or scientific community platforms.</p>
              </motion.div>

              <motion.div variants={staggerItemVariants} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl font-black text-ink mb-6 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white transition-all duration-300">4</div>
                <h3 className="text-xl font-bold text-ink mb-3 tracking-tight">Earn Commissions</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed">Earn 15% commission on every purchase. Track clicks, conversions, and payouts in real-time.</p>
              </motion.div>
            </StaggerChildren>
          </div>
        </FadeUp>
      </section>

      {/* 3. Commission Example & Metrics */}
      <section className="px-4 md:px-6 py-12 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Pitch & Earnings Panel */}
          <div className="lg:col-span-7 bg-[#f8fafd] rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-ink shadow-sm border border-gray-100 flex flex-col">
            <FadeUp>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">Competitive Commission Structure</h2>
              <p className="text-gray-500 font-light mb-10 text-lg">Your commission is calculated on the full order value before discounts, maximizing your earning potential.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Commission Example */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col h-full shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#5984c4] mb-6">Commission Example</h3>
                  <div className="space-y-4 text-sm flex-1">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Customer Order Value</span>
                      <span className="font-bold text-ink">$200</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Customer Discount (15%)</span>
                      <span className="font-bold text-red-500">-$30</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Customer Pays</span>
                      <span className="font-bold text-ink">$170</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-ink font-bold max-w-[120px]">Your Commission (15% of $200)</span>
                      <span className="font-black text-2xl text-[#5984c4]">$30</span>
                    </div>
                  </div>
                </div>

                {/* Realistic Monthly Earnings */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col h-full shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#5984c4] mb-6">Realistic Earnings</h3>
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="font-bold text-ink text-sm">10 referrals/mo</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">@ $150 avg order</div>
                      </div>
                      <div className="font-black text-lg text-green-600">$225</div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="font-bold text-ink text-sm">25 referrals/mo</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">@ $150 avg order</div>
                      </div>
                      <div className="font-black text-lg text-green-600">$562.5</div>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-[#5984c4]/30">
                      <div>
                        <div className="font-bold text-ink text-sm">50 referrals/mo</div>
                        <div className="text-[10px] text-[#5984c4]/70 uppercase tracking-wider">@ $150 avg order</div>
                      </div>
                      <div className="font-black text-lg text-[#5984c4]">$1,125</div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
          
          {/* Tracking Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-6">
            <FadeUp delay={0.1} className="h-full">
              <div className="bg-white rounded-[2rem] p-6 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300 border border-gray-100">
                <span className="block text-4xl md:text-5xl font-black text-ink mb-3 tracking-tighter group-hover:text-[#5984c4] transition-colors">7</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Day Cookie Duration</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.2} className="h-full">
              <div className="bg-white rounded-[2rem] p-6 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300 border border-gray-100">
                <span className="block text-4xl md:text-5xl font-black text-ink mb-3 tracking-tighter group-hover:text-[#5984c4] transition-colors">$30</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Payout Threshold</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.3} className="h-full">
              <div className="bg-white rounded-[2rem] p-6 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300 border border-gray-100">
                <span className="block text-4xl md:text-5xl font-black text-ink mb-3 tracking-tighter group-hover:text-[#5984c4] transition-colors">14</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Day Protection</span>
              </div>
            </FadeUp>
            <FadeUp delay={0.4} className="h-full">
              <div className="bg-white rounded-[2rem] p-6 h-full shadow-sm flex flex-col justify-center group hover:-translate-y-1 transition-transform duration-300 border border-gray-100">
                <span className="block text-4xl md:text-5xl font-black text-ink mb-3 tracking-tighter group-hover:text-[#5984c4] transition-colors">Dual</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tracking System</span>
              </div>
            </FadeUp>
          </div>
          
        </div>
      </section>

      {/* 4. Tracking Tech & Management Tools */}
      <section className="px-4 md:px-6 py-12 max-w-[1280px] mx-auto">
        <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Tracking & Payments */}
          <motion.div variants={staggerItemVariants} className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-ink mb-4 tracking-tight">Advanced Tracking Technology</h2>
              <div className="space-y-6 mt-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#5984c4]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">7-Day Cookie Duration</h4>
                    <p className="text-sm text-gray-500 mt-1">If a customer clicks your link but buys within 7 days, you still receive full commission credit.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-6 h-6 text-[#5984c4]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">Dual Attribution System</h4>
                    <p className="text-sm text-gray-500 mt-1">Both referral link tracking and coupon-code tracking ensure you never miss a commission.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6 text-[#5984c4]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">Real-Time Commission Tracking</h4>
                    <p className="text-sm text-gray-500 mt-1">Your affiliate dashboard provides instant visibility into total clicks, conversion rates, and earnings.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-[#5984c4]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">Flexible Payment Options</h4>
                    <p className="text-sm text-gray-500 mt-1">Once your account reaches $30 in approved commissions, you're eligible for monthly payout via PayPal, Stripe, or bank transfer.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Management Tools Accordion or List */}
          <motion.div variants={staggerItemVariants}>
            <div className="bg-white p-8 rounded-[2rem] h-full shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-ink mb-8 tracking-tight">Comprehensive Management Tools</h2>
              
              <div className="space-y-8">
                <div>
                  <h4 className="font-bold text-ink flex items-center gap-2 mb-3"><BarChart3 className="w-5 h-5 text-[#5984c4]" /> Performance Analytics</h4>
                  <ul className="text-sm text-gray-500 space-y-1.5 list-disc pl-8">
                    <li>Real-time traffic and conversion data</li>
                    <li>Click-through rates by link</li>
                    <li>Top-performing products</li>
                    <li>Revenue trends and forecasting</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-ink flex items-center gap-2 mb-3"><LinkIcon className="w-5 h-5 text-[#5984c4]" /> Link & Discount Management</h4>
                  <ul className="text-sm text-gray-500 space-y-1.5 list-disc pl-8">
                    <li>Referral link generator for any product or page</li>
                    <li>Create unlimited custom links & track performance</li>
                    <li>Generate personalized coupon codes</li>
                    <li>Track usage and redemption rates by code</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-ink flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-[#5984c4]" /> Commission Reports & Resources</h4>
                  <ul className="text-sm text-gray-500 space-y-1.5 list-disc pl-8">
                    <li>Detailed transaction history (pending vs. approved)</li>
                    <li>Monthly earnings summaries & downloadable reports</li>
                    <li>Pre-approved promotional content & product images</li>
                    <li>Compliance guidelines & educational materials</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

        </StaggerChildren>
      </section>

      {/* 5. Why Choose Grid */}
      <section className="px-4 md:px-6 py-20 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-ink mb-4 tracking-tight">Why Choose Our Program</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">A true passive income opportunity where previous work continues generating commissions over time.</p>
          </div>
          
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "High Conversion Rates", desc: "The built-in 15% customer discount significantly improves conversion rates compared to programs without discounts. Your audience receives immediate value." },
              { title: "15% Commission", desc: "Strong earning potential in the scientific products niche. Many lab supplies programs offer only 5-10%—our rate is among the best in biotech." },
              { title: "No Technical Setup", desc: "Join in minutes with zero coding or website requirements. Perfect for beginners exploring affiliate marketing opportunities." },
              { title: "Growing Market", desc: "The research peptide industry continues expanding. Promote products with genuine demand from laboratories and scientific professionals." },
              { title: "Premium Quality", desc: "We maintain rigorous quality standards with third-party testing and purity verification. Confidently promote products knowing they meet specifications." },
              { title: "Dedicated Support", desc: "Our affiliate management team provides assistance with strategy, compliance questions, and technical support. You're never alone." }
            ].map((feature, i) => (
              <motion.div key={i} variants={staggerItemVariants} className="p-8 rounded-2xl bg-[#f3f4f6] border border-gray-100 hover:shadow-lg transition-all duration-300">
                <CheckCircle2 className="w-8 h-8 text-[#5984c4] mb-4" />
                <h4 className="font-bold text-ink mb-2 text-lg">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* 6. Standards */}
      <section className="px-4 md:px-6 py-16 max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ink mb-4">Guidelines & Compliance</h2>
          <p className="text-gray-500">Maintaining our scientific integrity is essential.</p>
        </div>
        <div className="bg-red-50/50 rounded-3xl p-8 md:p-12 border border-red-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h3 className="text-2xl font-bold text-red-900">Prohibited Practices</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span className="text-red-900/80 text-sm">No misleading or exaggerated earnings claims</span></li>
            <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span className="text-red-900/80 text-sm">No medical claims - never suggest products are for human consumption</span></li>
            <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span className="text-red-900/80 text-sm">No spam, unsolicited emails, or mass messaging</span></li>
            <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span className="text-red-900/80 text-sm">No bidding on brand keywords in paid search</span></li>
            <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" /><span className="text-red-900/80 text-sm">No trademark misuse in domain names</span></li>
          </ul>
        </div>
        
        <div className="bg-blue-50/50 rounded-3xl p-8 md:p-12 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-blue-900">Content Standards</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /><span className="text-blue-900/80 text-sm">Position all products as "research use only"</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /><span className="text-blue-900/80 text-sm">Avoid bodybuilding, performance enhancement, or athletic language</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /><span className="text-blue-900/80 text-sm">Include appropriate disclaimers in all content</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /><span className="text-blue-900/80 text-sm">Comply with FTC affiliate disclosure requirements</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" /><span className="text-blue-900/80 text-sm">Maintain a scientific and professional tone</span></li>
          </ul>
        </div>
      </section>

      {/* 7. Application Form */}
      <section id="apply" className="px-4 md:px-6 py-16 max-w-[1000px] mx-auto scroll-mt-32">
        <FadeUp>
          <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-sm border border-gray-100">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-gray-100 text-ink rounded-full text-xs font-bold uppercase tracking-widest mb-6">Apply Now</span>
              <h2 className="text-3xl md:text-5xl font-bold text-ink mb-4 tracking-tight">Partner Application</h2>
              <p className="text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
                The application takes less than 2 minutes. No technical setup. No upfront costs. Just straightforward affiliate marketing opportunities with a trusted research peptide provider.
              </p>
            </div>

            {userStatus === 'affiliate_approved' ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Activity className="w-12 h-12 text-[#5984c4]" strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">You are an active partner!</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed mb-10">
                  Your affiliate account is active and ready. Access your dashboard to view your links, stats, and payouts.
                </p>
                <Link href="/affiliates/dashboard">
                  <Button size="lg" className="h-14 px-10 rounded-full bg-[#5984c4] text-white hover:bg-blue-600 hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : userStatus === 'affiliate_pending' || userStatus === 'pending_application' || submitted ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">Application Under Review</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed mb-10">
                  Your application has been received and is currently under review by our team. We will notify you once it's approved.
                </p>
              </div>
            ) : userStatus === 'affiliate_rejected' ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <XCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">Application Status</h3>
                <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed mb-10">
                  Unfortunately, your application to the affiliate program was not approved at this time.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Basic Info */}
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 text-sm font-semibold">
                      {error}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm font-semibold text-ink ml-1">Display Name <span className="text-[#5984c4]">*</span></Label>
                      <Input id="displayName" name="displayName" required placeholder="John Doe or Channel Name" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-sm font-semibold text-ink ml-1">Website URL</Label>
                      <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>
                </div>

                {/* 2. Social Links */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Primary Platform</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platform" className="text-sm font-semibold text-ink ml-1">Platform <span className="text-[#5984c4]">*</span></Label>
                      <Select defaultValue="youtube" required name="platform">
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
                      <Input id="socialUrl" name="socialUrl" type="url" required placeholder="https://youtube.com/c/..." className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Audience & Methods */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-ink tracking-tight border-b border-gray-100 pb-2">Audience & Strategy</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reach" className="text-sm font-semibold text-ink ml-1">Estimated Monthly Reach <span className="text-[#5984c4]">*</span></Label>
                      <Select defaultValue="1k-10k" required name="reach">
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
                      <Input id="niche" name="niche" placeholder="e.g. Biohacking, Fitness, Longevity" className="h-14 rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] px-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methods" className="text-sm font-semibold text-ink ml-1">Promotion Methods <span className="text-[#5984c4]">*</span></Label>
                    <Textarea 
                      id="methods" 
                      name="methods"
                      required 
                      placeholder="How do you plan to promote our products?" 
                      className="min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:ring-1 focus:ring-[#5984c4] p-4 resize-none"
                    />
                  </div>
                </div>

                {/* 4. Terms & Submit */}
                <div className="pt-6 border-t border-gray-100 flex flex-col items-start gap-6">
                  <div className="flex flex-row items-start space-x-3 space-y-0 bg-gray-50 p-4 rounded-xl border border-transparent">
                    <Checkbox id="terms" name="terms" required className="mt-1" />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="terms" className="text-sm font-semibold text-ink cursor-pointer">
                        Accept terms and conditions
                      </Label>
                      <p className="text-xs text-gray-500 font-light mt-1 leading-relaxed">
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

      {/* 8. FAQ */}
      <FaqCarousel 
        faqs={AFFILIATE_FAQS}
        title="Common"
        accentTitle="Questions"
        description="Common questions about research peptides, ordering, and lab standards"
        theme="light"
      />

      {/* 9. CTA */}
      <section className="px-4 md:px-6 py-16 mb-16 max-w-[1280px] mx-auto">
        <FadeUp>
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-12 md:p-20 shadow-sm text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6 tracking-tight">Start Earning 15% Commission Today</h2>
            <p className="text-lg text-gray-500 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              The application takes less than 2 minutes. No technical setup. No upfront costs. Just straightforward affiliate marketing opportunities with a trusted research peptide provider.
            </p>
            <div className="flex flex-col items-center gap-6">
              <Link href="#apply">
                <Button size="lg" className="h-14 px-10 rounded-full bg-ink text-white hover:bg-[#1a1a1a] hover:shadow-lg transition-all duration-300 font-bold tracking-wider uppercase text-sm border-none">
                  Become an Affiliate Now
                </Button>
              </Link>
              <p className="text-sm text-gray-400">Questions? Contact us at <a href="mailto:affiliates@thelooksmaxxinglab.com" className="text-[#5984c4] hover:underline">affiliates@thelooksmaxxinglab.com</a></p>
            </div>
          </div>
        </FadeUp>
        
        {/* Disclaimer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-gray-500">Research Use Only:</strong> All The Looks Maxxing Lab products are manufactured and sold exclusively for laboratory research purposes. Not for human consumption, medical treatment, or athletic performance enhancement. This affiliate program is for marketing research compounds only. Affiliates must comply with all applicable laws and regulations.
          </p>
        </div>
      </section>
    </main>
  )
}
