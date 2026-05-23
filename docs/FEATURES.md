# FEATURES.md — Complete Feature List

> Every feature with a user story and acceptance criteria. AI must reference the relevant feature ID when implementing.

---

## Format

Each feature has:

- **ID** for cross-reference
- **User story** (who, what, why)
- **Acceptance criteria** (testable)
- **Phase** it belongs to

---

## Authentication & accounts

### F-1: User registration

**Story:** As a visitor, I want to create an account so I can save orders, addresses, and wishlist.
**Phase:** 4
**Criteria:**

- Email + password + first name + last name + confirm password
- Email format validated, password min 8 chars with 1 number
- Confirm password matches
- Marketing opt-in checkbox (default unchecked)
- Locale captured from URL
- Duplicate email shows specific error
- On success: email verification sent, user logged in, redirected to /account
- Rate limited: 5 attempts per IP per hour

### F-2: Email verification

**Story:** As a new user, I need to verify my email to confirm I own it.
**Phase:** 4
**Criteria:**

- Verification link sent via Resend
- Link expires in 24 hours
- Verified status blocks/unblocks specific actions (configurable: warn vs. block at checkout)
- Resend verification button on account page

### F-3: Login

**Story:** As a customer, I want to log in to access my account.
**Phase:** 4
**Criteria:**

- Email + password
- "Remember me" extends session to 30 days
- Failed attempts: show generic "Invalid credentials"
- Rate limited: 10 attempts per IP per 15 minutes
- After 5 failures: require Turnstile CAPTCHA
- Successful login: merge guest cart with server cart

### F-4: Logout

**Phase:** 4
**Criteria:** Clears session cookie, redirects to homepage, shows toast.

### F-5: Password reset

**Phase:** 4
**Criteria:**

- "Forgot password" link on login page
- Email entered → always shows same "Check your email" message (no email enumeration)
- Reset link valid 1 hour, single-use
- New password requires same strength rules
- After reset: log out all other sessions

### F-6: OAuth sign-in (Google)

**Phase:** Post-MVP
**Criteria:** Google sign-in button on login/register. Maps to same Users collection.

### F-7: Admin login

**Phase:** 4
**Criteria:**

- Same auth, role=admin gates `/admin` access
- Admin login uses Payload's built-in `/admin` page
- 2FA via TOTP for admin accounts (Payload plugin)

---

## Products & catalog

### F-8: Browse products (PLP)

**Phase:** 6
**Criteria:**

- Grid of cards: image, name, price, rating, "Add to cart" or "View"
- Pagination or infinite scroll (pick infinite scroll)
- Filters in sidebar: category, price range, rating, in-stock, sale
- Sort: featured, newest, price asc/desc, best-selling, top-rated
- URL reflects filters (`?category=skincare&minPrice=20`)
- Loading skeletons
- Empty state if no results
- Mobile: filters in drawer

### F-9: View product (PDP)

**Phase:** 6
**Criteria:**

- Image gallery with thumbnails, swipe on mobile, zoom on desktop
- Name, price (with compareAtPrice strikethrough if applicable), rating with link to reviews section
- Short description above the fold
- Variant selector (if hasVariants)
- Quantity selector (min 1, max stock)
- "Add to cart" + "Add to wishlist" buttons
- Stock indicator: "In stock", "Only 3 left", "Out of stock"
- Tabs: Description, Ingredients, COA, Shipping, Reviews
- COA download button if present
- Related products carousel
- Recently viewed (last 6, stored in localStorage)
- Breadcrumbs
- JSON-LD Product schema
- OG tags

### F-10: Product search

**Phase:** 16
**Criteria:**

- Search bar in header, opens modal on click
- Instant search via Meilisearch
- Shows: top 5 products with image, name, price + "See all results"
- Search page: same as PLP but pre-filtered
- Tracks search queries to PostHog
- "No results" suggests alternatives or shows popular

### F-11: Category pages

**Phase:** 6
**Criteria:**

- Heading + description from CMS
- Same product grid as PLP, pre-filtered
- Subcategory navigation if children exist
- SEO content block below products

### F-12: Recently viewed products

**Phase:** 6
**Criteria:**

- Stores last 10 product IDs in localStorage
- Displayed at bottom of PDP and on homepage
- Skipped if cart/wishlist already contains item

---

## Cart

### F-13: Add to cart

