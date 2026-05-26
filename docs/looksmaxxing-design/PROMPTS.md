# PROMPTS.md — Frontend Design Prompts Library

> Copy-paste prompts to feed your AI IDE for building each piece of The Looksmaxxing Lab frontend. Use in order. Each prompt is scoped to a single deliverable.

---

## Always start each session with this

```
Read /docs/design/BRAND.md, /docs/design/DESIGN-SYSTEM.md, and /docs/design/COMPONENTS.md.
Confirm by stating: (1) the three primary brand color hex codes from DESIGN-SYSTEM, (2) the two font families being used, (3) the brand's voice trait in one word. Then ask me which prompt I want to work on.
```

This forces the AI to load context before generating anything.

---

# PHASE 1: Foundation Setup

## P-1 — Tailwind config, fonts, global styles

```
Goal: Set up the design system foundation. Read /docs/design/DESIGN-SYSTEM.md fully first.

Tasks (one at a time, confirm between each — do NOT bundle):

1. Replace tailwind.config.ts entirely with the exact config from DESIGN-SYSTEM.md "Full Tailwind config" section. Use it verbatim.

2. Install fonts: create src/app/fonts.ts with the exact code from DESIGN-SYSTEM.md "Font loading (Next.js setup)" section. Use Bodoni_Moda and DM_Sans from next/font/google.

3. Update src/app/layout.tsx to use these fonts via CSS variables on the html element. Show me the diff.

4. Replace src/app/globals.css with the exact contents from DESIGN-SYSTEM.md "globals.css" section.

5. Install tailwindcss-animate: `npm install tailwindcss-animate`

6. Create a test page at src/app/(frontend)/test-design/page.tsx that renders:
   - One <h1> with class "font-display text-display-xl" — text "Documented purity."
   - One <p> with class "font-sans text-body-md mt-6" — body text sample
   - One eyebrow above the h1: span with classes "font-sans text-label-md uppercase tracking-wider text-gold" — "THE LAB"
   - Set the page bg to bg-cream and text to text-ink
   - Container with max-w-page and px-6 md:px-12 lg:px-20

7. Run dev server. Open the test page. Verify:
   - Background is warm cream (#FAF7F2)
   - Headline is large serif (Bodoni Moda)
   - Body is clean sans-serif (DM Sans)
   - Eyebrow is gold-colored, small, uppercase, tracked

Do not move on if any of these is wrong. Tell me what looks off and we fix together.

Commit: `feat(design): establish design system foundation`
```

---

# PHASE 2: Core Components

## P-2 — Button component

```
Goal: Build the Button component exactly per /docs/design/COMPONENTS.md section 1 "Button".

Create src/components/ui/Button.tsx using the code shape provided in COMPONENTS.md. Required:
- All 5 variants: primary, secondary, ghost, link, dark
- All 3 sizes: sm, md, lg
- All states: default, hover, focus, active (0.98 scale), disabled, loading
- Use class-variance-authority (cva) — install if needed: `npm install class-variance-authority`
- TypeScript types for variants and sizes
- forwardRef for ref forwarding
- Loading prop replaces children with spinner (use the spinner from MOTION.md section "Spinner (action loading)")
- transition-all duration-300 ease-out-quart

After creating the component, update /test-design page to show:
- All 5 variants in a row, size md
- One row of size variants (sm, md, lg) using primary
- A disabled example
- A loading example

Take a screenshot description and tell me what to verify visually.

Commit: `feat(ui): Button component with 5 variants and 3 sizes`
```

## P-3 — Container component

```
Goal: Build the Container wrapper per /docs/design/COMPONENTS.md section 2.

Create src/components/ui/Container.tsx:
- Variants prop: 'content' (720px), 'prose' (960px), 'page' (1280px, default), 'wide' (1440px), 'bleed' (no max)
- Horizontal padding: px-6 md:px-12 lg:px-20 (except bleed: px-0)
- mx-auto for centering
- Pass-through className

Refactor /test-design to use <Container size="page">. Confirm visually nothing breaks.

Commit: `feat(ui): Container with size variants`
```

## P-4 — Input, Label, Form primitives

```
Goal: Build form primitives per /docs/design/COMPONENTS.md section 7.

Tasks:

1. src/components/ui/Input.tsx — text input:
   - h-12, px-4, bg-cream-warm, border border-default rounded-sm
   - text-body-md font-sans
   - Focus: border-strong + shadow-focus
   - Error variant: border-error, with error message slot
   - Disabled: opacity-40
   - forwardRef

2. src/components/ui/Label.tsx — form label:
   - text-body-sm font-medium text-ink-muted (semantic: text-secondary)
   - mb-2 default margin
   - Required asterisk: small gold * after children if required prop true

3. src/components/ui/Textarea.tsx — same styling as Input but multi-line

4. Don't build Select, Checkbox, Radio yet — install shadcn versions and customize in P-5

Update /test-design to show: a labeled email input, a labeled textarea, an example with error, a disabled example.

Commit: `feat(ui): Input, Label, Textarea primitives`
```

## P-5 — shadcn primitives customization

```
Goal: Install needed shadcn components and customize their colors/typography to match the design system.

Components to install:
- npx shadcn@latest add select checkbox radio-group switch dialog drawer sheet toast accordion tabs dropdown-menu

For each installed component:
1. Open the generated file in src/components/ui/
2. Replace shadcn's default colors (HSL color variables) with our token classes:
   - bg → bg-cream-warm or bg-cream
   - text → text-ink
   - border → border-default
   - focus → shadow-focus + border-strong
   - radius → rounded-sm (buttons) or rounded-md (cards/modals)
3. Replace font references with font-sans
4. Remove any opacity-based hover states; use bg color shifts instead
5. Animation durations: replace with our motion tokens (duration-fast 200ms for small, duration-base 400ms for larger)

Audit one at a time, show me the before/after diff. Don't bulk-edit.

Commit: `refactor(ui): customize shadcn primitives to design system`
```

## P-6 — Badge, StockIndicator, Spinner

```
Build three small components from COMPONENTS.md:

1. Badge (section 12) — variants: sale, new, bestseller
2. StockIndicator (section 24) — takes stock number, returns appropriate display
3. Spinner (section 21) — SVG circle, currentColor, rotating

All small. One commit: `feat(ui): Badge, StockIndicator, Spinner`
```

## P-7 — Motion components

