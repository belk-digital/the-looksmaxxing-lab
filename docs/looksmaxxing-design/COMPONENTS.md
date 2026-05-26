# COMPONENTS.md — Component Library

> Every reusable UI component with exact behavior, props, states, and styling. The AI references this when building any component.

---

## How components are organized

```
src/components/
├── ui/              # shadcn primitives (button, input, etc.) — customized
├── shared/          # Site-wide components (header, footer, marquee)
├── shop/            # Shop-specific (product card, gallery, variant selector)
├── editorial/       # Content components (article, pull-quote, image-grid)
├── account/         # Customer dashboard pieces
├── checkout/        # Checkout-flow components
└── motion/          # Reusable motion wrappers (FadeUp, ParallaxImage, etc.)
```

---

## 1. Button

The most important component to get right — establishes the brand voice in every interaction.

### Variants

```tsx
<Button variant="primary" size="md">View Collection</Button>
<Button variant="secondary" size="md">Learn More</Button>
<Button variant="ghost" size="md">Cancel</Button>
<Button variant="link" size="md">Read research</Button>
<Button variant="dark" size="md">Add to Cart</Button>
```

| Variant | Background | Text | Border | Use case |
|---|---|---|---|---|
| `primary` | `cream-sand` | `ink` | `1px ink` | Default primary actions |
| `secondary` | `transparent` | `ink` | `1px ink` | Secondary actions, hero CTAs |
| `ghost` | `transparent` | `ink` | none | Tertiary, dismiss |
| `link` | `transparent` | `ink` | bottom underline | Inline text actions |
| `dark` | `ink` | `cream` | none | High-contrast CTAs (Add to Cart) |

### Sizes

| Size | Padding | Font size | Height |
|---|---|---|---|
| `sm` | `8px 16px` | `label-md` | 36px |
| `md` | `12px 24px` | `label-lg` | 48px |
| `lg` | `16px 40px` | `label-lg` | 56px |

### Typography

All buttons: `font-sans`, `uppercase`, `tracking-wider`, `font-medium` (500).

### States

```css
/* Default → Hover */
primary:    bg-cream-sand → bg-ink, text-ink → text-cream    /* full inversion */
secondary:  border-ink → bg-ink, text-ink → text-cream
ghost:      transparent → bg-cream-warm
link:       underline persistent, color shifts ink → gold-dark
dark:       bg-ink → bg-ink-soft

/* Focus */
All: shadow-focus (gold ring), no outline

/* Disabled */
opacity-40, cursor-not-allowed, no hover transitions

/* Loading */
Content fades to 0, replaced with centered spinner.
Button width is preserved (don't collapse).
```

### Behavior

- Transition: `300ms ease-out-quart` on bg, color, border
- Click: subtle `scale(0.98)` for `100ms`, then back
- Disabled state: pointer-events-none, opacity 0.4
- Loading state: replace text with `<Spinner />`, lock width

### Code shape

```tsx
// src/components/ui/Button.tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-sans uppercase tracking-wider font-medium ' +
  'transition-all duration-300 ease-out-quart rounded-sm ' +
  'focus-visible:outline-none focus-visible:shadow-focus ' +
  'disabled:opacity-40 disabled:pointer-events-none ' +
  'active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:   'bg-cream-sand text-ink border border-ink hover:bg-ink hover:text-cream',
        secondary: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-cream',
        ghost:     'bg-transparent text-ink hover:bg-cream-warm',
        link:      'bg-transparent text-ink underline underline-offset-4 hover:text-gold-dark px-0 py-0 h-auto',
        dark:      'bg-ink text-cream border border-ink hover:bg-ink-soft',
      },
      size: {
        sm: 'text-label-md px-4 py-2 h-9',
        md: 'text-label-lg px-6 py-3 h-12',
        lg: 'text-label-lg px-10 py-4 h-14',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
```

---

## 2. Container

Wraps page sections in consistent max-width + padding.

```tsx
<Container size="page">...</Container>   // 1280px max, default
<Container size="wide">...</Container>   // 1440px max
<Container size="prose">...</Container>  // 960px max — editorial
<Container size="content">...</Container> // 720px max — article body
<Container size="bleed">...</Container>  // No max, edge-to-edge
```

