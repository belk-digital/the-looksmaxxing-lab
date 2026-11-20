'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { ArrowRight, BadgePercent, Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { safeNextPath, withNext } from '@/lib/auth/safeRedirect'
import { MEMBER_DISCOUNT_PERCENT } from '@/lib/membership/discount'

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
 * Logging in happens right here: an email + password form and "Continue with Google", so the visitor never leaves the
 * page. After a successful password login the popup simply goes away and the page refreshes (the discount and the
 * members-only products appear). Google takes them to Google and brings them straight back to this page.
 *
 * How it is closed: ONLY by the X button, the Escape key (the standard way to close any dialog) or "Maybe later".
 * Clicking outside the card does nothing, and choosing Create account does not count as closing it, so if
 * the visitor comes back without having logged in, it appears again.
 */

// Same wording as the login page, so a wrong password reads the same everywhere.
const LOGIN_ERROR = "Invalid credentials. If you haven't logged in since the upgrade, please reset your password."

const FIELD_CLASS =
  'h-12 w-full shrink-0 rounded-xl border border-ink/15 bg-white px-4 text-base text-ink shadow-sm outline-none transition placeholder:text-ink/35 hover:border-ink/30 focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:opacity-60 short:h-11'
const LABEL_CLASS = 'text-[10px] font-bold uppercase tracking-[0.22em] text-ink/55'