```
Goal: Build the reusable motion wrappers per /docs/design/MOTION.md section "Reusable motion components".

Create files in src/components/motion/:
1. useReducedMotion.ts (the helper hook)
2. FadeUp.tsx
3. StaggerChildren.tsx (export both component and staggerItemVariants)
4. RevealText.tsx
5. ParallaxImage.tsx
6. MagneticHover.tsx
7. PageTransition.tsx

Install framer-motion: `npm install framer-motion`

Add a /test-motion route demonstrating each component with sample content. Verify all 6 work and that they respect prefers-reduced-motion (toggle in DevTools rendering panel).

Commit: `feat(motion): reusable motion components with reduced-motion support`
```

---

# PHASE 3: Layout Primitives

## P-8 — Header / Navigation Bar

```
Goal: Build the Header per /docs/design/COMPONENTS.md section 3 — read it fully first.

Create src/components/shared/Header.tsx with:

1. Announcement bar above the header:
   - h-9, bg-ink, text-cream text-label-md
   - Reads content from a prop (placeholder for now: "Order over $300 — complimentary 2-day shipping")
   - Optional dismiss X on right (cookie-based, 24h)

2. Main header:
   - fixed top-0 inset-x-0 z-sticky
   - Initial state: transparent bg, cream text (for hero overlay)
   - Scrolled state (after 50px): bg cream/85 with backdrop-blur-md, ink text
   - Use framer-motion + useScroll/useMotionValueEvent (see MOTION.md "Header — transparent → frosted on scroll")
   - h-20 (80px)

3. Layout (3-column):
   - Left: Wordmark logo (just text "THE LOOKSMAXXING LAB" in font-sans text-label-lg uppercase tracking-wider for now — actual logo asset can replace later)
   - Center: Primary nav — SHOP, SCIENCE, ABOUT, JOURNAL — text-label-lg uppercase tracking-wider, evenly spaced, gap-12
   - Right: Icon-only buttons — Search, Heart (wishlist), User (account), Bag (cart with count badge)
   - Use Lucide icons, stroke-width 1.5, size 20

4. Cart count badge:
   - Small circle, top-right of bag icon, gold bg, ink text
   - Only visible if count > 0
   - Animates scale on update (use motion variants)

5. Mobile (md breakpoint and below):
   - Hide center nav
   - Replace left logo with hamburger icon
   - Center logo
   - Right: just cart icon
   - See mobile menu in next prompt

6. Mega menu on SHOP hover (desktop only):
   - Open on mouseEnter with 100ms delay
   - Close on mouseLeave with 300ms delay
   - Full-width dropdown panel showing 8 categories + 2 featured product cards
   - Use AnimatePresence for enter/exit (fade + slide-down 8px)
   - Categories list left, featured cards right
   - Background: bg-cream with shadow-lg

Hard-code the nav items, categories, and placeholder featured products for now. Real data wiring is a backend phase.

Commit: `feat(shared): Header with scroll behavior and mega menu`
```

## P-9 — Mobile menu

```
Goal: Build the mobile menu (full-screen overlay, NOT a slide-out sidebar) per COMPONENTS.md section 3 "Mobile layout".

Create src/components/shared/MobileMenu.tsx:

1. Trigger: hamburger icon in Header (mobile only) opens this
2. Behavior: full-screen overlay, slides in from right (400ms ease-out-quart)
3. Background: solid bg-cream
4. Top bar inside menu: X close button on left, optional logo center
5. Content:
   - Primary nav items as large rows: SHOP, SCIENCE, ABOUT, JOURNAL — text-display-sm font-display, vertical stacking, generous spacing
   - Each row has a › chevron on right
   - Tapping SHOP slides in subcategories panel from right (nested navigation)
   - Below primary nav: divider, then utility actions (Search, Wishlist, Account) as smaller text-body-lg rows with Lucide icons
   - Bottom: language switcher (EN | ES)
6. Lock body scroll when open
7. Esc key closes
8. Tap outside (the X area) closes
9. Use Framer Motion AnimatePresence + variants

Subcategory panel:
- Same slide pattern, slides over the primary panel from right
- Back arrow on top-left returns to primary panel
- Lists the 8 categories from the mega menu

Commit: `feat(shared): mobile full-screen menu with nested navigation`
```

## P-10 — Footer

```
Goal: Build the Footer per /docs/design/COMPONENTS.md section 4.

Create src/components/shared/Footer.tsx with:

1. Background: bg-ink, text-cream
2. Padding: pt-32 pb-16 (128px top, 64px bottom)
3. Container: max-w-wide

Structure (top to bottom):

4. Logo block (centered): large wordmark "THE LOOKSMAXXING LAB" in font-display text-display-md (use serif Bodoni — different from header's sans wordmark — this is intentional, footer is editorial). Below it: face profile mark (use a placeholder SVG for now or skip; client provides). 96px vertical padding around logo block.

5. Newsletter signup block (centered, max-w-content):
   - Eyebrow: NEWSLETTER (label-md uppercase tracked gold)
   - Headline: "Be the first to know." (font-display text-display-sm)
   - Subhead: "Quiet updates. New compounds and research notes — no marketing noise." (body-md cream/70)
   - Input + button row: Input variant on dark (bg-ink-soft border-cream/20 text-cream), Button variant "primary" but customized for dark bg (need to add a "primary-on-dark" variant? Or just use existing dark variant inverted — figure out the best path)
   - On submit: server action stub (real wiring later)

6. Link columns grid (4 columns desktop, 2 columns tablet, 1 column mobile):
   - Column 1: SHOP — All Products, Categories, Best Sellers, Gift Cards
   - Column 2: THE LAB — About, Science, Journal, Press
   - Column 3: RESOURCES — Peptide Calculator, COA Library, FAQ, Shipping
   - Column 4: CONNECT — Contact, Affiliates, Instagram, YouTube, TikTok
   - Heading: label-md uppercase tracked cream
   - Links: body-sm cream/70, hover cream
   - Gap between columns: gap-12

7. Tagline strip (centered):
   "BIOTECHNOLOGY | PRECISION | PURITY" — label-md uppercase tracked GOLD, separators ` | ` in cream/30

8. Hairline divider (1px cream/20)

9. Bottom row (flex justify-between, items-center):
   - Left: "© 2026 The Looksmaxxing Lab." (body-sm cream/60)
   - Right: policy links — Terms, Privacy, Refund, Disclaimer (body-sm cream/60, gap-6)
   - Mobile: stacked vertically

10. FDA disclaimer block at very bottom (centered, max-w-content):
   - Small text-body-xs cream/50
   - Full disclaimer text (insert from /docs/LEGAL-USA.md)

Commit: `feat(shared): editorial Footer with newsletter and disclaimers`
```

