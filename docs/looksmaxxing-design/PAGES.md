# PAGES.md — Page Layouts & Wireframes

> Every page in the site, with section-by-section layout, content requirements, and visual notes. ASCII wireframes show structure — actual designs follow the system in DESIGN-SYSTEM.md and components from COMPONENTS.md.

---

## Page inventory

| Page | Path | Status |
|---|---|---|
| 1. Homepage | `/` | Highest priority |
| 2. Shop (all products) | `/shop` | High |
| 3. Category page | `/shop/[category]` | High |
| 4. Product detail (PDP) | `/products/[slug]` | High |
| 5. Cart | `/cart` | High |
| 6. Checkout | `/checkout` | High |
| 7. Order confirmation | `/order-confirmation/[id]` | Medium |
| 8. Account dashboard | `/account` | Medium |
| 9. Account: orders | `/account/orders` | Medium |
| 10. Account: addresses | `/account/addresses` | Medium |
| 11. Account: wishlist | `/account/wishlist` | Medium |
| 12. Account: settings | `/account/settings` | Medium |
| 13. Login / Register | `/login`, `/register` | Medium (Clerk handles) |
| 14. About | `/about` | High (editorial) |
| 15. Journal (blog index) | `/journal` | High (editorial) |
| 16. Journal post | `/journal/[slug]` | High (editorial) |
| 17. Peptide Calculator | `/peptide-calculator` | High |
| 18. COA Library | `/certificates` | High |
| 19. Affiliates landing | `/affiliates` | Medium |
| 20. Affiliate apply | `/affiliates/apply` | Medium |
| 21. Affiliate dashboard | `/affiliates/dashboard/*` | Medium |
| 22. FAQ | `/faq` | Medium |
| 23. Contact | `/contact` | Medium |
| 24. Policies | `/privacy`, `/terms`, `/shipping`, `/returns`, `/disclaimer` | Low |
| 25. 404 / Error pages | catch-all | Low |

---

## 1. Homepage (`/`)

The most carefully designed page. Establishes the brand on first visit.

### Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ANNOUNCEMENT BAR  (36px, ink bg, cream text, optional dismiss)   │
├──────────────────────────────────────────────────────────────────┤
│ HEADER  (transparent over hero, frosted on scroll)               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                                                                  │
│           HERO  (full viewport — 100vh on desktop)               │
│                                                                  │
│         [Looping ambient video, marble + glass]                  │
│                                                                  │
│           Research-grade peptides.                               │
│           Documented purity.                                     │
│                                                                  │
│              [VIEW COLLECTION]    [the science →]                │
│                                                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ MARQUEE TICKER (48px, ink bg, cream text)                        │
│ ≥99% HPLC PURITY · LC-MS VERIFIED · COA INCLUDED · US-BASED ...  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: FEATURED PROTOCOLS                                     │
│  ─                                                               │
│  Most-studied compounds                                          │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │                        │  │                        │         │
│  │   [Oversized product]  │  │   [Oversized product]  │         │
│  │       TB-500           │  │       NAD+             │         │
│  │   $80–$800             │  │   $50–$650             │         │
│  │   [VIEW →]             │  │   [VIEW →]             │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │   [Oversized product]  │  │   [Oversized product]  │         │
│  │       BPC-157          │  │       SEMAGLUTIDE      │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│                       [VIEW ALL PRODUCTS]                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: BY CATEGORY                                            │
│  ─                                                               │
│  Eight research focuses                                          │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │      │ │      │ │      │ │      │                            │
│  │ Bio- │ │Cell- │ │Cogni-│ │Essen-│                            │
│  │regu- │ │ular  │ │tive  │ │tials │                            │
│  │lators│ │Health│ │Func. │ │      │                            │
│  └──────┘ └──────┘ └──────┘ └──────┘                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │Growth│ │Metab.│ │Recep.│ │Recov.│                            │
│  └──────┘ └──────┘ └──────┘ └──────┘                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│           [Full-bleed lifestyle image — hand to face,            │
│              warm marble surface, ambient lighting]              │
│                                                                  │
│                                                                  │
│  EYEBROW: THE LAB                                                │
│  ─                                                               │
│  Considered compounds for considered research.                   │
│                                                                  │
│  Body paragraph (3–4 lines, body-lg, max-w-prose centered).      │
│  About our approach, our standards, what we don't do.            │
│                                                                  │
│                  [READ ABOUT US →]                               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRUST BADGES ROW                                                │
│  ─────────────────────────────────────                           │
│  ⚡ ≥99% HPLC      🔬 LC-MS         🔒 COA WITH                 │
│     PURITY            VERIFIED         EVERY ORDER               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: SCIENCE JOURNAL                                        │
│  ─                                                               │
│  Latest research                                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │              │  │              │  │              │          │
│  │  [Article    │  │  [Article    │  │  [Article    │          │
│  │   image]     │  │   image]     │  │   image]     │          │
│  │              │  │              │  │              │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ EMERGING     │  │ PROTOCOL     │  │ RESEARCH     │          │
│  │              │  │              │  │              │          │
│  │ The case for │  │ How to       │  │ TB-500 in    │          │
│  │ NAD+ in...   │  │ reconstit... │  │ recovery...  │          │
│  │              │  │              │  │              │          │
│  │ 7 min read   │  │ 5 min read   │  │ 12 min read  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│                  [VIEW THE JOURNAL →]                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│           NEWSLETTER SECTION  (cream-sand bg)                    │
│                                                                  │
│  EYEBROW: STAY INFORMED                                          │
│  ─                                                               │
│  Quiet updates.                                                  │
│  New compounds and research notes — no marketing noise.          │
│                                                                  │
│  [email input              ] [SUBSCRIBE]                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER  (full footer per COMPONENTS.md)                          │
└──────────────────────────────────────────────────────────────────┘
```

### Section spacing
- Hero to Marquee: 0 (flush)
- Marquee to Featured: 128px
- Featured to Categories: 128px
- Categories to About: 128px
- About to Trust: 96px
- Trust to Journal: 128px
- Journal to Newsletter: 128px
- Newsletter to Footer: 0 (newsletter sits as a band before footer)

### Hero specifics

- Video file: `.webm` + `.mp4` fallback, max 4MB, 10–15 second loop
- Content: should evoke marble, water, glass, light — NOT a face, NOT a product. Abstract texture-rich ambient
- Headline: `display-xl` Bodoni Moda
- Subhead: `body-lg` DM Sans
- CTAs: 1 primary (filled), 1 link-style secondary
- Headline alignment: left-aligned on desktop (within container), centered on mobile
- Video alignment: object-cover, edge-to-edge
- Overlay: subtle dark gradient on bottom 30% to make text legible against any video frame
- Mobile: video replaced with static image (data savings), same text layout

### Animations on homepage

- Hero text: fades up with 100ms stagger between lines, starts after 200ms
- Marquee: starts looping immediately
- Featured products: scroll-triggered, fade up 24px with 100ms stagger across the 4 cards
- Categories: scroll-triggered, fade up 24px in a wave (stagger 50ms)
- About image: subtle parallax — moves at 0.8x scroll speed
- Trust badges: scroll-triggered, fade up 16px, no stagger (appear together)
- Journal cards: fade up 24px, 100ms stagger
- Newsletter: fade up on entry

All scroll triggers: fire once, when 30% of section in view, 600ms duration, ease-out-quart.

---

## 2. Shop (`/shop`)

Product Listing Page — all products with filters.

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home › Shop                                                     │
│                                                                  │
│  All compounds                                                   │
│  Browse our complete catalog of research-grade peptides.         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────┐  ┌───────────────────────────────────────────┐ │
│ │              │  │ Showing 24 of 47       Sort: Featured ▼  │ │
│ │  FILTERS     │  └───────────────────────────────────────────┘ │
│ │              │                                                │
│ │ Category     │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ ☐ Biologic   │  │         │ │         │ │         │         │
│ │ ☐ Cellular   │  │ Product │ │ Product │ │ Product │         │
│ │ ☐ Cognitive  │  │  Card   │ │  Card   │ │  Card   │         │
│ │ ☐ Essentials │  │         │ │         │ │         │         │
│ │ ☐ ...        │  └─────────┘ └─────────┘ └─────────┘         │
│ │              │                                                │
│ │ Price        │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ [─o────]     │  │         │ │         │ │         │         │
│ │ $0–$1500     │  │  Card   │ │  Card   │ │  Card   │         │
│ │              │  │         │ │         │ │         │         │
│ │ Availability │  └─────────┘ └─────────┘ └─────────┘         │
│ │ ☐ In stock   │                                                │
│ │ ☐ On sale    │  (3-column grid on desktop,                   │
│ │              │   2-column on tablet, 1-column on mobile)     │
│ │ Purity       │                                                │
│ │ ☐ ≥99%       │  [LOAD MORE]                                  │
│ │              │   or infinite scroll trigger                  │
│ │ [CLEAR ALL]  │                                                │
│ └──────────────┘                                                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Notes
- Filters sidebar: 280px width on desktop, sticky to viewport (top: 100px to clear header)
- Mobile: filters in a slide-up drawer, FAB-style filter button bottom-right
- Sort dropdown: shadcn Select, top-right of product grid
- Product grid: 3 columns desktop, 2 tablet, 1 mobile
- Pagination: prefer infinite scroll on this page (with "Loading more..." indicator)
- Filter URL state: every filter reflects in URL params (`?category=cellular&minPrice=100`)
- Active filter chips above grid, with X to remove individually

---

## 3. Category page (`/shop/[category]`)

Same as Shop but with category-specific hero:

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home › Shop › Bioregulators                                     │
│                                                                  │
│ ┌────────────────────────┬─────────────────────────────────────┐│
│ │                        │                                     ││
│ │  EYEBROW: CATEGORY     │   [Category hero image,             ││
│ │                        │    relevant scientific/lifestyle]   ││
│ │  Bioregulators         │                                     ││
│ │                        │                                     ││
│ │  Peptide bioregulators │                                     ││
│ │  are sequences derived │                                     ││
│ │  from peptide          │                                     ││
│ │  fractions...          │                                     ││
│ │                        │                                     ││
│ └────────────────────────┴─────────────────────────────────────┘│
│                                                                  │
│  (then same filter + grid structure as Shop, pre-filtered)       │
└──────────────────────────────────────────────────────────────────┘
```

