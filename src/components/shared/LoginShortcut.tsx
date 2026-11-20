'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LOGIN_PROMPT_MAX_RETRIES,
  LOGIN_PROMPT_RETRY_MS,
  LOGIN_PROMPT_AFTER_INTERACTION_MS,
  LOGIN_SHORTCUT_DELAY_MS,
  LOGIN_SHORTCUT_LCP_GUARD_PX,
  popupCouldBecomeLcp,
  safeGet,
  shouldShowLoginShortcut,
} from '@/lib/access/loginPrompt'
import { requestLoginPrompt } from '@/lib/access/loginPromptBus'
import { isRestrictionEnabled } from '@/lib/access/restrictedProducts'
import { readLargestContentfulPaintSize } from '@/components/shared/LoginPrompt'

/**
 * The corner shortcut: a small fixed "Members: save 20%" button, bottom-left of every page where the login popup may
 * appear, for logged-out visitors. Pressing it opens the same popup on demand (see LoginPrompt).
 *
 * Like the popup, it is kept clear of page speed:
 *  - This file is the only part shipped with every page. It has no animation library or icons, and it renders nothing
 *    until the shortcut is due. The button itself (LoginShortcutButton) is a separate download that starts then.
 *  - It appears LOGIN_SHORTCUT_DELAY_MS after the page has loaded and after the age gate has been passed.
 *  - On a nearly empty page (where its text could become the page's Largest Contentful Paint) it waits for the
 *    visitor's first scroll / click / tap / key press, exactly as the popup does.
 *  - Nothing is scheduled for logged-in visitors, or when the restriction (and with it the popup) is switched off.
 */
const LoginShortcutButton = dynamic(() => import('@/components/shared/LoginShortcutButton'), { ssr: false })

const INPUT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

function readLocalStore(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage
  } catch {
    return null // blocked: behave as if it were empty (the age gate is then never "passed", so nothing shows)
  }
}

export function LoginShortcut() {
  const { status } = useSession()
  const pathname = usePathname()
  // True once the shortcut has come due on this page load (it then stays through page-to-page navigation).
  const [armed, setArmed] = useState(false)

  const allowed = status === 'unauthenticated' && isRestrictionEnabled()

  useEffect(() => {
    if (armed || !allowed) return

    let cancelled = false
    const cleanups: Array<() => void> = []
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const arm = () => {
      if (!cancelled) setArmed(true)
    }

    const attempt = (retriesLeft: number, interacted = false) => {
      if (cancelled) return
      const ageGatePassed = safeGet(readLocalStore(), 'longevia_age_verified') === 'true'
      // Not yet: the age gate is still up, or this tab is in the background. Keep checking and appear once it is clear.
      // (Getting past the age gate takes a click, which already ended Chrome's measuring of the page's LCP.)
      if (!ageGatePassed || document.visibilityState !== 'visible') {
        if (retriesLeft > 0) later(() => attempt(retriesLeft - 1, interacted || !ageGatePassed), LOGIN_PROMPT_RETRY_MS)
        return
      }
      if (interacted) return arm()

      // Make sure the shortcut cannot take over as the page's Largest Contentful Paint (see LoginShortcut above).
      void readLargestContentfulPaintSize().then((size) => {
        if (cancelled) return
        if (!popupCouldBecomeLcp(size, LOGIN_SHORTCUT_LCP_GUARD_PX)) return arm()
        const onInput = () => {
          stopListening()
          later(() => attempt(LOGIN_PROMPT_MAX_RETRIES, true), LOGIN_PROMPT_AFTER_INTERACTION_MS)
        }
        const stopListening = () => INPUT_EVENTS.forEach((type) => window.removeEventListener(type, onInput, true))
        INPUT_EVENTS.forEach((type) => window.addEventListener(type, onInput, { capture: true, passive: true, once: true }))
        cleanups.push(stopListening)
      })
    }

    const begin = () => later(() => attempt(LOGIN_PROMPT_MAX_RETRIES), LOGIN_SHORTCUT_DELAY_MS)

    // The delay counts from when the page has finished loading.
    if (document.readyState === 'complete') begin()
    else window.addEventListener('load', begin, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', begin)
      timers.forEach((id) => window.clearTimeout(id))
      cleanups.forEach((fn) => fn())
    }
  }, [armed, allowed])

  if (!armed) return null
  // Evaluated on every render, so it follows the visitor around: gone on sign-in / basket / checkout / account pages,
  // and gone the moment they log in.
  if (!shouldShowLoginShortcut({ authStatus: status, pathname, local: readLocalStore() })) return null

  // Product pages have a full-width "add to cart" bar along the bottom of phones and tablets: sit above it there.
  const liftAboveStickyBar = Boolean(pathname && pathname.startsWith('/products/'))
  return <LoginShortcutButton onOpen={requestLoginPrompt} liftAboveStickyBar={liftAboveStickyBar} />
}