/** Google's own four-colour "G" (brand guidelines ask for it on Google sign-in buttons). */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const BENEFITS = [
  `${MEMBER_DISCOUNT_PERCENT}% member discount on every order`,
  'Members-only products and formats',
  'Order tracking and easy reorders',
  'Faster checkout with saved details',
]

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
  const fieldId = useId()
  const next = safeNextPath(returnTo)
  const router = useRouter()

  // The login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<null | 'password' | 'google'>(null)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    onDismiss()
    setVisible(false)
  }, [onDismiss])

  const logIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy('password')
    setError(null)
    try {
      const result = await signIn('credentials', { email: email.trim(), password, redirect: false })
      if (!result || result.error) {
        setError(LOGIN_ERROR)
        setBusy(null)
        return
      }
      toast.success(`Logged in. Your ${MEMBER_DISCOUNT_PERCENT}% member discount is active.`)
      // Logged in: the popup is simply done. (That is not "closing" it, so no reminder pause is recorded.)
      setVisible(false)
      router.refresh() // the members-only products and the discount show up straight away
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(null)
    }
  }

  const logInWithGoogle = () => {
    if (busy) return
    setBusy('google')
    setError(null)
    // Google takes them away and brings them back to the page they were on.
    void signIn('google', { callbackUrl: next ?? '/' }).catch(() => {
      setError('Could not reach Google. Please try again.')
      setBusy(null)
    })
  }

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
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')
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
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-ink/60 backdrop-blur-[4px] sm:items-center sm:p-6 short:p-2"
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
              className="relative max-h-[92dvh] w-full max-w-[800px] overflow-y-auto overscroll-contain rounded-t-[1.5rem] bg-cream shadow-[0_40px_100px_-30px_rgba(0,0,0,0.65)] outline-none sm:rounded-[1.5rem] short:max-h-[96dvh]"
            >
              {/* Close */}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10 sm:right-4 sm:top-4 short:right-1.5 short:top-1.5 split:border-ink/10 split:text-ink split:hover:bg-ink/5"
              >
                <X size={15} aria-hidden="true" />
              </button>

              <div className="flex flex-col split:flex-row">
              {/* Brand panel: flat ink, fine gold detailing. Compact on phones so the login form is on the first screen. */}
              <div className="bg-ink px-6 pb-5 pt-3 text-cream sm:px-8 split:flex split:w-[46%] split:flex-col split:justify-between split:px-10 split:py-11 short:px-6 short:py-5">
                <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-cream/25 split:hidden" />

                <div>
                  <span className="block font-serif text-[15px] font-bold uppercase tracking-tight text-cream">
                    Longevia Research
                  </span>

                  <div className="mt-4 sm:mt-6 split:mt-14 short:mt-4">
                    <span
                      data-testid="member-discount-pill"
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-gold/45 bg-gold/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-gold-light"
                    >
                      <BadgePercent size={13} strokeWidth={1.75} aria-hidden="true" />
                      {MEMBER_DISCOUNT_PERCENT}% member discount
                    </span>
                  </div>

                  <h2
                    id={titleId}
                    style={{ fontFamily: DISPLAY_FONT }}
                    className="mt-3 text-balance text-[1.7rem] font-normal leading-[1.08] tracking-[-0.01em] sm:mt-4 sm:text-[2rem] split:text-[2.1rem] lg:text-[2.4rem]"
                  >
                    Unlock the full catalogue.
                  </h2>
                  <p id={descriptionId} className="mt-4 hidden max-w-[32ch] text-[13px] leading-relaxed text-cream/60 sm:block short:hidden">
                    Log in or create a free account to see everything we offer, plus {MEMBER_DISCOUNT_PERCENT}% off every order.
                  </p>
                </div>

                <ul className="mt-10 hidden split:block short:hidden">
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

              {/* Action panel: log in right here */}
              <div className="flex flex-col justify-center gap-4 px-6 pb-8 pt-6 sm:gap-5 sm:px-9 split:w-[54%] split:px-9 split:py-12 lg:px-12 short:gap-3 short:pb-5 short:pr-12 short:pt-4">
                {/* On phones the invitation above already says this; showing it twice only makes the sheet taller. */}
                <div className="hidden split:block short:hidden">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/45">Member discount</span>
                  <p className="mt-3 text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">
                    Take {MEMBER_DISCOUNT_PERCENT}% off every order
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">Log in and your discount is applied at checkout. It can&apos;t be combined with other discounts.</p>
                </div>

                <button
                  type="button"
                  onClick={logInWithGoogle}
                  disabled={busy !== null}
                  data-testid="google-login"
                  className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-3 rounded-full border border-ink/20 bg-white text-sm font-semibold text-ink shadow-sm short:h-11 transition hover:border-ink/40 hover:bg-ink/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === 'google' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleMark />}
                  {busy === 'google' ? 'Opening Google...' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-ink/10" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/35">or</span>
                  <span className="h-px flex-1 bg-ink/10" />
                </div>

                <form onSubmit={logIn} data-testid="login-form" className="flex shrink-0 flex-col gap-4 short:gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${fieldId}-email`} className={LABEL_CLASS}>
                      Email
                    </label>
                    <input
                      id={`${fieldId}-email`}
                      type="email"
                      name="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (error) setError(null)
                      }}
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={busy !== null}
                      placeholder="you@example.com"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor={`${fieldId}-password`} className={LABEL_CLASS}>
                        Password
                      </label>
                      <Link
                        href={withNext('/forgot-password', next)}
                        prefetch={false}
                        className="text-xs font-medium text-ink/55 underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id={`${fieldId}-password`}
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          if (error) setError(null)
                        }}
                        autoComplete="current-password"
                        required
                        disabled={busy !== null}
                        placeholder="Your password"
                        className={`${FIELD_CLASS} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((shown) => !shown)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
                      >
                        {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" data-testid="login-error" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="group inline-flex h-14 w-full shrink-0 items-center justify-center gap-3 rounded-full bg-ink text-[10px] font-bold uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ink-soft short:h-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy === 'password' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log in
                        <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="flex flex-col items-center gap-2 text-sm text-ink/60">
                  <p>
                    New here?{' '}
                    <Link
                      href={withNext('/register', next)}
                      prefetch={false}
                      className="font-semibold text-ink underline underline-offset-4 transition-colors hover:text-ink/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      Create free account
                    </Link>
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="text-xs font-medium text-ink/50 underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
