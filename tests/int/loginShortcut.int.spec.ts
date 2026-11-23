/**
 * The corner shortcut: a small fixed "Members: save 15%" button that opens the login popup on demand.
 *
 * What is tested, in a simulated browser:
 * - When it appears: a moment after the page has loaded, only for logged-out visitors, only after the age gate has
 *   been passed, only on pages where the popup may appear, never when the restriction (kill switch) is off.
 * - It follows the visitor: gone on sign-in / basket / checkout / account pages, back on the next shop page,
 *   gone the moment they log in.
 * - Pressing it opens the real popup, whatever the reminder limits say, without using up a reminder.
 * - Page speed: on a nearly empty page it waits for the visitor's first interaction (so it can never be the page's
 *   Largest Contentful Paint); it leaves no listeners behind.
 * - Accessibility and layout hooks: a labelled button that announces a dialog, lifted above the product page's bar.
 *
 * Next's router, login state, framer-motion and Lenis are mocked; the shortcut and popup code are the real thing.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  pathname: '/shop',
  lenis: { stop: vi.fn(), start: vi.fn() },
  // the popup's login form
  signIn: vi.fn(async (..._args: unknown[]) => ({ error: null, ok: true }) as { error: string | null; ok: boolean } | undefined),
  refresh: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: h.status, data: null }),
  signIn: (...args: unknown[]) => h.signIn(...args),
}))
vi.mock('sonner', () => ({ toast: { success: (...args: unknown[]) => h.toast(...args), error: vi.fn() } }))
vi.mock('next/navigation', () => ({ usePathname: () => h.pathname, useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }))
vi.mock('lenis/react', () => ({ useLenis: () => h.lenis }))

// Short timings so the tests run quickly; every other rule is the real one. The popup's own automatic timer is pushed
// far away so only the shortcut can open it here.
vi.mock('@/lib/access/loginPrompt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/access/loginPrompt')>()),
  LOGIN_SHORTCUT_DELAY_MS: 40,
  LOGIN_PROMPT_RETRY_MS: 20,
  LOGIN_PROMPT_AFTER_INTERACTION_MS: 30,
  pickPromptDelay: () => 1_000_000,
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
import { LoginShortcut } from '../../src/components/shared/LoginShortcut'
import { requestLoginPrompt } from '../../src/lib/access/loginPromptBus'
import {
  AGE_VERIFIED_KEY,
  LOGIN_PROMPT_CLOSED_KEY,
  LOGIN_PROMPT_SHOWN_COUNT_KEY,
} from '../../src/lib/access/loginPrompt'

const both = () => React.createElement(React.Fragment, null, React.createElement(LoginPrompt), React.createElement(LoginShortcut))
const shortcutOnly = () => React.createElement(LoginShortcut)

const savedFlag = process.env.NEXT_PUBLIC_RESTRICT_SPRAYS
const sleep = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)))
const button = () => screen.queryByRole('button', { name: /member discount/i })
const wrapper = () => screen.queryByTestId('login-shortcut')

beforeEach(() => {
  h.status = 'unauthenticated'
  h.pathname = '/shop'
  h.lenis.stop.mockClear()
  h.lenis.start.mockClear()
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

// A fake browser LCP measurement: the page's biggest contentful item so far is `size` px².
const fakeLcp = (size: number) => {
  class FakeObserver {
    static supportedEntryTypes = ['largest-contentful-paint']
    constructor(private callback: (list: { getEntries: () => unknown[] }) => void) {}
    observe() {
      setTimeout(() => this.callback({ getEntries: () => [{ size }] }), 0)
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

// ─── When it appears ──────────────────────────────────────────────────────────

describe('when it appears', () => {
  it('shows nothing at first, then appears a moment after the page has loaded', async () => {
    render(shortcutOnly())
    expect(wrapper()).toBeNull()
    await sleep(15)
    expect(wrapper()).toBeNull()
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it('is a button that says what it is for, with the member discount in plain words', async () => {
    render(shortcutOnly())
    const el = await screen.findByRole('button', { name: /member discount/i })
    expect(el.getAttribute('aria-label')).toBe('Member discount: 15% off every order. Log in or create a free account.')
    expect(el.getAttribute('aria-haspopup')).toBe('dialog')
    expect(el.getAttribute('type')).toBe('button')
    expect(el.textContent).toContain('Members')
    expect(el.textContent).toContain('Save 15% on every order') // on larger screens
    expect(el.textContent).toContain('15% off') // on phones
  })

  it('never mentions GLP-1', async () => {
    render(shortcutOnly())
    const el = await screen.findByTestId('login-shortcut')
    expect(el.textContent).not.toMatch(/glp/i)
  })

  it('appears on every kind of ordinary page', async () => {
    for (const path of ['/', '/shop', '/products/bpc-157', '/journal/some-post', '/about', '/contact']) {
      h.pathname = path
      const { unmount } = render(shortcutOnly())
      expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
      unmount()
    }
  })

  it('never appears for a logged-in customer, and nothing is even scheduled', async () => {
    h.status = 'authenticated'
    const timeouts = vi.spyOn(window, 'setTimeout')
    const add = vi.spyOn(window, 'addEventListener')
    render(shortcutOnly())
    await sleep(200)
    expect(wrapper()).toBeNull()
    expect((timeouts.mock.calls as unknown[][]).filter(([, ms]) => ms === 40 || ms === 20)).toHaveLength(0)
    expect(listenedTypes(add)).not.toContain('load')
  })

  it('waits while it is still unknown whether the visitor is logged in (no flash for customers)', async () => {
    h.status = 'loading'
    const { rerender } = render(shortcutOnly())
    await sleep(150)
    expect(wrapper()).toBeNull()

    h.status = 'unauthenticated'
    rerender(shortcutOnly())
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it('never appears when the restriction (kill switch) is off', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    render(shortcutOnly())
    await sleep(200)
    expect(wrapper()).toBeNull()
  })

  it('waits for the age gate: it never sits on top of it', async () => {
    localStorage.removeItem(AGE_VERIFIED_KEY)
    render(shortcutOnly())
    await sleep(250)
    expect(wrapper()).toBeNull()

    localStorage.setItem(AGE_VERIFIED_KEY, 'true') // passing the gate
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it('waits while the tab is in the background', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    render(shortcutOnly())
    await sleep(200)
    expect(wrapper()).toBeNull()
    visibility.mockReturnValue('visible')
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it('never appears when storage is blocked (the age gate cannot be known to be passed)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(shortcutOnly())
    await sleep(200)
    expect(wrapper()).toBeNull()
  })
})

// ─── It follows the visitor ───────────────────────────────────────────────────

describe('as the visitor moves around', () => {
  it.each(['/login', '/register', '/forgot-password', '/cart', '/checkout', '/account', '/account/orders/5', '/order-confirmation/9', '/admin', '/affiliates/dashboard'])(
    'is not on %s',
    async (path) => {
      h.pathname = path
      render(shortcutOnly())
      await sleep(200)
      expect(wrapper()).toBeNull()
    },
  )

  it('goes away on the basket page and is straight back on the next shop page (no second wait)', async () => {
    const { rerender } = render(shortcutOnly())
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()

    h.pathname = '/cart'
    rerender(shortcutOnly())
    expect(wrapper()).toBeNull()

    h.pathname = '/shop'
    rerender(shortcutOnly())
    expect(wrapper()).not.toBeNull() // immediately, not after another delay
  })

  it('goes the moment the visitor logs in', async () => {
    const { rerender } = render(shortcutOnly())
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()

    h.status = 'authenticated'
    rerender(shortcutOnly())
    expect(wrapper()).toBeNull()
  })

  it('on product pages it sits above the full-width "add to cart" bar (phones and tablets)', async () => {
    h.pathname = '/products/bpc-157'
    render(shortcutOnly())
    expect((await screen.findByTestId('login-shortcut')).className).toContain('ls-wrap--lift')
  })

  it('on other pages it sits in the plain corner', async () => {
    render(shortcutOnly())
    expect((await screen.findByTestId('login-shortcut')).className).not.toContain('ls-wrap--lift')
  })

  it('switches its animation off for people who prefer reduced motion', async () => {
    render(shortcutOnly())
    const css = (await screen.findByTestId('login-shortcut')).querySelector('style')?.textContent ?? ''
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
    // inside that block, every animated part (the entrance, the pulse ring and the sheen) is switched off
    const reduced = css.slice(css.search(/@media \(prefers-reduced-motion:\s*reduce\)/))
    expect(reduced).toContain('.ls-wrap')
    expect(reduced).toContain('.ls-ring')
    expect(reduced).toContain('.ls-shine::before')
    expect(reduced).toContain('animation:none')
  })

  it('has a visible "Log in" call to action, so it reads as a button', async () => {
    render(shortcutOnly())
    const el = await screen.findByRole('button', { name: /member discount/i })
    expect(el.textContent).toContain('Log in')
  })

  it('keeps the same gap above, below, left and right of what is inside the pill', async () => {
    render(shortcutOnly())
    const el = await screen.findByRole('button', { name: /member discount/i })
    // one padding value on all four sides...
    expect(el.className).toMatch(/(^|\s)p-1\.5(\s|$)/)
    expect(el.className).not.toMatch(/(^|\s)p[xytblr]-/)
    // ...and the right-hand chip is exactly as tall as the gold badge on the left, at both sizes, so the gap is equal all round
    const badge = el.querySelector('.ls-badge') as HTMLElement
    const chips = Array.from(el.querySelectorAll(':scope > span[aria-hidden="true"]')).filter((s) => !s.classList.contains('ls-shine')) as HTMLElement[]
    expect(chips.length).toBe(2) // the phone arrow and the desktop "Log in" chip
    const [phoneChip, desktopChip] = chips
    expect(badge.className).toMatch(/(^|\s)h-10(\s|$)/)
    expect(phoneChip.className).toMatch(/(^|\s)h-10(\s|$)/)
    expect(badge.className).toMatch(/(^|\s)sm:h-11(\s|$)/)
    expect(desktopChip.className).toMatch(/(^|\s)h-11(\s|$)/)
    expect(desktopChip.className).not.toMatch(/(^|\s)py-/)
  })

  it('shows the offer with the 15% picked out, in one piece of text', async () => {
    render(shortcutOnly())
    const el = await screen.findByTestId('login-shortcut')
    const highlighted = Array.from(el.querySelectorAll('span')).filter((s) => s.className.includes('text-gold-light') && s.textContent === '15%')
    expect(highlighted.length).toBe(2) // one for phones ("15% off"), one for larger screens ("Save 15% on every order")
  })
})

// ─── Opening the popup ────────────────────────────────────────────────────────

describe('pressing it', () => {
  it('opens the real login popup, with the member discount', async () => {
    render(both())
    fireEvent.click(await screen.findByRole('button', { name: /member discount/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Unlock the full catalogue.' })
    expect(dialog.textContent).toContain('15% member discount')
    expect(dialog.textContent).not.toMatch(/glp/i)
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy() // the login form is right there in the popup
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /create free account/i }).getAttribute('href')).toBe('/register?next=%2Fshop')
  })

  it('works whatever the reminder limits say (the visitor asked for it), without using up a reminder', async () => {
    sessionStorage.setItem(LOGIN_PROMPT_SHOWN_COUNT_KEY, '3') // the per-session cap is already used up
    sessionStorage.setItem(LOGIN_PROMPT_CLOSED_KEY, String(Date.now())) // and it was just closed
    render(both())
    fireEvent.click(await screen.findByRole('button', { name: /member discount/i }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(sessionStorage.getItem(LOGIN_PROMPT_SHOWN_COUNT_KEY)).toBe('3') // not counted
  })

  it('closing it behaves like any other close: remembered, and the shortcut stays where it is', async () => {
    render(both())
    fireEvent.click(await screen.findByRole('button', { name: /member discount/i }))
    await screen.findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape' })
    await sleep(60)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(sessionStorage.getItem(LOGIN_PROMPT_CLOSED_KEY)).toBeTruthy()
    expect(wrapper()).not.toBeNull()
  })

  it('can be used again and again', async () => {
    render(both())
    for (let i = 0; i < 3; i++) {
      fireEvent.click(await screen.findByRole('button', { name: /member discount/i }))
      expect(await screen.findByRole('dialog')).toBeTruthy()
      fireEvent.keyDown(document, { key: 'Escape' })
      await sleep(60)
      expect(screen.queryByRole('dialog')).toBeNull()
    }
  })

  it('opens nothing for a logged-in customer, even if asked', async () => {
    h.status = 'authenticated'
    render(both())
    act(() => requestLoginPrompt())
    await sleep(100)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens nothing when the restriction is off, even if asked', async () => {
    process.env.NEXT_PUBLIC_RESTRICT_SPRAYS = 'false'
    render(both())
    act(() => requestLoginPrompt())
    await sleep(100)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('asking with no popup on the page does nothing (and does not throw)', () => {
    expect(() => requestLoginPrompt()).not.toThrow()
  })

  it('stops listening when the popup goes away', async () => {
    const view = render(both())
    await screen.findByTestId('login-shortcut')
    view.unmount()
    expect(() => act(() => requestLoginPrompt())).not.toThrow()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

// ─── Page speed ───────────────────────────────────────────────────────────────

describe('page speed: it never becomes the page\'s Largest Contentful Paint', () => {
  it('on a page whose own biggest item is large (photo, hero), it appears on its normal timer with no listeners at all', async () => {
    fakeLcp(500_000)
    const add = vi.spyOn(window, 'addEventListener')
    render(shortcutOnly())
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
    for (const type of INPUTS) expect(listenedTypes(add)).not.toContain(type)
  })

  it('on a nearly empty page it waits for the visitor\'s first scroll / click / tap / key press', async () => {
    fakeLcp(5_000)
    render(shortcutOnly())
    await sleep(300)
    expect(wrapper()).toBeNull() // still waiting

    act(() => void window.dispatchEvent(new Event('pointerdown')))
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it.each(INPUTS)('any %s ends the wait', async (type) => {
    fakeLcp(5_000)
    render(shortcutOnly())
    await sleep(300)
    expect(wrapper()).toBeNull()
    act(() => void window.dispatchEvent(new Event(type)))
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })

  it('leaves no listeners behind when the visitor leaves without interacting', async () => {
    fakeLcp(5_000)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(shortcutOnly())
    await sleep(300)
    for (const type of INPUTS) expect(listenedTypes(add)).toContain(type)
    unmount()
    for (const type of INPUTS) expect(listenedTypes(remove)).toContain(type)
  })

  it('has nothing to protect when the browser does not measure LCP: it simply appears', async () => {
    class Unsupported {
      static supportedEntryTypes = ['mark']
    }
    vi.stubGlobal('PerformanceObserver', Unsupported)
    render(shortcutOnly())
    expect(await screen.findByTestId('login-shortcut')).toBeTruthy()
  })
})

describe('near the footer', () => {
  // A footer the simulated browser can "scroll": its top edge is wherever the test says (jsdom has no real layout).
  const addFooter = (initialTop: number, marked = true) => {
    let top = initialTop
    const el = document.createElement('footer')
    if (marked) el.setAttribute('data-site-footer', '')
    el.getBoundingClientRect = () => ({ top, bottom: top + 500, left: 0, right: 0, width: 0, height: 500, x: 0, y: top, toJSON: () => ({}) }) as DOMRect
    document.body.appendChild(el)
    return {
      moveTo: async (next: number) => {
        top = next
        window.dispatchEvent(new Event('scroll'))
        await sleep(60) // the check runs on the next animation frame
      },
      remove: () => el.remove(),
    }
  }
  const isAway = () => wrapper()!.className.includes('ls-wrap--away')

  it('steps out of the way when the footer scrolls into view, and comes back when it scrolls out again', async () => {
    const footer = addFooter(5000) // far below the bottom of the screen (768px tall)
    try {
      render(shortcutOnly())
      await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
      expect(isAway()).toBe(false)

      await footer.moveTo(300) // the footer is on screen
      expect(isAway()).toBe(true)
      expect(wrapper()!.getAttribute('aria-hidden')).toBe('true')
      // (the role lookup deliberately cannot see it now: it is hidden from assistive technology)
      expect(button()).toBeNull()
      expect(wrapper()!.querySelector('button')!.getAttribute('tabindex')).toBe('-1') // and cannot be tabbed to

      await footer.moveTo(5000) // scrolled back up
      expect(isAway()).toBe(false)
      expect(wrapper()!.getAttribute('aria-hidden')).toBeNull()
      expect(button()!.getAttribute('tabindex')).toBeNull()
    } finally {
      footer.remove()
    }
  })

  it('stays away from the footer even on a short page where the footer is on screen from the start', async () => {
    const footer = addFooter(400)
    try {
      render(shortcutOnly())
      await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
      expect(isAway()).toBe(true)
    } finally {
      footer.remove()
    }
  })

  it('does not leave until the footer is actually coming into view', async () => {
    const footer = addFooter(900) // 132px below the bottom edge of the 768px screen
    try {
      render(shortcutOnly())
      await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
      expect(isAway()).toBe(false)
      await footer.moveTo(759) // just inside the 8px margin: the footer is 9px into view
      expect(isAway()).toBe(true)
    } finally {
      footer.remove()
    }
  })

  it('only reacts to the site footer: another <footer> on the page (e.g. under a blog post) is ignored', async () => {
    const other = addFooter(100, false)
    try {
      render(shortcutOnly())
      await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
      await other.moveTo(100)
      expect(isAway()).toBe(false)
    } finally {
      other.remove()
    }
  })

  it('shows normally on a page with no footer at all', async () => {
    render(shortcutOnly())
    await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
    window.dispatchEvent(new Event('scroll'))
    await sleep(60)
    expect(isAway()).toBe(false)
  })

  it('stops listening for scrolling when it goes away (nothing is left behind)', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(shortcutOnly())
    await screen.findByTestId('login-shortcut')
      await sleep(60) // let the button's own effects run (its scroll listener is attached there)
    const scrolls = add.mock.calls.filter(([type]) => type === 'scroll').length
    expect(scrolls).toBeGreaterThan(0)
    unmount()
    expect(remove.mock.calls.filter(([type]) => type === 'scroll').length).toBeGreaterThanOrEqual(scrolls)
  })

  it('both site footers carry the marker the shortcut looks for', async () => {
    const { readFileSync } = await import('node:fs')
    for (const file of ['src/components/shared/Footer.tsx', 'src/components/shared/MinimalFooter.tsx']) {
      expect(readFileSync(file, 'utf8'), file).toMatch(/<footer\s+data-site-footer[\s>]/)
    }
  })
})
