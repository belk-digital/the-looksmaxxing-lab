# MOTION.md — Motion Design System

> The complete motion language: animation tokens, scroll triggers, page transitions, micro-interactions. Reference this any time you add movement.

---

## Motion philosophy

The client called this out specifically: motion should feel **effortless, not showy**. The cinematic feel comes from coordination and timing, not from elements bouncing or doing tricks. Three principles guide every animation decision:

1. **Confident finish.** Every motion uses ease-out timing — fast start, settled finish. Never ease-in (lazy start) or linear (mechanical).
2. **Honor the system.** Use the timing and easing tokens from `DESIGN-SYSTEM.md`. Don't invent durations.
3. **Reduced motion is default-respected.** Every animation falls back to a static state when `prefers-reduced-motion: reduce` is set. This is built into the helpers.

---

## Motion stack

Two libraries, distinct roles:

| Library | When to use |
|---|---|
| **Framer Motion** | Component-level animation: entrance, hover, layout transitions, drawer/modal animations, page transitions |
| **GSAP + ScrollTrigger** | Complex scroll-driven sequences: parallax, pinned sections, multi-element scroll choreography |

**Default to Framer Motion.** Reach for GSAP only when Framer can't do it cleanly (e.g., scroll-pinned hero with multi-step text reveal).

### Install

```bash
npm install framer-motion
npm install gsap
```

GSAP's ScrollTrigger is included in the free GSAP package.

---

## Timing tokens (recap from DESIGN-SYSTEM.md)

```ts
duration: {
  instant: 100,   // ms — color shifts, button hover
  fast:    200,   // ms — small UI shifts
  base:    400,   // ms — DEFAULT — most transitions
  slow:    700,   // ms — section entrances
  cinema:  1200,  // ms — hero reveals, dramatic moments
}

easing: {
  'out-quart':     [0.16, 1, 0.3, 1],         // DEFAULT
  'in-out-quart':  [0.65, 0, 0.35, 1],        // Loops, balanced motion
  'spring':        [0.34, 1.56, 0.64, 1],     // Subtle overshoot — rare
}
```

### Token usage in Framer Motion

```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
/>
```

---

## Reduced motion helper

Create once, use everywhere:

```ts
// src/lib/motion/useReducedMotion.ts
'use client'
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

export function useReducedMotion() {
  return useFramerReducedMotion() ?? false
}

// Helper: returns motion props that collapse to instant when reduced
export function withReducedMotion<T extends Record<string, any>>(
  full: T,
  reduced: boolean,
): T {
  if (!reduced) return full
  return {
    ...full,
    initial: full.animate ?? full.initial,
    transition: { duration: 0 },
  }
}
```

For GSAP:
```ts
// Check inside any ScrollTrigger setup
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReduced) {
  // Set elements to their final state immediately, skip animation
  gsap.set(elements, { opacity: 1, y: 0 })
  return
}
```

---

## Reusable motion components

Build these once. Use them everywhere. They encapsulate the system.

### `<FadeUp>` — entrance fade with upward translate

The workhorse. Use for almost every entering element.

```tsx
// src/components/motion/FadeUp.tsx
'use client'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

export function FadeUp({
  children,
  delay = 0,
  duration = 0.6,
  distance = 24,
  once = true,
  className,
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  distance?: number
  once?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -100px 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

Usage:
```tsx
<FadeUp delay={0.1}>
  <h2>Section heading</h2>
</FadeUp>
<FadeUp delay={0.2}>
  <p>Body paragraph...</p>
</FadeUp>
```

### `<StaggerChildren>` — stagger entrance of child elements

```tsx
// src/components/motion/StaggerChildren.tsx
'use client'
import { motion } from 'framer-motion'

export function StaggerChildren({
  children,
  staggerDelay = 0.08,
  className,
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}
```

Usage:
```tsx
<StaggerChildren>
  {products.map(p => (
    <motion.div key={p.id} variants={staggerItemVariants}>
      <ProductCard product={p} />
    </motion.div>
  ))}
</StaggerChildren>
```

### `<RevealText>` — line-by-line text reveal for headlines

The cinematic hero text reveal. Lines fade up sequentially.

```tsx
// src/components/motion/RevealText.tsx
'use client'
import { motion } from 'framer-motion'

export function RevealText({
  lines,
  baseDelay = 0,
  className,
}: {
  lines: string[]
  baseDelay?: number
  className?: string
}) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{
              duration: 1.0,
              delay: baseDelay + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  )
}
```

Usage on hero:
```tsx
<RevealText
  lines={['Research-grade peptides.', 'Documented purity.']}
  baseDelay={0.2}
  className="text-display-xl font-display"
