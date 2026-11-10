'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { ArrowRight, Check, X } from 'lucide-react'
import { safeNextPath, withNext } from '@/lib/auth/safeRedirect'

/**
 * The popup shown to logged-out visitors: "log in to see the full catalogue".
 * Loaded on demand by LoginPrompt (never part of the first page load).
 *
 * Design: restrained and editorial. A flat ink panel with fine gold detailing (the site's own ink / cream / gold
 * palette), a Bodoni headline that echoes the brand wordmark, hairline dividers, pill buttons with wide-tracked
 * capitals. No gradients, glows or blurred shapes. A centred card on desktop, a bottom sheet on phones.
 * Accessible: a real dialog (focus moves in, Tab stays inside, Escape closes, focus returns afterwards), and
 * all motion is switched off for people who prefer reduced motion.
 *
 * How it is closed: ONLY by the X button, the Escape key (the standard way to close any dialog) or "Maybe later".
 * Clicking outside the card does nothing, and choosing Log in / Create account does not count as closing it, so if
 * the visitor comes back without having logged in, it appears again.
 */

const BENEFITS = ['Nasal spray formats', 'Order tracking and easy reorders', 'Faster checkout with saved details']

// The site's `font-display` class does not currently produce Bodoni (its font list contains an unquoted
// "Bodoni 72", which is invalid CSS, so browsers drop the whole rule). The popup asks for Bodoni explicitly.
const DISPLAY_FONT = 'var(--font-display), "Bodoni 72", Didot, "Times New Roman", serif'

type Props = {
  /** The page the visitor is on; they are brought back here after logging in. */
  returnTo: string | null
  /** Called whenever the popup is closed in any way, so it can stay away for a while. */
  onDismiss: () => void
  /** Called once the closing animation has finished, so the parent can remove it. */
  onClosed: () => void
}

export default function LoginPromptModal({ returnTo, onDismiss, onClosed }: Props) {
  const [visible, setVisible] = useState(true)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lenis = useLenis()
  const titleId = useId()
  const descriptionId = useId()
  const next = safeNextPath(returnTo)

  const close = useCallback(() => {
    onDismiss()
    setVisible(false)
  }, [onDismiss])

  // Lock the page behind the popup (same approach as the age gate), move focus in, and restore both afterwards.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    // Hiding the scrollbar (which is what stops the page scrolling) makes the page behind widen by the scrollbar's
    // width on computers with permanent scrollbars. Padding the body by that same width keeps the content where it
    // was. (Phones and Macs with overlay scrollbars have no such gap, so nothing is added there.)
    // (`scrollbar-gutter: stable` was tried first and measured in a real browser: it does not stop this jump.)
    const scrollbarWidth = window.innerWidth - root.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0 && scrollbarWidth < 50) {
      const currentPadding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }
    lenis?.stop()
    // Focus goes to the dialog itself: screen readers announce it by name, keyboard users press Tab to reach the
    // buttons, and nobody (touch or mouse) gets a focus ring on a button they did not choose.
    dialogRef.current?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
      lenis?.start()
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [lenis])

  // Escape closes it, wherever the focus happens to be.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  // Keep Tab inside the popup.
  const trapTab = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    // Shift+Tab from the dialog itself (where focus starts) wraps round to the last control instead of escaping.
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={onClosed}>
        {visible && (
          <motion.div
            key="login-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onKeyDown={trapTab}
            data-lenis-prevent
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-ink/60 backdrop-blur-[4px] sm:items-center sm:p-6"
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              className="relative flex max-h-[92dvh] w-full max-w-[800px] flex-col overflow-y-auto rounded-t-[1.5rem] bg-cream shadow-[0_40px_100px_-30px_rgba(0,0,0,0.65)] outline-none sm:rounded-[1.5rem] md:flex-row md:overflow-hidden"
            >
              {/* Close */}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10 md:border-ink/10 md:text-ink md:hover:bg-ink/5"
              >
                <X size={15} aria-hidden="true" />
              </button>

              {/* Brand panel: flat ink, fine gold detailing */}
              <div className="bg-ink px-7 pb-8 pt-4 text-cream md:flex md:w-[46%] md:flex-col md:justify-between md:px-10 md:py-11">
                <span aria-hidden="true" className="mx-auto mb-5 block h-1 w-10 rounded-full bg-cream/25 md:hidden" />

                <div>
                  <span className="block font-serif text-[15px] font-bold uppercase tracking-tight text-cream">
                    Longevia Research
                  </span>

                  <div className="mt-9 flex items-center gap-3 md:mt-14">
                    <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-light">
                      Members catalogue
                    </span>
                  </div>

                  <h2
                    id={titleId}
                    style={{ fontFamily: DISPLAY_FONT }}
                    className="mt-4 text-balance text-[2rem] font-normal leading-[1.06] tracking-[-0.01em] md:text-[2.1rem] lg:text-[2.4rem]"
                  >
                    Unlock the full catalogue.
                  </h2>
                  <p id={descriptionId} className="mt-4 max-w-[32ch] text-[13px] leading-relaxed text-cream/60">
                    Log in or create a free account to browse every compound and format we offer, including our nasal sprays.
                  </p>
                </div>

                <ul className="mt-10 hidden md:block">
                  {BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-3 border-t border-cream/10 py-3.5 text-xs tracking-wide text-cream/80 last:border-b"
                    >
                      <Check size={14} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-gold" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action panel */}
              <div className="flex flex-col justify-center gap-7 px-7 pb-9 pt-8 sm:px-9 md:w-[54%] md:px-12 md:py-14">
                {/* On phones the invitation above already says this; showing it twice only makes the sheet taller. */}
                <div className="hidden md:block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/45">Free account</span>
                  <p className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-ink">
                    See everything we offer
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">
                    Already a customer? Log in and pick up where you left off. New here? Creating an account takes under a minute.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={withNext('/login', next)}
                    prefetch={false}
                    className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-ink text-[10px] font-bold uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Log in
                    <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={withNext('/register', next)}
                    prefetch={false}
                    className="inline-flex h-14 w-full items-center justify-center rounded-full border border-ink/25 text-[10px] font-bold uppercase tracking-[0.25em] text-ink transition-colors hover:border-ink hover:bg-ink/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Create free account
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    className="mx-auto mt-1 text-xs font-medium text-ink/50 underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
