'use client'

import React from 'react'
import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-black/10">
      
      {/* Left Column - Imagery / Branding */}
      <div className="w-full lg:w-[45%] relative min-h-[30vh] lg:min-h-screen order-first lg:order-none flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden">
        
        {/* Background Image */}
        <Image 
          src="/img-1.webp"
          alt="Laboratory Background"
          fill
          className="object-cover object-center z-0"
          priority
        />
        
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

        {/* Top Logo / Back */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:opacity-80 transition-opacity drop-shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return
          </Link>
          <div className="font-serif text-xl font-bold tracking-tighter text-white drop-shadow-sm">TLML</div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-sm mt-12 lg:mt-0 drop-shadow-md">
          <h2 className="text-[10px] font-bold text-white/80 tracking-[0.25em] uppercase mb-6">
            Portal Access
          </h2>
          <h1 className={`text-4xl lg:text-5xl leading-[1.1] font-bold tracking-tighter text-white mb-6 ${spaceGrotesk.className}`}>
            Welcome back to the laboratory.
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Sign in to access your account, manage your subscriptions, and explore premium research materials.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          <div className="flex flex-col items-center justify-center w-full">
            <SignIn 
              path="/login"
              routing="path"
              signUpUrl="/register"
              forceRedirectUrl="/account"
              appearance={{
                variables: {
                  colorPrimary: '#000000', 
                  colorText: '#000000', 
                  colorBackground: '#ffffff',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#000000',
                  borderRadius: '0px',
                  fontFamily: 'inherit',
                  colorTextOnPrimaryBackground: '#ffffff',
                },
                elements: {
                  rootBox: 'w-full flex justify-center !overflow-visible',
                  cardBox: 'shadow-none bg-transparent !overflow-visible',
                  card: 'bg-white shadow-none w-full p-0 m-0 border-none ring-0 !overflow-visible',
                  headerTitle: `text-2xl font-bold tracking-tight text-black mb-1 ${spaceGrotesk.className}`,
                  headerSubtitle: 'text-sm text-gray-500 mb-4',
                  footerAction: 'justify-center mt-8',
                  footerActionText: 'text-[11px] text-gray-500 uppercase tracking-widest',
                  footerActionLink: 'text-[11px] text-black font-bold uppercase tracking-widest hover:underline transition-all',
                  formButtonPrimary: 'bg-black hover:bg-gray-900 text-white w-full rounded-none h-14 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center mt-4',
                  formFieldInput: 'border border-gray-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white h-14 text-black rounded-none placeholder:text-gray-400 transition-all px-4 shadow-none',
                  formFieldLabel: 'text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800 mb-1',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 px-4',
                  socialButtonsBlockButton: 'border border-gray-200 bg-white hover:bg-gray-50 h-14 rounded-none transition-colors mb-4 relative !overflow-visible',
                  socialButtonsBlockButtonText: 'text-xs font-bold text-black tracking-wide',
                  formFieldAction: 'text-black hover:underline text-[10px] font-bold uppercase tracking-[0.1em] transition-all',
                  identityPreview: 'bg-gray-50 border border-gray-200 rounded-none text-black p-4 mb-4',
                  identityPreviewText: 'text-sm font-medium text-black',
                  identityPreviewEditButton: 'text-gray-500 hover:text-black transition-colors',
                  footer: 'hidden', // Completely hides the Clerk branding and default links
                }
              }} 
            />
            
            {/* Custom Footer without branding */}
            <div className="mt-8 text-center border-t border-gray-100 pt-8 w-full max-w-[400px]">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Don&apos;t have an account? </span>
              <Link href="/register" className="text-[10px] text-black font-bold uppercase tracking-widest hover:underline transition-all">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
