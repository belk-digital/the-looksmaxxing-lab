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
  
  const [ageChecked, setAgeChecked] = useState(false)
  const [researcherChecked, setResearcherChecked] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Fallback: if server missed the cookie (e.g., during OAuth redirect with SameSite=Strict previously), check localStorage
    if (!initialVerified && localStorage.getItem('longevia_age_verified') === 'true') {
      setIsVerified(true)
      // Repair the cookie with Lax so it works during OAuth redirects
      document.cookie = "longevia_age_verified=true; path=/; max-age=31536000; SameSite=Lax"
    }

    if (!isVerified && localStorage.getItem('longevia_age_verified') !== 'true') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isVerified])

  const handleVerify = () => {
    if (!ageChecked || !researcherChecked) return;
    
    document.cookie = "longevia_age_verified=true; path=/; max-age=31536000; SameSite=Lax"
    localStorage.setItem('longevia_age_verified', 'true')
    
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
              alt="Longevia Research peptide vials displayed on an open longevity-science magazine spread"
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
              <div className="mb-8 md:mb-12 mt-12 md:mt-0">
                <span className="font-display text-xl sm:text-2xl tracking-widest uppercase text-ink">
                  Longevia Research
                </span>
              </div>
              
              {!isDenied ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="flex flex-col items-center w-full"
                >
                  <h1 className="font-display text-3xl sm:text-5xl text-ink mb-4 sm:mb-6 leading-tight">
                    Research Verification
                  </h1>
                  
                  <p className="text-body-sm sm:text-body-md text-ink-muted mb-8 max-w-md mx-auto">
                    Longevia Research sells research peptides exclusively to qualified researchers and laboratories for in vitro and laboratory use. Please confirm before continuing.
                  </p>
                  
                  <div className="flex flex-col gap-5 w-full max-w-md text-left mb-8">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={ageChecked}
                          onChange={(e) => setAgeChecked(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-border rounded-sm peer-checked:bg-ink peer-checked:border-ink transition-colors"></div>
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-ink group-hover:text-ink/80 transition-colors">I am at least 21 years of age</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={researcherChecked}
                          onChange={(e) => setResearcherChecked(e.target.checked)}
                        />
                        <div className="w-5 h-5 border-2 border-border rounded-sm peer-checked:bg-ink peer-checked:border-ink transition-colors"></div>
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-ink group-hover:text-ink/80 transition-colors leading-snug">I confirm I am a qualified researcher purchasing for in vitro / laboratory research only - not for human or veterinary use.</span>
                    </label>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={!ageChecked || !researcherChecked}
                    className="bg-ink text-cream px-8 py-4 rounded-md font-sans text-sm tracking-widest uppercase hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg w-full max-w-md mb-6"
                  >
                    Enter Longevia Research
                  </button>

                  <p className="text-[10px] text-ink-muted/80 max-w-md text-left leading-relaxed mb-6">
                    By proceeding you affirm the statements above are true. Products are not for human or veterinary use, not for diagnostic procedures, and have not been evaluated by the Food and Drug Administration. You accept responsibility for proper handling and storage and agree to hold Longevia Research harmless of any misuse.
                  </p>

                  <button
                    onClick={handleDeny}
                    className="text-xs text-ink-muted hover:text-ink underline underline-offset-4 transition-colors"
                  >
                    Not a researcher? Exit
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <h2 className="font-display text-3xl sm:text-4xl text-error mb-4 mt-12">
                    Access Denied
                  </h2>
                  <p className="text-body-md text-ink-muted max-w-md mx-auto">
                    You must be a qualified researcher of legal age to access this site. Please close this window.
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