- Hero: split layout (text left, image right). 60vh tall.
- Image: relevant lifestyle or scientific imagery
- Description: editorial copy about the category (NOT product list summary)
- Sub-categories (if any): chips below description

---

## 4. Product Detail Page (`/products/[slug]`)

The most important commercial page after homepage. Spend extra design time here.

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home › Shop › Bioregulators › TB-500                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────┬───────────────────────────────┐ │
│ │                             │                               │ │
│ │                             │  EYEBROW: BIOREGULATORS · NEW │ │
│ │                             │                               │ │
│ │                             │  TB-500                       │ │
│ │                             │  THYMOSIN BETA-4              │ │
│ │   [Large primary image]     │                               │ │
│ │                             │  ★★★★☆ 4.7 (124 reviews)      │ │
│ │      (4:5 aspect)           │                               │ │
│ │                             │  From $80.00                  │ │
│ │                             │                               │ │
│ │                             │  ─────────                    │ │
│ │                             │                               │ │
│ │                             │  A stabilized actin-binding   │ │
│ │ ┌──┐┌──┐┌──┐┌──┐┌──┐        │  peptide studied for its      │ │
│ │ │T1││T2││T3││T4││T5│        │  effects on angiogenesis      │ │
│ │ └──┘└──┘└──┘└──┘└──┘        │  and tissue repair.           │ │
│ │   (thumbnails)              │                               │ │
│ │                             │  Size                         │ │
│ │ (sticky on scroll on        │  ⚪ 5 MG · $80                │ │
│ │  desktop until end of       │  🔘 10 MG · $150              │ │
│ │  product info section)      │  ⚪ 20 MG · $280              │ │
│ │                             │  ⚪ 50 MG · $650 · OUT OF STOCK│ │
│ │                             │                               │ │
│ │                             │  Quantity   [ – ] 1 [ + ]    │ │
│ │                             │                               │ │
│ │                             │  ─────────                    │ │
│ │                             │                               │ │
│ │                             │  ● IN STOCK · SHIPS 1–2 DAYS  │ │
│ │                             │                               │ │
│ │                             │  [ ADD TO CART — DARK BUTTON ]│ │
│ │                             │  [ ♡ Save for later          ]│ │
│ │                             │                               │ │
│ │                             │  ─────────                    │ │
│ │                             │                               │ │
│ │                             │  ⚡ ≥99% HPLC PURITY          │ │
│ │                             │  🔬 LC-MS VERIFIED            │ │
│ │                             │  🔒 COA INCLUDED              │ │
│ │                             │                               │ │
│ │                             │  ▼ COA DOCUMENT (PDF)         │ │
│ │                             │                               │ │
│ └─────────────────────────────┴───────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OVERVIEW   LAB RESULTS   RECONSTITUTION   SHIPPING & RETURNS   │
│  ────────                                                        │
│                                                                  │
│  [Tab content — editorial-styled body                            │
│   with PullQuote, ImageFigure components.                        │
│   Generous spacing, max-w-prose.]                                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │   [Full-bleed editorial image — molecular structure,    │    │
│  │    HPLC chromatogram, or lifestyle photography]         │    │
│  │                                                         │    │
│  │                                                         │    │
│  │       EYEBROW: THE SCIENCE                              │    │
│  │       Why TB-500 has become a reference                 │    │
│  │       compound in tissue repair research.               │    │
│  │                                                         │    │
│  │       Body paragraph...                                 │    │
│  │       [READ THE FULL PROTOCOL →]                        │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REVIEWS                                                         │
│  ─                                                               │
│                                                                  │
│  ★★★★☆  4.7 / 5                Distribution                     │
│  Based on 124 reviews          5 ★ ████████ 87                  │
│                                4 ★ ███      28                  │
│                                3 ★ █         6                  │
│                                                                  │
│  [Sort ▼]  [Filter ▼]                                            │
│                                                                  │
│  ────────────────────────────────────────                        │
│  ★★★★★  J.D. · Verified purchase · 2 days ago                   │
│  Outstanding documentation.                                      │
│  Body of review (body-md, max 4 lines visible, "read more").     │
│  [Helpful (12)]                                                  │
│  ────────────────────────────────────────                        │
│  (more reviews...)                                               │
│                                                                  │
│  [LOAD MORE REVIEWS]                                             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: ALSO CONSIDERED                                        │
│  ─                                                               │
│  You might also research                                         │
│                                                                  │
│  [4 related product cards — horizontal scroll on mobile]         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### PDP-specific notes
- Right column (product info) sticky on desktop scroll until end of editorial sections
- "Add to Cart" button: full-width on mobile, sticky to bottom of viewport on mobile (always reachable)
- Tab content: stays in viewport above the fold when switched, scroll doesn't reset
- Reviews limited to 5 initially, expand to 20, then pagination
- Photo gallery: 5+ images per product is the standard

