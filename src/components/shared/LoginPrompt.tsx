'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LOGIN_PROMPT_MAX_RETRIES,
  LOGIN_PROMPT_PRELOAD_LEAD_MS,
  LOGIN_PROMPT_RETRY_MS,
  countPageView,
  isPromptPath,
  markPromptClosed,
  markPromptShown,
  pickPromptDelay,
  shouldOfferLoginPrompt,
} from '@/lib/access/loginPrompt'
import { isRestrictionEnabled } from '@/lib/access/restrictedProducts'

/**
 * "Log in to see the full catalogue" popup for logged-out visitors (nasal sprays are for logged-in customers).
 *
 * It can appear on any page, a random 6-12 seconds after the page has finished loading (a new random delay on every
 * page), as a gentle reminder: up to 3 times per browsing session, and once the visitor has closed it, it stays away
 * for the next couple of pages and a few minutes (see src/lib/access/loginPrompt.ts for the numbers). It does not
 * wait for a scroll or a click.
 *
 * Kept clear of page speed:
 *  - This file is the only part that ships with every page. It is tiny: no animation library, no icons, no event
 *    listeners, and it renders nothing at all until the popup is shown, so the page's HTML and first paint are
 *    untouched.
 *  - The timer only starts once the page has fully loaded, and the popup's own code (LoginPromptModal) is a separate
 *    download that starts about 2 seconds before the popup is due.
 *  - Nothing is scheduled for logged-in visitors, excluded pages (sign-in, basket, checkout, account...) or when the
 *    restriction is switched off.
 */
const LoginPromptModal = dynamic(() => import('@/components/shared/LoginPromptModal'), { ssr: false })

type Store = Pick<Storage, 'getItem' | 'setItem'>

// Some privacy settings block sessionStorage. Then "closed" and the reminder counts are kept in memory instead, so
// they still hold while the visitor moves between pages (a full reload forgets them, which is fine).
const memory = new Map<string, string>()
const memoryStore: Store = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => void memory.set(key, value) }

function getStore(kind: 'localStorage' | 'sessionStorage'): Store | null {
  try {
    return window[kind]
  } catch {
    return kind === 'sessionStorage' ? memoryStore : null // localStorage blocked: behave as if it were empty
  }
}

// Another modal (or a scroll lock such as the age gate's) is up: do not stack on top of it.
function anotherDialogIsOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')) || document.body.style.overflow === 'hidden'
}

export function LoginPrompt() {
  const { status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // `skipAgeGate: true` answers "could it EVER appear on this page?" (closed, logged in, excluded page: no);
  // `false` answers "may it appear right now?" (the age-verification gate must be passed first).
  const check = useCallback(
    (skipAgeGate: boolean) =>
      shouldOfferLoginPrompt({
        authStatus: status,
        pathname,
        local: getStore('localStorage'),
        session: getStore('sessionStorage'),
        now: Date.now(),
        skipAgeGate,
      }),
    [status, pathname],
  )

  // Every page the visitor views counts towards the popup's next reminder, but only once they have closed it.
  // This effect is declared before the scheduling one below on purpose: React runs effects in order, so the page is
  // already counted by the time the scheduler decides whether the popup may appear on it.
  useEffect(() => {
    countPageView(getStore('sessionStorage'))
  }, [pathname])

  useEffect(() => {
    if (open) return
    // Cheap exits first: nothing is scheduled for logged-in visitors, excluded pages, or when switched off.
    if (status !== 'unauthenticated' || !isPromptPath(pathname) || !isRestrictionEnabled()) return
    // And nothing is scheduled when it cannot appear on this page anyway (capped, or closed too recently).
    if (!check(true)) return

    let cancelled = false
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const begin = () => {
      const delay = pickPromptDelay() // a fresh random delay on every page

      // Start downloading the popup's code a couple of seconds before it is due, so it is ready on time.
      later(() => void import('@/components/shared/LoginPromptModal'), Math.max(0, delay - LOGIN_PROMPT_PRELOAD_LEAD_MS))

      const attempt = (retriesLeft: number) => {
        if (!check(true)) return // it can never show here (closed, logged in...): nothing to wait for
        // Not right now: the age gate is still up, another dialog is open, or this tab is in the background.
        // Keep checking, and appear as soon as the way is clear.
        if (!check(false) || document.visibilityState !== 'visible' || anotherDialogIsOpen()) {
          if (retriesLeft > 0) later(() => attempt(retriesLeft - 1), LOGIN_PROMPT_RETRY_MS)
          return
        }
        // Appearing counts towards the per-session cap. (Leaving the page without closing it is not a close, so it
        // can remind them again on the next page, until that cap is reached.)
        const show = () => {
          if (cancelled) return // the visitor moved on while it was waiting for an idle moment
          markPromptShown(getStore('sessionStorage'))
          setOpen(true)
        }
        if ('requestIdleCallback' in window) window.requestIdleCallback(show, { timeout: 1500 })
        else show()
      }
      later(() => attempt(LOGIN_PROMPT_MAX_RETRIES), delay)
    }

    // The delay counts from when the page has finished loading.
    if (document.readyState === 'complete') begin()
    else window.addEventListener('load', begin, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', begin)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [status, pathname, open, check])

  // Moving to another page takes it off the screen. That is NOT the visitor closing it, so it is not remembered as
  // closed: it may remind them again on the next page (after a fresh random delay), within the session cap.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // The visitor closed it with the X, Escape or "Maybe later". (Clicking outside does nothing, and choosing Log in /
  // Create account is not a close: if they come back without logging in, it appears again.)
  const handleDismiss = useCallback(
    () => markPromptClosed(getStore('localStorage'), getStore('sessionStorage'), Date.now()),
    [],
  )
  const handleClosed = useCallback(() => setOpen(false), [])

  if (!open) return null
  return <LoginPromptModal returnTo={pathname} onDismiss={handleDismiss} onClosed={handleClosed} />
}
