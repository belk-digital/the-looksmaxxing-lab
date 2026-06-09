'use client'

import React from 'react'
import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center bg-[#050505] overflow-hidden selection:bg-purple-500/30">
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_80%)]" />
        
        {/* Glowing Orb 1 */}
        <motion.div 
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
        
        {/* Glowing Orb 2 */}
        <motion.div 
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          {/* Glassmorphism Card Backdrop */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.5)] z-0" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="inline-block p-3 rounded-2xl bg-white/[0.05] border border-white/[0.05] mb-6 shadow-inner relative overflow-hidden group-hover:border-purple-500/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 font-serif text-2xl font-bold text-white tracking-tighter">TL<span className="text-purple-400">ML</span></div>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
              <p className="text-gray-400 text-sm">Enter your credentials to access the lab.</p>
            </div>
            
            <div className="flex justify-center w-full">
              <SignIn 
                path="/login"
                routing="path"
                signUpUrl="/register"
                appearance={{
                  variables: {
                    colorPrimary: '#8b5cf6', // Violet
                    colorText: '#f3f4f6', 
                    colorBackground: 'transparent',
                    colorInputBackground: 'rgba(255,255,255,0.03)',
                    colorInputText: '#ffffff',
                    borderRadius: '0.75rem',
                    fontFamily: 'inherit',
                    colorTextOnPrimaryBackground: '#ffffff',
                    colorNeutral: '#f3f4f6',
                  },
                  elements: {
                    rootBox: 'w-full flex justify-center',
                    cardBox: 'shadow-none bg-transparent',
                    card: 'bg-transparent shadow-none w-full p-0 m-0 gap-6 border-none ring-0',
                    header: 'hidden',
                    footerAction: 'justify-center mt-6',
                    footerActionText: 'text-sm text-gray-400',
                    footerActionLink: 'text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors',
                    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white w-full rounded-xl h-12 text-sm font-bold uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]',
                    formFieldInput: 'border-white/[0.1] focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 bg-white/[0.03] h-12 text-white rounded-xl placeholder:text-gray-600 backdrop-blur-sm transition-all',
                    formFieldLabel: 'text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2',
                    dividerLine: 'bg-white/[0.1]',
                    dividerText: 'text-xs font-medium uppercase tracking-wider text-gray-500',
                    socialButtonsBlockButton: 'border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.06] h-12 rounded-xl transition-all relative overflow-hidden group/btn',
                    socialButtonsBlockButtonText: 'text-sm font-medium text-white relative z-10',
                    socialButtonsBlockButtonArrow: 'text-white relative z-10',
                    formFieldAction: 'text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors',
                    identityPreview: 'bg-white/[0.05] border border-white/[0.1] rounded-xl text-white',
                    identityPreviewText: 'text-white',
                    identityPreviewEditButton: 'text-gray-400 hover:text-white transition-colors',
                    footer: 'hidden',
                  }
                }} 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