---

# PHASE 4: Homepage

## P-11 — Hero section

```
Goal: Build the homepage hero per /docs/design/PAGES.md section 1 "Homepage" Hero specifics + /docs/design/MOTION.md "Homepage hero — complete motion sequence".

Create src/components/home/Hero.tsx:

1. Section: h-screen relative overflow-hidden, sits flush under header
2. Video element:
   - <video autoPlay muted loop playsInline preload="auto"> with /hero.webm src (placeholder, real video added later)
   - object-cover, absolute inset-0 w-full h-full
   - Fades in over 1200ms with subtle scale 1.05 → 1
   - Mobile (under md): replace with static <Image> from /hero-mobile.jpg
3. Overlay gradient: bg-gradient-to-b from-transparent via-transparent to-ink/30
4. Content positioned at bottom-left (desktop) / bottom-center (mobile):
   - pb-32 (128px from bottom)
   - Eyebrow: "RESEARCH USE ONLY" in label-md uppercase tracked cream/70
   - Headline using <RevealText> with lines ['Research-grade peptides.', 'Documented purity.'], baseDelay 0.4
   - Subhead with <FadeUp delay={0.8}>: "Where biotechnology meets ritual." body-lg cream/80 mt-6
   - CTA row with <StaggerChildren staggerDelay={0.08} className="flex gap-4 mt-10">:
     - Button variant primary size lg: "View Collection"
     - Button variant link size lg (white version — text-cream underline): "The Science →"
5. Mobile considerations:
   - text-display-lg instead of text-display-xl on the headline
   - CTAs stack vertically (flex-col gap-3)
   - Static image replaces video

Hard-code the headline copy for now — CMS-driven later.

Commit: `feat(home): cinematic hero with video and choreographed text reveal`
```

## P-12 — Marquee component

```
Goal: Build the Marquee per /docs/design/COMPONENTS.md section 6 + /docs/design/MOTION.md "Marquee / Ticker".

Create src/components/shared/Marquee.tsx:

1. Container: bg-ink py-3 overflow-hidden
2. Inner flex container animates with CSS keyframe marquee 40s linear infinite
3. Items rendered twice for seamless loop
4. Each item: text-cream text-label-md uppercase tracking-wider whitespace-nowrap mx-8
5. Separators between items: gold "·" character mx-4
6. On hover: animation-play-state paused
7. prefers-reduced-motion: animation disabled, items just sit static

Add @keyframes marquee to globals.css per MOTION.md exact code.

Props: items: string[]

Default content for trust marquee:
['≥99% HPLC PURITY', 'LC-MS VERIFIED', 'COA WITH EVERY ORDER', 'US-BASED FULFILLMENT', '2-DAY SHIPPING OVER $300']

Place directly below Hero on homepage. The Marquee touches the Hero — no gap.

Commit: `feat(shared): looping Marquee with reduced-motion fallback`
```

## P-13 — Featured products grid

```
Goal: Build the oversized featured products section per /docs/design/PAGES.md homepage section "FEATURED PROTOCOLS" + /docs/design/COMPONENTS.md section 5 "Featured (oversized) ProductCard".

Two parts:

1. FeaturedProductCard component (src/components/shop/FeaturedProductCard.tsx):
   - Takes a Product prop (use a Product type with name, slug, image, shortDescription, priceRange)
   - Layout: image area top, info area bottom
   - Image: aspect-[4/5] OR aspect-[16/10] (pass as prop, alternate per card for visual rhythm)
   - Image bg: bg-cream-warm, image inside with Next/Image fill object-cover
   - Hover: image scales 1.04 over 700ms ease-out-quart, wishlist heart fades in top-right
   - Info area: bg-cream-warm p-12
     - Eyebrow: category label-md uppercase gold
     - Name: text-editorial-lg font-display
     - Description: 2 lines max body-md text-ink-muted line-clamp-2
     - Bottom row: price (body-lg font-medium) + Button variant=link "View Product →"

2. FeaturedProductsSection (src/components/home/FeaturedProductsSection.tsx):
   - Container max-w-page mx-auto px-6 md:px-12 lg:px-20
   - py-32 (128px vertical)
   - <FadeUp> Eyebrow "FEATURED PROTOCOLS"
   - <FadeUp delay={0.1}> Heading "Most-studied compounds" text-display-md font-display
   - <StaggerChildren staggerDelay={0.1}> grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 — render 4-6 FeaturedProductCards
   - <FadeUp delay={0.4}> CTA "View All Products" centered, variant=secondary, mt-16

Hard-code 4 sample products with placeholder images (use https://placehold.co/800x1000/F2EDE4/0A0A0A?text=Product+Name).

Commit: `feat(home): featured products section with oversized cards`
```

## P-14 — Categories grid

```
Goal: Build the category browsing section per /docs/design/PAGES.md homepage section "BY CATEGORY".

Create src/components/home/CategoriesSection.tsx:

1. Container, py-32
2. <FadeUp> Eyebrow: "BY CATEGORY"
3. <FadeUp delay={0.1}> Heading: "Eight research focuses" text-display-md font-display
4. <StaggerChildren staggerDelay={0.05}> grid grid-cols-2 md:grid-cols-4 gap-4 mt-16
5. Each category card (CategoryCard component):
   - aspect-square
   - Background image (lifestyle/scientific imagery, placeholder for now)
   - Overlay: bg-ink/20 default, bg-ink/40 on hover
   - Centered text overlay: category name in text-editorial-md font-display text-cream
   - Plus a small "Explore →" label-md uppercase tracked that fades in on hover
   - Whole card is a link to /shop/[category-slug]
   - Image scales 1.05 on hover (700ms ease-out-quart)
   - Tracking number ("01–08") in top-left corner, small label-sm gold

Categories list (hard-code):
01 Bioregulators
02 Cellular Health
03 Cognitive Function
04 Essentials
05 Growth Factor
06 Metabolic
07 Receptor Agonist
08 Recovery

Use 8 placeholder images.

Commit: `feat(home): categories grid with hover reveals`
```

