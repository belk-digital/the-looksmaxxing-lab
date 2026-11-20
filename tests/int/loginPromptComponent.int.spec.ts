/**
 * The "log in to see the full catalogue" popup, in a simulated browser.
 *
 * What is tested:
 * - Timing: it appears by itself a random delay after each page has loaded (no scroll or click needed), on every page,
 *   and nothing is rendered, listened for or scheduled before that (or at all for logged-in visitors).
 * - When it waits (age gate, another dialog, background tab) and when it never shows (logged in, sign-in/checkout
 *   pages, kill switch).
 * - Reminders: it comes back on other pages (up to 3 per session), but never straight after being closed: it then
 *   needs 3 more pages and 3 minutes, and closing it again starts the waiting again.
 * - The dialog itself: accessible name, focus moves in and stays in, the X / Escape / Maybe later close it,
 *   page scrolling is locked while it is open and restored afterwards, return-to-page links are safe.
 * - The basket notice shown to logged-out visitors holding a nasal spray.
 *
 * Next's router, login state, framer-motion and Lenis are mocked; the popup code itself is the real thing.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, act, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  pathname: '/shop',
  lenis: { stop: vi.fn(), start: vi.fn() },
  // the popup's login form
  signIn: vi.fn(async (..._args: unknown[]) => ({ error: null, ok: true }) as { error: string | null; ok: boolean } | undefined),
  refresh: vi.fn(),
  toast: vi.fn(),
  pickDelay: vi.fn(() => 40),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: h.status, data: null }),
  signIn: (...args: unknown[]) => h.signIn(...args),
}))
vi.mock('sonner', () => ({ toast: { success: (...args: unknown[]) => h.toast(...args), error: vi.fn() } }))
vi.mock('next/navigation', () => ({ usePathname: () => h.pathname, useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }))
vi.mock('lenis/react', () => ({ useLenis: () => h.lenis }))
vi.mock('@/app/(frontend)/actions/cart', () => ({ syncCartToPayload: async () => undefined }))

// Short timings so the tests run quickly; every other rule is the real one. (The real delay is a random 6-12 s.)
vi.mock('@/lib/access/loginPrompt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/access/loginPrompt')>()),
  pickPromptDelay: () => h.pickDelay(),
  LOGIN_PROMPT_PRELOAD_LEAD_MS: 15,
  LOGIN_PROMPT_RETRY_MS: 20,
  LOGIN_PROMPT_AFTER_INTERACTION_MS: 30,
}))

vi.mock('next/dynamic', async () => {
  const R = await import('react')
  return {
    default: (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
      const Lazy = R.lazy(loader)
      return (props: any) => R.createElement(R.Suspense, { fallback: null }, R.createElement(Lazy, props))
    },
  }
})

vi.mock('next/link', async () => {
  const R = await import('react')
  return {
    default: R.forwardRef(({ href, children, prefetch: _prefetch, ...rest }: any, ref: any) =>
      R.createElement('a', { href, ref, ...rest }, children),
    ),
  }
})

vi.mock('framer-motion', async () => {
  const R = await import('react')
  const cache = new Map<string, unknown>()
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            R.forwardRef((props: any, ref) => {
              const { initial, animate, exit, transition, ...rest } = props
              return R.createElement(tag, { ...rest, ref })
            }),
          )
        }
        return cache.get(tag)
      },
    },
  )
  // Minimal AnimatePresence: reports when its content has gone, like the real one after the exit animation.
  const AnimatePresence = ({ children, onExitComplete }: any) => {
    const had = R.useRef(false)
    R.useEffect(() => {
      if (!children && had.current) onExitComplete?.()
      had.current = Boolean(children)
    }, [children, onExitComplete])
    return children || null
  }
  return { motion, AnimatePresence, MotionConfig: ({ children }: any) => children }
})

import { LoginPrompt } from '../../src/components/shared/LoginPrompt'
import LoginPromptModal from '../../src/components/shared/LoginPromptModal'
import { RestrictedCartNotice } from '../../src/components/shop/RestrictedCartNotice'
import { useCartStore } from '../../src/lib/cart/store'
import {
  AGE_VERIFIED_KEY,
  LOGIN_PROMPT_CLOSED_KEY,
  LOGIN_PROMPT_DISMISSED_KEY,
  LOGIN_PROMPT_PAGES_KEY,
  LOGIN_PROMPT_SHOWN_COUNT_KEY,
} from '../../src/lib/access/loginPrompt'

const prompt = () => React.createElement(LoginPrompt)
const notice = (returnTo: '/cart' | '/checkout') => React.createElement(RestrictedCartNotice, { returnTo })

const savedFlag = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
const sleep = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)))

beforeEach(() => {
  h.status = 'unauthenticated'
  h.pathname = '/shop'
  h.lenis.stop.mockClear()
  h.lenis.start.mockClear()
  h.pickDelay.mockClear()
  clockOffset = 0
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem(AGE_VERIFIED_KEY, 'true')
  document.body.style.overflow = ''
  delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
  else process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = savedFlag
})

// ─── Trigger ──────────────────────────────────────────────────────────────────
//
// The test delay is 40 ms (the real one is a random 6-12 s), the code preload starts 15 ms before it is due
// (25 ms) and the "not yet, try again" check runs every 20 ms. Those three numbers are used below to tell
// "something was scheduled" from "nothing was".

const SCHEDULED = [40, 25, 20]
const scheduled = (spy: ReturnType<typeof vi.spyOn>) =>
  (spy.mock.calls as unknown[][]).some(([, ms]) => SCHEDULED.includes(ms as number))

describe('before the delay is up (page load and LCP)', () => {
  it('renders nothing at all until the delay has passed', async () => {
    const { container } = render(prompt())
    await sleep(10)
    expect(container.innerHTML).toBe('')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not start the delay until the page has finished loading, then counts it from then', async () => {
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
    const timeouts = vi.spyOn(window, 'setTimeout')
    const add = vi.spyOn(window, 'addEventListener')
    render(prompt())

    expect(add.mock.calls.some(([type]) => type === 'load')).toBe(true)
    expect(scheduled(timeouts)).toBe(false) // nothing scheduled yet
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull() // the delay has not even started

    readyState.mockReturnValue('complete')
    act(() => void window.dispatchEvent(new Event('load')))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    readyState.mockRestore()
  })

  it('attaches no scroll, click, touch or key listeners at all (nothing extra for the page to carry)', () => {
    const add = vi.spyOn(window, 'addEventListener')
    render(prompt())
    const types = add.mock.calls.map(([type]) => String(type))
    for (const type of ['scroll', 'pointerdown', 'keydown', 'touchstart', 'wheel']) expect(types).not.toContain(type)
  })
})

describe('showing the popup', () => {
  it('appears by itself after the delay, without the visitor doing anything', async () => {
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
    // being shown is not the same as being closed: it must not be marked as dealt with
    expect(sessionStorage.getItem(LOGIN_PROMPT_CLOSED_KEY)).toBeNull()
  })

  it('appears on different pages: a new delay starts on each page (up to the per-session cap)', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    for (const path of ['/products/bpc-157', '/journal']) {
      h.pathname = path
      rerender(prompt())
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()) // gone while the new page loads
      expect(await screen.findByRole('dialog')).toBeTruthy() // and back after its own delay
    }
  })

  it('picks a fresh random delay on every page (not one fixed wait)', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    expect(h.pickDelay).toHaveBeenCalledTimes(1)

    h.pickDelay.mockReturnValueOnce(25) // the next page happens to draw a different delay
    h.pathname = '/journal'
    rerender(prompt())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await screen.findByRole('dialog')
    expect(h.pickDelay).toHaveBeenCalledTimes(2)
  })

  it('waits when the age gate is still up, and shows soon after the visitor has passed it', async () => {
    localStorage.removeItem(AGE_VERIFIED_KEY)
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()

    localStorage.setItem(AGE_VERIFIED_KEY, 'true')
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('waits while another dialog or scroll lock is up, and shows once it is gone', async () => {
    document.body.style.overflow = 'hidden'
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()

    document.body.style.overflow = ''
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('waits while the browser tab is in the background, and shows once it is visible again', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()

    visibility.mockReturnValue('visible')
    expect(await screen.findByRole('dialog')).toBeTruthy()
    visibility.mockRestore()
  })
})

// ─── Page speed: never become the page's Largest Contentful Paint ─────────────
//
// A fake browser LCP measurement: the page's biggest contentful item so far is `size` px².
// (The popup's own biggest text block is about 23,000 px²; the limit in the app is 30,000.)

const fakeLcp = (size: number | 'unsupported' | 'throws') => {
  class FakeObserver {
    static supportedEntryTypes = size === 'unsupported' ? ['mark'] : ['largest-contentful-paint']
    constructor(private callback: (list: { getEntries: () => unknown[] }) => void) {
      if (size === 'throws') throw new Error('measurement broke')
    }
    observe() {
      const entries = typeof size === 'number' ? [{ size: Math.min(size, 1) }, { size }] : [] // later entries are bigger
      setTimeout(() => this.callback({ getEntries: () => entries }), 0)
    }
    takeRecords() {
      return []
    }
    disconnect() {}
  }
  vi.stubGlobal('PerformanceObserver', FakeObserver)
}
const INPUTS = ['pointerdown', 'keydown', 'touchstart', 'wheel']
const listenedTypes = (spy: ReturnType<typeof vi.spyOn>) => (spy.mock.calls as unknown[][]).map(([type]) => String(type))

describe('page speed: it never becomes the page\'s Largest Contentful Paint', () => {
  it('on a page whose own biggest item is large (photo, hero), it appears on its normal timer with no listeners at all', async () => {
    fakeLcp(500_000)
    const add = vi.spyOn(window, 'addEventListener')
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
    for (const type of INPUTS) expect(listenedTypes(add)).not.toContain(type)
  })

  it('on a nearly empty page (biggest item smaller than the popup\'s text) it WAITS instead of taking over', async () => {
    fakeLcp(14_850)
    render(prompt())
    await sleep(400) // well past the 40 ms delay (+ the 100 ms measurement)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('treats a page with nothing contentful yet as one to wait on (the popup would BE the LCP)', async () => {
    fakeLcp(0)
    render(prompt())
    await sleep(400)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('draws the line at the limit: exactly 30,000 waits, 30,001 does not', async () => {
    fakeLcp(30_000)
    render(prompt())
    await sleep(400)
    expect(screen.queryByRole('dialog')).toBeNull()
    cleanup()

    fakeLcp(30_001)
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it.each(INPUTS)('and appears a moment after the visitor\'s first %s', async (type) => {
    fakeLcp(14_850)
    render(prompt())
    await sleep(400)
    expect(screen.queryByRole('dialog')).toBeNull()

    act(() => void window.dispatchEvent(new Event(type)))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('1')
  })

  it('stops listening after the first interaction, and appears only once', async () => {
    fakeLcp(14_850)
    const remove = vi.spyOn(window, 'removeEventListener')
    render(prompt())
    await sleep(400)
    act(() => void window.dispatchEvent(new Event('pointerdown')))
    await screen.findByRole('dialog')
    for (const type of INPUTS) expect(listenedTypes(remove)).toContain(type)
    act(() => void window.dispatchEvent(new Event('keydown')))
    await sleep(120)
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('1')
  })

  it('waits for the age gate first, and once the visitor has passed it (which took a click) it needs no second interaction', async () => {
    fakeLcp(14_850)
    localStorage.removeItem(AGE_VERIFIED_KEY)
    render(prompt())
    await sleep(400)
    expect(screen.queryByRole('dialog')).toBeNull() // the age gate is still up

    localStorage.setItem(AGE_VERIFIED_KEY, 'true') // passing the gate is a click
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('after an interaction it still waits for another open dialog to be gone', async () => {
    fakeLcp(14_850)
    render(prompt())
    await sleep(400)
    document.body.style.overflow = 'hidden' // some other dialog / scroll lock is up
    act(() => void window.dispatchEvent(new Event('pointerdown')))
    await sleep(200)
    expect(screen.queryByRole('dialog')).toBeNull()

    document.body.style.overflow = ''
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('moving to another page drops the old wait: interactions then only ever show the new page\'s popup, once', async () => {
    fakeLcp(14_850)
    const { rerender } = render(prompt())
    await sleep(300) // waiting for an interaction on /shop
    h.pathname = '/about'
    rerender(prompt())
    await sleep(300) // now waiting on /about
    act(() => void window.dispatchEvent(new Event('pointerdown')))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    await sleep(150)
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('1')
  })

  it('leaves no listeners behind when the visitor leaves the page (or the component goes away) without interacting', async () => {
    fakeLcp(14_850)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(prompt())
    await sleep(300) // now waiting for an interaction
    for (const type of INPUTS) expect(listenedTypes(add)).toContain(type)
    expect(listenedTypes(remove)).not.toContain('keydown')

    unmount()
    for (const type of INPUTS) expect(listenedTypes(remove)).toContain(type)
  })

  it('has nothing to protect when the browser does not measure LCP: it simply appears', async () => {
    fakeLcp('unsupported')
    const add = vi.spyOn(window, 'addEventListener')
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
    for (const type of INPUTS) expect(listenedTypes(add)).not.toContain(type)
  })

  it('never lets a broken measurement stop it from appearing', async () => {
    fakeLcp('throws')
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('does not even take the measurement for logged-in visitors', async () => {
    h.status = 'authenticated'
    const observed = vi.fn()
    class Spy {
      static supportedEntryTypes = ['largest-contentful-paint']
      constructor() {
        observed()
      }
      observe() {}
      takeRecords() {
        return []
      }
      disconnect() {}
    }
    vi.stubGlobal('PerformanceObserver', Spy)
    render(prompt())
    await sleep(300)
    expect(observed).not.toHaveBeenCalled()
  })

  it('does not take the measurement while the page is loading, only when the popup is due', async () => {
    const observed = vi.fn()
    class Spy {
      static supportedEntryTypes = ['largest-contentful-paint']
      constructor() {
        observed()
      }
      observe() {}
      takeRecords() {
        return []
      }
      disconnect() {}
    }
    vi.stubGlobal('PerformanceObserver', Spy)
    render(prompt())
    await sleep(15) // before the 40 ms delay is up
    expect(observed).not.toHaveBeenCalled()
    await sleep(200)
    expect(observed).toHaveBeenCalledTimes(1)
  })
})

describe('when it never shows', () => {
  it('a logged-in customer never sees it, and nothing is even scheduled', async () => {
    h.status = 'authenticated'
    const timeouts = vi.spyOn(window, 'setTimeout')
    render(prompt())
    await sleep(150)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scheduled(timeouts)).toBe(false)
  })

  it('does not show while the login state is still being checked', async () => {
    h.status = 'loading'
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each(['/login', '/register', '/cart', '/checkout', '/account/orders'])('never on %s, and nothing is scheduled', async (path) => {
    h.pathname = path
    const timeouts = vi.spyOn(window, 'setTimeout')
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scheduled(timeouts)).toBe(false)
  })

  it('is off when the restriction is switched off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    const timeouts = vi.spyOn(window, 'setTimeout')
    render(prompt())
    await sleep(150)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scheduled(timeouts)).toBe(false)
  })

  it('when it cannot appear here (closed a moment ago, or the cap is reached) nothing is scheduled at all', async () => {
    for (const setup of [
      () => sessionStorage.setItem(LOGIN_PROMPT_CLOSED_KEY, String(Date.now())),
      () => sessionStorage.setItem(LOGIN_PROMPT_SHOWN_COUNT_KEY, '3'),
    ]) {
      cleanup()
      sessionStorage.clear()
      setup()
      const timeouts = vi.spyOn(window, 'setTimeout')
      render(prompt())
      await sleep(150)

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(scheduled(timeouts)).toBe(false) // no delay, no preload, no retry loop
      timeouts.mockRestore()
    }
  })
})

// Pretend `ms` milliseconds have passed (the popup's own timers keep running in real time).
const realDateNow = Date.now.bind(Date) // captured once, before anything is mocked
let clockOffset = 0
const advanceClock = (ms: number) => {
  clockOffset += ms // calling it twice moves the clock on twice
  vi.spyOn(Date, 'now').mockImplementation(() => realDateNow() + clockOffset)
}
const goTo = (rerender: (ui: React.ReactElement) => void, path: string) => {
  h.pathname = path
  rerender(prompt())
}
const closeIt = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}
const MIN = 60 * 1000

describe('reminders: it comes back on other pages, but closing it is respected', () => {
  it('closing it remembers when, and it does not come back on the next two pages (or the same page)', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()

    expect(Number(sessionStorage.getItem(LOGIN_PROMPT_CLOSED_KEY))).toBeGreaterThan(1_000_000_000_000) // a timestamp
    expect(sessionStorage.getItem(LOGIN_PROMPT_PAGES_KEY)).toBe('0')
    expect(Number(localStorage.getItem(LOGIN_PROMPT_DISMISSED_KEY))).toBeGreaterThan(0)

    await sleep(120) // same page: nothing comes back
    expect(screen.queryByRole('dialog')).toBeNull()

    advanceClock(10 * MIN) // plenty of time has passed, so only the number of pages is holding it back
    for (const path of ['/about', '/faq']) {
      goTo(rerender, path)
      await sleep(120)
      expect(screen.queryByRole('dialog')).toBeNull()
    }
    expect(sessionStorage.getItem(LOGIN_PROMPT_PAGES_KEY)).toBe('2')
  })

  it('does not come back within 3 minutes of being closed, however many pages are viewed', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()

    for (const path of ['/about', '/faq', '/journal', '/certificates', '/']) {
      goTo(rerender, path)
      await sleep(100)
      expect(screen.queryByRole('dialog')).toBeNull()
    }
    expect(Number(sessionStorage.getItem(LOGIN_PROMPT_PAGES_KEY))).toBe(5)
  })

  it('reminds them again on the 3rd page after closing it, once 3 minutes have passed', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()
    advanceClock(4 * MIN)

    goTo(rerender, '/about')
    await sleep(100)
    goTo(rerender, '/faq')
    await sleep(100)
    expect(screen.queryByRole('dialog')).toBeNull()

    goTo(rerender, '/journal') // the 3rd page since it was closed
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('2')
  })

  it('closing the reminder starts the waiting again from zero', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()
    advanceClock(4 * MIN)
    for (const path of ['/about', '/faq']) goTo(rerender, path)
    goTo(rerender, '/journal')
    await screen.findByRole('dialog')
    await closeIt() // closed the reminder too

    expect(sessionStorage.getItem(LOGIN_PROMPT_PAGES_KEY)).toBe('0')
    advanceClock(20 * MIN)
    goTo(rerender, '/certificates')
    await sleep(120)
    expect(screen.queryByRole('dialog')).toBeNull() // only 1 page since the second close
  })

  it('appears at most 3 times in one browsing session, even if the visitor never closes it', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog') // 1st
    for (const path of ['/about', '/faq']) {
      goTo(rerender, path)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(await screen.findByRole('dialog')).toBeTruthy() // 2nd, 3rd
    }
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('3')

    for (const path of ['/journal', '/certificates']) {
      goTo(rerender, path)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await sleep(120)
      expect(screen.queryByRole('dialog')).toBeNull() // no 4th
    }
  })

  it('a brand-new browsing session starts fresh, even though the browser remembers it was closed before', async () => {
    const first = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()
    first.unmount()

    sessionStorage.clear()
    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('still respects a close when the browser blocks sessionStorage (kept in memory instead)', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    await closeIt()

    for (const path of ['/about', '/faq']) {
      goTo(rerender, path)
      await sleep(120)
      expect(screen.queryByRole('dialog')).toBeNull() // not straight back, even without sessionStorage
    }
  })

  it('if the visitor leaves without closing it, it comes back on their next visit', async () => {
    const first = render(prompt())
    await screen.findByRole('dialog')
    first.unmount() // they left the site without closing it

    render(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('moving to another page takes it away but does not count as closing it: it comes back on the next page', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')

    h.pathname = '/about'
    rerender(prompt())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(sessionStorage.getItem(LOGIN_PROMPT_CLOSED_KEY)).toBeNull()

    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('choosing Create account is NOT closing it: if they come back without logging in, it appears again', async () => {
    const { rerender } = render(prompt())
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('link', { name: /create free account/i }))
    expect(sessionStorage.getItem(LOGIN_PROMPT_CLOSED_KEY)).toBeNull() // not marked as closed

    // they land on the register page: no popup there
    h.pathname = '/register'
    rerender(prompt())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await sleep(120)
    expect(screen.queryByRole('dialog')).toBeNull()

    // ...and they come back to the shop without having logged in: it is back
    h.pathname = '/shop'
    rerender(prompt())
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })
})

// ─── The dialog ───────────────────────────────────────────────────────────────

function open(props: Partial<React.ComponentProps<typeof LoginPromptModal>> = {}) {
  const onDismiss = vi.fn()
  const onClosed = vi.fn()
  const view = render(React.createElement(LoginPromptModal, { returnTo: '/shop', onDismiss, onClosed, ...props }))
  return { ...view, onDismiss, onClosed }
}

describe('the dialog', () => {
  it('is a labelled, modal dialog with the invitation text', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'Unlock the full catalogue.' })).toBe(dialog)
    // advertises the member discount, and never names the GLP-1 compounds
    expect(dialog.textContent).toContain('20% member discount')
    expect(dialog.textContent).toContain('20% off every order')
    // and says plainly that it is not combinable
    expect(dialog.textContent).toContain("can't be combined with other discounts")
    expect(dialog.textContent).not.toMatch(/glp/i)
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('has Create free account and Forgot password links that bring the visitor back to this page (logging in itself happens in the popup)', () => {
    open({ returnTo: '/products/bpc-157' })
    expect(screen.getByRole('link', { name: /create free account/i }).getAttribute('href')).toBe('/register?next=%2Fproducts%2Fbpc-157')
    expect(screen.getByRole('link', { name: /forgot password/i }).getAttribute('href')).toBe('/forgot-password?next=%2Fproducts%2Fbpc-157')
    expect(screen.queryByRole('link', { name: /^log in$/i })).toBeNull() // Log in is a button of the form, not a link to another page
    expect(screen.getByRole('button', { name: 'Log in' }).getAttribute('type')).toBe('submit')
  })

  it('never carries an unsafe return address into the links', () => {
    for (const bad of ['//evil.example', 'https://evil.example', 'javascript:alert(1)', '/login']) {
      cleanup()
      open({ returnTo: bad })
      expect(screen.getByRole('link', { name: /forgot password/i }).getAttribute('href')).toBe('/forgot-password')
      expect(screen.getByRole('link', { name: /create free account/i }).getAttribute('href')).toBe('/register')
    }
  })

  it('moves focus to the dialog itself when it opens (announced by name; no button is highlighted)', () => {
    open()
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('Tab from the dialog reaches the first control, and Shift+Tab from the dialog wraps to the last (never escapes)', () => {
    open()
    const dialog = screen.getByRole('dialog')
    expect(document.activeElement).toBe(dialog)

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Maybe later' }))
  })

  it('keeps Tab and Shift+Tab inside the dialog', () => {
    open()
    const loginButton = screen.getByRole('button', { name: 'Log in' })
    const maybeLater = screen.getByRole('button', { name: 'Maybe later' })

    maybeLater.focus()
    fireEvent.keyDown(maybeLater, { key: 'Tab' })
    expect(document.activeElement).not.toBe(maybeLater)
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)

    const first = screen.getByRole('button', { name: 'Close' })
    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    expect(loginButton).toBeTruthy()
  })

  it('Tab also wraps round the form fields: from the last control to the Close button, and back', () => {
    open()
    const close = screen.getByRole('button', { name: 'Close' })
    const maybeLater = screen.getByRole('button', { name: 'Maybe later' })
    const dialog = screen.getByRole('dialog')
    // every control of the form is inside the Tab loop, between Close and Maybe later
    const controls = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')]
    expect(controls[0]).toBe(close)
    expect(controls[controls.length - 1]).toBe(maybeLater)
    for (const name of ['Continue with Google', 'Log in', 'Show password']) {
      expect(controls).toContain(screen.getByRole('button', { name }))
    }
    expect(controls).toContain(screen.getByLabelText('Email'))
    expect(controls).toContain(screen.getByLabelText('Password'))

    maybeLater.focus()
    fireEvent.keyDown(maybeLater, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
  })

  it('locks page scrolling while open and restores it afterwards', () => {
    document.body.style.overflow = ''
    const { unmount } = open()
    expect(document.body.style.overflow).toBe('hidden')
    expect(h.lenis.stop).toHaveBeenCalled()

    unmount()
    expect(document.body.style.overflow).toBe('')
    expect(h.lenis.start).toHaveBeenCalled()
  })

  it('pads the page by the scrollbar width while open (so it does not jump sideways) and restores it afterwards', () => {
    // jsdom has no scrollbars: pretend this is a desktop with a 15px one
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1366)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1351)
    document.body.style.paddingRight = ''
    const { unmount } = open()
    expect(document.body.style.paddingRight).toBe('15px')
    unmount()
    expect(document.body.style.paddingRight).toBe('')
  })

  it('adds nothing where there is no permanent scrollbar (phones, overlay scrollbars) and keeps any padding the page had', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(390)
    document.body.style.paddingRight = '4px'
    const { unmount } = open()
    expect(document.body.style.paddingRight).toBe('4px')
    unmount()
    expect(document.body.style.paddingRight).toBe('4px')
    document.body.style.paddingRight = ''
  })

  it('never invents a huge padding from a nonsense measurement', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1366)
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(0) // jsdom-style "unknown" width
    document.body.style.paddingRight = ''
    const { unmount } = open()
    expect(document.body.style.paddingRight).toBe('')
    unmount()
  })

  it('returns focus to where it was before it opened', () => {
    const before = document.createElement('button')
    document.body.appendChild(before)
    before.focus()
    const { unmount } = open()
    expect(document.activeElement).not.toBe(before)
    unmount()
    expect(document.activeElement).toBe(before)
    before.remove()
  })

  it.each([
    ['the Close button', () => fireEvent.click(screen.getByRole('button', { name: 'Close' }))],
    ['Maybe later', () => fireEvent.click(screen.getByRole('button', { name: 'Maybe later' }))],
    ['the Escape key', () => fireEvent.keyDown(document, { key: 'Escape' })],
  ])('closes with %s, remembering it and telling its parent when finished', async (_label, close) => {
    const { onDismiss, onClosed } = open()
    close()
    expect(onDismiss).toHaveBeenCalled()
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('clicking OUTSIDE the card does NOT close it', () => {
    const { onDismiss } = open()
    const outside = screen.getByRole('dialog').parentElement as HTMLElement
    fireEvent.click(outside)
    fireEvent.mouseDown(outside)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('does not close when clicking inside the card', () => {
    const { onDismiss } = open()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('choosing Create account or Forgot password does not count as closing it', () => {
    const { onDismiss } = open()
    fireEvent.click(screen.getByRole('link', { name: /forgot password/i }))
    fireEvent.click(screen.getByRole('link', { name: /create free account/i }))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

// ─── Basket notice ────────────────────────────────────────────────────────────

describe('the basket notice for logged-out visitors holding a members-only product', () => {
  const line = (slug: string) => ({
    lineId: slug,
    productId: slug,
    variantSku: null,
    quantity: 1,
    priceSnapshot: 10,
    product: { id: slug, name: slug, slug, imageUrl: null },
  })
  const setBasket = (...slugs: string[]) => act(() => useCartStore.setState({ items: slugs.map(line) as any }))

  afterEach(() => act(() => useCartStore.setState({ items: [] })))

  it('explains why they cannot check out and offers Log in / Create account that return to the basket', () => {
    setBasket('bpc-157', 'bpc-157-spray')
    render(notice('/cart'))

    expect(screen.getByRole('alert').textContent).toContain('members-only products')
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login?next=%2Fcart')
    expect(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')).toBe('/register?next=%2Fcart')
  })

  it.each(['glp-3rta', 'tirzepatide', 'semaglutide'])('is shown when the basket holds %s (vial)', (slug) => {
    setBasket('bpc-157', slug)
    render(notice('/cart'))
    expect(screen.getByRole('alert').textContent).toContain('members-only products')
  })

  it('returns to checkout when shown on the checkout page', () => {
    setBasket('bpc-157-spray')
    render(notice('/checkout'))
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login?next=%2Fcheckout')
  })

  it('is not shown to a logged-in customer', () => {
    h.status = 'authenticated'
    setBasket('bpc-157-spray')
    render(notice('/cart'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('is not shown when the basket has no members-only product', () => {
    setBasket('bpc-157', 'tb-500')
    render(notice('/cart'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('is not shown while the login state is still being checked (no flash)', () => {
    h.status = 'loading'
    setBasket('bpc-157-spray')
    render(notice('/cart'))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
