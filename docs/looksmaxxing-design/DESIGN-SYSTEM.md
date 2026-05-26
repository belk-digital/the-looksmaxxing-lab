# DESIGN-SYSTEM.md — Design Tokens & Foundations

> The single source of truth for colors, typography, spacing, radii, shadows, and the Tailwind config. The AI must read this before writing any CSS or Tailwind class.

---

## Color system

All colors derived from the product packaging photography. The palette is intentionally narrow — fewer choices, more cohesion.

### Background colors

```
--bg-base:        #FAF7F2  /* Primary cream — site background */
--bg-elevated:    #FFFFFF  /* Pure white — cards, modals on cream */
--bg-warm:        #F2EDE4  /* Deeper cream — alternating section bg */
--bg-sand:        #ECE5D8  /* Sand — accent panels, callout boxes */
--bg-clay:        #E0D5C2  /* Clay — rare, for emphasis only */
--bg-ink:         #0A0A0A  /* Near-black — for dark sections like footer */
--bg-ink-soft:    #1A1A1A  /* Slightly lifted black — for cards on dark */
```

**Usage rules:**
- `bg-base` is the default page background. Never use pure white as a page background.
- `bg-warm` and `bg-sand` are for alternating sections — when you need visual separation without lines.
- `bg-elevated` (pure white) is reserved for cards floating on cream, and for modals.
- `bg-ink` is used for the footer and rare premium dark sections (e.g., a "Science" hero).

### Text colors

```
--text-primary:    #0A0A0A  /* Near-black — default body text */
--text-secondary:  #4A4A4A  /* Medium gray — secondary text, captions */
--text-muted:      #8A8A8A  /* Light gray — meta, timestamps */
--text-disabled:   #BFBFBF  /* Disabled states */
--text-inverse:    #FAF7F2  /* Cream — text on dark backgrounds */
--text-link:       #0A0A0A  /* Same as primary — underlined for distinction */
```