## P-15 — About teaser section

```
Goal: Build the About teaser section per /docs/design/PAGES.md homepage section between categories and trust badges.

Create src/components/home/AboutTeaser.tsx:

1. Container size="bleed" (full-width, no padding)
2. Layout: full-width hero image with text overlay block
3. Image: aspect-[16/9] desktop, aspect-[4/5] mobile — lifestyle photography, placeholder
4. Use <ParallaxImage> with intensity 0.15 — subtle
5. Overlay: absolute positioning, bottom-12 left-12 right-12 on desktop, centered on mobile
6. Inside overlay (semi-transparent cream bg block, 480px max width):
   - bg-cream/95 backdrop-blur-md p-12 rounded-md
   - <FadeUp> Eyebrow "THE LAB" gold
   - <FadeUp delay={0.1}> Heading "Considered compounds for considered research." text-display-sm font-display
   - <FadeUp delay={0.2}> Body paragraph (3-4 lines) describing approach
   - <FadeUp delay={0.3}> Button variant secondary "Read About Us →"

Section py-32 (vertical padding outside the section's image).

Commit: `feat(home): about teaser with parallax image`
```

## P-16 — Trust badges row

```
Goal: Build the trust badges row per /docs/design/COMPONENTS.md section 25.

Create src/components/shared/TrustBadges.tsx:

1. Section py-24, container max-w-page
2. <FadeUp> grid grid-cols-1 md:grid-cols-3 gap-12 items-start
3. Each column:
   - Custom SVG icon, 32x32, stroke 1.5px, color gold (use simple geometric icons: a lightning bolt for HPLC, a flask for LC-MS, a shield/check for COA — keep them simple line drawings)
   - Title: label-lg uppercase tracked ink (mt-6)
   - Body: body-sm text-ink-muted, max 2 lines (mt-2)
4. On desktop: thin 1px gold vertical line between columns

Content (hard-code):
- Column 1: "≥99% HPLC PURITY" / "Every batch verified by high-performance liquid chromatography."
- Column 2: "LC-MS VERIFIED" / "Mass spectrometry confirms peptide identity and purity."
- Column 3: "COA WITH EVERY ORDER" / "Lot-specific Certificate of Analysis included."

Commit: `feat(shared): trust badges row with custom line icons`
```

## P-17 — Journal teaser section

```
Goal: Build the Science/Journal teaser per /docs/design/PAGES.md homepage section "SCIENCE JOURNAL".

Create src/components/home/JournalTeaser.tsx:

1. Section py-32, container max-w-page
2. <FadeUp> Eyebrow + heading + subhead structure (same pattern as Featured)
3. <StaggerChildren> grid grid-cols-1 md:grid-cols-3 gap-8 mt-16
4. Each item: BlogPostCard (build inline or extract):
   - Aspect 4:3 image bg-cream-warm
   - Below image: label-md uppercase tracked gold for category
   - Title editorial-md font-display
   - Excerpt body-sm text-ink-muted line-clamp-2
   - Meta row: "7 min read" label-sm text-ink-subtle
   - Hover: image scales 1.04
   - Whole card links to /journal/[slug]

5. <FadeUp delay={0.4}> CTA "View The Journal →" centered, variant=secondary

Hard-code 3 sample posts.

Commit: `feat(home): journal teaser section`
```

## P-18 — Newsletter section (homepage version)

```
Goal: Build a more prominent newsletter section above the footer (different from the footer newsletter).

Create src/components/home/Newsletter.tsx:

1. Section bg-cream-sand py-32
2. Container max-w-content (720px) centered text-center
3. <FadeUp> Eyebrow "STAY INFORMED" gold
4. <FadeUp delay={0.1}> Heading "Quiet updates." text-display-md font-display
5. <FadeUp delay={0.2}> Body: "New compounds and research notes — no marketing noise." body-lg
6. <FadeUp delay={0.3}> Form row mt-12:
   - flex flex-col md:flex-row gap-3 max-w-md mx-auto
   - <Input> placeholder "your@email.com"
   - <Button variant="dark" size="md"> "SUBSCRIBE"
7. <FadeUp delay={0.4}> Small disclaimer below: "Unsubscribe at any time." body-sm text-ink-muted mt-4

Server action stub for submission.

Commit: `feat(home): newsletter signup section`
```

## P-19 — Homepage assembly

```
Goal: Assemble the full homepage at src/app/(frontend)/[locale]/page.tsx.

Page composition (in order):
1. <AnnouncementBar /> (above Header — already inside Header component)
2. <Header />
3. <Hero />
4. <Marquee items={trustItems} />
5. <FeaturedProductsSection products={featuredProducts} />
6. <CategoriesSection />
7. <AboutTeaser />
8. <TrustBadges />
9. <JournalTeaser posts={recentPosts} />
10. <Newsletter />
11. <Footer />

The page is a server component. Hard-code all data with sample arrays for now. Use placeholder images.

Verify the full page scrolls and feels right. Check:
- Hero is full viewport
- Spacing between sections feels generous (128px is intentional)
- Marquee runs continuously
- Scroll-triggered animations fire as sections enter
- Header transitions from transparent to frosted past hero

Commit: `feat(home): assemble full homepage with all sections`
```

---

# PHASE 5: Shop & Product Pages

## P-20 — ProductCard (standard)

```
Goal: Build the standard ProductCard per /docs/design/COMPONENTS.md section 5 "Standard ProductCard".

Create src/components/shop/ProductCard.tsx:
- aspect-[4/5] image area on bg-cream-warm
- Lazy-loaded with blur-up placeholder
- Wishlist heart absolute top-right (hidden by default, fades in on card hover)
- Below image:
  - Editorial-md font-display product name
  - label-md uppercase tracked muted: descriptor "THYMOSIN BETA-4 · 5MG"
  - body-lg font-medium price (or price range)
- Optional Badge top-left if onSale/isNew/isBestSeller
- Hover: image scales 1.04 over 700ms
- Whole card links to /products/[slug]

Use Framer Motion variants pattern (rest/hover) per /docs/design/MOTION.md section "Product card hover".

Commit: `feat(shop): standard ProductCard`
```

## P-21 — Filter sidebar

