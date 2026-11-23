/**
 * Rules for the "log in to see the full catalogue" popup: when it may be offered, and how it reminds without
 * nagging (it can come back on other pages, up to 3 times per session, but never straight after being closed).
 * Pure functions with fake storage: no browser needed.
 */

import { describe, it, expect } from 'vitest'
import {
  AGE_VERIFIED_KEY,
  LOGIN_PROMPT_AFTER_INTERACTION_MS,
  LOGIN_PROMPT_CLOSED_KEY,
  LOGIN_PROMPT_LCP_GUARD_PX,
  LOGIN_PROMPT_MAX_DELAY_MS,
  LOGIN_PROMPT_MAX_PER_SESSION,
  LOGIN_PROMPT_MIN_DELAY_MS,
  LOGIN_PROMPT_MIN_GAP_AFTER_CLOSE_MS,
  LOGIN_PROMPT_MIN_PAGES_AFTER_CLOSE,
  LOGIN_PROMPT_DISMISSED_KEY,
  LOGIN_PROMPT_PAGES_KEY,
  LOGIN_PROMPT_REAPPEAR_AFTER_MS,
  LOGIN_PROMPT_SHOWN_COUNT_KEY,
  LOGIN_SHORTCUT_DELAY_MS,
  LOGIN_SHORTCUT_LCP_GUARD_PX,
  cooldownActive,
  countPageView,
  isPromptPath,
  markPromptClosed,
  markPromptShown,
  pickPromptDelay,
  popupCouldBecomeLcp,
  readCount,
  safeGet,
  safeSet,
  shouldOfferLoginPrompt,
  shouldShowLoginShortcut,
  type PromptContext,
} from '../../src/lib/access/loginPrompt'

const NOW = 1_800_000_000_000
const DAY = 24 * 60 * 60 * 1000

const store = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value
    },
  }
}

const ctx = (over: Partial<PromptContext> = {}): PromptContext => ({
  authStatus: 'unauthenticated',
  pathname: '/shop',
  local: store({ [AGE_VERIFIED_KEY]: 'true' }),
  session: store(),
  now: NOW,
  enabled: true,
  ...over,
})

describe('who and where the popup is for', () => {
  it('is offered to a logged-out, age-verified visitor on an ordinary page', () => {
    expect(shouldOfferLoginPrompt(ctx())).toBe(true)
  })

  it('is never offered to a logged-in customer, or while that is still being checked', () => {
    expect(shouldOfferLoginPrompt(ctx({ authStatus: 'authenticated' }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ authStatus: 'loading' }))).toBe(false)
  })

  it('never shows on top of the age-verification gate', () => {
    expect(shouldOfferLoginPrompt(ctx({ local: store() }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ local: store({ [AGE_VERIFIED_KEY]: 'false' }) }))).toBe(false)
  })

  it('is off when the restriction is switched off', () => {
    expect(shouldOfferLoginPrompt(ctx({ enabled: false }))).toBe(false)
  })

  it.each(['/login', '/register', '/forgot-password', '/cart', '/checkout', '/account', '/account/orders/5', '/order-confirmation/12', '/pay/1/abc', '/affiliates/dashboard/links', '/admin/collections/products', '/api/auth/session'])(
    'never shows on %s',
    (path) => {
      expect(isPromptPath(path)).toBe(false)
      expect(shouldOfferLoginPrompt(ctx({ pathname: path }))).toBe(false)
    },
  )

  it.each(['/', '/shop', '/products/bpc-157', '/journal', '/journal/some-post', '/about', '/faq', '/certificates', '/accounting'])(
    'can show on %s',
    (path) => {
      expect(isPromptPath(path)).toBe(true)
    },
  )

  it('does not mistake a page that merely starts with an excluded word (/accounting) for an excluded page', () => {
    expect(isPromptPath('/accounting')).toBe(true)
    expect(isPromptPath('/carts')).toBe(true)
    expect(isPromptPath(null)).toBe(false)
    expect(isPromptPath(undefined)).toBe(false)
  })
})

