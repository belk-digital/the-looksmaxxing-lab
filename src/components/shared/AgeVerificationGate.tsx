'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Image from 'next/image'

interface AgeVerificationGateProps {
  initialVerified: boolean
}

export function AgeVerificationGate({ initialVerified }: AgeVerificationGateProps) {
  const [isVerified, setIsVerified] = useState(initialVerified)
  const [isDenied, setIsDenied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isVerified) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isVerified])

  const handleVerify = () => {
    document.cookie = "looksmaxxing_age_verified=true; path=/; max-age=31536000; SameSite=Strict"
    localStorage.setItem('looksmaxxing_age_verified', 'true')
    
    setIsVerified(true)
    document.body.style.overflow = ''
  }

  const handleDeny = () => {
    setIsDenied(true)
  }

  if (initialVerified) return null

  return (
    <AnimatePresence>
      {!isVerified && mounted && (
        <motion.div
          key="age-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] } }}
          className="fixed inset-0 z-[99999] bg-cream flex flex-col md:flex-row overflow-hidden"
        >
          {/* Image Section */}
          <div className="relative w-full h-[35vh] md:h-full md:w-1/2 flex-shrink-0">
            <Image 
              src="/Featured Images/vials-on-magazine.webp" 
              alt="Research Laboratory" 
              fill 
              priority
              quality={100}
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-ink/10" />
            
            {/* Mobile-only subtle gradient to blend into cream background below */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent md:hidden" />
          </div>
          
          {/* Content Section */}
          <div className="w-full h-[65vh] md:h-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 text-center overflow-y-auto">
            <div className="max-w-xl w-full flex flex-col items-center">
              <div className="mb-8 md:mb-12">
                <span className="font-display text-xl sm:text-2xl tracking-widest uppercase text-ink">
                  The Looksmaxxing Lab
                </span>
              </div>
              
              {!isDenied ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="flex flex-col items-center w-full"
                >
                  <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-ink mb-4 sm:mb-6 leading-tight">
                    Are you 21 years<br className="hidden sm:block"/> of age or older?
                  </h1>
                  
                  <p className="text-body-sm sm:text-body-md text-ink-muted mb-8 sm:mb-12 max-w-md mx-auto">
                    This site offers research-grade peptides intended solely for laboratory research by qualified professionals. By entering, you confirm you are at least 21 years of age and agree to our Terms of Service.
                  </p>
                  
                  <div className="flex flex-col w-full sm:flex-row gap-4 sm:w-auto">
                    <button
                      onClick={handleVerify}
                      className="bg-ink text-cream px-8 sm:px-10 py-4 rounded-md font-sans text-sm tracking-widest uppercase hover:bg-ink-soft transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto flex-1"
                    >
                      Yes, I am 21+
                    </button>
                    <button
                      onClick={handleDeny}
                      className="bg-transparent text-ink-muted border border-border px-8 sm:px-10 py-4 rounded-md font-sans text-sm tracking-widest uppercase hover:text-ink hover:border-ink transition-all duration-300 w-full sm:w-auto flex-1"
                    >
                      No, I am under 21
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <h2 className="font-display text-3xl sm:text-4xl text-error mb-4">
                    Access Denied
                  </h2>
                  <p className="text-body-md text-ink-muted max-w-md mx-auto">
                    You must be 21 years of age or older to access this site and purchase our research compounds. Please close this window.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
