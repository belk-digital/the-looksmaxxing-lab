'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { toast } from 'sonner'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error('Network response was not ok')
      }

      setIsSuccess(true)
    } catch (error) {
      toast.error('An error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-black/10">
      
      {/* Left Column - Imagery / Branding */}
      <div className="w-full lg:w-[45%] relative min-h-[30vh] lg:min-h-screen order-first lg:order-none flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden">
        
        {/* Background Image */}
        <Image 
          src="/New Images/vials-on-magazine.webp"
          alt="Longevia Research"
          fill
          className="object-cover object-center z-0"
          priority
        />
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

        {/* Top Logo / Back */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/login" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:opacity-80 transition-opacity drop-shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <div className="font-serif text-xl font-bold tracking-tighter text-white drop-shadow-sm">Longevia</div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-sm mt-12 lg:mt-0 drop-shadow-md">
          <h2 className="text-[10px] font-bold text-white/80 tracking-[0.25em] uppercase mb-6">
            Account Recovery
          </h2>
          <h1 className={`text-4xl lg:text-5xl leading-[1.1] font-bold tracking-tighter text-white mb-6 ${spaceGrotesk.className}`}>
            Lost your credentials?
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Enter your email address and we will send you a secure link to reset your password and regain access to the laboratory.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-[420px] flex flex-col">
          <h2 className={`text-2xl font-bold tracking-tight text-black mb-1 ${spaceGrotesk.className}`}>
            Reset Password
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Remembered it? <Link href="/login" className="text-black font-bold hover:underline transition-all">Sign In</Link>
          </p>
          
          {isSuccess ? (
            <div className="bg-gray-50 border border-gray-200 p-8 flex flex-col items-center text-center">
              <svg className="w-12 h-12 text-black mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className={`text-lg font-bold mb-2 ${spaceGrotesk.className}`}>Check your inbox</h3>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for that email, we have sent a password reset link. Please check your spam folder if you don't see it.
              </p>
              <Link href="/login" className="text-xs font-bold uppercase tracking-[0.2em] text-black hover:underline">
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800 mb-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border border-gray-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white h-14 text-black rounded-none transition-all px-4"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-gray-900 disabled:opacity-50 text-white w-full rounded-none h-14 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center mt-4"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
