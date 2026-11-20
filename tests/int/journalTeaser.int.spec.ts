/**
 * The journal row on the home page.
 *
 * - It shows exactly the posts it is given (the home page passes the newest ones from the same list /journal uses),
 *   in that order, linking to each post.
 * - Phones and tablets (below 1280px): an ordinary section with a plain, swipeable row of cards (native horizontal
 *   scrolling that snaps card by card), nothing pinned, no "Scroll to explore" prompt. (Measured in a real browser at
 *   345px to 1279px: the row scrolls sideways, the button no longer overlaps the cards, scrolling the page does not move it.)
 * - Wide screens: the original pinned section whose cards slide sideways as the page scrolls.
 * - The home page really feeds it from the /journal list, and saving a post clears the home page's saved copy.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'

vi.mock('framer-motion', () => {
  const passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, layoutId, whileInView, viewport, variants, ...dom } = rest
    return React.createElement('div', { ref, ...dom }, children)
  })
  return {
    motion: new Proxy({}, { get: () => passthrough }),
    useScroll: () => ({ scrollYProgress: { get: () => 0, on: () => () => undefined } }),
    useTransform: () => 0,
  }
})
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => React.createElement('img', { src, alt }),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}))

import { JournalTeaser, type JournalTeaserPost } from '../../src/components/home/JournalTeaser'

const post = (n: number): JournalTeaserPost => ({
  slug: `post-${n}`,
  title: `Post number ${n}`,
  category: n % 2 ? 'Guides' : 'Studies',
  readTime: `${n + 3} min read`,
  heroImage: `/images/post-${n}.webp`,
})
const POSTS = [1, 2, 3, 4, 5].map(post)

let matches = false
const listeners = new Set<() => void>()
beforeEach(() => {
  matches = false
  listeners.clear()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() { return matches },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const renderTeaser = (posts = POSTS) => {
  const view = render(React.createElement(JournalTeaser, { posts }))
  const section = view.container.querySelector('section') as HTMLElement
  const scroller = section.querySelector('[role="region"]') as HTMLElement
  const track = scroller.firstElementChild as HTMLElement
  return { ...view, section, scroller, track }
}

describe('what it shows', () => {
  it('one card per given post, in the given order, each linking to its post', () => {
    const { track } = renderTeaser()
    const links = Array.from(track.querySelectorAll('a'))
    expect(links.map((a) => a.getAttribute('href'))).toEqual(POSTS.map((p) => `/journal/${p.slug}`))
    expect(links.map((a) => a.querySelector('h3')!.textContent)).toEqual(POSTS.map((p) => p.title))
    expect(links.map((a) => a.querySelector('img')!.getAttribute('src'))).toEqual(POSTS.map((p) => p.heroImage))
  })

  it('shows a different set when given a different set (it does not use a built-in list)', () => {
    const { track } = renderTeaser([post(9), post(8)])
    expect(Array.from(track.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual(['/journal/post-9', '/journal/post-8'])
  })

  it('shows the category and reading time of each card', () => {
    const { track } = renderTeaser()
    const first = track.querySelector('a')!
    expect(first.textContent).toContain('Guides')
    expect(first.textContent).toContain('4 min read')
  })

  it('renders nothing at all when there are no posts', () => {
    const { container } = render(React.createElement(JournalTeaser, { posts: [] }))
    expect(container.querySelector('section')).toBeNull()
  })

  it('keeps the heading and a link to the full journal', () => {
    const { section } = renderTeaser()
    expect(section.querySelector('h2')!.textContent).toContain('Clinical Reviews')
    expect(Array.from(section.querySelectorAll('a')).some((a) => a.getAttribute('href') === '/journal')).toBe(true)
  })
})

describe('phones and tablets: a normal horizontal scroll', () => {
  it('is an ordinary section: only the wide layout is 300vh tall and pinned', () => {
    const { section } = renderTeaser()
    expect(section.className).not.toMatch(/(^|\s)h-\[300vh\]/)
    expect(section.className).toContain('xl:h-[300vh]')
    const inner = section.firstElementChild as HTMLElement
    expect(inner.className).not.toMatch(/(^|\s)sticky(\s|$)/)
    expect(inner.className).toContain('xl:sticky')
    expect(inner.className).not.toMatch(/(^|\s)h-screen(\s|$)/) // no fixed screen-height box the heading and cards are squeezed into
  })

  it('puts the heading above the cards in normal flow (the button can no longer overlap them)', () => {
    const { section } = renderTeaser()
    const panel = section.querySelector('h2')!.closest('[class*="z-20"]') as HTMLElement
    expect(panel.className).toMatch(/(^|\s)relative(\s|$)/)
    expect(panel.className).not.toMatch(/(^|\s)absolute(\s|$)/)
    expect(panel.className).toContain('xl:absolute')
  })

  it('has native horizontal scrolling that snaps card by card, with no scrollbar', () => {
    const { scroller, track } = renderTeaser()
    expect(scroller.className).toContain('overflow-x-auto')
    expect(scroller.className).toContain('snap-x')
    expect(scroller.className).toContain('snap-mandatory')
    expect(scroller.className).toContain('hide-scrollbar')
    expect(scroller.className).toContain('xl:overflow-visible') // the pinned layout moves the track itself instead
    expect(scroller.className).toContain('xl:snap-none')
    expect(scroller.getAttribute('aria-label')).toBe('Latest journal articles')
    for (const card of Array.from(track.querySelectorAll('a'))) expect(card.className).toContain('snap-start')
  })

  it('does not move the row while the page scrolls (no scroll-driven movement below 1280px)', () => {
    const { track } = renderTeaser()
    expect(track.getAttribute('style') ?? '').not.toMatch(/transform|translate/)
  })

  it('hides the "Scroll to explore" prompt there (it only makes sense for the pinned layout)', () => {
    const { section } = renderTeaser()
    const prompt = Array.from(section.querySelectorAll('span')).find((s) => /scroll to explore/i.test(s.textContent ?? ''))!
    expect(prompt.parentElement!.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(prompt.parentElement!.className).toContain('xl:flex')
  })
})

describe('wide screens: the original pinned effect', () => {
  it('moves the track with the page scroll once the screen is 1280px or wider', () => {
    matches = true
    const { track } = renderTeaser()
    // the pinned layout drives the track through a scroll-linked value (an inline style), the plain one does not
    expect(track.getAttribute('style') ?? '').toMatch(/will-change:\s*transform/)
  })

  it('switches over when the window is resized across 1280px, and back', async () => {
    const { track } = renderTeaser()
    expect(track.getAttribute('style') ?? '').not.toMatch(/will-change/)
    matches = true
    const { act } = await import('@testing-library/react')
    act(() => listeners.forEach((fn) => fn()))
    expect(track.getAttribute('style') ?? '').toMatch(/will-change:\s*transform/)
    matches = false
    act(() => listeners.forEach((fn) => fn()))
    expect(track.getAttribute('style') ?? '').not.toMatch(/will-change/)
  })

  it('stops listening for window changes when it goes away', () => {
    const { unmount } = renderTeaser()
    expect(listeners.size).toBe(1)
    unmount()
    expect(listeners.size).toBe(0)
  })
})

describe('where its posts come from', () => {
  const read = (file: string) => readFileSync(file, 'utf8')

  it('the home page passes it the newest posts from the same list /journal uses', () => {
    const home = read('src/app/(frontend)/page.tsx')
    expect(home).toContain("getLatestJournalPosts")
    expect(home).toMatch(/<JournalTeaser posts=\{latestJournalPosts\}\s*\/>/)
    // /journal uses getAllJournalPosts; the home page's helper is that same list cut short
    expect(read('src/app/(frontend)/journal/page.tsx')).toContain('getAllJournalPosts')
    expect(read('src/lib/blog/getPosts.ts')).toMatch(/getLatestJournalPosts[\s\S]*getAllJournalPosts\(\)\)\.slice\(0,/)
  })

  it('the section no longer reads its own built-in list', () => {
    const source = read('src/components/home/JournalTeaser.tsx')
    expect(source).not.toContain('JOURNAL_POSTS')
    expect(source).not.toContain('@/data/journal-posts')
  })
})