/>
```

### `<ParallaxImage>` — image translates slower than scroll

```tsx
// src/components/motion/ParallaxImage.tsx
'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function ParallaxImage({
  src, alt, intensity = 0.2, className,
}: {
  src: string; alt: string; intensity?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${intensity * 100}%`])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="relative h-[120%] -top-[10%]">
        <Image src={src} alt={alt} fill className="object-cover" />
      </motion.div>
    </div>
  )
}
```

### `<MagneticHover>` — subtle cursor-following effect for hero CTAs

Sparingly used. Only the primary CTA on the homepage hero.

```tsx
// src/components/motion/MagneticHover.tsx
'use client'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'

export function MagneticHover({
  children, strength = 0.3, className,
}: {
  children: React.ReactNode; strength?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 20 })
  const sy = useSpring(y, { stiffness: 200, damping: 20 })

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

---

## Page-level animations

### Page transitions (route changes)

Use Framer Motion's `AnimatePresence` in the root layout. Cross-fade between pages, no slide — slide animations on route change feel mobile-app-y, not editorial.

```tsx
// src/components/motion/PageTransition.tsx
'use client'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

Wrap content in root layout:
```tsx
<AnimatePresence mode="wait">
  <PageTransition>{children}</PageTransition>
</AnimatePresence>
```

### Header — transparent → frosted on scroll

```tsx
// In Header component
const { scrollY } = useScroll()
const [scrolled, setScrolled] = useState(false)

useMotionValueEvent(scrollY, 'change', (latest) => {
  setScrolled(latest > 50)
})

return (
  <motion.header
    animate={{
      backgroundColor: scrolled ? 'rgba(250, 247, 242, 0.85)' : 'rgba(250, 247, 242, 0)',
      backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
      borderBottom: scrolled ? '1px solid rgba(216, 205, 184, 0.5)' : '1px solid transparent',
    }}
    transition={{ duration: 0.3 }}
    className="fixed top-0 inset-x-0 z-sticky"
  >
    {/* nav content */}
  </motion.header>
)
```

Text colors also shift: cream → ink as background goes solid. Animate via the same scrolled state.

---

## Homepage hero — complete motion sequence

The single most important animation on the site. Designed as a coordinated sequence.

```
Timeline:
0ms      Video starts playing, opacity 0
200ms    Video fades in (cinema duration 1200ms)
400ms    Headline line 1 reveals (RevealText, 1000ms)
520ms    Headline line 2 reveals
800ms    Subhead fades up (FadeUp, 600ms)
1000ms   CTAs fade up with stagger (StaggerChildren, 80ms apart)
1400ms   Marquee underneath starts visible scroll
```

```tsx
// Hero component
<section className="relative h-screen overflow-hidden">
  <motion.video
    src="/hero.webm"
    autoPlay muted loop playsInline preload="auto"
    initial={{ opacity: 0, scale: 1.05 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/30" />

  <div className="relative z-10 h-full flex flex-col justify-end pb-32">
    <Container>
      <RevealText
        lines={['Research-grade peptides.', 'Documented purity.']}
        baseDelay={0.4}
        className="text-display-xl font-display text-cream"
      />
      <FadeUp delay={0.8}>
        <p className="text-body-lg text-cream/80 mt-6 max-w-md">
          Where biotechnology meets ritual.
        </p>
      </FadeUp>
      <StaggerChildren staggerDelay={0.08} className="flex gap-4 mt-10">
        <motion.div variants={staggerItemVariants}>
          <Button variant="primary" size="lg">View Collection</Button>
        </motion.div>
        <motion.div variants={staggerItemVariants}>
          <Button variant="link" size="lg">The Science →</Button>
        </motion.div>
      </StaggerChildren>
    </Container>
  </div>
</section>
```

---

## Section entrance animations

Standard pattern for every page section below the fold:

```tsx
<FadeUp>
  <EyebrowHeading>FEATURED PROTOCOLS</EyebrowHeading>
</FadeUp>
<FadeUp delay={0.1}>
  <h2 className="text-display-md font-display mt-2">
    Most-studied compounds
  </h2>
</FadeUp>
<StaggerChildren staggerDelay={0.1} className="grid grid-cols-2 gap-8 mt-12">
  {products.map(p => (
    <motion.div key={p.id} variants={staggerItemVariants}>
      <FeaturedProductCard product={p} />
    </motion.div>
  ))}
</StaggerChildren>
```

Pattern: heading → subhead → content. Total stagger across a section: ~600ms maximum. Past that it feels delayed.

---

## Marquee / Ticker

Pure CSS animation, no JS needed. Honors reduced motion via media query.

```tsx
// src/components/shared/Marquee.tsx
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="bg-ink overflow-hidden py-3 motion-safe:block motion-reduce:overflow-x-auto">
      <div className="flex motion-safe:animate-marquee motion-reduce:animate-none">
        {/* Render items twice for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-cream text-label-md uppercase tracking-wider whitespace-nowrap mx-8"
          >
            {item} <span className="text-gold mx-4">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
```

```css
/* In globals.css */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 40s linear infinite;
}

.animate-marquee:hover {
  animation-play-state: paused;
}
```

---

## Cart drawer animation

```tsx
// src/components/cart/CartDrawer.tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={close}
        className="fixed inset-0 bg-ink/55 z-drawer"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-cream z-drawer shadow-xl"
      >
        {/* Drawer content */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

Mobile menu uses the same pattern. Modal uses center-scale pattern (`scale: 0.96 → 1`, `opacity: 0 → 1`).

---

## Product card hover

```tsx
// src/components/shop/ProductCard.tsx
<motion.div
  whileHover="hover"
  initial="rest"
  variants={{
    rest: {},
    hover: {},
  }}
>
  <motion.div
    variants={{
      rest: { scale: 1 },
      hover: { scale: 1.04 },
    }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className="overflow-hidden bg-cream-warm"
  >
    <Image src={product.image} alt={product.name} />
  </motion.div>

  {/* Wishlist heart fades in on card hover */}
  <motion.div
    variants={{
      rest: { opacity: 0 },
      hover: { opacity: 1 },
    }}
    transition={{ duration: 0.2 }}
    className="absolute top-4 right-4"
  >
    <WishlistButton productId={product.id} />
  </motion.div>
</motion.div>
```

Image scales, wishlist heart fades in. No shadow lift, no card translate — keep it restrained.

---

## Image gallery transitions (PDP)

Crossfade between gallery images when thumbnail clicked:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeIndex}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Image src={images[activeIndex]} alt={...} />
  </motion.div>
</AnimatePresence>
```

---

## Tab transitions

Animated indicator bar that moves between tabs:

```tsx
// In Tabs component
{tabs.map(tab => (
  <button onClick={() => setActive(tab.id)} className="relative">
    <span className={active === tab.id ? 'text-ink' : 'text-ink-subtle'}>
      {tab.label}
    </span>
    {active === tab.id && (
      <motion.div
        layoutId="tab-indicator"
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -bottom-1 inset-x-0 h-0.5 bg-ink"
      />
    )}
  </button>
))}
```

`layoutId` makes Framer animate the indicator's position when active changes.

---

## Toast animations

```tsx
// Sonner config in root layout
<Toaster
  toastOptions={{
    duration: 4000,
    style: {
      background: '#0A0A0A',
      color: '#FAF7F2',
      border: 'none',
      borderRadius: '4px',
    },
  }}
  position="bottom-center"
/>
```

Sonner handles the slide-in itself — use its built-in motion.

---

## Add-to-cart confirmation animation

When user clicks "Add to cart":

1. Button text replaces with checkmark icon for 1.5s, then back to "Add to cart"
2. Cart icon in header pulses (scale 1 → 1.2 → 1 over 400ms)
3. Cart count badge updates with a brief scale-in
4. Cart drawer slides in (per cart drawer animation)
5. Toast: "Added to cart" with VIEW action

```tsx
const [justAdded, setJustAdded] = useState(false)

const handleAdd = async () => {
  await addToCart(...)
  setJustAdded(true)
  triggerCartIconPulse()
  toast.success('Added to cart', { action: { label: 'VIEW', onClick: openDrawer } })
  setTimeout(() => setJustAdded(false), 1500)
}

<Button onClick={handleAdd} disabled={justAdded}>
  <AnimatePresence mode="wait">
    {justAdded ? (
      <motion.span key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <CheckIcon />
      </motion.span>
    ) : (
      <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        Add to cart
      </motion.span>
    )}
  </AnimatePresence>
</Button>
```

---

## Form field interactions

### Focus state
- Border darkens from `border-default` to `border-strong`
- Gold focus ring appears (`shadow-focus`)
- Transition: 200ms ease-out

### Validation
- Error appears below field, fades up with subtle slide:
```tsx
<AnimatePresence>
  {error && (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="text-error text-body-sm mt-1"
    >
      {error}
    </motion.p>
  )}
</AnimatePresence>
```

### Submit success
- Button shows checkmark briefly
- Form clears (if appropriate)
- Toast confirms

---

## Loading states

### Skeleton shimmer

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(236, 229, 216, 0) 0%,
    rgba(229, 216, 184, 0.5) 50%,
    rgba(236, 229, 216, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Full-page loading

A single gold dot, pulsing:
```tsx
<div className="flex items-center justify-center min-h-screen">
  <motion.div
    animate={{ scale: [1, 1.15, 1] }}
    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    className="w-2 h-2 rounded-full bg-gold"
  />
</div>
```

### Spinner (action loading)

```tsx
<motion.svg
  animate={{ rotate: 360 }}
  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
  viewBox="0 0 24 24" width="20" height="20"
>
  <circle cx="12" cy="12" r="10" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeDasharray="60 100"
    strokeLinecap="round"
  />
</motion.svg>
```

---

## GSAP-specific patterns (when Framer isn't enough)

### Pinned hero with multi-step text reveal

For the About page hero or a Science section that pins while user scrolls through phases:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function PinnedHeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=2000',
          scrub: 1,
          pin: true,
        },
      })

      tl.from('.line-1', { y: 60, opacity: 0, duration: 1 })
        .from('.line-2', { y: 60, opacity: 0, duration: 1 }, '-=0.5')
        .to('.image', { scale: 1.2, duration: 2 }, '<')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="h-screen relative overflow-hidden">
      {/* content with .line-1, .line-2, .image classes */}
    </section>
  )
}
```

### Horizontal scroll section

For a "process" or "timeline" section that scrolls horizontally while user scrolls vertically. Use sparingly — fits Timeline/About contexts only.

```tsx
useEffect(() => {
  gsap.registerPlugin(ScrollTrigger)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const container = horizontalRef.current
  const panels = container.querySelectorAll('.panel')

  const ctx = gsap.context(() => {
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${container.offsetWidth}`,
      },
    })
  }, container)

  return () => ctx.revert()
}, [])
```

---

## Performance guardrails

Motion is expensive. Rules to keep the site fast:

1. **Animate only `transform` and `opacity`.** Never `top`, `left`, `width`, `height`, `background-color`. These trigger layout/paint; transform+opacity are GPU-composited.
2. **Use `will-change: transform` sparingly** — only on elements actively animating, remove when done.
3. **Avoid animating large images.** Parallax is fine. Don't try to scale a 4MB hero image on scroll.
4. **Lazy-load Framer for below-fold sections.** Use dynamic imports for components that aren't in initial viewport.
5. **Limit concurrent animations.** No more than 5 elements animating at once. Stagger to spread the load.
6. **Test on a mid-range Android (e.g., a $300 phone).** If it stutters, simplify.

### Lazy-load Framer for sections far from initial view

```tsx
import dynamic from 'next/dynamic'

const HeavyMotionSection = dynamic(() => import('./HeavyMotionSection'), {
  ssr: false,
  loading: () => <div className="h-screen bg-cream" />, // placeholder
})
```

---

## Motion budget per page

A rough rule for how much motion belongs on each page:

| Page type | Motion budget |
|---|---|
| Homepage | High — cinematic, this is the brand showcase |
| About, Journal | High — editorial moments matter |
| Shop (PLP) | Medium — entrance animations, hover, filter transitions |
| PDP | Medium — gallery transitions, tab animations, add-to-cart feedback |
| Cart, Checkout | Low — these should feel fast and frictionless |
| Account dashboard | Low — utility, not theater |
| FAQ, Contact, Policies | Low — accordions and inputs only |

---

## Anti-patterns (things to never do)

1. **Bouncing/wobbling buttons.** Spring physics on hover reads as cartoonish. Use straight ease-out.
2. **Animating numbers counting up.** Done to death. The stat cards on the affiliate dashboard show numbers directly — no count-up.
3. **Whole-page transitions that wipe.** No swipe transitions, no curtain effects. Cross-fade only.
4. **Animations that block input.** Never wait for animation to complete before accepting clicks. Use Framer's `style` over `animate` if motion is purely decorative.
5. **Looping motion in body content.** No infinite shimmers on actual content (only on skeleton loaders).
6. **Parallax on text.** Move images, never text. Parallaxing text causes readability issues and CLS.
7. **Auto-playing videos with sound.** Always muted, always controlled.
8. **Notification dot animations.** Cart count badge briefly scales when item added — that's it. No infinite pulse.

---

## Motion testing checklist

Before any animation ships, verify:

- [ ] Looks correct on slow 4G (test with Chrome DevTools throttling)
- [ ] Respects `prefers-reduced-motion: reduce` (toggle in DevTools rendering panel)
- [ ] Doesn't cause CLS (Cumulative Layout Shift) — check Lighthouse
- [ ] Doesn't trigger paint or layout in Performance tab (only composite layer)
- [ ] Works on iOS Safari (the most restrictive platform — `autoPlay` quirks, `backdrop-filter` quirks)
- [ ] Works keyboard-only (no animation traps focus, Esc dismisses overlays)
- [ ] Looks good at 200% zoom and on a 4K display