describe('reminders: it can come back on other pages, but closing it is respected', () => {
  const MIN = 60 * 1000

  it('has the documented pacing: 3 per session, back after 3 pages and 3 minutes', () => {
    expect(LOGIN_PROMPT_MAX_PER_SESSION).toBe(3)
    expect(LOGIN_PROMPT_MIN_PAGES_AFTER_CLOSE).toBe(3)
    expect(LOGIN_PROMPT_MIN_GAP_AFTER_CLOSE_MS).toBe(3 * MIN)
  })

  it('is offered on different pages when the visitor has simply not closed it (left it, or moved on)', () => {
    expect(shouldOfferLoginPrompt(ctx())).toBe(true)
    expect(shouldOfferLoginPrompt(ctx({ pathname: '/products/bpc-157' }))).toBe(true)
    expect(shouldOfferLoginPrompt(ctx({ pathname: '/journal' }))).toBe(true)
  })

  it('stops after the per-session cap, however it was left', () => {
    const shownTwice = store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: '2' })
    const shownThrice = store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: '3' })
    expect(shouldOfferLoginPrompt(ctx({ session: shownTwice }))).toBe(true) // the 3rd and last
    expect(shouldOfferLoginPrompt(ctx({ session: shownThrice }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ session: store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: '99' }) }))).toBe(false)
  })

  it('does NOT come back straight after being closed: not on the same page, not on the next two pages', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    markPromptClosed(local, session, NOW)
    // even much later, the pages rule still holds (0 pages viewed since)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 60 * MIN }))).toBe(false)
    countPageView(session) // 1st page after closing
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 60 * MIN }))).toBe(false)
    countPageView(session) // 2nd page after closing
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 60 * MIN }))).toBe(false)
  })

  it('does NOT come back within 3 minutes of being closed, even after many pages', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    markPromptClosed(local, session, NOW)
    for (let i = 0; i < 10; i++) countPageView(session)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 5_000 }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 3 * MIN - 1 }))).toBe(false)
  })

  it('may remind again once BOTH 3 pages and 3 minutes have passed since it was closed', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    markPromptClosed(local, session, NOW)
    for (let i = 0; i < 3; i++) countPageView(session)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 3 * MIN }))).toBe(true)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 10 * MIN }))).toBe(true)
  })

  it('closing it again starts the waiting again from zero', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    markPromptClosed(local, session, NOW)
    for (let i = 0; i < 3; i++) countPageView(session)
    markPromptShown(session) // it came back (2nd time)...
    markPromptClosed(local, session, NOW + 10 * MIN) // ...and was closed again
    expect(session.data[LOGIN_PROMPT_PAGES_KEY]).toBe('0')
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + 60 * MIN }))).toBe(false)
  })

  it('a full visit: shown, closed, 3 pages + 3 minutes, shown, closed, wait, shown, then never again', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    let now = NOW
    let shown = 0
    for (let step = 0; step < 40; step++) {
      now += step % 2 === 0 ? MIN : 20 * 1000 // some pages quick, some slow
      countPageView(session)
      if (shouldOfferLoginPrompt(ctx({ local, session, now }))) {
        markPromptShown(session)
        shown++
        markPromptClosed(local, session, now) // each time, the visitor closes it
      }
    }
    expect(shown).toBe(3)
  })

  it('counts pages only once it has been closed (nothing to count towards before that)', () => {
    const session = store()
    countPageView(session)
    countPageView(session)
    expect(session.data[LOGIN_PROMPT_PAGES_KEY]).toBeUndefined()
  })

  it('treats garbage counters and timestamps as "never closed / zero", without throwing', () => {
    for (const bad of ['', 'abc', '-3', 'NaN', '1e999']) {
      const session = store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: bad, [LOGIN_PROMPT_CLOSED_KEY]: bad, [LOGIN_PROMPT_PAGES_KEY]: bad })
      expect(() => shouldOfferLoginPrompt(ctx({ session }))).not.toThrow()
    }
    expect(readCount(store({ k: 'abc' }), 'k')).toBe(0)
    expect(readCount(store({ k: '-4' }), 'k')).toBe(0)
    expect(readCount(store({ k: '7' }), 'k')).toBe(7)
    expect(readCount(store(), 'k')).toBe(0)
  })

  it('the pacing can be tuned through the context (and the constants are what the app uses by default)', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    markPromptClosed(local, session, NOW)
    countPageView(session)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + MIN, minPagesAfterClose: 1, minGapAfterCloseMs: 30_000 }))).toBe(true)
    expect(shouldOfferLoginPrompt(ctx({ local, session, now: NOW + MIN, minPagesAfterClose: 2, minGapAfterCloseMs: 30_000 }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ session: store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: '1' }), maxPerSession: 1 }))).toBe(false)
  })

  it('comes back in the NEXT session even though it was closed before (the default)', () => {
    expect(LOGIN_PROMPT_REAPPEAR_AFTER_MS).toBe(0)
    // a brand-new session (empty sessionStorage) but the browser remembers it was closed a minute / a day ago
    const closedMinuteAgo = store({ [AGE_VERIFIED_KEY]: 'true', [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW - 60_000) })
    const closedDayAgo = store({ [AGE_VERIFIED_KEY]: 'true', [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW - DAY) })
    expect(shouldOfferLoginPrompt(ctx({ local: closedMinuteAgo, session: store() }))).toBe(true)
    expect(shouldOfferLoginPrompt(ctx({ local: closedDayAgo, session: store() }))).toBe(true)
  })

  it('can optionally stay away for longer after being closed (the setting, if it is ever turned on)', () => {
    const week = 7 * DAY
    const justNow = store({ [AGE_VERIFIED_KEY]: 'true', [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW - 1000) })
    const sixDays = store({ [AGE_VERIFIED_KEY]: 'true', [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW - 6 * DAY) })
    const eightDays = store({ [AGE_VERIFIED_KEY]: 'true', [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW - 8 * DAY) })
    expect(shouldOfferLoginPrompt(ctx({ local: justNow, reappearAfterMs: week }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ local: sixDays, reappearAfterMs: week }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ local: eightDays, reappearAfterMs: week }))).toBe(true)
  })

  it('ignores garbage in storage instead of breaking', () => {
    for (const bad of ['not a number', null, undefined, '-5', 0]) expect(cooldownActive(bad, NOW, 7 * DAY)).toBe(false)
    expect(cooldownActive(NOW - 1000, NOW, 0)).toBe(false) // a window of 0 never blocks
  })

  it('remembers when it was closed, and counts every time it appears', () => {
    const local = store({ [AGE_VERIFIED_KEY]: 'true' })
    const session = store()
    expect(shouldOfferLoginPrompt(ctx({ local, session }))).toBe(true)
    markPromptShown(session)
    markPromptShown(session)
    expect(session.data[LOGIN_PROMPT_SHOWN_COUNT_KEY]).toBe('2')
    markPromptClosed(local, session, NOW)
    expect(session.data[LOGIN_PROMPT_CLOSED_KEY]).toBe(String(NOW))
    expect(session.data[LOGIN_PROMPT_PAGES_KEY]).toBe('0')
    expect(local.data[LOGIN_PROMPT_DISMISSED_KEY]).toBe(String(NOW))
    expect(shouldOfferLoginPrompt(ctx({ local, session }))).toBe(false)
  })

  it('is never offered to someone who is logged in, however it was left', () => {
    expect(shouldOfferLoginPrompt(ctx({ authStatus: 'authenticated' }))).toBe(false)
  })
})