**Phase:** 7
**Criteria:**

- Button on PDP and product cards
- Validates variant selected (if applicable) and stock available
- Optimistic update with rollback on failure
- Cart drawer slides in showing newly added item + "View Cart" + "Checkout"
- Cart count badge in header updates
- Toast on success
- Guest: stored in localStorage
- Logged in: stored in Carts collection, synced

### F-14: View cart page

**Phase:** 7
**Criteria:**

- Each line: image, name, variant, unit price, quantity stepper, line total, remove
- Subtotal, estimated shipping placeholder, estimated tax placeholder
- Coupon code field (F-26)
- Continue shopping + Proceed to checkout buttons
- Empty cart state with CTA
- Stock validation: if item out of stock, show warning + disable checkout for that line

### F-15: Update cart quantity

**Phase:** 7
**Criteria:**

- Stepper or input
- Validates against stock
- Removes item if quantity → 0
- Recalculates totals immediately

### F-16: Remove from cart

**Phase:** 7
**Criteria:**

- X button per line
- "Undo" toast for 5 seconds
- Recalculates totals

### F-17: Cart persistence

**Phase:** 7
**Criteria:**

- Guest: localStorage, persists across sessions on same device
- Logged in: server-side, persists across devices
- On login: merge guest + server carts (sum quantities, dedupe by SKU)
- On logout: clear server data from client (localStorage remains empty for that device)

### F-18: Mini cart / cart drawer

**Phase:** 7
**Criteria:**

- Slides from right on add-to-cart or cart icon click
- Shows up to 5 items, scrolls if more
- Quick quantity adjust + remove
- Subtotal + Checkout button
- Closes on outside click or X

---

## Wishlist

### F-19: Add to wishlist

**Phase:** 8
**Criteria:**

- Heart icon on product cards and PDPs
- Filled when in wishlist, outline when not
- Guest: prompts login or stores in localStorage (your call — store in localStorage)
- Logged in: stored in Wishlists collection
- Toast confirms

### F-20: View wishlist page

**Phase:** 8
**Criteria:**

- Grid of saved products
- Per item: remove, add to cart, share (copy link)
- "Move all to cart" button
- Empty state

### F-21: Wishlist sync on login

**Phase:** 8
**Criteria:** Same as cart merge — combine guest + server wishlists, dedupe.

---

## Checkout

### F-22: Checkout flow

**Phase:** 9
**Criteria:**

- Single page with sections (NOT multi-step — single page converts better):
  1. Contact (email, marketing opt-in if guest)
  2. Shipping address (auto-complete via browser, validate US address format)
  3. Shipping method (calculated based on weight + zone)
  4. Payment (Stripe Elements embedded)
  5. Order review (line items, totals, customer notes textarea)
  6. Disclaimer acknowledgment checkbox (if Category C)
  7. Place order button
- Right column on desktop: order summary (sticky)
- Mobile: collapsible order summary at top
- Guest checkout allowed by default
- "Login for faster checkout" link
- Pre-fills if logged in (default addresses, email)

### F-23: Address validation

**Phase:** 9
**Criteria:**

- ZIP code → state auto-fill
- "Save this address" checkbox (if logged in)
- USPS address validation API (or Shippo) before payment — show "Did you mean..." if normalized differs
- Block shipping to restricted states per product (F-43)

### F-24: Shipping rate calculation

**Phase:** 12
**Criteria:**

- On address entered, calculate available shipping methods via Shippo or matched ShippingZone
- Display: method name, est. delivery, price
- Sort by price ascending
- Default-select cheapest
- Recalculate on address change
- Free shipping applied if cart subtotal ≥ threshold

### F-25: Tax calculation

**Phase:** 9
**Criteria:**

- Use Stripe Tax (enabled in Stripe dashboard)
- Tax line shown in summary
- Tax recalculated on address change

### F-26: Apply coupon

**Phase:** 11
**Criteria:**

- Input + Apply button on cart and checkout
- Validates: exists, active, within dates, under usage limit, customer eligible, products in cart match scope, min order met
- Shows applied discount line + remove option
- Stackable coupons (rare): can apply multiple if coupons allow
- Invalid: specific error message
- Free shipping coupon: zeros out shipping line

### F-27: Process payment (Stripe)

**Phase:** 9
**Criteria:**

