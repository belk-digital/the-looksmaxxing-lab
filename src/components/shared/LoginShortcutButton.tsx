'use client'

import React, { useEffect, useState } from 'react'
import { ArrowRight, Crown } from 'lucide-react'
import { MEMBER_DISCOUNT_PERCENT } from '@/lib/membership/discount'

/**
 * The look of the corner shortcut (the trigger and timing are in LoginShortcut). Loaded on demand, never part of the
 * first page load.
 *
 * Design: a floating ink pill in the site's own ink / cream / gold palette, matching the popup it opens.
 *  - a raised gold badge with a crown (a member perk, instantly readable even at a glance) and a slow pulse ring;
 *  - the offer in two lines, with the "20%" picked out in gold;
 *  - a gold-outlined "Log in" chip on the right, so it is obvious the pill is a button (on phones: a round arrow). It
 *    mirrors the solid gold badge on the left, is exactly as tall as the badge (so the gap is the same above, below and
 *    to the right) and fills with gold on hover;
 *  - a soft gold glow, and a light sheen that sweeps across now and then.
 * On hover the pill lifts, its gold outline brightens, the crown tilts and the arrow nudges. All motion is switched
 * off for people who prefer reduced motion. Plain CSS (no animation library), scoped by class names starting "ls-".
 *
 * It steps out of the way at the bottom of the page: as soon as the site footer (the element marked data-site-footer)
 * scrolls into view the pill fades down and out, and it comes back when the visitor scrolls up again. While it is away
 * it cannot be clicked or tabbed to.
 */

/** The pill leaves once the footer's top edge is this close to (or above) the bottom of the screen. */
const FOOTER_MARGIN_PX = 8

/** True while the site footer is on screen. Re-checked on scroll, on resize and when the page's height changes. */
function useFooterInView(): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const footer = document.querySelector('[data-site-footer]')
      setInView(footer ? footer.getBoundingClientRect().top < window.innerHeight - FOOTER_MARGIN_PX : false)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // The page grows and shrinks as content loads or the visitor moves to another page: no scroll happens, so watch for it.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(document.body)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer?.disconnect()
    }
  }, [])
  return inView
}

// The animation, the fixed position and the metallic finishes live here (rather than in utility classes) so the button
// works anywhere without the site's stylesheet knowing about it. "lift" raises it above the product page's bottom bar
// on phones and tablets.
const CSS = `
.ls-wrap{position:fixed;left:1rem;z-index:60;bottom:max(1rem,env(safe-area-inset-bottom));animation:ls-in .6s cubic-bezier(.16,1,.3,1) backwards;transition:opacity .25s ease,transform .25s ease,visibility 0s}
.ls-wrap--away{opacity:0;transform:translateY(14px);visibility:hidden;pointer-events:none;transition:opacity .25s ease,transform .25s ease,visibility 0s .25s}
@media (min-width:640px){.ls-wrap{left:1.5rem;bottom:max(1.5rem,env(safe-area-inset-bottom))}}
@media (max-width:1023.98px){.ls-wrap--lift{bottom:calc(5.75rem + env(safe-area-inset-bottom))}}
.ls-pill{background:linear-gradient(135deg,#221f19 0%,#0f0e0c 55%,#0a0a0a 100%);box-shadow:0 18px 40px -14px rgba(0,0,0,.65),0 0 32px -10px rgba(201,181,142,.45),inset 0 1px 0 rgba(255,255,255,.1)}
.ls-pill:hover{box-shadow:0 24px 46px -14px rgba(0,0,0,.75),0 0 40px -8px rgba(201,181,142,.6),inset 0 1px 0 rgba(255,255,255,.14)}
.ls-badge{background:linear-gradient(145deg,#f4ead0 0%,#c9b58e 52%,#a89570 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 5px rgba(140,122,85,.5),0 5px 12px -3px rgba(201,181,142,.55)}
.ls-ring{position:absolute;inset:0;border-radius:9999px;border:2px solid rgba(201,181,142,.7);animation:ls-ring 3.2s ease-out infinite}
.ls-shine{position:absolute;inset:0;border-radius:9999px;overflow:hidden;pointer-events:none}
.ls-shine::before{content:"";position:absolute;top:-10%;bottom:-10%;left:-60%;width:38%;background:linear-gradient(100deg,transparent,rgba(240,228,196,.2),transparent);transform:skewX(-18deg);animation:ls-shine 7s ease-in-out 2.5s infinite}
@keyframes ls-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
@keyframes ls-ring{0%{transform:scale(1);opacity:.75}65%,100%{transform:scale(1.7);opacity:0}}
@keyframes ls-shine{0%{left:-60%}30%,100%{left:135%}}
@media (prefers-reduced-motion:reduce){.ls-wrap,.ls-ring,.ls-shine::before{animation:none}.ls-wrap,.ls-wrap--away{transition:none}.ls-ring,.ls-shine{display:none}}
`

export default function LoginShortcutButton({
  onOpen,
  liftAboveStickyBar = false,
}: {
  onOpen: () => void
  liftAboveStickyBar?: boolean
}) {
  const away = useFooterInView()
  return (
    <div
      className={`ls-wrap${liftAboveStickyBar ? ' ls-wrap--lift' : ''}${away ? ' ls-wrap--away' : ''}`}
      data-testid="login-shortcut"
      aria-hidden={away || undefined}
    >
      <style>{CSS}</style>
      <button
        type="button"
        tabIndex={away ? -1 : undefined}
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Member discount: ${MEMBER_DISCOUNT_PERCENT}% off every order. Log in or create a free account.`}
        className="ls-pill group relative flex items-center gap-3 rounded-full p-1.5 text-left text-cream ring-1 ring-gold/40 transition-all duration-300 hover:-translate-y-0.5 hover:ring-gold/90 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {/* Light sheen that sweeps across the pill now and then */}
        <span aria-hidden="true" className="ls-shine" />

        {/* Raised gold badge with a slow pulse ring */}
        <span className="ls-badge relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink sm:h-11 sm:w-11">
          <span aria-hidden="true" className="ls-ring" />
          <Crown size={20} strokeWidth={2} aria-hidden="true" className="relative transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
        </span>

        <span className="flex flex-col leading-tight">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gold-light">Members</span>
          <span className="text-[13px] font-semibold tracking-tight">
            <span className="sm:hidden">
              <span className="text-gold-light">{MEMBER_DISCOUNT_PERCENT}%</span> off
            </span>
            <span className="hidden sm:inline">
              Save <span className="text-gold-light">{MEMBER_DISCOUNT_PERCENT}%</span> on every order
            </span>
          </span>
        </span>

        {/* The call to action: a cream "Log in" chip (an arrow on phones), so it reads as a button */}
        <span
          aria-hidden="true"
          className="ml-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/60 text-gold-light transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink sm:hidden"
        >
          <ArrowRight size={15} strokeWidth={2.25} />
        </span>
        <span
          aria-hidden="true"
          className="ml-1 hidden h-11 shrink-0 items-center gap-1.5 rounded-full border border-gold/60 pl-5 pr-4 text-[13px] font-semibold text-gold-light transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink sm:inline-flex"
        >
          Log in
          <ArrowRight size={15} strokeWidth={2.25} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </button>
    </div>
  )
}