describe('the random delay before the popup appears', () => {
  it('is between 6 and 12 seconds', () => {
    expect(LOGIN_PROMPT_MIN_DELAY_MS).toBe(6000)
    expect(LOGIN_PROMPT_MAX_DELAY_MS).toBe(12000)
  })

  it('covers the whole range at its edges, including both ends', () => {
    expect(pickPromptDelay(() => 0)).toBe(6000)
    expect(pickPromptDelay(() => 0.5)).toBe(9000)
    expect(pickPromptDelay(() => 0.999999999)).toBe(12000)
  })

  it('never leaves the range, and really varies (it is not a fixed wait)', () => {
    const delays = Array.from({ length: 2000 }, () => pickPromptDelay())
    expect(Math.min(...delays)).toBeGreaterThanOrEqual(6000)
    expect(Math.max(...delays)).toBeLessThanOrEqual(12000)
    expect(new Set(delays).size).toBeGreaterThan(500)
    // spread across the range, not bunched at one end
    const average = delays.reduce((a, b) => a + b, 0) / delays.length
    expect(average).toBeGreaterThan(8500)
    expect(average).toBeLessThan(9500)
  })

  it('returns a whole number of milliseconds', () => {
    for (let i = 0; i < 200; i++) expect(Number.isInteger(pickPromptDelay())).toBe(true)
  })
})

