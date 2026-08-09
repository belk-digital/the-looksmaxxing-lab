'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { subscribeToNewsletter } from '@/app/(frontend)/actions/newsletter'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMessage('')

    const res = await subscribeToNewsletter(email)
    
    if (res.success) {
      setStatus('success')
      setEmail('')
    } else {
      setStatus('error')
      setErrorMessage(res.error || 'Something went wrong')
    }
  }

  return (
    <section className="w-full bg-white py-12 md:py-24 px-4 sm:px-6 relative z-20">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp>
          <div className="bg-[#f8fafd] border border-[#e8eff7] rounded-[2rem] md:rounded-[3rem] relative flex flex-col items-center py-12 lg:py-20 shadow-sm">
            
            {/* Left Vial */}
            <div className="absolute left-[-20px] md:left-[-40px] xl:left-[-60px] top-1/2 -translate-y-1/2 w-[100px] md:w-[140px] xl:w-[180px] aspect-[1/2.2] pointer-events-none hidden md:block z-30">
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full h-full"
              >
                <Image 
                  src="/New Images/longevia-vial.webp" 
                  alt="Longevia Research — High-purity laboratory peptide vial" 
                  fill 
                  className="object-contain drop-shadow-2xl" 
                />
              </motion.div>
            </div>

            {/* Right Vial */}
            <div className="absolute right-[-20px] md:right-[-40px] xl:right-[-60px] top-1/2 -translate-y-1/2 w-[100px] md:w-[140px] xl:w-[180px] aspect-[1/2.2] pointer-events-none hidden md:block z-30">
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="relative w-full h-full"
              >
                <Image 
                  src="/New Images/longevia-vial.webp" 
                  alt="Longevia Research Research Peptide Vial" 
                  fill 
                  className="object-contain drop-shadow-2xl" 
                />
              </motion.div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full px-6 md:px-32 lg:px-40 xl:px-48 flex flex-col items-center">
              
              <div className="flex flex-col xl:flex-row items-center justify-between w-full gap-8 xl:gap-12">
                
                {/* Left Text */}
                <div className="flex-1 flex flex-col items-center xl:items-start text-center xl:text-left w-full">
                  <h2 className="text-[1.75rem] sm:text-4xl lg:text-[2.75rem] font-serif text-[#1c4477] mb-3 md:mb-4 tracking-tight whitespace-normal xl:whitespace-nowrap leading-tight">
                    Sign up to our Newsletter
                  </h2>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-[#9eb5d8] uppercase max-w-[280px] sm:max-w-sm xl:max-w-none">
                    Sign up to our newsletter and get 10% off your first order.
                  </p>
                </div>

                {/* Right Form */}
                <div className="flex-1 flex w-full justify-center xl:justify-end">
                  <form 
                    className="flex flex-col sm:flex-row gap-3 w-full max-w-md xl:max-w-[500px] relative"
                    onSubmit={handleSubmit}
                  >
                    <input 
                      type="email" 
                      placeholder="Enter email address" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (status !== 'idle' && status !== 'loading') {
                          setStatus('idle')
                          setErrorMessage('')
                        }
                      }}
                      disabled={status === 'loading'}
                      className="flex-1 rounded-full border-2 border-[#e8eff7] px-6 py-4 text-sm focus:outline-none focus:border-[#a9c1e1] bg-white shadow-sm text-ink placeholder:text-slate-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={status === 'loading'}
                      className="bg-[#5984c4] hover:bg-[#3d65a0] text-white rounded-full px-8 py-4 font-bold text-xs tracking-widest uppercase transition-colors shadow-sm whitespace-nowrap shrink-0 disabled:opacity-70 disabled:hover:bg-[#5984c4] disabled:cursor-not-allowed flex justify-center items-center min-w-[140px]"
                    >
                      {status === 'loading' ? 'SUBSCRIBING...' : status === 'success' ? 'SUBSCRIBED!' : 'SUBSCRIBE'}
                    </button>
                    
                    {/* Status Messages */}
                    {status === 'error' && (
                      <p className="absolute -bottom-6 left-6 text-[10px] text-red-500 font-medium">
                        {errorMessage}
                      </p>
                    )}
                    {status === 'success' && (
                      <p className="absolute -bottom-6 left-6 text-[10px] text-[#5984c4] font-bold tracking-widest">
                        Successfully added to our list!
                      </p>
                    )}
                  </form>
                </div>

              </div>

              {/* Bottom Disclaimer */}
              <div className="mt-12 lg:mt-16 w-full text-center">
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] text-[#c4d0df] uppercase">
                  One-time use code. By signing up you agree to our <Link href="/privacy" className="underline hover:text-[#9eb5d8] transition-colors">Privacy Policy</Link>. For research use only.
                </p>
              </div>

            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