```
Goal: Build the filter sidebar for the shop page per /docs/design/PAGES.md section 2 "Shop".

Create src/components/shop/FilterSidebar.tsx:

1. Width 280px on desktop, sticky top-24 (clears header)
2. Mobile: hidden by default, opened via FAB button (filter icon, fixed bottom-right)
3. Mobile open state: full-screen drawer slides up from bottom, FAB becomes X close
4. Sections (each with label-md uppercase heading + bottom border-subtle):
   - CATEGORY — multi-select checkboxes for 8 categories
   - PRICE — range slider (use shadcn Slider) with min/max labels
   - AVAILABILITY — checkboxes: In stock, On sale, Available to backorder
   - PURITY — single radio: All, ≥99%, ≥99.5%
5. "Clear all filters" button at bottom (Button variant=link)
6. URL state: every filter reflects in URL params
7. Active filter chips render above the product grid (NOT inside the sidebar) — those are P-22

State management: lift filter state up to the shop page, or use a Zustand store.

Commit: `feat(shop): filter sidebar with URL state`
```

## P-22 — Shop page

```
Goal: Build the Shop PLP at src/app/(frontend)/[locale]/shop/page.tsx per /docs/design/PAGES.md section 2.

Page layout:
1. <Header /> (no announcement bar variant — actually keep it)
2. Container max-w-page py-12
3. Breadcrumbs: Home › Shop
4. Page header: "All compounds" display-md, body text below
5. Two-column layout below header:
   - Left: <FilterSidebar /> (280px)
   - Right: results
6. Right column:
   - Top row: results count "Showing 24 of 47" + sort dropdown (Featured, Newest, Price asc, Price desc, Best Rated)
   - Active filter chips row (each chip dismissible with X)
   - Product grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   - <StaggerChildren> with ProductCards
   - Infinite scroll trigger at bottom (use intersection observer)
   - Loading skeletons for next batch

Hard-code 24 sample products. Make the infinite scroll fake: just append 8 more on trigger up to 47 total.

Mobile:
- Filter sidebar replaced with FAB button + drawer
- Grid is 1 column on small mobile, 2 on larger mobile

Commit: `feat(shop): PLP with filters, sort, infinite scroll`
```

## P-23 — Product Detail Page

```
Goal: Build the PDP at src/app/(frontend)/[locale]/products/[slug]/page.tsx per /docs/design/PAGES.md section 4.

Page is large. Build in subsections (run multiple turns if needed):

1. Hero split layout:
   - Left column (sticky on scroll): <ImageGallery /> per COMPONENTS.md section 13
   - Right column: product info
     - Breadcrumbs
     - Eyebrow with category + optional badges
     - Product name display-sm font-display
     - Subtitle (e.g., "THYMOSIN BETA-4") label-lg uppercase tracked muted
     - Rating + review count link (ScrollTo reviews section)
     - Price from $X (or single price if no variants)
     - Short description body-md max-w-md
     - <VariantSelector /> per COMPONENTS.md section 14
     - <QuantityStepper /> per COMPONENTS.md section 22
     - <StockIndicator />
     - Add to cart button (dark variant, full width)
     - Wishlist button below ("Save for later")
     - Trust badges mini-row (3 items, smaller version of homepage)
     - COA download button if coaFile present

2. Tabs section (Overview, Lab Results, Reconstitution, Shipping):
   - Use shadcn Tabs customized with our underline indicator
   - Animated indicator via layoutId

3. Editorial science section:
   - Full-bleed image + overlaid text block (same pattern as homepage About teaser)
   - Eyebrow "THE SCIENCE" / heading / body / CTA

4. Reviews section:
   - Average rating + distribution bars
   - Sort/filter controls
   - Review list (5 visible initially, "Load more" expands)

5. Related products row:
   - Eyebrow "ALSO CONSIDERED"
   - Horizontal scroll on mobile, grid of 4 on desktop

Hard-code one detailed sample product (TB-500) for testing.

Commit: `feat(shop): full PDP layout with all sections`
```

## P-24 — ImageGallery, VariantSelector, QuantityStepper

```
Build the three PDP-specific components per COMPONENTS.md sections 13, 14, 22:

1. ImageGallery (src/components/shop/ImageGallery.tsx):
   - Primary 4:5 image
   - Thumbnail row below (5+ thumbnails, 80x80)
   - Click thumb: cross-fades primary (Framer AnimatePresence + key)
   - Active thumb: 1px ink border
   - Mobile: primary is a swipeable carousel (use embla-carousel-react)
   - Click primary: opens fullscreen lightbox modal

2. VariantSelector (src/components/shop/VariantSelector.tsx):
   - List of variant rows, full-width
   - Each: radio circle + name + price + optional "OUT OF STOCK"
   - Selected: 1px ink border, bg-cream-warm
   - Out of stock: opacity-40 strikethrough
   - Controlled component (value + onChange props)

3. QuantityStepper (src/components/shop/QuantityStepper.tsx):
   - Three small buttons row: – count +
   - 32x32 each button, border-subtle
   - Center: monospace digit body-md
   - Props: value, onChange, min (default 1), max (stock)

One commit: `feat(shop): ImageGallery, VariantSelector, QuantityStepper`
```

---

# PHASE 6: Cart & Checkout

## P-25 — Cart drawer

```
Goal: Build the cart drawer per /docs/design/COMPONENTS.md section 8 + /docs/design/MOTION.md "Cart drawer animation".

Create src/components/cart/CartDrawer.tsx:

1. AnimatePresence-wrapped, controlled by cart store isOpen state
2. Backdrop: bg-ink/55 z-drawer, click to close
3. Drawer:
   - Right-anchored, width 480px desktop, full mobile
   - bg-cream
   - Slide-in from right 400ms ease-out-quart
   - shadow-xl
4. Header: "YOUR CART (count)" label-lg uppercase + close X
5. Items list (scrollable):
   - 80x80 thumb + product info (name, variant, price) + qty stepper + remove X
   - Row separator: 1px border-subtle
6. Free shipping progress (if subtotal < $300):
   - Text: "Add $X more for free 2-day shipping"
   - Progress bar: bg-cream-warm container with gold fill
7. Summary at bottom (sticky):
   - Subtotal, Shipping (estimate), Total
   - "CHECKOUT →" dark button (full width)
   - "VIEW CART" link button below
8. Empty state: small illustration + copy + browse CTA

Lock body scroll when open. Esc closes.

Connect to a cart store (Zustand) — for now, stub the store with sample data. Real Cart integration comes from /docs/PROMPTS.md backend prompt P-7.1.

Commit: `feat(cart): slide-in cart drawer with free shipping progress`
```