---

## 5. Cart (`/cart`)

Distinct from cart drawer — fuller experience for review before checkout.

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cart (2 items)                                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌────────────────────────────────────┬──────────────────────┐   │
│ │ ITEMS                              │                      │   │
│ │                                    │  ORDER SUMMARY       │   │
│ │ ┌──────┐  TB-500                   │                      │   │
│ │ │      │  Thymosin Beta-4 · 10 mg  │  Subtotal   $230.00 │   │
│ │ │ 📷   │  $150.00                  │  Shipping   $12.00  │   │
│ │ └──────┘                           │  Tax        $18.40  │   │
│ │   [– 1 +]                  Remove  │  ─────────────────  │   │
│ │                                    │  Total      $260.40 │   │
│ │ ─────────────────────────────      │                      │   │
│ │                                    │  Promo code          │   │
│ │ ┌──────┐  NAD+                     │  [code  ] [APPLY]   │   │
│ │ │ 📷   │  500 mg · $80.00          │                      │   │
│ │ └──────┘                           │  [CHECKOUT →]        │   │
│ │   [– 1 +]                  Remove  │  Dark button         │   │
│ │                                    │                      │   │
│ │ ─────────                          │  We accept:          │   │
│ │                                    │  Visa · MC · AmEx    │   │
│ │ [← Continue shopping]              │  · ApplePay · GPay   │   │
│ │                                    │                      │   │
│ └────────────────────────────────────┴──────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: ALSO CONSIDERED                                        │
│  ─                                                               │
│  Recommended for your cart                                       │
│                                                                  │
│  [4 related products]                                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Right column sticky on desktop
- Mobile: order summary collapses to top of page with subtotal + checkout button, expand for full breakdown
- Empty cart state: cream illustration + "Your cart is empty" + "Begin with our most-studied compounds" + browse CTA

---

## 6. Checkout (`/checkout`)