describe('keeping the popup from becoming the page\'s Largest Contentful Paint (LCP)', () => {
  it('can only take over on a page whose own biggest item is no bigger than the popup\'s biggest text block', () => {
    expect(popupCouldBecomeLcp(14_850)).toBe(true) // e.g. a product page whose image has not loaded: just a heading
    expect(popupCouldBecomeLcp(0)).toBe(true) // nothing contentful yet: the popup would BE the LCP
    expect(popupCouldBecomeLcp(LOGIN_PROMPT_LCP_GUARD_PX)).toBe(true) // exactly at the limit: still waits
    expect(popupCouldBecomeLcp(LOGIN_PROMPT_LCP_GUARD_PX + 1)).toBe(false)
    expect(popupCouldBecomeLcp(517 * 646)).toBe(false) // a product photo
    expect(popupCouldBecomeLcp(1195 * 464)).toBe(false) // a hero image
  })

  it('has nothing to protect when the browser does not measure LCP (or the measurement is nonsense)', () => {
    expect(popupCouldBecomeLcp(null)).toBe(false)
    expect(popupCouldBecomeLcp(Number.NaN)).toBe(false)
    expect(popupCouldBecomeLcp(Number.POSITIVE_INFINITY)).toBe(false)
  })

  it('uses a limit above the popup\'s measured text sizes (22,900 px² desktop, 17,700 tablet, 16,200 phone)', () => {
    expect(LOGIN_PROMPT_LCP_GUARD_PX).toBeGreaterThan(24_100) // the largest candidate seen, with headroom
    expect(LOGIN_PROMPT_AFTER_INTERACTION_MS).toBeGreaterThan(0)
  })

  it('the limit can be tuned through the second argument', () => {
    expect(popupCouldBecomeLcp(50_000, 60_000)).toBe(true)
    expect(popupCouldBecomeLcp(50_000, 40_000)).toBe(false)
  })
})

describe('telling "never here" from "not yet"', () => {
  it('the age gate being up is "not yet": skipping the age gate says it could appear', () => {
    const gateUp = ctx({ local: store() })
    expect(shouldOfferLoginPrompt(gateUp)).toBe(false)
    expect(shouldOfferLoginPrompt({ ...gateUp, skipAgeGate: true })).toBe(true)
  })

  it('skipping the age gate never overrides a real reason it can not show', () => {
    const noGate = { skipAgeGate: true }
    expect(shouldOfferLoginPrompt(ctx({ ...noGate, authStatus: 'authenticated' }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ ...noGate, pathname: '/checkout' }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ ...noGate, enabled: false }))).toBe(false)
    // closed a moment ago (and no page viewed since): a real reason, so "never here" even with the age gate skipped
    expect(shouldOfferLoginPrompt(ctx({ ...noGate, session: store({ [LOGIN_PROMPT_CLOSED_KEY]: String(NOW - 1000) }) }))).toBe(false)
    expect(shouldOfferLoginPrompt(ctx({ ...noGate, session: store({ [LOGIN_PROMPT_SHOWN_COUNT_KEY]: '3' }) }))).toBe(false)
  })
})