**Usage rules:**
- Body text is always `text-primary` on cream backgrounds.
- Never use pure black (#000000) — `#0A0A0A` is warmer and matches the product label printing.
- Never use light gray for body copy — only for metadata.

### Accent: champagne gold

```
--gold:            #C9B58E  /* Primary accent — from product label face profile */
--gold-light:      #E5D8B8  /* Hover state, soft accents */
--gold-dark:       #A89570  /* Active state, deeper emphasis */
--gold-deep:       #8C7A55  /* Rare — for dark mode equivalent */
```

**Usage rules:**
- Gold is ONLY for: thin decorative lines, the brand mark, hover underlines, small icons, accent borders. Never use it for body text, large fills, or buttons.
- One use of gold per visible viewport is the discipline. If you see two gold elements at once, one is wrong.

### Functional colors

```
--success:    #6B8E5E  /* Muted sage green — order confirmed, in stock */
--success-bg: #E8EFE3
--error:      #B85450  /* Muted terracotta — errors, out of stock */
--error-bg:   #F5E3E1
--warning:    #C4A05E  /* Warm gold — warnings, low stock */
--warning-bg: #F5EAD3
--info:       #6B7A8E  /* Cool mineral — informational */
--info-bg:    #E5E9EF
```

All functional colors muted to fit the palette — never saturated.

### Borders

```
--border-subtle:    #E8E2D5  /* Default — separators, card edges */
--border-default:   #D6CDB8  /* Stronger — form input borders */
--border-strong:    #0A0A0A  /* Near-black — emphasized dividers, focus rings */
--border-gold:      #C9B58E  /* Accent — rare decorative use */
```

### Surface overlays

```
--scrim-light:  rgba(250, 247, 242, 0.85)  /* Cream-tinted overlay */
--scrim-dark:   rgba(10, 10, 10, 0.55)     /* For modals, image overlays */
--scrim-strong: rgba(10, 10, 10, 0.75)     /* Heavy text-over-image */
```

---

## Typography system

### Font families

**Display / hero — High-contrast editorial serif:**

Primary choice (free, available on Google Fonts):
- **Bodoni Moda** (variable font) — modern Didone, matches the product label letterforms closely
- Loaded weights: 400, 500, 600, 700, 800, 900 (use the variable axis if possible)

Premium upgrade option (paid, recommended once budget allows):
- **Canela** by Commercial Type (~$300) — the gold standard for luxury beauty editorial
- Used by: Glossier (in past iterations), countless high-end beauty brands

Fallback stack:
```css
font-family: "Bodoni Moda", "Bodoni 72", "Didot", "Cormorant Garamond", Georgia, serif;
```

**Body / UI — Clean modern sans-serif:**

Primary choice (free, Google Fonts):
- **DM Sans** (variable font) — geometric, warm, premium without feeling generic
- Loaded weights: 400, 500, 600, 700

Premium upgrade option (paid):
- **Söhne** by Grilli Type — used widely in premium DTC

Fallback stack:
```css
font-family: "DM Sans", "Söhne", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
```

**Strictly never:** Inter, Roboto, system font stacks as primary. The client explicitly called these out as too generic.

### Font loading (Next.js setup)

```ts
// src/app/fonts.ts
import { Bodoni_Moda, DM_Sans } from 'next/font/google'

export const fontDisplay = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

export const fontSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})
```

```tsx
// In root layout:
<html className={`${fontDisplay.variable} ${fontSans.variable}`}>
```

### Type scale

```
Display XL:    96px / 1.05 / -0.03em / Bodoni Moda 400  /* Hero only */
Display L:     72px / 1.05 / -0.03em / Bodoni Moda 400  /* Section headers */
Display M:     56px / 1.1  / -0.02em / Bodoni Moda 400
Display S:     40px / 1.15 / -0.02em / Bodoni Moda 400

Editorial L:   32px / 1.25 / -0.01em / Bodoni Moda 400  /* Article H1, large pulls */
Editorial M:   24px / 1.3  / -0.01em / Bodoni Moda 400  /* Article H2 */

Body L:        18px / 1.6  / -0.005em / DM Sans 400     /* Lede paragraphs */
Body M:        16px / 1.6  / 0       / DM Sans 400      /* Default body */
Body S:        14px / 1.5  / 0       / DM Sans 400      /* Captions, meta */
Body XS:       12px / 1.4  / 0.02em  / DM Sans 500      /* Labels, eyebrow */

Label L:       14px / 1.4  / 0.1em   / DM Sans 500 UPPER /* Eyebrow, nav */
Label M:       12px / 1.4  / 0.12em  / DM Sans 500 UPPER /* Buttons, small nav */
Label S:       10px / 1.3  / 0.15em  / DM Sans 600 UPPER /* Badges, taglines */
```

### Type usage rules

| Use case | Style |
|---|---|
| Page hero headline | Display XL or L (serif) |
| Section heading | Display M or S (serif) |
| Card title | Editorial M (serif) |
| Product name on PDP | Display S (serif) |
| Product name on card | Editorial M (serif) |
| Price | Body L (sans, 500 weight) |
| Navigation links | Label L (sans, uppercase, tracked) |
| Body paragraphs | Body M (sans) |
| Button text | Label L (sans, uppercase, tracked) |
| Form labels | Body S (sans, 500 weight) |
| Form input text | Body M (sans) |
| Eyebrow text (above headings) | Label M (sans, uppercase, tracked) — often in gold |
| Footer text | Body S (sans) |
| Disclaimer text | Body S (sans, muted) |

### Headline composition

When designing headlines, follow these rules:

- **Mix weights, never sizes within a phrase.** "Documented **purity**" with bold on one word reads better than mixing 48px and 64px.
- **Use italic Bodoni sparingly.** It's gorgeous but loses readability fast. One word per headline, max.
- **Hanging punctuation.** Quotation marks and other punctuation should optically align outside the text block on display sizes.
- **Optical kerning manually** for hero headlines. Auto-kerning fails on Bodoni.

---

## Spacing system

Use Tailwind's default 4px-based scale, but with semantic spacing tokens for layout:

```
--space-0:    0
--space-1:    4px
--space-2:    8px
--space-3:    12px
--space-4:    16px
--space-5:    24px
--space-6:    32px
--space-7:    48px
--space-8:    64px
--space-9:    96px
--space-10:   128px
--space-11:   160px
--space-12:   192px

/* Semantic */
--space-inline-xs:  8px   /* Between adjacent inline elements */
--space-inline-sm:  16px
--space-inline-md:  24px

--space-stack-xs:   12px  /* Between stacked text elements */
--space-stack-sm:   24px
--space-stack-md:   48px
--space-stack-lg:   80px
--space-stack-xl:   128px /* Between major page sections */

--space-page-x:     24px  /* Mobile horizontal page padding */
--space-page-x-md:  48px  /* Tablet */
--space-page-x-lg:  80px  /* Desktop */
```

**Default vertical rhythm between page sections: 128px desktop, 80px mobile.** Use less only when sections are conceptually adjacent.

The brand's visual identity depends on **generous whitespace.** When in doubt, double the spacing.

---

## Layout containers

```
--max-w-content:   720px   /* Article body, narrow editorial */
--max-w-prose:     960px   /* Two-column editorial */
--max-w-page:      1280px  /* Standard page max-width */
--max-w-wide:      1440px  /* Hero, marquee, full-width media */
--max-w-bleed:     100%    /* Edge-to-edge (hero, full-bleed images) */
```

Container component automatically applies horizontal padding and centers content. See `COMPONENTS.md` → Container.

---

## Border radius

The brand is editorial and minimal — radii are subtle.

```
--radius-none:   0      /* Hero, full-bleed images, marquee */
--radius-sm:     2px    /* Form inputs, buttons */
--radius-md:     4px    /* Cards, modals */
--radius-lg:     8px    /* Large containers (rare) */
--radius-full:   9999px /* Avatars, pill badges */
```

**Default:** `--radius-sm` for buttons and inputs, `--radius-md` for cards. **Never** use `xl` or `2xl` rounded corners — they read as consumer-app-y, not editorial.

---

## Shadows

Minimal. The brand is flat with whitespace, not floating cards.

```
--shadow-none:    none
--shadow-sm:      0 1px 2px rgba(10, 10, 10, 0.04)             /* Buttons hover */
--shadow-md:      0 4px 12px rgba(10, 10, 10, 0.06)            /* Cards hover, dropdowns */
--shadow-lg:      0 12px 32px rgba(10, 10, 10, 0.08)           /* Modals, drawers */
--shadow-xl:      0 24px 64px rgba(10, 10, 10, 0.12)           /* Cart drawer, large modals */
--shadow-focus:   0 0 0 3px rgba(201, 181, 142, 0.4)           /* Focus ring (gold-tinted) */
```

Default card state: NO shadow. Add `shadow-md` on hover only. The flat default is intentional.

---

## Motion timing tokens

(Full motion system in `MOTION.md` — these are just the timing primitives.)

```
--duration-instant:  100ms   /* Color flips, hover */
--duration-fast:     200ms   /* Buttons, small UI */
--duration-base:     400ms   /* Default — most transitions */
--duration-slow:     700ms   /* Page sections entering */
--duration-cinema:   1200ms  /* Hero reveals, dramatic */

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)    /* Default — confident finish */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)   /* For looping or balanced motion */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* Subtle overshoot — rare */
```

---

## Z-index scale

```
--z-base:       0
--z-raised:     10
--z-sticky:     100   /* Sticky header, sticky filter bar */
--z-drawer:     200   /* Cart drawer, mobile nav */
--z-modal:      300   /* Modal dialogs */
--z-toast:      400   /* Toast notifications */
--z-tooltip:    500   /* Tooltips */
--z-debug:      9999  /* Development overlays */
```

---

## Iconography

Use **Lucide icons** (already in shadcn/ui ecosystem). Strict rules:

- **Stroke width: 1.5px** (Lucide default is 2; we use 1.5 for an editorial feel)
- **Color:** Inherit `currentColor` — controlled by parent text color
- **Size scale:** 14px, 16px, 18px, 20px, 24px, 32px — no other sizes
- **Never custom-illustrate icons.** The Lucide set is comprehensive enough.
- **Never use emoji as icons.** Including ⭐ for ratings (use star SVG instead).

---

## Full Tailwind config

Drop this into `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: {
          DEFAULT: '#FAF7F2',
          warm: '#F2EDE4',
          sand: '#ECE5D8',
          clay: '#E0D5C2',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#1A1A1A',
          muted: '#4A4A4A',
          subtle: '#8A8A8A',
        },
        gold: {
          DEFAULT: '#C9B58E',
          light: '#E5D8B8',
          dark: '#A89570',
          deep: '#8C7A55',
        },
        success: { DEFAULT: '#6B8E5E', bg: '#E8EFE3' },
        error: { DEFAULT: '#B85450', bg: '#F5E3E1' },
        warning: { DEFAULT: '#C4A05E', bg: '#F5EAD3' },
        info: { DEFAULT: '#6B7A8E', bg: '#E5E9EF' },
        border: {
          subtle: '#E8E2D5',
          DEFAULT: '#D6CDB8',
          strong: '#0A0A0A',
          gold: '#C9B58E',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bodoni 72', 'Didot', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display
        'display-xl': ['96px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['72px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['40px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        // Editorial
        'editorial-lg': ['32px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'editorial-md': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        // Body
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
        'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        'body-xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        // Labels (uppercase, tracked)
        'label-lg': ['14px', { lineHeight: '1.4', letterSpacing: '0.1em' }],
        'label-md': ['12px', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'label-sm': ['10px', { lineHeight: '1.3', letterSpacing: '0.15em' }],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '8px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(10, 10, 10, 0.04)',
        md: '0 4px 12px rgba(10, 10, 10, 0.06)',
        lg: '0 12px 32px rgba(10, 10, 10, 0.08)',
        xl: '0 24px 64px rgba(10, 10, 10, 0.12)',
        focus: '0 0 0 3px rgba(201, 181, 142, 0.4)',
      },
      maxWidth: {
        content: '720px',
        prose: '960px',
        page: '1280px',
        wide: '1440px',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '200ms',
        base: '400ms',
        slow: '700ms',
        cinema: '1200ms',
      },
      zIndex: {
        sticky: '100',
        drawer: '200',
        modal: '300',
        toast: '400',
        tooltip: '500',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-cream text-ink;
    font-feature-settings: 'kern', 'liga', 'calt', 'ss01';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply font-sans text-body-md;
  }

  ::selection {
    background: rgba(201, 181, 142, 0.35);
    color: #0A0A0A;
  }

  /* Hide scrollbar but keep functionality, for marquee */
  .scrollbar-hidden::-webkit-scrollbar { display: none; }
  .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }

  /* Honor prefers-reduced-motion globally */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

---

## Accessibility tokens

| Concern | Token / value |
|---|---|
| Focus ring | `shadow-focus` (gold-tinted 3px ring) |
| Min tap target | `44 × 44px` on mobile |
| Min contrast for body text | 7:1 (`#0A0A0A` on `#FAF7F2` passes AAA) |
| Min contrast for large text | 4.5:1 |
| Min contrast for gold accents | They cannot meet AA — never use gold for text content. Lines only. |

---

## Design-token quick reference (for AI prompts)

When asking the AI to build something, you can paste this compressed reference:

```
Colors: cream (#FAF7F2 bg), cream-warm (#F2EDE4 alt), cream-sand (#ECE5D8 panel),
ink (#0A0A0A text), ink-muted (#4A4A4A secondary), gold (#C9B58E accent only).
Fonts: font-display (Bodoni Moda, serif, hero/headings), font-sans (DM Sans, body/UI).
Type: hero=display-xl, h2=display-md, h3=editorial-lg, body=body-md,
buttons/nav=label-lg uppercase tracked.
Radius: sm (2px) buttons, md (4px) cards. Shadows: none default, md on hover.
Motion: duration-base 400ms ease-out-quart for default transitions.
Whitespace: 128px between sections desktop, 80px mobile.
```