All sizes apply:
- Horizontal padding: 24px mobile, 48px tablet (md), 80px desktop (lg)
- `mx-auto` for centering
- Except `bleed` — no padding, full width

---

## 3. Header / Navigation Bar

The most visible recurring element. Reference: Dr. Sturm + Timeline.

### Desktop layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo wordmark]    SHOP  SCIENCE  ABOUT  JOURNAL    🔍 ♡ 👤 🛒(2)│
└────────────────────────────────────────────────────────────────────┘
```

### Structure
- **Left:** Wordmark logo (links to /)
- **Center:** 3–5 primary nav links — uppercase, tracked, label-lg, evenly spaced
- **Right:** Icon-only controls — Search, Wishlist (heart), Account (user), Cart (bag) with item count badge

### Nav links (primary)

1. **SHOP** (with mega menu on hover — categories grid)
2. **SCIENCE** (research, COA library, peptide calculator)
3. **ABOUT**
4. **JOURNAL** (blog)
5. (Optional 5th: **AFFILIATES**)

### Behavior states

| State | Background | Text |
|---|---|---|
| **Over hero (top of page)** | `transparent` | `cream` (white) |
| **Scrolled (past hero)** | `rgba(250, 247, 242, 0.85)` + `backdrop-blur-md` | `ink` |
| **At top of non-hero pages** | `cream` | `ink` |

Transition between states: `400ms ease-out-quart`.

### Mega menu (on SHOP hover)

Reveals full-width dropdown panel:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  By Category                  Featured                          │
│  ─────────                    ─────────                         │
│  Bioregulators               [Large image card: best-seller]    │
│  Cellular Health                                                │
│  Cognitive                   [Large image card: new arrival]    │
│  Essentials                                                     │
│  Growth Factor               → View all products                │
│  Metabolic                                                      │
│  Receptor Agonist                                               │
│  Recovery                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Open on hover with 100ms delay (so accidental hovers don't trigger)
- Close on hover out with 300ms delay (forgiveness when moving to content)
- Click outside or Esc to dismiss
- Animated reveal: 400ms ease-out-quart, fade + slide down 8px

### Mobile layout

```
┌──────────────────────────────────────┐
│  ☰         [Logo wordmark]      🛒(2)│
└──────────────────────────────────────┘
```

Tapping ☰ opens full-screen menu (not a sidebar — full screen, premium):
```
┌──────────────────────────────────────┐
│  ✕                                   │
│                                      │
│  SHOP                              › │
│  SCIENCE                           › │
│  ABOUT                             › │
│  JOURNAL                           › │
│                                      │
│  ─────                               │
│                                      │
│  🔍  Search                          │
│  ♡  Wishlist                         │
│  👤 Account                          │
│                                      │
│  EN | ES                             │
└──────────────────────────────────────┘
```

- Background: solid `cream`
- Animation: slide in from right, 400ms ease-out-quart
- Tap SHOP → slides in subcategories panel from right
- Locks body scroll

### Announcement bar (above header)

Thin strip, full-width:
```
Order over $300 — complimentary 2-day shipping  •  Use code WELCOME15
```

- Height: 36px
- Background: `ink` 
- Text: `cream`, `label-md`, centered
- Optional dismiss (X) on right
- Can rotate multiple messages (set in SiteSettings — fade between every 5s)

---

## 4. Footer

Generous, dark, considered. Anchors the brand at the bottom of every page.

### Layout (desktop)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         [Wordmark logo, large]                     │
│                         [Face profile mark]                        │
│                                                                    │
│   Newsletter                                                       │
│   ──────────                                                       │
│   Be the first to know.                                            │
│   [email input        ] [SUBSCRIBE]                                │
│                                                                    │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐    │
│ │ Shop         │ The Lab      │ Resources    │ Connect      │    │
│ │              │              │              │              │    │
│ │ All Products │ About        │ Peptide Calc │ Contact      │    │
│ │ Categories   │ Science      │ COA Library  │ Affiliates   │    │
│ │ Best Sellers │ Journal      │ FAQ          │ IG · YT · TT │    │
│ │ Gift Cards   │ Press        │ Shipping     │              │    │
│ └──────────────┴──────────────┴──────────────┴──────────────┘    │
│                                                                    │
│  BIOTECHNOLOGY  |  PRECISION  |  PURITY                           │
│                                                                    │
│  ─────────────────────────────────────────────────────────────    │
│                                                                    │
│  © 2026 The Looksmaxxing Lab.  Terms  Privacy  Refund  Disclaimer │
│                                                                    │
│  [FDA disclaimer in full, small text, muted]                       │
└────────────────────────────────────────────────────────────────────┘
```

