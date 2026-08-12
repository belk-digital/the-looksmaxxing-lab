'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLenis } from 'lenis/react'

interface AgeVerificationGateProps {
  initialVerified: boolean
}

export function AgeVerificationGate({ initialVerified }: AgeVerificationGateProps) {
  const [isVerified, setIsVerified] = useState(initialVerified)
  const [isDenied, setIsDenied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [ageChecked, setAgeChecked] = useState(false)
  const [researcherChecked, setResearcherChecked] = useState(false)

  const lenis = useLenis()

  useEffect(() => {
    setMounted(true)

    // Fallback: if server missed the cookie (e.g., during OAuth redirect with SameSite=Strict previously), check localStorage
    if (!initialVerified && localStorage.getItem('longevia_age_verified') === 'true') {
      setIsVerified(true)
      // Repair the cookie with Lax so it works during OAuth redirects
      document.cookie = "longevia_age_verified=true; path=/; max-age=31536000; SameSite=Lax"
    }

    const shouldLock = !isVerified && localStorage.getItem('longevia_age_verified') !== 'true'

    if (shouldLock) {
      document.body.style.overflow = 'hidden'
      lenis?.stop()
    } else {
      document.body.style.overflow = ''
      lenis?.start()
    }

    return () => {
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [isVerified, lenis])

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
          exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.65, 0, 0.35, 1] } }}
          className="fixed inset-0 z-[99999] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          data-lenis-prevent
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-full max-w-2xl my-auto rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col md:flex-row"
          >
            {/* Brand Panel */}
            <div className="w-full md:w-2/5 bg-ink text-cream p-8 flex flex-col justify-between shrink-0">
              <div>
                <span className="font-serif text-lg font-bold tracking-tighter uppercase text-cream block mb-6">
                  Longevia Research
                </span>
                <h2 className="font-display text-2xl leading-snug mb-3">
                  US-manufactured, research-grade peptides.
                </h2>
                <p className="text-xs text-cream/60 leading-relaxed">
                  You must be 21 years of age or older to enter. Please confirm the statements to continue.
                </p>
              </div>

              <ul className="hidden md:flex flex-col gap-3 mt-8">
                {[
                  'Independent 3rd-party HPLC testing',
                  '≥99% purity standard',
                  'Manufactured in the United States',
                  'COA provided with every order',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-cream/80">
                    <svg className="w-3.5 h-3.5 text-cream shrink-0" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form Panel */}
            <div className="w-full md:w-3/5 p-8 flex flex-col justify-center">
              {!isDenied ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-ink-muted font-medium">
                    Please confirm before entering
                  </span>

                  <div className="flex flex-col gap-4 w-full text-left mt-4 mb-6">
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
                      <span className="text-sm text-ink group-hover:text-ink/80 transition-colors leading-snug">I am a qualified researcher purchasing for laboratory research only - not for human or veterinary use.</span>
                    </label>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={!ageChecked || !researcherChecked}
                    className="bg-ink text-cream px-8 py-3.5 rounded-md font-sans text-sm tracking-widest uppercase hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg w-full mb-5"
                  >
                    Enter Longevia Research
                  </button>

                  <p className="text-[10px] text-ink-muted/80 leading-relaxed mb-4">
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
                  className="flex flex-col items-center text-center"
                >
                  <h2 className="font-display text-2xl text-error mb-3">
                    Access Denied
                  </h2>
                  <p className="text-body-sm text-ink-muted">
                    You must be a qualified researcher of legal age to access this site. Please close this window.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