## P-26 — Cart page

```
Goal: Build /cart page per /docs/design/PAGES.md section 5.

Create src/app/(frontend)/[locale]/cart/page.tsx:

1. <Header />
2. Container max-w-page py-12
3. Heading "Cart (count items)"
4. Two-column grid lg:grid-cols-[1fr_400px] gap-12
5. Left column (items):
   - Each line item: 120x120 thumb, name/variant/unit price, qty stepper, line total, remove
   - Bottom: "← Continue shopping" link button
6. Right column (order summary, sticky top-24):
   - bg-cream-warm p-8 rounded-md
   - Subtotal, Shipping, Tax, Total rows
   - Promo code input + Apply button
   - Checkout dark button full-width
   - "We accept" payment method icons (Visa, MC, AmEx, Apple Pay, Google Pay)
7. Below: "ALSO CONSIDERED" related products row
8. <Footer />

Empty cart state: large centered illustration + copy + browse CTA.

Commit: `feat(cart): full cart page with summary and related products`
```

## P-27 — Checkout page

```
Goal: Build /checkout per /docs/design/PAGES.md section 6.

Create src/app/(frontend)/[locale]/checkout/page.tsx:

1. Minimal header (just centered logo, no nav, no announcement bar) — extract <MinimalHeader />
2. Container max-w-page py-12
3. Two-column grid lg:grid-cols-[1fr_420px] gap-12
4. Left column (form sections):
   - Express checkout row at top: Apple Pay, Google Pay buttons (placeholders)
   - Divider "OR PAY ANOTHER WAY"
   - Section 1: CONTACT (email input + marketing opt-in checkbox if guest)
   - Section 2: SHIPPING ADDRESS (full form: first/last name, street, apt, city, state select, zip, phone)
   - Section 3: SHIPPING METHOD (radio cards — placeholder rates)
   - Section 4: PAYMENT (placeholder for Stripe Payment Element)
   - Section 5: ACKNOWLEDGEMENT (RUO + 21+ checkbox)
   - Order notes textarea (optional)
   - "PLACE ORDER" dark button full-width size-lg
   - Security note below
5. Right column (sticky order summary):
   - Items list (thumb + name + qty + price)
   - Divider
   - Subtotal, Shipping, Tax, Total
   - Promo code apply
6. Minimal footer (just policy links + copyright)

Each section title: label-lg uppercase tracked + thin underline (border-subtle below)
Section validation: when section's required fields valid, the next section's border-strong intensifies — visual cue.

Mobile: order summary becomes a collapsible card at the top of the page (shows just subtotal + checkout button collapsed, expands on tap).

Commit: `feat(checkout): single-page checkout layout`
```

## P-28 — Order confirmation page

```
Goal: Build /order-confirmation/[id] per /docs/design/PAGES.md section 7.

Create src/app/(frontend)/[locale]/order-confirmation/[id]/page.tsx:

1. <Header />
2. Container max-w-content py-24 text-center
3. Gold checkmark icon (scale-in animation with Framer spring)
4. <FadeUp delay={0.3}> "Thank you, [name]." display-md font-display
5. <FadeUp delay={0.4}> "Your order is confirmed." body-lg
6. <FadeUp delay={0.5}> Order #LL-2026-XXXXX + email confirmation note
7. Divider
8. <FadeUp delay={0.6}> Order details section:
   - Items table (image + name + qty + price)
   - Shipping address block + estimated delivery
   - Totals breakdown
   - Payment method (card ending in)
9. <FadeUp delay={0.7}> CTA row: [VIEW ORDER] [CONTINUE BROWSING]
10. <Footer />

Hard-code a sample order for testing.

Commit: `feat(checkout): order confirmation page with celebrated arrival animation`
```

---

# PHASE 7: Account Dashboard

## P-29 — Account layout

```
Goal: Build the account dashboard layout per /docs/design/PAGES.md section 8-12.

Create:
1. src/app/(frontend)/[locale]/account/layout.tsx
2. src/components/account/AccountSidebar.tsx

Layout:
- <Header />
- Container max-w-page py-12
- "My Account" heading
- Grid lg:grid-cols-[240px_1fr] gap-12
- Left: <AccountSidebar /> with greeting + nav items (Overview, Orders, Addresses, Wishlist, Settings) + Sign out
- Right: {children}
- Mobile: sidebar becomes a horizontal scrolling row of tabs at top
- <Footer />

AccountSidebar:
- Greeting at top: "Welcome, [name]" body-lg font-display
- Nav items: label-md uppercase tracked, py-3 each, border-b border-subtle between
- Active item: text-ink, with 2px ink left border
- Inactive: text-ink-muted, hover text-ink
- Bottom: Sign out (variant=link)

Commit: `feat(account): dashboard layout with sidebar`
```

## P-30 — Account overview page

```
Goal: Build the /account overview page.

Create src/app/(frontend)/[locale]/account/page.tsx:

1. Stats grid: 3 cards (Orders placed, Wishlist count, Member since)
2. "Recent orders" section: last 3 orders as small cards (order#, date, status, total, view link)
3. "Default address" card
4. Quick links: Track an order, Contact support

Each stat card:
- bg-cream-warm p-6 rounded-md
- Big number top: text-display-sm font-display
- Label below: label-md uppercase tracked text-ink-muted

Hard-code sample data.

Commit: `feat(account): overview page`
```

## P-31 — Orders, addresses, wishlist, settings pages

```
Build the remaining account sub-pages — one commit each:

1. /account/orders — table on desktop (Order # | Date | Status | Total | View), cards on mobile. Filter + pagination.

2. /account/orders/[orderNumber] — full order detail. Same template as order confirmation page but with tracking timeline + "Reorder" + "Request return" actions.

3. /account/addresses — grid of address cards (per COMPONENTS.md form patterns). Each card has Default badges, Edit, Delete. Add new address opens a modal with the address form.

4. /account/wishlist — reuse ProductCard in a grid. Add "Remove" + "Add to Cart" per card. "Move all to cart" button at top.

5. /account/settings — sectioned form: Personal info, Email & password (Clerk handles password change), Notifications, Language, Marketing.

Each: one commit.
```

