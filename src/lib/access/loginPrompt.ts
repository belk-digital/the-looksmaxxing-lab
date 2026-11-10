/**
 * Rules for the "log in to see the full catalogue" popup. Pure functions: no React, no browser access
 * (storage is passed in), so every rule can be tested on its own.
 *
 * Design rules, and why:
 *  - On every page, never at once. Once a page has finished loading, the popup waits a random 6-12 seconds (a new
 *    random delay on every page) and then appears, whether or not the visitor has done anything. The wait keeps it
 *    well clear of the page's own loading: by then the main content has painted. The popup has no images and only
 *    a few small text blocks, so it can only become the page's Largest Contentful Paint if the page's real one is
 *    smaller than those blocks (rare), and its code is a separate download that starts ~2 seconds before it is due.
 *  - Never while the age-verification gate is up, never to someone already logged in, never on sign-in,
 *    basket, checkout or account pages.
 *  - Reminders, not nagging. It can appear on different pages as a reminder, but never straight after being closed:
 *    once the visitor has closed it (the X, Escape or "Maybe later"; clicking outside does nothing, and choosing
 *    Log in / Create account does not count as closing it) it stays away for the next couple of pages AND for a few
 *    minutes, and only then may remind them again. It appears at most 3 times in one browsing session, and each
 *    new browsing session starts fresh (LOGIN_PROMPT_REAPPEAR_AFTER_MS can make it stay away longer between
 *    visits). All of these numbers are the constants below.
 */

import { isRestrictionEnabled } from './restrictedProducts'

/** localStorage: when the popup was last closed. Only used when LOGIN_PROMPT_REAPPEAR_AFTER_MS is above 0. */
export const LOGIN_PROMPT_DISMISSED_KEY = 'lm_login_prompt_dismissed_at'
/** sessionStorage: WHEN (a timestamp) the visitor last closed the popup during this browsing session. */
export const LOGIN_PROMPT_CLOSED_KEY = 'lm_login_prompt_closed'
/** sessionStorage: how many times the popup has appeared during this browsing session. */
export const LOGIN_PROMPT_SHOWN_COUNT_KEY = 'lm_login_prompt_shown_count'
/** sessionStorage: how many pages the visitor has viewed since they last closed the popup. */
export const LOGIN_PROMPT_PAGES_KEY = 'lm_login_prompt_pages_since_close'
export const AGE_VERIFIED_KEY = 'longevia_age_verified'

/** The most times the popup appears in one browsing session (the first time plus its reminders). */
export const LOGIN_PROMPT_MAX_PER_SESSION = 3
/**
 * After the visitor closes it, it can only return on the Nth page they view afterwards (3 = it stays away for the
 * next two pages, and may remind them again on the third)...
 */
export const LOGIN_PROMPT_MIN_PAGES_AFTER_CLOSE = 3
/** ...and only once at least this long has passed since they closed it. Both conditions must be met. */
export const LOGIN_PROMPT_MIN_GAP_AFTER_CLOSE_MS = 3 * 60 * 1000

/**
 * How long the popup stays away, across visits, after the visitor closed it.
 * 0 (the current setting) = it is back in the very next browsing session, every session, until they log in.
 * To give people a break after closing it, set this to a number of milliseconds, e.g. 7 * 24 * 60 * 60 * 1000.
 */
export const LOGIN_PROMPT_REAPPEAR_AFTER_MS = 0

/**
 * The popup appears a random time after each page has finished loading, somewhere between these two values
 * (a fresh random delay on every page, so it feels natural rather than clockwork).
 */
export const LOGIN_PROMPT_MIN_DELAY_MS = 6000
export const LOGIN_PROMPT_MAX_DELAY_MS = 12000

/** The popup's code starts downloading this long before the popup is due, so it is ready exactly on time. */
export const LOGIN_PROMPT_PRELOAD_LEAD_MS = 2000

/**
 * If the popup falls due while something else is in the way (the age-verification gate, another dialog, a hidden
 * browser tab), it re-checks at this interval, up to MAX_RETRIES times, and appears as soon as the way is clear.
 */
export const LOGIN_PROMPT_RETRY_MS = 1500
export const LOGIN_PROMPT_MAX_RETRIES = 40

/** A random delay between MIN and MAX (inclusive). `random` is injectable so the maths can be tested. */
export function pickPromptDelay(random: () => number = Math.random): number {
  const span = LOGIN_PROMPT_MAX_DELAY_MS - LOGIN_PROMPT_MIN_DELAY_MS
  return LOGIN_PROMPT_MIN_DELAY_MS + Math.floor(random() * (span + 1))
}

/** Pages (and everything below them) where the popup is never shown. */
const EXCLUDED_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/cart',
  '/checkout',
  '/account',
  '/order-confirmation',
  '/pay',
  '/affiliates/apply',
  '/affiliates/dashboard',
  '/admin',
  '/api',
]

export function isPromptPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return !EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** Reads storage without ever throwing (private browsing, blocked storage...). */
export function safeGet(storage: StorageLike | null | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function safeSet(storage: StorageLike | null | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value)
  } catch {
    // storage unavailable: the popup will simply be allowed to show again later
  }
}