describe('blocked or missing storage (private browsing)', () => {
  const broken = {
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }

  it('never throws', () => {
    expect(() => safeGet(broken, 'k')).not.toThrow()
    expect(() => safeSet(broken, 'k', 'v')).not.toThrow()
    expect(() => markPromptClosed(broken, broken, NOW)).not.toThrow()
    expect(() => markPromptShown(broken)).not.toThrow()
    expect(() => countPageView(broken)).not.toThrow()
    expect(readCount(broken, 'k')).toBe(0)
    expect(safeGet(null, 'k')).toBeNull()
    expect(safeGet(undefined, 'k')).toBeNull()
  })

  it('treats broken storage as "age gate not passed", so the popup stays away rather than risk stacking', () => {
    expect(shouldOfferLoginPrompt(ctx({ local: broken, session: broken }))).toBe(false)
  })
})

// ─── The corner shortcut ──────────────────────────────────────────────────────

describe('shouldShowLoginShortcut (the small "Members: save 15%" button in the corner)', () => {
  const verified = store({ [AGE_VERIFIED_KEY]: 'true' })
  const base = { authStatus: 'unauthenticated' as const, pathname: '/shop', local: verified, enabled: true }

  it('is for logged-out visitors on ordinary pages, once the age gate has been passed', () => {
    expect(shouldShowLoginShortcut(base)).toBe(true)
    for (const pathname of ['/', '/shop', '/products/bpc-157', '/journal/x', '/about']) {
      expect(shouldShowLoginShortcut({ ...base, pathname })).toBe(true)
    }
  })

  it('is never for a logged-in customer, and not while it is still unknown whether they are', () => {
    expect(shouldShowLoginShortcut({ ...base, authStatus: 'authenticated' })).toBe(false)
    expect(shouldShowLoginShortcut({ ...base, authStatus: 'loading' })).toBe(false)
  })

  it('is never on sign-in, basket, checkout or account pages', () => {
    for (const pathname of ['/login', '/register', '/cart', '/checkout', '/account', '/account/orders', '/order-confirmation/1', '/pay/1/x', '/admin']) {
      expect(shouldShowLoginShortcut({ ...base, pathname })).toBe(false)
    }
    expect(shouldShowLoginShortcut({ ...base, pathname: null })).toBe(false)
    expect(shouldShowLoginShortcut({ ...base, pathname: undefined })).toBe(false)
  })

  it('never sits on top of the age gate, and storage that cannot be read counts as "not passed"', () => {
    expect(shouldShowLoginShortcut({ ...base, local: store() })).toBe(false)
    expect(shouldShowLoginShortcut({ ...base, local: store({ [AGE_VERIFIED_KEY]: 'false' }) })).toBe(false)
    expect(shouldShowLoginShortcut({ ...base, local: null })).toBe(false)
    expect(shouldShowLoginShortcut({ ...base, local: { getItem: () => { throw new Error('blocked') }, setItem: () => undefined } })).toBe(false)
  })

  it('is off when the restriction (kill switch) is off', () => {
    expect(shouldShowLoginShortcut({ ...base, enabled: false })).toBe(false)
  })

  it('has none of the popup\'s reminder limits: closing the popup or using up its 3 reminders does not hide it', () => {
    const used = store({
      [AGE_VERIFIED_KEY]: 'true',
      [LOGIN_PROMPT_SHOWN_COUNT_KEY]: String(LOGIN_PROMPT_MAX_PER_SESSION),
      [LOGIN_PROMPT_CLOSED_KEY]: String(NOW),
      [LOGIN_PROMPT_DISMISSED_KEY]: String(NOW),
    })
    expect(shouldShowLoginShortcut({ ...base, local: used })).toBe(true)
  })

  it('has sensible timings: a short wait after load, and a smaller LCP guard than the popup\'s', () => {
    expect(LOGIN_SHORTCUT_DELAY_MS).toBeGreaterThanOrEqual(1000)
    expect(LOGIN_SHORTCUT_DELAY_MS).toBeLessThanOrEqual(6000)
    expect(LOGIN_SHORTCUT_LCP_GUARD_PX).toBeLessThan(LOGIN_PROMPT_LCP_GUARD_PX)
    expect(popupCouldBecomeLcp(5_000, LOGIN_SHORTCUT_LCP_GUARD_PX)).toBe(true)
    expect(popupCouldBecomeLcp(500_000, LOGIN_SHORTCUT_LCP_GUARD_PX)).toBe(false)
  })
})