---

# PHASE 8: Editorial Pages

## P-32 — About page

```
Goal: Build /about per /docs/design/PAGES.md section 14.

Create src/app/(frontend)/[locale]/about/page.tsx:

Sections in order (heavy use of scroll-triggered FadeUp + StaggerChildren):

1. Hero split: large image left (60vh), manifesto text right with eyebrow + display-md heading
2. Origin section: max-w-content centered, eyebrow + heading + body with drop cap (use ::first-letter CSS)
3. PullQuote section per COMPONENTS.md section 11
4. Three pillars grid: 3 columns with image + title + body each
5. Standards section: full-width image with overlay text block (about HPLC, MS, COA)
6. CTA section: links to Science / Journal / Shop

Each section py-32, fade-up entrance.

Commit: `feat(about): editorial about page with scroll choreography`
```

## P-33 — PullQuote, ImageFigure, EyebrowHeading

```
Build editorial components per /docs/design/COMPONENTS.md section 11:

1. <PullQuote attribution={}>quote text</PullQuote>:
   - Max-w-content centered
   - display-sm font-display italic
   - Vertical margin space-stack-lg (80px)
   - Optional thin gold rule above, spanning only the text width
   - Attribution: label-md uppercase gold mt-6

2. <ImageFigure src caption>:
   - Full container width image
   - Caption below: body-sm italic text-ink-muted

3. <EyebrowHeading children gold={false}>:
   - label-md uppercase tracked
   - text-ink-muted by default, text-gold if gold prop true
   - Often followed by a short dash/rule

One commit: `feat(editorial): PullQuote, ImageFigure, EyebrowHeading`
```

## P-34 — Journal pages

```
Build /journal index and /journal/[slug] post pages per /docs/design/PAGES.md sections 15, 16.

1. /journal index:
   - Eyebrow + heading at top
   - Featured post: 1 large card (full-width hero image, category, title, excerpt, read more)
   - Filter chips: All, Emerging, Protocols, Studies, Guides
   - Grid: 3 columns desktop, 1 mobile, of BlogPostCards
   - Infinite scroll

2. /journal/[slug] post:
   - Full-bleed hero image
   - Meta row: category · date · read time
   - Display-lg headline
   - Author line
   - Article body: max-w-content (720px), body-lg, generous line-height
   - First paragraph: drop cap
   - Embedded ImageFigure, PullQuote
   - References at bottom
   - Related posts row below
   - Optional sticky reading-progress bar at very top (1px gold, scales width with scroll position)

One commit each.
```

## P-35 — Peptide Calculator page

```
Goal: Build /peptide-calculator per /docs/design/PAGES.md section 17.

Create src/app/(frontend)/[locale]/peptide-calculator/page.tsx:

1. Eyebrow + heading at top, intro paragraph
2. Calculator card (max-w-content, bg-cream-warm, rounded-md, p-12):
   - INPUT section with 3 large number inputs:
     - Peptide amount (MG)
     - Bacteriostatic water (ML)
     - Desired dose (MCG)
   - Divider
   - RESULTS section (4 stat rows):
     - Concentration (mg/mL)
     - Volume per dose (mL)
     - Syringe marking (IU on 100u syringe)
     - Doses per vial
3. Below calculator: 3-4 accordion items explaining usage, math, storage
4. Link to full reconstitution guide in journal
5. Disclaimer block at bottom

Pure client-side math, real-time updates as user types. Build the math correctly:
- concentration = (vialMg * 1000) / waterMl  → mcg/mL
- volumePerDose = doseMcg / concentration   → mL
- syringeIU = volumePerDose * 100           → IU on 100u syringe
- dosesPerVial = floor(waterMl / volumePerDose)

If any input is 0/empty/produces NaN: show "—".

Commit: `feat(tools): peptide reconstitution calculator with live math`
```

## P-36 — COA Library page

```
Goal: Build /certificates per /docs/design/PAGES.md section 18.

Create src/app/(frontend)/[locale]/certificates/page.tsx:

1. Eyebrow + heading + intro
2. Category filter dropdown (above table)
3. Table (desktop) / Cards (mobile):
   - Columns: Product | Purity | Batch | Analyzed | COA download
   - Generous row height, 1px subtle dividers, no zebra
   - "COA" cell: small download icon + "PDF" text, clicking opens PDF in new tab
   - Products without COA: "Available on request" linking to contact
4. Editorial section below: "About our testing process" with HPLC image and explanation
5. CTA to learn more

Hard-code 15 sample COA entries.

Commit: `feat(content): COA library page`
```

---

# PHASE 9: Remaining Pages

## P-37 — FAQ page

```
Build /faq per /docs/design/PAGES.md section 22.

Sections grouped (Products & Purity, Ordering & Shipping, Returns, Research Use, Account).
Use shadcn Accordion customized per /docs/design/COMPONENTS.md section 10.
Optional search input at top (filter accordion items by text match).

Commit: `feat(content): FAQ page with grouped accordions`
```

## P-38 — Contact page

```
Build /contact per /docs/design/PAGES.md section 23.

Two-column layout: form left, direct contacts right. Department select + name + email + subject + message. Turnstile placeholder for now.

Commit: `feat(content): contact page with department routing`
```

## P-39 — Affiliate pages

```
Build the 3 affiliate pages:

1. /affiliates landing (per /docs/design/PAGES.md section 19, hero pattern same as About)
2. /affiliates/apply (single-page form, all fields from /docs/AFFILIATE-SYSTEM.md)
3. /affiliates/dashboard layout + overview page (per /docs/design/PAGES.md section 21, sidebar pattern same as Account dashboard)

Sub-pages of dashboard (links, conversions, earnings, payouts, settings) follow same layout. Build them in subsequent commits.

Commit: `feat(affiliates): landing + apply + dashboard skeleton`
```

## P-40 — Login, Register, 404

```
Build the auth pages and error page:

1. /login: 50/50 split — image left, Clerk <SignIn /> right (customized). Per /docs/design/PAGES.md section 13.

2. /register: same template with Clerk <SignUp />.

3. /not-found.tsx (404): centered, large gold "404" display-xl, "This page doesn't exist." messaging, two CTAs (Return Home, Browse Shop). Per /docs/design/PAGES.md section 25.

Commit: `feat(pages): login, register, 404`
```

---

# PHASE 10: Polish