- Background: `ink` (#0A0A0A)
- Text: `cream` primary, `text-muted` (lighter gray) for secondary
- The tagline strip "BIOTECHNOLOGY | PRECISION | PURITY" uses `label-md` uppercase, in `gold` — this is one of the few places gold gets to shine
- Generous vertical padding: 128px top, 64px bottom
- Newsletter input: cream bg, ink text, dark border. Submit button: dark variant (ink bg, cream text).

---

## 5. ProductCard

The most repeated commercial component. Two variants: standard and oversized (featured).

### Standard ProductCard

```
┌────────────────────────────┐
│                            │
│                            │
│    [Product image]         │
│         centered           │
│                            │
│                            │
│ ─────────────────────── ♡ │  <- wishlist heart top-right of image
│                            │
│  Peptide Name              │  <- editorial-md serif
│  THYMOSIN BETA-4 · 5MG     │  <- label-md uppercase tracked, muted
│                            │
│  $80 – $800                │  <- body-lg sans 500
│                            │
└────────────────────────────┘
```

- Aspect ratio: 4:5 (taller than wide, matches product photography)
- Background: `cream-warm` (slightly deeper than page bg, makes products pop)
- No border, no shadow by default
- Hover: image scales 1.04 over 700ms ease-out-quart, slight shadow fade in (shadow-md)
- Image lazy-loaded with blur-up placeholder
- Wishlist heart positioned absolute top-right, fades in on card hover

### Featured (oversized) ProductCard

The Rhode-inspired large cards on homepage.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│            [Hero product image, edge-to-edge]            │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Peptide Name                                           │
│   Lorem ipsum dolor sit amet, consectetur                │
│   adipiscing elit. (2-line description)                  │
│                                                          │
│   $80 – $800              [VIEW PRODUCT →]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Full-width within container, or 50% width in a 2-column grid
- Image area: 16:10 or 4:5 aspect ratio (alternate per card for visual rhythm)
- Lower section: cream-warm bg, generous padding (48px)
- Editorial layout: image dominant
- Hover: image cross-fades to alternate angle if available, or subtle scale

---

## 6. Marquee / Ticker

Looping horizontal strip beneath hero. Reference: Rhode + Timeline.

```
┌──────────────────────────────────────────────────────────────┐
│  ◀ ≥99% HPLC PURITY  ·  LC-MS VERIFIED  ·  COA INCLUDED  ◀  │
└──────────────────────────────────────────────────────────────┘
```

- Height: 48px
- Background: `ink`
- Text: `cream`, `label-md` uppercase tracked
- Separator: small dot character ` · ` between items (or a tiny diamond/square)
- Optional: small gold star or arrow icon every N items as visual accent
- Animation: CSS `@keyframes` translateX, infinite, linear, 40 second loop
- Pauses on hover
- Pre-renders content twice in DOM for seamless loop
- Honors `prefers-reduced-motion` — falls back to a static row showing the first 4 items

### Example content sets

**Trust strip (default homepage):**
- ≥99% HPLC PURITY
- LC-MS VERIFIED
- COA WITH EVERY ORDER
- US-BASED FULFILLMENT
- 2-DAY SHIPPING OVER $300

**Press strip (if/when press coverage exists):**
- "[Quote]" — Publication Name
- "[Quote]" — Publication Name
- (rotating press mentions)

---

## 7. Form components

### Input

```tsx
<Input type="email" placeholder="your@email.com" />
```

- Height: 48px
- Background: `cream-warm` (slightly elevated from page)
- Border: 1px `border-default`
- Border-radius: `sm` (2px)
- Padding: 12px 16px
- Font: `body-md` sans-serif
- Focus: border becomes `border-strong` (near-black), shadow-focus (gold ring)
- Error state: border becomes `error`, hint text below in `error`
- Placeholder: `text-muted` color

### Label

```tsx
<Label>Email address</Label>
```

- `body-sm` font-medium, `text-secondary`
- Margin-bottom 8px from associated input
- Required indicator: subtle gold `*` after label text

### Select

Use shadcn Select customized with the same input styling. Chevron icon in `text-secondary`.

### Checkbox & Radio

- Custom-styled, NOT browser defaults
- Box: 18px square, 1px border, `border-default`
- Checked: cream bg, ink border, small ink checkmark
- Radio: 18px circle, same border treatment, ink dot when selected
- Label: `body-md`, aligned to vertical center
- Tap target: extend invisible padding to 44px on mobile

### Form layout

- Vertical stack with `space-stack-sm` (24px) between fields
- Group related fields (e.g., First name + Last name) into 2-column grid with `gap-4`
- Submit button: full-width on mobile, auto-width on desktop, right-aligned

---

## 8. Cart Drawer

Slide-in overlay from right.

```
┌─────────────────────────────────┐
│  YOUR CART (2)              ✕  │
│  ─────────────────────────────  │
│                                 │
│  ┌────┐ TB-500                  │
│  │    │ 5MG  ·  $80             │
│  │ 📷 │                         │
│  └────┘ – 1 +              ✕    │
│                                 │
│  ┌────┐ NAD+                    │
│  │    │ 500MG  ·  $150          │
│  │ 📷 │                         │
│  └────┘ – 1 +              ✕    │
│                                 │
│  Add $70 more for free shipping │
│  [progress bar: 230 / 300]      │
│                                 │
│ ─────────────────────────────── │
│                                 │
│  Subtotal              $230.00  │
│  Shipping              $12.00   │
│  ─────────────────────────────  │
│  Total                 $242.00  │
│                                 │
│  [CHECKOUT — DARK BUTTON]       │
│                                 │
│  [VIEW CART]                    │
│                                 │
└─────────────────────────────────┘
```

- Width: 480px on desktop, 100vw on mobile
- Background: `cream`
- Slide-in: 400ms ease-out-quart from right
- Backdrop: `scrim-dark` overlay, click to close
- Body scroll locked when open
- Esc key closes
- Item row: 80x80 thumbnail, product info, qty stepper, remove X
- Free shipping progress: only shows if under threshold
- Empty state: cream image illustration + "Begin with our most-studied compounds" + CTA

---

## 9. Tabs

For PDP sections (Overview, Lab Results, Reconstitution, Shipping) and Account dashboard.

```
┌─────────────────────────────────────────────────┐
│  OVERVIEW   LAB RESULTS   RECONSTITUTION   ⋯   │
│  ━━━━━━━━                                       │
│                                                 │
│  [Tab content]                                  │
└─────────────────────────────────────────────────┘
```

- Tab labels: `label-lg` uppercase, tracked
- Active indicator: 2px ink bar beneath active tab, animates between tabs (Framer Motion layout animation)
- Inactive: `text-muted`
- Active: `text-primary`
- Generous padding: 16px below indicator before content
- Mobile: tabs scroll horizontally if they overflow

---

## 10. Accordion (FAQ, product details)

```
┌─────────────────────────────────────────────────┐
│  What is research-use-only?                  +  │
│  ─────────────────────────────────────────────  │
│  What purity level is research-grade?        +  │
│  ─────────────────────────────────────────────  │
│  How are COAs verified?                      –  │
│   ─────────────────────────────────────────     │
│   A peptide certificate of analysis...          │
│   (open content here, fades in)                 │
│  ─────────────────────────────────────────────  │
└─────────────────────────────────────────────────┘
```

- Item rows: 24px vertical padding
- Bottom border: 1px `border-subtle`
- Question: `body-lg`, sans-serif
- Icon: + / – on right, in `text-muted`, rotates 45deg on open (smooth)
- Open: content expands smoothly, 400ms ease-out-quart
- Only one open at a time (radio behavior) — or allow multi-open, your call

---

## 11. Editorial / Article components

### PullQuote

```tsx
<PullQuote attribution="Dr. Jane Doe, Lead Researcher">
  Documented purity is the foundation of every reproducible result.
</PullQuote>
```

- Display-sm serif italic
- Max-width content (720px)
- Margin: large vertical (space-stack-lg)
- Optional small ornament (thin gold rule above) — span only the width of the text
- Attribution: label-md uppercase, gold color

### ImageFigure

```tsx
<ImageFigure src="/molecule.jpg" caption="Molecular structure of TB-500" />
```

- Image fills its container width, no border
- Caption below: body-sm, text-secondary, italic
- Hangs left-aligned with article column

### EyebrowHeading

A small uppercase tracked label above a section title:

```
SCIENCE                          <- eyebrow, gold, label-md uppercase
─                                <- short gold rule
Documented purity, every batch.  <- display-md serif
```

---

## 12. Badge

For "Sale", "New", "Best Seller" on product cards.

```tsx
<Badge variant="sale">SALE</Badge>
<Badge variant="new">NEW</Badge>
<Badge variant="bestseller">BEST SELLER</Badge>
```

- Padding: 6px 12px
- Font: label-sm uppercase tracked
- Variants:
  - `sale`: cream bg, ink text, 1px ink border
  - `new`: ink bg, cream text
  - `bestseller`: gold bg, ink text — rare use

Position absolute top-left of product card, 12px from edge.

---

## 13. Image Gallery (PDP)

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│   [Large primary image]              │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
┌────┐┌────┐┌────┐┌────┐┌────┐
│ 1  ││ 2  ││ 3  ││ 4  ││ 5  │  <- thumbnails
└────┘└────┘└────┘└────┘└────┘
```

- Primary image: 4:5 aspect, fills column
- Below: row of 5 thumbnails, each 80x80, gap 8px
- Active thumbnail: 1px ink border
- Inactive: cream-warm bg, 1px subtle border
- Click thumbnail: cross-fade primary image (300ms ease-out)
- Desktop: hover thumbnail to preview
- Mobile: primary image is a swipeable carousel (use Embla Carousel)
- Zoom on click: opens full-screen lightbox with pinch-zoom on mobile

---

## 14. Variant Selector (PDP)

For products with size/concentration variants.

```
Size                          <- label-md uppercase tracked, muted
┌──────────────────────────────────────────┐
│  ⚪ 5 MG · $80                          │
│  ⚪ 10 MG · $150                        │
│  🔘 20 MG · $280                        │
│  ⚪ 50 MG · $650 · OUT OF STOCK         │
└──────────────────────────────────────────┘
```

- Each variant is a clickable row, full-width
- Selected: 1px ink border, cream-warm bg
- Unselected: 1px border-subtle, transparent bg
- Out of stock: opacity 40, strikethrough on label
- Click: instant change, no animation

Alt visual (for fewer variants — pill style):
```
   [ 5 MG ] [ 10 MG ] [ 20 MG ] [ 50 MG ]
```
Same color logic, just pill-shaped instead of rows.

---

## 15. Skeleton / Loading states

Cream-warm shimmering placeholders matching the shape of the loading content.

- Background: `cream-warm`
- Shimmer: linear gradient sweep, gold-light center, 1500ms loop
- Border-radius matches the component being loaded

Always show a skeleton, never a spinner, for content loads. Spinners only for action loads (button click).

---

## 16. Toast / Notification

```
┌────────────────────────────────────────┐
│  ✓  Added to cart              VIEW    │
└────────────────────────────────────────┘
```

- Position: bottom-center on mobile, bottom-left on desktop
- Background: `ink`
- Text: `cream`
- Icon left: cream/gold
- Action link right (optional): uppercase tracked
- Slide in from below, 400ms ease-out
- Auto-dismiss after 4 seconds (or 6 for important)
- Stack vertically if multiple

Use Sonner library (already in shadcn) with customized theme.

---

## 17. Empty states

Never just "No results." Always:
- A small illustration or symbol (can be a single gold-line icon)
- A clear, branded line of copy
- A CTA when relevant

Example: empty wishlist
```
                  ♡
            (gold outline)

      Your wishlist is empty.
   Save items you're considering
       for next time.

      [BROWSE PRODUCTS →]
```

---

## 18. Pagination

Used on PLP, blog, order history.

```
                ‹ PREV   1  2  3 … 12   NEXT ›
```

- Numbers: label-lg, ink color
- Active number: 1px bottom underline in gold
- Hover: gold-dark text
- Prev/Next: uppercase tracked with chevron
- Mobile: just prev/next + "Page X of Y" between

Prefer infinite scroll on PLP, traditional pagination on order history and blog.

---

## 19. Breadcrumbs

```
Home  ›  Shop  ›  Bioregulators  ›  TB-500
```

- label-md uppercase tracked
- Color: `text-muted` for inactive levels, `text-primary` for current
- Separator: `›` in `text-muted`
- Current page: not a link, not interactive
- Hover: gold-dark on inactive levels

---

## 20. Modal / Dialog

Smaller than the cart drawer, centered on screen, for confirmations and forms.

```
                ┌────────────────────────────┐
                │                            │
                │  Confirm sign out?         │
                │                            │
                │  You'll need to sign back  │
                │  in to view your account.  │
                │                            │
                │  [SIGN OUT]   [CANCEL]     │
                │                            │
                └────────────────────────────┘
```

- Width: 480px on desktop, calc(100% - 32px) on mobile
- Background: `cream`
- Border-radius: `md` (4px)
- Shadow: `xl`
- Backdrop: `scrim-dark`
- Animation: scale from 0.96 to 1, fade in, 400ms ease-out

---

## 21. Spinner / Loader

For action loading states (button clicks, payment processing).

- SVG circle, 24px default, scales with `currentColor`
- Stroke 2px, dashed (one quarter visible)
- Rotates 360deg over 800ms linear, infinite

For full-page loading: a single gold dot in the center, breathing pulse (scale 1 to 1.15 over 1200ms).

---

## 22. Quantity Stepper

```
[ – ]  2  [ + ]
```

- Each button: 32x32, 1px border-subtle, cream bg
- Center: `body-md`, monospace digit, ink color
- Hover button: bg becomes cream-warm
- Disabled (at min/max): opacity 40

---

## 23. Wishlist Heart Button

Small icon button used on product cards.

- Default: outline heart icon, 1.5px stroke, color `text-muted`
- Active (in wishlist): filled heart, `ink` color
- Hover: scales 1.1, color shifts to `gold-dark`
- Tap: fills with subtle bounce animation (Framer spring)

---

## 24. Stock Indicator

Appears on PDPs and cart rows.

| Stock level | Display |
|---|---|
| 0 | "OUT OF STOCK" — `error` color, `label-md` |
| 1–5 | "ONLY 3 LEFT" — `warning` color, `label-md` |
| > 5 | "IN STOCK" — `success` color, `label-md` |
| Backorder | "AVAILABLE TO BACKORDER" — `text-muted`, `label-md` |

Optional small dot indicator (6x6) in matching color, left of the text.

---

## 25. Trust Badges Row (Homepage / PDP)

Three icon+text columns showing trust signals:

```
   ⚡             🔬             🔒
≥99% HPLC      LC-MS         COA WITH
PURITY        VERIFIED       EVERY ORDER

(thin gold rule between each column on desktop)
```

- Icons: custom 32px line illustrations in gold (not Lucide — custom)
- Title: `label-lg` uppercase tracked
- Body: `body-sm`, optional 1-line description
- Spacing: generous, centered, 3 columns on desktop, stacked on mobile

---

## Building order

If building components from scratch in priority order:
1. **Container, Button, Input, Label** — foundation
2. **Header (nav)** — visible everywhere
3. **Footer** — visible everywhere
4. **ProductCard** — most repeated commercial unit
5. **Marquee** — homepage hero adjacency
6. **Cart Drawer** — needed before checkout
7. **ImageGallery, VariantSelector** — PDP essentials
8. **Tabs, Accordion** — PDP and FAQ
9. **Form components, Toast, Modal** — interactions
10. **Editorial components** (PullQuote, ImageFigure, EyebrowHeading) — content pages
11. **Skeleton, Spinner, EmptyState** — polish
12. **Badge, StockIndicator, TrustBadges, Pagination, Breadcrumbs** — final pass
