# The Looksmaxxing Lab — Frontend Design Documentation

> Complete design system, component library, page layouts, and motion design for The Looksmaxxing Lab e-commerce site. Drop this folder into `/docs/design/` in your project root.

---

## What this is

This is a separate documentation set focused exclusively on **visual design and frontend implementation**. The backend documentation (Payload schemas, Clerk auth, affiliate system, etc.) lives in `/docs/`. The two work together but are independent.

**The brand:** The Looksmaxxing Lab — research-grade peptides for an aesthetics-focused audience. Female-led, premium positioning, biotech credibility.

**The aesthetic:** Longevium's biotech luxury + Dr. Sturm's scientific credibility + Rhode's visual cleanliness + Timeline's modern motion design.

---

## File index

| File | Purpose | When to use |
|---|---|---|
| `README.md` | This file. Navigation. | First |
| `BRAND.md` | Brand vision, voice, name, positioning, logo guidelines | Read once, reference for tone |
| `DESIGN-SYSTEM.md` | Colors, typography, spacing, shadows, radii, Tailwind config | Daily — the source of truth |
| `COMPONENTS.md` | Every reusable component spec (buttons, cards, forms, navigation, etc.) | When building any component |
| `PAGES.md` | Page-by-page layouts with ASCII wireframes for all 14 pages | When building any page |
| `MOTION.md` | All animations, scroll triggers, micro-interactions, motion code | When adding any movement |
| `PROMPTS.md` | Copy-paste AI prompts for building each piece of the UI | Daily use with AI IDE |

---

## How to use these docs with your AI IDE

The same workflow as the backend docs. At the start of any new chat:

```
Read /docs/design/BRAND.md, /docs/design/DESIGN-SYSTEM.md, and /docs/design/COMPONENTS.md.
Confirm by listing the three primary brand colors and two font families.
We are working on [component or page name] from /docs/design/PROMPTS.md prompt [P-X.Y].
```

This stops the AI from inventing colors, picking wrong fonts, or building components that don't match the design system.

---

## Build sequence (recommended)

1. **Foundation first** — Set up the Tailwind config, fonts, and global CSS from `DESIGN-SYSTEM.md`. Verify a basic page renders with correct colors and type. (Prompt P-1)
2. **Core components** — Build buttons, inputs, cards, badges from `COMPONENTS.md`. Test in isolation. (Prompts P-2 through P-7)
3. **Layout primitives** — Header, footer, container, section components. (Prompts P-8, P-9)
4. **Homepage first** — The most visible page. Get hero + ticker + featured products working. (Prompts P-10, P-11, P-12)
5. **Product pages** — PLP and PDP. (Prompts P-13, P-14)
6. **Account + checkout** — These don't need to be as visually rich; functional design. (Prompts P-15, P-16)
7. **Editorial pages** — Blog, About, Science. These get extra design love. (Prompts P-17, P-18)
8. **Motion pass** — After everything renders correctly, layer in animations. (Prompts P-19, P-20)

---

## Golden rules

1. **The cream background is sacred.** Never push it pure white. Never push it grey. It's `#FAF7F2` — luminous, warm, premium.
2. **Black text is pure or near-pure.** Never grey-shifted. The contrast against cream is the brand.
3. **Champagne gold is an accent — never a background.** Use it sparingly: thin lines, the brand mark, hover states. If you find yourself using it for a whole panel, stop.
4. **Editorial serif for display ONLY.** Body, buttons, navigation, prices all in sans-serif. Mixing them gives the brand its editorial-meets-modern feel.
5. **Every animation must be turn-off-able.** Honor `prefers-reduced-motion`. No exceptions.
6. **Negative space is a feature, not a bug.** The reference sites all use enormous whitespace. Resist the urge to fill it.
7. **No purple gradients. No emojis. No stock-icon clutter.** (Client called this out specifically.)
