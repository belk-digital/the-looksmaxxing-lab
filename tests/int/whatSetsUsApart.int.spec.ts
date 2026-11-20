/**
 * "What sets us apart" cards on phones and tablets.
 *
 * The bug: each card had a fixed shape (4:5 on phones) with the text pushed to the bottom. On a narrow screen, or at
 * 125% browser zoom, the text is taller than that shape, so it overflowed upward: the icon and the start of the title
 * were cut off at the top of the card (seen as a faint grey blob in the corner).
 *
 * The fix: the shape is only a MINIMUM. A hidden spacer with the 4:5 / 16:9 shape shares one grid cell with the text,
 * so the card is as tall as whichever is bigger, and the card itself has no fixed aspect ratio.
 * (The actual measurements at many widths were made in a real browser; this guards the markup that makes it work.)
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('framer-motion', () => {
  const passthrough = ({ children, ...rest }: any) => {
    const { initial, animate, exit, transition, layoutId, whileInView, viewport, variants, ...dom } = rest
    return React.createElement('div', dom, children)
  }
  return {
    motion: new Proxy({}, { get: () => passthrough }),
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useScroll: () => ({ scrollYProgress: { get: () => 0, on: () => () => undefined } }),
    useMotionValueEvent: () => undefined,
    useTransform: () => 0,
    useInView: () => true,
  }
})
vi.mock('@/components/motion/FadeUp', () => ({
  FadeUp: ({ children }: any) => React.createElement('div', null, children),
}))
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => React.createElement('img', { src: typeof src === 'string' ? src : '', alt }),
}))

import { WhatSetsUsApart } from '../../src/components/home/WhatSetsUsApart'

const mobileCards = () => {
  const { container } = render(React.createElement(WhatSetsUsApart))
  const mobile = container.querySelector('[class~="xl:hidden"]') as HTMLElement
  expect(mobile).toBeTruthy()
  return Array.from(mobile.querySelectorAll('[class~="rounded-[2rem]"]')) as HTMLElement[]
}

describe('the phone / tablet cards', () => {
  it('shows all three pillars', () => {
    expect(mobileCards().length).toBe(3)
  })

  it('has no fixed aspect ratio on the card itself, so it can grow with its text', () => {
    for (const card of mobileCards()) {
      expect(card.className).not.toMatch(/(^|\s)(sm:)?aspect-/)
      expect(card.className).toMatch(/(^|\s)grid(\s|$)/)
    }
  })

  it('keeps the 4:5 (phones) / 16:9 (tablets) shape as a minimum, using a hidden spacer in the same grid cell as the text', () => {
    for (const card of mobileCards()) {
      const spacer = card.querySelector('[aria-hidden="true"][class*="aspect-"]') as HTMLElement
      expect(spacer, 'spacer').toBeTruthy()
      expect(spacer.className).toContain('aspect-[4/5]')
      expect(spacer.className).toContain('sm:aspect-[16/9]')
      expect(spacer.className).toMatch(/col-start-1/)
      expect(spacer.className).toMatch(/row-start-1/)

      const text = card.querySelector('h3')!.closest('[class*="z-30"]') as HTMLElement
      expect(text.className).toMatch(/col-start-1/)
      expect(text.className).toMatch(/row-start-1/)
      expect(text.className).toContain('self-end') // still sits at the bottom when the card is taller than the text
    }
  })

  it('keeps the icon from being squeezed, and still shows the title and the full description', () => {
    for (const card of mobileCards()) {
      const icon = card.querySelector('.backdrop-blur-md') as HTMLElement
      expect(icon.className).toContain('shrink-0')
      expect(card.querySelector('h3')!.textContent!.length).toBeGreaterThan(10)
      expect(card.querySelector('p')!.textContent!.length).toBeGreaterThan(100)
    }
  })
})