/** Is the visitor still inside the "stay away after closing" window? Always false when the window is 0. */
export function cooldownActive(
  dismissedAt: string | number | null | undefined,
  now: number,
  windowMs: number = LOGIN_PROMPT_REAPPEAR_AFTER_MS,
): boolean {
  if (!(windowMs > 0)) return false
  const at = Number(dismissedAt)
  if (!Number.isFinite(at) || at <= 0) return false
  return now - at < windowMs
}

export type PromptContext = {
  authStatus: AuthStatus
  pathname: string | null | undefined
  /** localStorage-style store (the age gate, and the last time it was closed, live there) */
  local: StorageLike | null | undefined
  /** sessionStorage-style store ("closed during this browsing session") */
  session: StorageLike | null | undefined
  now: number
  /** the restriction switch; defaults to the real setting */
  enabled?: boolean
  /** how long it stays away across visits after being closed; defaults to LOGIN_PROMPT_REAPPEAR_AFTER_MS */
  reappearAfterMs?: number
  /** overrides for the reminder pacing (default to the LOGIN_PROMPT_MAX_PER_SESSION / MIN_PAGES / MIN_GAP constants) */
  maxPerSession?: number
  minPagesAfterClose?: number
  minGapAfterCloseMs?: number
  /**
   * Ignore the age-verification gate. Used to tell "can never appear on this page" (closed, logged in, excluded
   * page: stop waiting) from "just not yet" (the age gate is still up: keep waiting).
   */
  skipAgeGate?: boolean
}

/** Should the popup be offered right now? (The caller still waits for the page to load plus the random delay.) */
export function shouldOfferLoginPrompt(ctx: PromptContext): boolean {
  if (!(ctx.enabled ?? isRestrictionEnabled())) return false
  if (ctx.authStatus !== 'unauthenticated') return false
  if (!isPromptPath(ctx.pathname)) return false
  // The age gate comes first; the popup must never stack on top of it.
  if (!ctx.skipAgeGate && safeGet(ctx.local, AGE_VERIFIED_KEY) !== 'true') return false
  // Reminders, not nagging. First, a cap on how many times it can appear in one browsing session...
  if (readCount(ctx.session, LOGIN_PROMPT_SHOWN_COUNT_KEY) >= (ctx.maxPerSession ?? LOGIN_PROMPT_MAX_PER_SESSION)) return false
  // ...and once the visitor has closed it, it does not come straight back: it needs a few pages AND a few minutes.
  const closedAt = Number(safeGet(ctx.session, LOGIN_PROMPT_CLOSED_KEY))
  if (Number.isFinite(closedAt) && closedAt > 0) {
    if (ctx.now - closedAt < (ctx.minGapAfterCloseMs ?? LOGIN_PROMPT_MIN_GAP_AFTER_CLOSE_MS)) return false
    const pagesSince = readCount(ctx.session, LOGIN_PROMPT_PAGES_KEY)
    if (pagesSince < (ctx.minPagesAfterClose ?? LOGIN_PROMPT_MIN_PAGES_AFTER_CLOSE)) return false
  }
  // Optionally stay away for longer between VISITS after it was closed (off by default).
  if (cooldownActive(safeGet(ctx.local, LOGIN_PROMPT_DISMISSED_KEY), ctx.now, ctx.reappearAfterMs)) return false
  return true
}

/** A non-negative whole number from storage; anything else (missing, garbage, negative) counts as 0. */
export function readCount(storage: StorageLike | null | undefined, key: string): number {
  const n = Number.parseInt(safeGet(storage, key) ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** The popup has just appeared: counts towards the per-session cap. */
export function markPromptShown(session: StorageLike | null | undefined): void {
  safeSet(session, LOGIN_PROMPT_SHOWN_COUNT_KEY, String(readCount(session, LOGIN_PROMPT_SHOWN_COUNT_KEY) + 1))
}

/**
 * The visitor closed the popup. It now stays away until they have viewed a few more pages AND a few minutes have
 * passed (see shouldOfferLoginPrompt); the page counter starts again from 0.
 */
export function markPromptClosed(
  local: StorageLike | null | undefined,
  session: StorageLike | null | undefined,
  now: number,
): void {
  safeSet(session, LOGIN_PROMPT_CLOSED_KEY, String(now))
  safeSet(session, LOGIN_PROMPT_PAGES_KEY, '0')
  safeSet(local, LOGIN_PROMPT_DISMISSED_KEY, String(now))
}

/** A page was viewed. Once the popup has been closed, each page counts towards its next reminder. */
export function countPageView(session: StorageLike | null | undefined): void {
  const closedAt = Number(safeGet(session, LOGIN_PROMPT_CLOSED_KEY))
  if (!(Number.isFinite(closedAt) && closedAt > 0)) return // never closed: nothing to count towards
  safeSet(session, LOGIN_PROMPT_PAGES_KEY, String(readCount(session, LOGIN_PROMPT_PAGES_KEY) + 1))
}
