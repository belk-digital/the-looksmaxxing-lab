/**
 * LCP safety of the login popup: the popup's code is NOT part of the page load.
 *
 * Two guards:
 *  1. Behaviour: in a page where the popup code has never been loaded, nothing downloads it while the page is
 *     loading or in the first moments after; it is fetched shortly BEFORE the popup is due, then shown.
 *  2. Structure: the file that ships with EVERY page (LoginPrompt.tsx) stays tiny. It must not import the
 *     animation library, icons, smooth-scroll library or the popup itself, except through a lazy import(),
 *     so a future edit can't quietly put the popup into the first page load.
 *
 * (The popup module is deliberately not imported at the top of this file: that is what makes guard 1 meaningful.)
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, cleanup, act } from '@testing-library/react'

const h = vi.hoisted(() => ({ downloads: 0 }))

vi.mock('next-auth/react', () => ({ useSession: () => ({ status: 'unauthenticated', data: null }) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/shop' }))
vi.mock('lenis/react', () => ({ useLenis: () => ({ stop: () => undefined, start: () => undefined }) }))
vi.mock('@/lib/access/loginPrompt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/access/loginPrompt')>()),
  pickPromptDelay: () => 400, // the real delay is a random 6-12 s
  LOGIN_PROMPT_PRELOAD_LEAD_MS: 200, // so the code is fetched at 200 ms
}))

// The factory runs when the popup's code is first downloaded: nothing else in this file imports it.
vi.mock('@/components/shared/LoginPromptModal', async (importOriginal) => {
  h.downloads += 1
  return await importOriginal<typeof import('@/components/shared/LoginPromptModal')>()
})

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
  return { default: R.forwardRef(({ href, children, prefetch: _p, ...rest }: any, ref: any) => R.createElement('a', { href, ref, ...rest }, children)) }
})
vi.mock('framer-motion', async () => {
  const R = await import('react')
  const motion = new Proxy({}, { get: (_t, tag: string) => R.forwardRef((props: any, ref) => {
    const { initial, animate, exit, transition, ...rest } = props
    return R.createElement(tag, { ...rest, ref })
  }) })
  return { motion, AnimatePresence: ({ children }: any) => children || null, MotionConfig: ({ children }: any) => children }
})

import { LoginPrompt } from '../../src/components/shared/LoginPrompt'

const sleep = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('longevia_age_verified', 'true')
  document.body.style.overflow = ''
})
afterEach(() => cleanup())

describe('the popup code is not part of the page load', () => {
  it('is not downloaded during page load or the first moments after, but is fetched just before the popup is due', async () => {
    const { container } = render(React.createElement(LoginPrompt))

    // The page has just finished loading: nothing rendered, nothing downloaded yet.
    await sleep(80)
    expect(container.innerHTML).toBe('')
    expect(h.downloads).toBe(0)

    // Just before the popup is due, its code is fetched and then it is shown (no scroll or click was needed).
    expect(await screen.findByRole('dialog', undefined, { timeout: 2000 })).toBeTruthy()
    expect(h.downloads).toBe(1)
  })
})

describe('the file that ships with every page stays tiny', () => {
  const source = readFileSync(join(__dirname, '..', '..', 'src', 'components', 'shared', 'LoginPrompt.tsx'), 'utf8')
  const staticImports = [...source.matchAll(/^import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map((m) => m[1])

  it('has no static import of the animation library, icons, smooth-scroll library or the popup itself', () => {
    for (const forbidden of ['framer-motion', 'lucide-react', 'lenis', 'lenis/react', '@/components/shared/LoginPromptModal', './LoginPromptModal']) {
      expect(staticImports).not.toContain(forbidden)
    }
  })

  it('loads the popup only through a lazy import()', () => {
    expect(source).toMatch(/dynamic\(\(\) => import\('@\/components\/shared\/LoginPromptModal'\)/)
    expect(source).toMatch(/ssr: false/)
  })

  it('only imports small, already-bundled things statically', () => {
    expect(staticImports.sort()).toEqual(
      ['@/lib/access/loginPrompt', '@/lib/access/restrictedProducts', 'next-auth/react', 'next/dynamic', 'next/navigation', 'react'].sort(),
    )
  })

  it('renders nothing until the popup is open', () => {
    expect(source).toMatch(/if \(!open\) return null/)
  })
})