Single-page (not multi-step). Premium and efficient.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Minimal header: just logo, centered. No nav.]                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────┬──────────────────────────┐  │
│ │                                 │                          │  │
│ │  CHECKOUT                       │  ORDER SUMMARY           │  │
│ │                                 │  (sticky right)          │  │
│ │  1. CONTACT                     │                          │  │
│ │  ─                              │  ┌──┐ TB-500             │  │
│ │  [email                      ]  │  │📷│ 10mg · $150        │  │
│ │  ☐ Get updates on this order    │  └──┘                    │  │
│ │     and similar research        │                          │  │
│ │                                 │  ┌──┐ NAD+               │  │
│ │  2. SHIPPING ADDRESS            │  │📷│ 500mg · $80        │  │
│ │  ─                              │  └──┘                    │  │
│ │  [First name] [Last name]       │                          │  │
│ │  [Street]                       │  ─                       │  │
│ │  [Apt/Suite]                    │                          │  │
│ │  [City] [State ▼] [ZIP]         │  Subtotal     $230.00    │  │
│ │  [Phone]                        │  Shipping     $12.00     │  │
│ │  ☐ Save this address for next   │  Tax          $18.40     │  │
│ │                                 │  ─                       │  │
│ │  3. SHIPPING METHOD             │  Total        $260.40    │  │
│ │  ─                              │                          │  │
│ │  🔘 Standard 3–5 days  $12      │  Promo code              │  │
│ │  ⚪ Priority 2 days    $24      │  [code  ] [APPLY]        │  │
│ │                                 │                          │  │
│ │  4. PAYMENT                     │                          │  │
│ │  ─                              │                          │  │
│ │  [Stripe Payment Element        │                          │  │
│ │   embedded here — card,         │                          │  │
│ │   Apple Pay, Google Pay,        │                          │  │
│ │   Link options]                 │                          │  │
│ │                                 │                          │  │
│ │  5. ACKNOWLEDGEMENT             │                          │  │
│ │  ─                              │                          │  │
│ │  ☐ I acknowledge these products │                          │  │
│ │     are for research use only   │                          │  │
│ │     and I am 21+ years of age.  │                          │  │
│ │                                 │                          │  │
│ │  Notes (optional)               │                          │  │
│ │  [textarea]                     │                          │  │
│ │                                 │                          │  │
│ │  [PLACE ORDER — DARK BUTTON  ]  │                          │  │
│ │                                 │                          │  │
│ │  🔒 Encrypted. Your data is     │                          │  │
│ │     never sold.                 │                          │  │
│ │                                 │                          │  │
│ └─────────────────────────────────┴──────────────────────────┘  │
│                                                                  │
│  [Minimal footer: just policy links + © line]                    │
└──────────────────────────────────────────────────────────────────┘
```

- All sections visible on one page (NOT accordion/multi-step)
- Section transitions: when a section becomes valid, the next section's border darkens, indicating ready to fill
- Mobile: order summary at top, collapsible (shows subtotal + "View details ▼")
- Express checkout buttons (Apple Pay, Google Pay) at very top, above section 1
- "Have an account? Sign in for faster checkout" link below contact section

---

## 7. Order Confirmation (`/order-confirmation/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                          ✓                                       │
│                  (gold checkmark)                                │
│                                                                  │
│              Thank you, Sarah.                                   │
│              Your order is confirmed.                            │
│                                                                  │
│              Order #LL-2026-00342                                │
│              We've sent confirmation to                          │
│              sarah@example.com                                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ORDER DETAILS                                                   │
│  ─                                                               │
│                                                                  │
│  [Items table — image, name, qty, price]                         │
│                                                                  │
│  ─                                                               │
│                                                                  │
│  Shipping to:              Estimated delivery:                   │
│  Sarah Smith               March 12–14                           │
│  123 Main St                                                     │
│  ...                       Tracking link will be                 │
│                            emailed when shipped.                 │
│                                                                  │
│  ─                                                               │
│                                                                  │
│  Subtotal         $230.00                                        │
│  Shipping         $12.00                                         │
│  Tax              $18.40                                         │
│  ─                                                               │
│  Total            $260.40                                        │
│                                                                  │
│  Charged to Visa ending in 4242                                  │
│                                                                  │
│                                                                  │
│  [VIEW ORDER]     [CONTINUE BROWSING]                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Confirmation icon: large gold checkmark, subtle scale-in animation (Framer spring)
- Generous vertical spacing — this is a moment, treat it as one
- All info accessible to the customer (not just a "thanks, check email" page)
- Fire purchase analytics event once on load (sessionStorage flag to prevent re-fire)

---

## 8–12. Account dashboard pages

Account dashboard uses a left sidebar nav + content layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  My Account                                                      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────┬───────────────────────────────────────────────┐│
│ │              │                                               ││
│ │  Welcome,    │  [Current section content]                    ││
│ │  Sarah       │                                               ││
│ │              │                                               ││
│ │  Overview    │                                               ││
│ │  Orders      │                                               ││
│ │  Addresses   │                                               ││
│ │  Wishlist    │                                               ││
│ │  Settings    │                                               ││
│ │              │                                               ││
│ │  ─           │                                               ││
│ │              │                                               ││
│ │  Sign out    │                                               ││
│ │              │                                               ││
│ └──────────────┴───────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Overview (`/account`)
- Stats: orders placed, wishlist count, current loyalty/affiliate status
- Recent orders (last 3) — clickable
- Default address card
- Quick links: track order, contact support

### Orders (`/account/orders`)
- Table on desktop, cards on mobile
- Columns: Order #, Date, Status, Total, View
- Filter: by status, year
- Click → order detail page

### Order detail (`/account/orders/[id]`)
- Same structure as Order Confirmation page, plus:
- Tracking info if shipped (status timeline)
- "Reorder" button (adds all items back to cart)
- "Request return" (if eligible, within window)

### Addresses (`/account/addresses`)
- Grid of address cards
- Each: name, full address, "Default shipping" / "Default billing" badges, Edit / Delete
- "Add new address" button

### Wishlist (`/account/wishlist`)
- Same grid as Shop, but smaller (4-col desktop)
- Per item: Remove + Add to Cart actions
- "Move all to cart" button

### Settings (`/account/settings`)
- Sections: Personal info, Email & password, Notifications, Language, Marketing preferences
- Email change requires re-verification
- Password change handled by Clerk's component

---

## 13. Login / Register (`/login`, `/register`)

Clerk's components handle the form. The page wraps them:

