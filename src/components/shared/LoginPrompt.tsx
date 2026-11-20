'use client'

import React, { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LOGIN_PROMPT_AFTER_INTERACTION_MS,
  LOGIN_PROMPT_MAX_RETRIES,
  LOGIN_PROMPT_PRELOAD_LEAD_MS,
  LOGIN_PROMPT_RETRY_MS,
  countPageView,
  isPromptPath,
  markPromptClosed,
  markPromptShown,
  pickPromptDelay,
  popupCouldBecomeLcp,
  shouldOfferLoginPrompt,
} from '@/lib/access/loginPrompt'
import { isRestrictionEnabled } from '@/lib/access/restrictedProducts'
import { onLoginPromptRequested } from '@/lib/access/loginPromptBus'

/**
 * "Log in to see the full catalogue" popup for logged-out visitors (nasal sprays are for logged-in customers).
 *
 * It can appear on any page, a random 6-12 seconds after the page has finished loading (a new random delay on every
 * page), as a gentle reminder: up to 3 times per browsing session, and once the visitor has closed it, it stays away
 * for the next couple of pages and a few minutes (see src/lib/access/loginPrompt.ts for the numbers). It does not
 * normally wait for a scroll or a click. The one exception is a page whose own biggest item is smaller than the
 * popup's biggest text block (see LOGIN_PROMPT_LCP_GUARD_PX): there it waits for the visitor's first interaction, so
 * the popup can never become that page's Largest Contentful Paint.
 *
 * Kept clear of page speed:
 *  - This file is the only part that ships with every page. It is tiny: no animation library, no icons, no event
 *    listeners (until, on a nearly empty page, it has to wait for a first interaction), and it renders nothing at
 *    all until the popup is shown, so the page's HTML and first paint are untouched.
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

// What ends Chrome's measuring of the page's LCP: the visitor's first click, tap, key press or scroll.
// (`wheel` and `touchstart` stand in for "scroll": they only fire when the visitor does it, never for page-made scrolls.)
const INPUT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

/**
 * The size (px²) of the page's biggest contentful item so far: 0 if it has none yet, or null when this browser does
 * not measure LCP (then no score is at stake). Only asked at the moment the popup is due, never while the page loads.
 * Any hiccup answers null, i.e. "show it": a broken measurement must not stop the popup from ever appearing.
 */
export function readLargestContentfulPaintSize(): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      if (typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        return resolve(null)
      }
      let largest = 0
      const take = (entries: PerformanceEntryList) => {
        for (const entry of entries) largest = Math.max(largest, (entry as PerformanceEntry & { size?: number }).size ?? 0)
      }
      const observer = new PerformanceObserver((list) => take(list.getEntries()))
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      // The entries recorded so far are handed over in the next moment or two.
      window.setTimeout(() => {
        take(observer.takeRecords())
        observer.disconnect()
        resolve(largest)
      }, 100)
    } catch {
      resolve(null)
    }
  })
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
    const cleanups: Array<() => void> = []
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const begin = () => {
      const delay = pickPromptDelay() // a fresh random delay on every page

      // Start downloading the popup's code a couple of seconds before it is due, so it is ready on time.
      later(() => void import('@/components/shared/LoginPromptModal'), Math.max(0, delay - LOGIN_PROMPT_PRELOAD_LEAD_MS))

      // Appearing counts towards the per-session cap. (Leaving the page without closing it is not a close, so it
      // can remind them again on the next page, until that cap is reached.)
      const show = () => {
        if (cancelled) return // the visitor moved on while it was waiting for an idle moment
        markPromptShown(getStore('sessionStorage'))
        setOpen(true)
      }
      const reveal = () => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(show, { timeout: 1500 })
        else show()
      }

      const attempt = (retriesLeft: number, interacted = false) => {
        if (!check(true)) return // it can never show here (closed, logged in...): nothing to wait for
        // Not right now: the age gate is still up, another dialog is open, or this tab is in the background.
        // Keep checking, and appear as soon as the way is clear.
        if (!check(false) || document.visibilityState !== 'visible' || anotherDialogIsOpen()) {
          // (Getting past the age gate takes a click, which already ended Chrome's measuring of the page's LCP.)
          const ageGateUp = !check(false)
          if (retriesLeft > 0) later(() => attempt(retriesLeft - 1, interacted || ageGateUp), LOGIN_PROMPT_RETRY_MS)
          return
        }
        // Once the visitor has interacted, Chrome has stopped measuring the page's LCP: nothing left to protect.
        if (interacted) return reveal()

        // Otherwise, make sure the popup cannot take over as the page's Largest Contentful Paint. If the page's own
        // biggest item is bigger than anything in the popup, there is nothing to worry about: appear now. If it is
        // smaller (a nearly empty page), wait for the visitor's first scroll / click / tap / key press, which ends
        // the measuring, and appear a moment after it.
        void readLargestContentfulPaintSize().then((size) => {
          if (cancelled) return
          if (!popupCouldBecomeLcp(size)) return reveal()
          const onInput = () => {
            stopListening()
            later(() => attempt(LOGIN_PROMPT_MAX_RETRIES, true), LOGIN_PROMPT_AFTER_INTERACTION_MS)
          }
          const stopListening = () => INPUT_EVENTS.forEach((type) => window.removeEventListener(type, onInput, true))
          INPUT_EVENTS.forEach((type) => window.addEventListener(type, onInput, { capture: true, passive: true, once: true }))
          cleanups.push(stopListening)
        })
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
      cleanups.forEach((fn) => fn())
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

  // The corner shortcut (LoginShortcut) asks for the popup here. That is the visitor's own request, so the reminder
  // limits do not apply and it does not count towards the per-session cap; closing it still counts as closing it.
  const canOpenOnRequest = status === 'unauthenticated' && isRestrictionEnabled()
  useEffect(() => {
    if (!canOpenOnRequest) return
    return onLoginPromptRequested(() => setOpen(true))
  }, [canOpenOnRequest])

  if (!open) return null
  return <LoginPromptModal returnTo={pathname} onDismiss={handleDismiss} onClosed={handleClosed} />
}