## P-41 — Skeleton loaders

```
Goal: Add skeleton loaders for all async content.

Create src/components/ui/Skeleton.tsx with the shimmer styling from /docs/design/MOTION.md section "Loading states".

Where to add skeletons:
- ProductCard → ProductCardSkeleton
- BlogPostCard → BlogPostCardSkeleton
- Order row → OrderRowSkeleton
- Account stat card → StatCardSkeleton
- COA table row → COARowSkeleton

Each variant matches the shape of its loaded counterpart.

Commit: `feat(ui): skeleton loaders for all async content`
```

## P-42 — Empty states

```
Goal: Build empty state component + apply to all empty contexts.

Create src/components/shared/EmptyState.tsx:
- Props: icon (component), title, description, action (Button)
- Centered, py-24
- Icon in gold, 48px, stroke-1.5

Apply to:
- Empty cart
- Empty wishlist
- No search results
- No orders yet
- Filter returns nothing on PLP

Commit: `feat(shared): EmptyState component + apply across app`
```

## P-43 — Loading + error boundaries

```
Add loading.tsx and error.tsx files in key routes:

1. src/app/(frontend)/[locale]/shop/loading.tsx — page-level skeleton
2. src/app/(frontend)/[locale]/products/[slug]/loading.tsx — PDP skeleton
3. src/app/(frontend)/[locale]/account/loading.tsx — account skeleton
4. Global error.tsx — branded error page using 404 template with different copy

Each: server component using Skeleton primitives.

Commit: `feat(pages): loading and error states`
```

## P-44 — Motion pass

```
Goal: Final review and motion polish.

Tasks (read /docs/design/MOTION.md fully, then audit each page):

1. Homepage:
   - Verify Hero motion sequence timing feels right
   - Test marquee on hover (should pause)
   - Confirm scroll-triggered sections fire once and at correct viewport intersection
   - Test prefers-reduced-motion: animations off, content visible immediately

2. PDP:
   - Image gallery cross-fade smooth
   - Tab indicator slides smoothly (layoutId)
   - Add to cart animation: checkmark, cart icon pulse, drawer slide
   - Toast appears bottom-center

3. Account, checkout, forms:
   - Field focus transitions smooth
   - Validation error appears with gentle slide
   - Submit button shows loading state

4. Performance:
   - Run Lighthouse on home, PLP, PDP
   - Confirm no CLS from animations
   - Confirm no layout-trigger animations (only transform + opacity)

5. Cross-browser:
   - Test on iOS Safari (backdrop-filter, video autoplay, Framer Motion compat)
   - Test on Android Chrome on a slow device

Document any issues, fix one at a time.

Commit per fix: `polish(motion): [specific fix]`
```

## P-45 — Accessibility audit

```
Goal: Full a11y pass before launch.

Tasks:

1. Keyboard navigation:
   - Tab through every page, ensure focus visible (shadow-focus ring) on every interactive element
   - Esc closes drawer, modal, mobile menu
   - Enter activates buttons
   - Arrow keys in tabs, accordions

2. Screen reader:
   - Add aria-label to icon-only buttons
   - aria-current on active nav links
   - aria-expanded on accordion triggers
   - aria-controls on tab triggers

3. Form a11y:
   - Every input has associated label
   - Error messages linked with aria-describedby
   - Required fields marked aria-required

4. Color contrast:
   - Body text on cream: passes AAA (verified in DESIGN-SYSTEM.md)
   - Gold accents NOT used for text content
   - Run axe DevTools on every page

5. Images:
   - All images have meaningful alt text (from Payload media)
   - Decorative images: alt=""
   - Hero video: aria-label describing the visual

6. Motion:
   - prefers-reduced-motion works site-wide (toggle in DevTools)
   - No flashing/strobing content

Commit per page audited: `a11y([page]): fixes from audit`
```

---

# Working with these prompts

## Tips

1. **One prompt per session.** Don't chain. Each prompt is a complete unit.
2. **Start with the session preamble.** Forces context loading.
3. **Stop the AI if it deviates.** If it suggests Inter font, MUI components, purple accents, or shadcn defaults — stop and re-paste the relevant doc.
4. **Verify visually before committing.** Run the dev server, screenshot the change, confirm it matches the design.
5. **Commit after every working prompt.** Use Conventional Commits format shown in each prompt.
6. **Don't optimize prematurely.** Build it correctly first, polish in Phase 10.

## When you finish a prompt and something is off

```
The result of prompt P-X doesn't match the design system. Here's what I expected:
[paste from /docs/design/COMPONENTS.md section X]

Here's what I got:
[paste the generated code or describe the visual difference]

Without rewriting the whole component, identify the 2-3 specific lines that deviate and fix only those.
```

## When you want to extend a prompt for a new feature

Pick the closest existing prompt as a template:

```
Expand /docs/design/PROMPTS.md prompt P-13 (Featured products grid) to also support a 
"horizontal scroll on mobile" variant. Show me the additional code and how to use it via a prop. Do not change the desktop behavior.
```

The AI does this expansion in context, no need to add to PROMPTS.md unless it becomes reusable.

---

## Sequence summary

Total work: ~45 prompts across 10 phases. Realistic timeline for a beginner with AI assistance, working part-time: **8–12 weeks** for the full frontend.

| Phase | Prompts | Focus | Days (estimate) |
|---|---|---|---|
| 1: Foundation | P-1 | Tailwind, fonts, globals | 1–2 |
| 2: Core Components | P-2 to P-7 | Button, forms, motion wrappers | 3–5 |
| 3: Layout Primitives | P-8 to P-10 | Header, footer, mobile menu | 3–4 |
| 4: Homepage | P-11 to P-19 | Hero + all home sections | 7–10 |
| 5: Shop & PDP | P-20 to P-24 | Catalog and product pages | 5–7 |
| 6: Cart & Checkout | P-25 to P-28 | Commerce flow | 4–6 |
| 7: Account | P-29 to P-31 | Customer dashboard | 3–5 |
| 8: Editorial | P-32 to P-36 | About, journal, tools | 5–7 |
| 9: Other pages | P-37 to P-40 | FAQ, contact, affiliates, auth | 3–5 |
| 10: Polish | P-41 to P-45 | Loaders, empty states, motion, a11y | 5–7 |

Adjust based on your pace. Don't rush the homepage — that's where the brand lives.