- Stripe Payment Element (supports cards, Apple Pay, Google Pay, Link)
- 3D Secure handled automatically
- On success: confirm via webhook, create order, redirect to confirmation
- On failure: stay on checkout, show error, allow retry
- Idempotency: prevent double-charge if user double-clicks
- Apple Pay / Google Pay express checkout button at top

### F-28: Order confirmation page

**Phase:** 9
**Criteria:**

- Order number prominently displayed
- "We've sent a confirmation to [email]"
- Order summary, shipping address, payment method
- Estimated delivery date
- "Continue shopping" + "View order" buttons
- GA4 + PostHog purchase event fired

### F-29: Stripe webhook handling

**Phase:** 9
**Criteria:**

- Endpoint: `/api/webhooks/stripe`
- Verify signature using `STRIPE_WEBHOOK_SECRET`
- Handle events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`
- Idempotent: same event ID twice = no-op
- On success: update order status, decrement inventory, send confirmation email
- On failure: notify customer, optionally restore cart

---

## Orders & post-purchase

### F-30: Order list (customer)

**Phase:** 10
**Criteria:**

- `/account/orders`
- Card per order: number, date, status badge, total, item thumbnails
- Click → order detail
- Pagination if > 20

### F-31: Order detail (customer)

**Phase:** 10
**Criteria:**

- All order info: items, addresses, payment last 4, totals
- Tracking link if shipped (F-34)
- "Buy again" button (adds all to cart)
- "Request return" button if within window
- Download invoice PDF (Phase 2)

### F-32: Order list (admin)

**Phase:** 10
**Criteria:**

- Payload admin `/admin/collections/orders`
- Filter by status, date range, customer
- Search by order number, customer email
- Bulk actions: mark as shipped, export CSV
- Custom columns: order number, customer, total, status, date

### F-33: Update order status (admin)

**Phase:** 10
**Criteria:**

- Admin edits order in Payload
- Status dropdown
- Each transition triggers an email + analytics event
- Add tracking number triggers shipped email
- Internal notes for admin only

### F-34: Order tracking

**Phase:** 12
**Criteria:**

- Customer sees tracking number with deep link to carrier site
- Live tracking page on our site that calls Shippo Track API
- Email on each major event: shipped, out for delivery, delivered
- Lost-in-transit detection at 14+ days no movement → admin alert

### F-35: Returns request

**Phase:** Post-MVP
**Criteria:** Customer submits return request, admin approves/denies, generates return label via Shippo, refund processed on receipt.

### F-36: Refund processing (admin)

**Phase:** 10
**Criteria:**

- Admin order page has "Refund" action
- Full or partial refund (amount input)
- Refund reason dropdown
- Calls Stripe Refunds API
- On success: status → refunded or partially_refunded
- Inventory restored (toggleable)
- Refund confirmation email sent

---

## Email notifications

### F-37: Welcome email

**Phase:** 14
**Trigger:** User registration
**Content:** Bilingual greeting, verify email link, top categories CTA

### F-38: Order confirmation email

**Phase:** 14
**Trigger:** Payment succeeded
**Content:** Order details, items, total, shipping address, estimated delivery, contact link

### F-39: Shipping confirmation email

**Phase:** 14
**Trigger:** Status → shipped
**Content:** Tracking number with link, items shipped, expected delivery

### F-40: Delivered email

**Phase:** 14
**Trigger:** Shippo tracking webhook → delivered
**Content:** Thank you, leave a review CTA

### F-41: Abandoned cart email

**Phase:** Post-MVP
**Trigger:** Cart inactive > 1 hour with email captured
**Content:** "You left these behind", items, return to cart link, optional 10% coupon after 24h

### F-42: Review request email

**Phase:** 15
**Trigger:** 7 days after delivery
**Content:** Per product purchased, request review with deep link

---

## Compliance & legal

### F-43: Shipping restrictions enforcement

**Phase:** 12
**Criteria:**

- Per-product restricted states list
- At checkout, if shipping state is restricted for any item: block with specific message
- At PDP, display "Cannot ship to: [states]" if applicable

### F-44: Age gate

**Phase:** 19
**Criteria:**

- On first visit (cookie check): modal asking "Are you 21 or older?"
- Yes → set cookie 365 days
- No → redirect to external site or show message
- Required if any product has `requiresAgeVerification`
- Additional checkbox at checkout for purchases of restricted items

### F-45: FDA disclaimer

**Phase:** 19
**Criteria:**

- Footer on every page
- Banner on PDPs of regulated products
- Checkout step before payment (if Category C)

### F-46: Cookie consent banner

**Phase:** 19
**Criteria:**

- First visit: banner at bottom
- Options: Accept All, Reject All, Customize
- Categories: Necessary (always on), Analytics, Marketing
- Choice stored in cookie 365 days
- Analytics scripts only load after consent
- Settings link in footer to reopen banner

### F-47: CCPA "Do Not Sell" page

**Phase:** 19
**Criteria:**

- Footer link "Your Privacy Choices"
- Form to opt-out of data sharing
- Logged: name, email, request type, fulfilled date

---

## Reviews

### F-48: Write a review

**Phase:** 15
**Criteria:**

- Only customers with delivered order containing the product can review
- Form: rating (stars 1-5), title, body, photo upload (optional, max 3)
- Submitted as `pending`, admin moderates
- Confirmation: "Thanks, your review is pending approval"

### F-49: Display reviews on PDP

**Phase:** 15
**Criteria:**

- Summary: average rating, count, distribution bars
- List: sortable (newest, highest, lowest, most helpful)
- Per review: name (first name + last initial), date, verified purchase badge, rating, title, body, photos, helpful button
- Admin response shown indented below review if present
- Pagination

### F-50: Moderate reviews (admin)

**Phase:** 15
**Criteria:**

- Admin sees pending in Payload
- Approve / Reject buttons
- Optional admin response field

---

## Content & marketing

### F-51: Homepage

**Phase:** 17
**Criteria:** Hero, featured products, category grid, testimonials, blog teaser, newsletter signup. All CMS-editable via Homepage global.

### F-52: Blog

**Phase:** 17
**Criteria:**

- Index page: cards with cover, title, excerpt, date
- Post page: title, hero, body (richtext blocks), author, related posts
- RSS feed
- Category tags

### F-53: Static pages

**Phase:** 17
**Criteria:** About, FAQ, Shipping, Returns, Privacy, Terms, Contact — all in Pages collection.

### F-54: Contact form

**Phase:** 17
**Criteria:**

- Name, email, subject, message
- Turnstile protection
- Submits to ContactMessages collection
- Auto-reply email
- Admin notification email

### F-55: Newsletter signup

**Phase:** 17
**Criteria:**

- Footer + dedicated section
- Email only, double-opt-in via Resend
- 10% off coupon as incentive (optional)

---

## Internationalization (EN/ES)

### F-56: Language switcher

**Phase:** 5
**Criteria:**

- Header dropdown: EN | ES
- Switches locale, preserves current URL path
- Persisted in cookie + user preference if logged in

### F-57: Localized content

**Phase:** 5
**Criteria:**

- All product names, descriptions, blog, pages have EN+ES via Payload
- All UI strings via next-intl in `messages/en.json` and `messages/es.json`
- URLs: `/en/products` and `/es/productos` (localized slugs optional)
- Hreflang tags

---

## Search

### F-58: Site-wide search

**Phase:** 16
**Criteria:** See F-10. Indexed: products, blog posts, categories, pages.

---

## Admin operations

### F-59: Product management

**Phase:** 6
**Criteria:** Full CRUD via Payload admin. Bulk CSV import via custom endpoint.

### F-60: Inventory management

**Phase:** 6
**Criteria:**

- Stock editable per product/variant
- Low stock dashboard widget
- Auto-decrement on order paid
- Auto-restore on order cancelled/refunded (configurable)

### F-61: Customer management

**Phase:** 10
**Criteria:** View all users, search by email/name, see order history per user, ban/unban.

### F-62: Coupon management

**Phase:** 11
**Criteria:** Full CRUD via Payload. Stats per coupon: usage count, total discount given.

### F-63: Analytics dashboard

**Phase:** 18
**Criteria:**

- Custom widget on Payload home: revenue today/week/month, orders count, top products, low stock count
- Deeper analytics in PostHog (linked from Payload)

### F-64: Email log

**Phase:** 14
**Criteria:** Searchable list of all emails sent, status from Resend webhooks.

---

## Performance, SEO, monitoring

### F-65: SEO basics

**Phase:** 19
**Criteria:** Sitemap.xml (dynamic), robots.txt, canonical URLs, OG tags, Product/Article/Breadcrumb JSON-LD, hreflang.

### F-66: Performance budgets

**Phase:** 19
**Criteria:** Per `PROJECT-CONTEXT.md`. Lighthouse CI in GitHub Actions.

### F-67: Error monitoring

**Phase:** 18
**Criteria:** Sentry for client + server errors, source maps uploaded, alerts for new error types.

### F-68: Uptime monitoring

**Phase:** 18
**Criteria:** UptimeRobot pings homepage, /api/health, /admin, /api/webhooks/stripe every 5 min.

### F-69: Rate limiting

**Phase:** 19
**Criteria:**

- Upstash Redis-based
- Login: 10/15min per IP
- Register: 5/hour per IP
- Password reset: 3/hour per email
- Contact form: 3/hour per IP
- Checkout: 20/hour per IP
- Search: 60/min per IP

### F-70: Bot protection

**Phase:** 19
**Criteria:** Cloudflare Turnstile on register, login (after 5 fails), password reset, contact, newsletter, reviews.

---

## Features added from reference site audit (99puritypeptides.com)

---

### F-71: Peptide reconstitution calculator

**Story:** As a researcher, I want to calculate exactly how much bacteriostatic water to add to my vial and how many mL to draw per dose, so I don't waste expensive peptides.
**Phase:** 17 (content tools)
**Route:** `/[locale]/peptide-calculator`
**Criteria:**

- Single-page React client component, no backend needed
- **Input fields:**
  - Vial size (mg) — number input
  - Desired concentration (mcg/mL or mg/mL — toggle unit)
  - Desired dose per injection (mcg or mg)
- **Outputs (real-time, update as user types):**
  - Bacteriostatic water to add: X mL
  - Volume to draw per dose: X mL (with syringe markings: e.g., "40 IU on a 100-unit insulin syringe")
  - Doses per vial: X doses
- Mobile-friendly large inputs
- Explanatory text beneath each output field (what it means)
- Disclaimer: "For research and educational purposes only"
- Link to blog post explaining reconstitution protocol
- Both EN and ES
- JSON-LD HowTo schema for SEO
- This page should rank for "peptide calculator" and "how to reconstitute peptides"

**Implementation note:** Pure math, no API calls. All client-side. Build as a `'use client'` component within a server-rendered page (for SEO/metadata).

---

### F-72: Affiliate program

**Story:** As a site owner, I want an affiliate program so researchers, influencers, and community members can earn commissions by referring buyers.
**Phase:** Post-MVP (recommend Rewardful SaaS integration, not custom build)
**Route:** `/[locale]/affiliates` — landing page + signup
**Criteria:**

- **Integration:** Use Rewardful ($49/mo) — handles referral link generation, click tracking, Stripe commission attribution, payout dashboard
- Affiliate landing page: program terms, commission rate (e.g., 10–15%), how it works, signup CTA
- Affiliate signup form → creates Rewardful account
- Affiliate dashboard (via Rewardful embed or link-out)
- Admin: view affiliates, approve/reject, adjust commission rates in Rewardful dashboard
- Banner links and promotional assets available for download
- Referral link appended automatically on checkout via Rewardful JS snippet
- Cookie window: 30 days (standard)
- Commission paid on completed, non-refunded orders
- Both EN and ES landing page

**Payload additions:**

- Add `affiliateCode` text field to Orders collection (captured from Rewardful cookie at checkout)

---

### F-73: COA / Certificates library page

**Story:** As a researcher, I want to browse all available Certificates of Analysis in one place to verify product quality before ordering.
**Phase:** 6 (alongside product catalog)
**Route:** `/[locale]/certificates`
**Criteria:**

- Lists all active products with their associated COA
- Each row: product name, purity %, batch number, COA download button (PDF)
- Filter by category
- Products without a COA show "COA available upon request" with contact link
- Updated automatically as products are updated in Payload (server-rendered, revalidated)
- Linked from header nav and product pages
- Builds trust as a standalone SEO page

**Payload note:** Powered by the existing `coaFile`, `purity`, and `batchNumber` fields in Products collection.

---

### F-74: Promo / sale entry popup

**Story:** As a site owner, I want to show a promotion popup on first visit with coupon codes, so I can drive conversions on campaign days.
**Phase:** 17
**Criteria:**

- Popup shown on first visit (or after X days — configurable)
- Cookie: `promo_popup_seen` — expiry configurable (default 7 days)
- Controlled entirely from Payload `SiteSettings` global:
  - `promoPopupActive` checkbox (default false)
  - `promoPopupImage` upload (desktop + mobile versions)
  - `promoPopupCoupons` array: [{ label, code, description }] — up to 3 tiers
  - `promoPopupExpireDays` number
- UI: full-screen overlay on mobile, centered modal on desktop
- Each coupon code: display with one-click "Copy Code" button (copies to clipboard, shows "Copied!" toast)
- Close button (X) + click outside to dismiss
- Does NOT show on /checkout, /cart, /admin
- Does NOT show if user is already logged in and has placed an order before

---

### F-75: Announcement bar

**Story:** As a site owner, I want a sitewide announcement bar to promote free shipping thresholds or campaigns.
**Phase:** 6
**Criteria:**

- Already in SiteSettings global (`announcementBar`, `announcementBarActive`)
- Extend with:
  - `announcementBarLink` text (optional URL to link the bar)
  - `announcementBarBgColor` text (hex, default brand primary)
  - `announcementBarTextColor` text (hex, default white)
- Renders above the header, full width
- Dismissable with X (cookie for 24h)
- Localized text [L]

---

### F-76: Video hero on homepage

**Story:** As a site owner, I want an autoplay background video on the homepage hero, to convey premium lab quality instantly.
**Phase:** 17
**Criteria:**

- Homepage global extended with:
  - `heroVideoWebm` upload → Media (`.webm` format, max 10MB)
  - `heroVideoMp4` upload → Media (`.mp4` fallback, max 10MB)
  - `heroFallbackImage` upload → Media (shown if video unsupported or on slow connections)
- `<video>` element: `autoPlay muted loop playsInline`
- On mobile (< 768px): use fallback image only (videos autoplay policy + data savings)
- Overlay: dark gradient so text remains readable
- Hero text (headline, subheadline, 2 CTAs) CMS-editable [L]
- Preload: `preload="none"` — don't block page load

---

### F-77: Medical Disclaimer standalone page

**Phase:** 17
**Criteria:**

- CMS page at `/[locale]/medical-disclaimer`
- Full-text disclaimer managed in Pages collection
- Linked in footer "Policies" column
- Indexed by search engines
- Content: covers RUO designation, not FDA-approved, not for human/veterinary use, purity variation notice

---

### F-78: Dual contact email routing

**Story:** As a customer, I want to reach the right team — orders vs. support — without guessing.
**Phase:** 17
**Criteria:**

- ContactMessages collection: add `department` select field: `Orders & Shipping` | `Technical / Lab Support` | `General Inquiry` | `Press & Partnerships`
- Form on contact page shows department dropdown
- Email notification on new submission routed to:
  - Orders & Shipping → orders@clientdomain.com
  - Technical / Lab Support → support@clientdomain.com
  - Others → general inbox
- SiteSettings global: `ordersEmail` and `supportEmail` fields (admins update without redeploy)
- Both emails shown in header and footer (matching reference site)

---

### Updated: Product categories (seed data)

Replace the generic seed categories with these 8, matching the reference site's taxonomy:

```
1. Bioregulators
2. Cellular Health Research
3. Cognitive Function Studies
4. Essentials
5. Growth Factor Research Peptides
6. Metabolic Research Peptides
7. Receptor Agonist Research Peptides
8. Recovery Research Peptides
```

Blog post categories:

```
1. Emerging Research
2. Metabolic Studies (Tirzepatide/Semaglutide-related)
3. Product Use & Classification
4. Recovery & Growth Research
```

---

### Updated: Header nav structure

Mirror the reference site's navigation:

```
Home | Shop | Categories ▾ | About Us | Blog | Peptide Calculator | Affiliates | FAQ | Contact
```

Mobile: hamburger menu with same items.

Secondary header row (desktop): phone number | email | announcement bar

---

### Updated: Footer structure

Column 1: Logo + newsletter signup + social icons (Facebook, Instagram, YouTube)
Column 2: Quick Links (Home, About, Shop, Blog, Affiliates, FAQ, Contact)
Column 3: Policies (Terms, Privacy, Refund, Shipping, Medical Disclaimer)
Column 4: Contact (orders email, support email, phone number)

Below footer: full FDA/RUO disclaimer paragraph (managed in SiteSettings global as `footerDisclaimer` [L] richtext field)