```
┌──────────────────────────────────────────────────────────────────┐
│ MINIMAL HEADER (just logo, centered)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                                                                  │
│ ┌────────────────────────┬──────────────────────────────────┐   │
│ │                        │                                  │   │
│ │  [Full-bleed image:    │      EYEBROW: WELCOME            │   │
│ │   abstract texture,    │      ─                           │   │
│ │   marble + glass]      │      Sign in                     │   │
│ │                        │                                  │   │
│ │                        │      [<SignIn /> from Clerk,     │   │
│ │                        │       customized to match brand] │   │
│ │                        │                                  │   │
│ │                        │      New here? Create account →  │   │
│ │                        │                                  │   │
│ └────────────────────────┴──────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- 50/50 split on desktop, image-only on mobile (above form)
- Clerk component appearance customized: cream bg, ink text, gold focus, DM Sans font
- Same template for /register — image and form, customized copy

---

## 14. About (`/about`)

Editorial page. Big design opportunity.

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Hero section — large image left, manifesto right (60vh)        │
│                                                                  │
│ ┌─────────────────────────────┬───────────────────────────────┐ │
│ │                             │                               │ │
│ │                             │   EYEBROW: THE LAB            │ │
│ │   [Full-bleed lifestyle     │   ─                           │ │
│ │    or laboratory image]     │                               │ │
│ │                             │   Considered                  │ │
│ │                             │   compounds for               │ │
│ │                             │   considered research.        │ │
│ │                             │                               │ │
│ │                             │   (display-md serif)          │ │
│ │                             │                               │ │
│ └─────────────────────────────┴───────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: ORIGIN                                                 │
│  ─                                                               │
│  Why we started                                                  │
│                                                                  │
│  [Body paragraph, max-w-prose centered, body-lg                  │
│   editorial-feeling typesetting with first-letter drop cap]      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PullQuote                                                       │
│  ─                                                               │
│  "Beauty as biology. Documentation as discipline."               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THREE PILLARS                                                   │
│  ─                                                               │
│                                                                  │
│  ┌──────────────────┬──────────────────┬──────────────────┐    │
│  │                  │                  │                  │    │
│  │   [Image 1]      │   [Image 2]      │   [Image 3]      │    │
│  │                  │                  │                  │    │
│  │ Documented       │ Considered       │ Quiet            │    │
│  │ purity           │ ritual           │ science          │    │
│  │                  │                  │                  │    │
│  │ Body...          │ Body...          │ Body...          │    │
│  │                  │                  │                  │    │
│  └──────────────────┴──────────────────┴──────────────────┘    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Standards section: full-width image + overlaid text             │
│  about HPLC, MS, COA process                                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CTA section: link to Science / Journal / Shop                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

Heavy use of scroll-triggered animations. Treat like a magazine article.

---

## 15. Journal / Blog index (`/journal`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EYEBROW: JOURNAL                                               │
│   ─                                                              │
│   Notes from the lab                                             │
│   Research references, protocols, and emerging studies.          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   FEATURED POST (1 large card)                                   │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │                                                            │  │
│ │      [Large hero image]                                    │  │
│ │                                                            │  │
│ │      EMERGING RESEARCH · 7 MIN READ                        │  │
│ │      The case for NAD+ in mitochondrial research           │  │
│ │      A brief tour of the molecular machinery...            │  │
│ │      [READ →]                                              │  │
│ │                                                            │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter chips: ALL · EMERGING · PROTOCOLS · STUDIES · GUIDES    │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ [Image]  │ │ [Image]  │ │ [Image]  │                        │
│  │ Category │ │ Category │ │ Category │                        │
│  │ Title    │ │ Title    │ │ Title    │                        │
│  │ Excerpt  │ │ Excerpt  │ │ Excerpt  │                        │
│  │ 5 min    │ │ 8 min    │ │ 12 min   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                  │
│  (more rows of 3, infinite scroll or pagination)                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16. Journal post (`/journal/[slug]`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │              [Hero image — full bleed]                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│            EMERGING RESEARCH · MARCH 12, 2026 · 7 MIN            │
│            ─                                                     │
│                                                                  │
│            The case for NAD+ in                                  │
│            mitochondrial research                                │
│                                                                  │
│            By Dr. Researcher Name                                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│            [Article body — max-w-content 720px,                  │
│             body-lg text, generous line-height,                  │
│             drop-cap on first paragraph,                         │
│             editorial typesetting]                               │
│                                                                  │
│            Paragraph 1...                                        │
│                                                                  │
│            ## Section heading (editorial-md serif)               │
│                                                                  │
│            More paragraphs...                                    │
│                                                                  │
│            [Embedded ImageFigure — breaks out of column          │
│             slightly for visual emphasis]                        │
│                                                                  │
│            <PullQuote>                                           │
│              "Quote that frames the piece."                      │
│            </PullQuote>                                          │
│                                                                  │
│            More content...                                       │
│                                                                  │
│            ## References                                         │
│                                                                  │
│            [Numbered list of cited papers]                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EYEBROW: RELATED                                                │
│  ─                                                               │
│  Continue reading                                                │
│                                                                  │
│  [3 related posts — same card style as journal index]            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

Reading experience first. No popups, no inline CTAs interrupting the flow. Optional sticky reading-progress bar at very top of viewport (1px gold).

---

## 17. Peptide Calculator (`/peptide-calculator`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EYEBROW: RESEARCH TOOLS                                        │
│   ─                                                              │
│   Peptide reconstitution calculator                              │
│                                                                  │
│   A guided calculator for accurate peptide reconstitution        │
│   and dose volume calculation. For research use only.            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  INPUT                                                      │ │
│ │  ─                                                          │ │
│ │                                                             │ │
│ │  Peptide amount in vial                                     │ │
│ │  [    5    ] MG                                             │ │
│ │                                                             │ │
│ │  Bacteriostatic water to add                                │ │
│ │  [    2    ] ML                                             │ │
│ │                                                             │ │
│ │  Desired dose                                               │ │
│ │  [   250   ] MCG                                            │ │
│ │                                                             │ │
│ │  ─                                                          │ │
│ │                                                             │ │
│ │  RESULTS                                                    │ │
│ │  ─                                                          │ │
│ │                                                             │ │
│ │  Concentration              2.5 mg / mL                     │ │
│ │  Volume per dose            0.10 mL                         │ │
│ │  Syringe marking            10 IU (on 100u syringe)         │ │
│ │  Doses per vial             20 doses                        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  How to use this calculator (collapsible accordion)              │
│  Why each calculation matters (collapsible)                      │
│  Storage and handling (collapsible)                              │
│  See also: full reconstitution guide → /journal/[guide-slug]     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Disclaimer block (small text, muted)                            │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Centered, max-w-prose
- Cream-warm background for the calculator card to differentiate from page
- Live calculation — updates as user types (no submit button)
- Number inputs styled large, easy to tap
- Results displayed as a clean stat table (label left, value right)
- If any field empty: results show "—"

---

## 18. COA Library (`/certificates`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EYEBROW: LABORATORY VERIFICATION                               │
│   ─                                                              │
│   Certificate of Analysis library                                │
│                                                                  │
│   Every batch verified. Every result published.                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Filter by category dropdown]                                   │
│                                                                  │
│  ┌────────────┬──────────┬──────────┬───────────┬──────────┐    │
│  │ PRODUCT    │ PURITY   │ BATCH    │ ANALYZED  │   COA    │    │
│  ├────────────┼──────────┼──────────┼───────────┼──────────┤    │
│  │ TB-500     │ ≥99.4%   │ TB24-A   │ 2026-04   │ [↓ PDF]  │    │
│  │ NAD+       │ ≥99.1%   │ ND24-B   │ 2026-04   │ [↓ PDF]  │    │
│  │ BPC-157    │ ≥99.6%   │ BP24-C   │ 2026-03   │ [↓ PDF]  │    │
│  │ ...        │ ...      │ ...      │ ...       │ ...      │    │
│  └────────────┴──────────┴──────────┴───────────┴──────────┘    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  About our testing process (editorial section)                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Table on desktop, cards on mobile
- Each row has a download icon for the COA PDF
- Generous row height — easy to scan
- 1px subtle dividers between rows, no zebra striping (too busy for the aesthetic)

---

## 19–21. Affiliates pages

### Landing (`/affiliates`)

Same hero pattern as About. Sections: hero, how it works (3 steps), commission rates, FAQ, application CTA.

### Application (`/affiliates/apply`)

Single-page form, editorial-styled. Fields per `/docs/AFFILIATE-SYSTEM.md`.

### Affiliate dashboard (`/affiliates/dashboard`)

Different from customer account — more data-heavy. Layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Affiliate Dashboard                              [GOLD TIER]    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────┬──────────────────────────────────────────────────┐ │
│ │          │                                                  │ │
│ │ Overview │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │ │
│ │ Links    │  │ 1247 │ │ 423  │ │ 32   │ │ 7.6% │            │ │
│ │ Conv.    │  │Clicks│ │Unique│ │Convs │ │CR    │            │ │
│ │ Earnings │  └──────┘ └──────┘ └──────┘ └──────┘            │ │
│ │ Payouts  │                                                  │ │
│ │ Settings │  ┌──────┐ ┌──────┐ ┌──────┐                     │ │
│ │          │  │ $345 │ │ $890 │ │ $1340│                     │ │
│ │          │  │Pending Approv │ │ Paid │                     │ │
│ │          │  └──────┘ └──────┘ └──────┘                     │ │
│ │          │                                                  │ │
│ │          │  Your referral link                              │ │
│ │          │  ─                                               │ │
│ │          │  yoursite.com/ref/sarahsmith   [COPY]            │ │
│ │          │                                                  │ │
│ │          │  Your coupon code                                │ │
│ │          │  ─                                               │ │
│ │          │  SARAH15                       [COPY]            │ │
│ │          │                                                  │ │
│ └──────────┴──────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Stat cards: cream-warm bg, big number top, label below
- Charts (on Earnings page): use Recharts, theme to match (gold + ink + cream)

---

## 22. FAQ (`/faq`)

Accordion-driven, grouped into categories.

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EYEBROW: SUPPORT                                               │
│   ─                                                              │
│   Frequently asked questions                                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Search input — optional, type-ahead filters questions]         │
│                                                                  │
│  PRODUCTS & PURITY                                               │
│  ─                                                               │
│  + What is research use only (RUO)?                              │
│  + What does HPLC verified mean?                                 │
│  + How do you confirm peptide identity?                          │
│  + ...                                                           │
│                                                                  │
│  ORDERING & SHIPPING                                             │
│  ─                                                               │
│  + How long does shipping take?                                  │
│  + Do you ship internationally?                                  │
│  + ...                                                           │
│                                                                  │
│  RETURNS & REFUNDS                                               │
│  ─                                                               │
│  + What is your return policy?                                   │
│  + ...                                                           │
│                                                                  │
│  RESEARCH USE                                                    │
│  ─                                                               │
│  + How do I reconstitute lyophilized peptides?                   │
│  + ...                                                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Still have a question? [CONTACT US →]                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 23. Contact (`/contact`)

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EYEBROW: CONTACT                                               │
│   ─                                                              │
│   Get in touch                                                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────┬──────────────────────────────┐  │
│ │                             │                              │  │
│ │  CONTACT FORM               │  REACH US DIRECTLY           │  │
│ │  ─                          │  ─                           │  │
│ │                             │                              │  │
│ │  Department                 │  Orders                      │  │
│ │  [select ▼]                 │  orders@looksmaxxinglab.com  │  │
│ │                             │                              │  │
│ │  Name                       │  Research Support            │  │
│ │  [             ]            │  support@looksmaxxinglab.com │  │
│ │                             │                              │  │
│ │  Email                      │  Press & Partnerships        │  │
│ │  [             ]            │  press@looksmaxxinglab.com   │  │
│ │                             │                              │  │
│ │  Subject                    │  Hours                       │  │
│ │  [             ]            │  Mon–Fri, 9am–5pm EST        │  │
│ │                             │                              │  │
│ │  Message                    │                              │  │
│ │  [textarea, 6 lines      ]  │                              │  │
│ │                             │                              │  │
│ │  [SEND MESSAGE — DARK]      │                              │  │
│ │                             │                              │  │
│ └─────────────────────────────┴──────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 24. Policies (`/privacy`, `/terms`, etc.)

Editorial styling, max-w-content (720px), large display-md heading, body-md content. Plain but well-typeset. Heading anchor links for long policies.

---

## 25. 404 / Error pages

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                       404                                        │
│                       (display-xl serif, gold)                   │
│                                                                  │
│               This page doesn't exist.                           │
│                                                                  │
│         The link may be outdated, or the page may                │
│         have been moved.                                         │
│                                                                  │
│              [RETURN HOME]   [BROWSE SHOP]                       │
│                                                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
└──────────────────────────────────────────────────────────────────┘
```

Centered, generous vertical space. Same template for 500 errors with different copy.

---

## Responsive breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| `sm` | 640px | Tablets in portrait, large phones in landscape |
| `md` | 768px | Tablets in landscape |
| `lg` | 1024px | Small laptops — primary "desktop" target |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Large displays — keep content max-w-page (1280) centered |

Mobile-first. Every layout above shows desktop — assume mobile is single-column unless noted otherwise.

---

## Page-level animations summary

| Page | Hero | Sections | Special |
|---|---|---|---|
| Homepage | Cinematic video + text reveal | Scroll-fade-up all sections | Marquee loop, parallax About image |
| Shop | None | Cards fade up in stagger | Filter open/close |
| PDP | Image cross-fade | Tab transitions | Add-to-cart success |
| Cart | None | Cart drawer slide | Quantity step animations |
| Checkout | None | Section validation glow | Stripe Element loads |
| About | Image parallax | Heavy scroll-triggered reveals | Drop caps animate in |
| Journal | None | Image reveals on entry | Reading progress bar |
| 404 | Gold number scale-in | None | Subtle pulse |

All animations: 600ms ease-out-quart default, fire once per page load. See `MOTION.md` for the full system.
