'use client'

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

/**
 * A small "i" icon that explains something in plain words.
 *  - desktop: appears on hover or keyboard focus
 *  - phone/tablet: tap the icon to open, tap again (or anywhere else) to close
 *  - Esc closes it; screen readers get the text through aria-describedby
 *
 * The text box floats above the page (rendered at the end of <body>, `position: fixed`), so it can never be
 * clipped by a scrolling/overflow container, never makes a scrollbar appear, and never moves the page - which is
 * what made it flicker when it used to sit inside a scrolling list. It is also kept fully inside the screen and
 * flips above the icon when there is no room below. The box ignores the mouse, so hovering is only ever about the icon.
 *
 * Do NOT place it inside a <button>, <a> or <label> (nested interactive elements); put it next to them.
 */
const WIDTH = 256
const MARGIN = 12
const GAP = 8

export function InfoTip({
  children,
  label = 'More information',
  align = 'left',
  className = '',
}: {
  children: React.ReactNode
  /** Accessible name of the icon button, e.g. "What does Skip next delivery do?" */
  label?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hover || pinned
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!pinned) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false)
        setHover(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned])

  // Only one tip is ever open: opening this one closes every other.
  useEffect(() => {
    if (!open) return
    document.dispatchEvent(new CustomEvent('infotip-open', { detail: id }))
  }, [open, id])
  useEffect(() => {
    const closeIfOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) {
        setPinned(false)
        setHover(false)
      }
    }
    document.addEventListener('infotip-open', closeIfOther)
    return () => document.removeEventListener('infotip-open', closeIfOther)
  }, [id])

  // Work out where the box goes (before the browser paints, so it never flashes in the wrong place).
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const place = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      const viewportHeight = window.innerHeight
      const width = Math.min(WIDTH, viewportWidth - MARGIN * 2)
      let left = align === 'right' ? rect.right - width : align === 'center' ? rect.left + rect.width / 2 - width / 2 : rect.left
      left = Math.max(MARGIN, Math.min(left, viewportWidth - MARGIN - width))
      const height = tipRef.current?.offsetHeight || 0
      let top = rect.bottom + GAP
      // not enough room below, but room above: flip over the icon
      if (height && top + height > viewportHeight - MARGIN && rect.top - GAP - height >= MARGIN) top = rect.top - GAP - height
      setPos({ top: Math.round(top), left: Math.round(left), width })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true) // any scrolling area, so the box follows the icon
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align])

  return (
    <span
      ref={ref}
      className={`relative inline-flex align-middle normal-case tracking-normal font-normal ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-testid="info-tip"
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setPinned((p) => !p)
        }}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink/40 transition-colors hover:text-ink focus:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
      >
        <Info size={15} aria-hidden="true" />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            ref={tipRef}
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width ?? WIDTH,
              visibility: pos ? 'visible' : 'hidden',
              pointerEvents: 'none',
            }}
            className="z-[9999] rounded-xl bg-ink p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-xl"
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  )
}
