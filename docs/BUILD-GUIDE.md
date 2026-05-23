# BUILD-GUIDE.md — Phase-by-Phase Build Plan

> The full path from empty folder to launched store. Do phases in order. Each phase ends with a verification checklist — don't move on until everything passes.

For copy-paste prompts to feed your AI IDE, see `PROMPTS.md`. Each prompt is numbered to match this guide.

---

# Phase 0 — Business setup (no code)

**Goal:** Have the legal, financial, and brand foundation in place before writing code.

## Steps

1. **Pick your peptide category** (see `LEGAL-USA.md`). This determines payment provider.
2. **Form business entity** — LLC in your state, or Wyoming/Delaware if Category C. Get EIN.
3. **Open business bank account** with EIN.
4. **Apply for merchant account:**
   - Category A/B → Stripe account at stripe.com/dashboard (instant)
   - Category C → Apply with high-risk processor (4–8 week approval). Do this NOW.
5. **Pick a brand name + domain.** Buy domain at Cloudflare Registrar (at-cost). Enable WHOIS privacy.
6. **Design basics:** Logo (Figma, Looka, or hire a designer for $200). Pick 3 colors, 2 fonts.
7. **Product photography:** Plan to shoot every SKU on white background. Minimum 5 angles per product. Even iPhone shots beat stock photos.
8. **Draft policies** (Privacy, Terms, Shipping, Returns, Disclaimer) via Termly. Budget for a lawyer review.
9. **Open accounts** (free tiers fine for now):
   - GitHub
   - Vercel
   - Neon (Postgres)
   - Cloudflare (DNS + R2 + Turnstile)
   - Resend (email)
   - Stripe (test mode)
   - Sentry
   - PostHog
   - UptimeRobot
   - Upstash Redis
   - Google Analytics 4 property
   - Microsoft Clarity
10. **Install tools on your machine:**
    - Node.js 20 LTS (use nvm)
    - Git
    - VS Code or Cursor
    - GitHub CLI (`gh`)
    - Stripe CLI (for local webhook testing)

## Verification

- [ ] Business formed, EIN issued
- [ ] Bank account active
- [ ] Domain owned, WHOIS private
- [ ] All accounts created, credentials saved in a password manager (1Password / Bitwarden)
- [ ] Local machine: `node -v` shows v20.x.x, `npm -v` works, `git --version` works

---

# Phase 1 — Local environment & repo

**Goal:** Empty Next.js + Payload + Postgres project running on localhost.

## Steps

1. Create a Neon project. Copy the connection string. Create a second branch called `staging`.
2. Create a GitHub repo: `peptides-store`. Clone it locally.
3. Inside the repo, run `npx create-payload-app@latest` and select:
   - Template: **website** (we'll add e-commerce manually, the ecommerce template is also OK if available)
   - Database: **Postgres**
   - TypeScript: yes
   - Package manager: **npm**
4. Paste the Neon connection string when prompted.
5. Add the `/docs` folder from this guide to the project root.
6. Add `CLAUDE.md` to project root (Claude Code) AND copy contents to `.cursorrules` (Cursor) AND `.windsurfrules` (Windsurf).
7. Run `npm run dev`. Visit `http://localhost:3000` and `http://localhost:3000/admin`.
8. Create your first admin user via the admin panel.
9. Run `npm run generate:types`. Verify `src/payload-types.ts` exists.
10. Commit: `git commit -m "chore: initial scaffold"`.

**Run this prompt:** `PROMPTS.md` → **P-1.1**

## Verification

- [ ] `npm run dev` works
- [ ] `/admin` loads, you can log in
- [ ] Postgres connection works (check Neon dashboard for activity)
- [ ] `src/payload-types.ts` generated
- [ ] First Git commit pushed to GitHub

---

# Phase 2 — Tailwind, shadcn/ui, project conventions

**Goal:** Styling foundation and tooling.

## Steps

1. Tailwind is usually included by Payload's website template. Verify `tailwind.config.ts` exists.
2. Initialize shadcn/ui: `npx shadcn@latest init`. Choose defaults, "Default" style, "Slate" base color.
3. Install initial components:
   ```
   npx shadcn@latest add button input label form select dialog drawer sheet toast skeleton badge separator dropdown-menu navigation-menu accordion tabs avatar
   ```
4. Configure ESLint + Prettier. Add scripts to `package.json`: `lint`, `format`, `typecheck`.
5. Set up Husky + lint-staged for pre-commit hooks.
6. Create folder structure per `PROJECT-CONTEXT.md`.
7. Configure absolute imports (`@/*`) in `tsconfig.json`.
8. Add `.env.example` and `.env.local`. Reference `ENV-VARIABLES.md`.

**Run this prompt:** `PROMPTS.md` → **P-2.1**

## Verification

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run format` works
- [ ] shadcn `<Button>` renders on test page
- [ ] Commit hooks trigger on `git commit`

---

# Phase 3 — Database schemas (all collections)

**Goal:** All Payload collections defined and migrated.

> Reference: `SCHEMAS.md` is the source of truth. Build each collection exactly as specified.

## Order of creation

Do collections in this order to satisfy relationships:

1. Media (no deps)
2. Users (Payload may already have this — extend it)
3. Addresses (deps: Users)
4. Categories (self-ref)
5. Products (deps: Categories, Media)
6. Carts (deps: Users, Products)
7. Wishlists (deps: Users, Products)
8. Coupons (deps: Products, Categories)
9. Orders (deps: Users, Products) — important: snapshot product data, don't rely on live relations
10. Reviews (deps: Users, Products, Orders)
11. ShippingZones (no deps)
12. BlogPosts (deps: Users, Media)
13. Pages (deps: Media)
14. ContactMessages (no deps)
15. EmailLogs (deps: Users, Orders)

## Globals

After collections:

- SiteSettings
- Header
- Footer
- Homepage

## Migrations

After each collection: `npm run payload migrate:create <name>` then `npm run payload migrate`.

**Run prompts:** `PROMPTS.md` → **P-3.1 through P-3.15** (one per collection)

## Verification

- [ ] All collections visible in `/admin` sidebar
- [ ] Can create 1 sample of each in admin
- [ ] `src/payload-types.ts` includes all types
- [ ] Migrations checked into Git
- [ ] No console errors

---

# Phase 4 — Authentication

**Goal:** Customers can register, log in, log out, verify email, reset password. Admin auth separated by role.

## Steps

1. Extend Users collection per `SCHEMAS.md`:
   - Add `role`, `acceptsMarketing`, `preferredLocale`, etc.
   - Enable Payload's built-in email verification
   - Enable password reset
2. Create customer registration page at `/[locale]/register`.
3. Create login page at `/[locale]/login`.
4. Create forgot-password and reset-password pages.
5. Create logout server action.
6. Email templates (in `src/emails/`):
   - WelcomeEmail.tsx
   - VerifyEmail.tsx
   - PasswordResetEmail.tsx
7. Configure Payload to use Resend for transactional emails. Replace default email adapter.
8. Add middleware (`src/middleware.ts`) to protect `/account/*` routes.
9. Add session check helpers in `src/lib/auth.ts`.
10. Add rate limiting (will be filled in Phase 19 — for now just enable Payload's built-in throttling).

**Run prompts:** `PROMPTS.md` → **P-4.1 through P-4.7**

## Verification

- [ ] Can register at `/register` — receives welcome + verification email
- [ ] Verification link works
- [ ] Can log in
- [ ] Can log out
- [ ] Forgot password flow works end-to-end
- [ ] `/account` redirects to `/login` when logged out
- [ ] Admin user (role=admin) can access `/admin`
- [ ] Customer user (role=customer) gets 403 on `/admin`

---

# Phase 5 — Bilingual (EN/ES)

**Goal:** Site usable in both English and Spanish.

## Steps

1. Install `next-intl`: `npm install next-intl`.
2. Set up routing: `src/i18n/routing.ts` with locales `['en', 'es']`, default `'en'`.
3. Create `messages/en.json` and `messages/es.json`. Initial keys for navigation, common buttons.
4. Update `src/app/` structure to use `[locale]` segment.
5. Update middleware to handle locale.
6. Enable Payload localization in `payload.config.ts` for: products, categories, pages, blog posts, site settings.
7. Update SCHEMAS-marked `[L]` fields to set `localized: true`.
8. Create `<LanguageSwitcher>` component in header.
9. Set hreflang tags in root layout.
10. Translate Spanish strings. Use DeepL or hire a translator — don't trust ML for marketing copy.

**Run prompts:** `PROMPTS.md` → **P-5.1 through P-5.4**

## Verification

- [ ] `/en/...` and `/es/...` both render
- [ ] Switching language preserves current page
- [ ] Product entered in admin shows EN and ES tabs, both save
- [ ] PDP shows correct localized content
- [ ] Hreflang tags present in `<head>`
- [ ] No untranslated strings in UI (search for hardcoded English)

---

# Phase 6 — Product catalog

**Goal:** Browse and view products on the storefront.

## Steps

1. Seed 5-10 sample products via admin (or seed script).
2. Build PLP at `/[locale]/products`:
   - Server component fetches products
   - Client filter sidebar (price range, category, in-stock, sort)
   - Infinite scroll via `useInfiniteQuery` or server component pagination
3. Build PDP at `/[locale]/products/[slug]`:
   - Server-rendered with `generateMetadata` for SEO
   - Image gallery (client component)
   - Variant selector (client component)
   - Quantity selector
   - Add to cart button (works in Phase 7)
   - Tabs: Description, Ingredients, COA, Shipping, Reviews placeholder
   - Related products section
4. Build category pages at `/[locale]/categories/[slug]`.
5. Build `<ProductCard>` shared component.
6. Implement recently viewed (localStorage hook).
7. Add JSON-LD Product schema.
8. Add OG tags.

**Run prompts:** `PROMPTS.md` → **P-6.1 through P-6.6**

## Verification

- [ ] PLP loads, shows products
- [ ] Filters and sort work, URL reflects state
- [ ] Pagination/infinite scroll works
- [ ] PDP loads, all sections render
- [ ] Variant switching updates price and stock
- [ ] Category pages work
- [ ] Lighthouse SEO score ≥ 95 on PDP
- [ ] Mobile PDP usable (gallery swipes, add-to-cart sticky)

---

# Phase 7 — Cart

**Goal:** Users can add, view, update, and remove cart items. Guest + logged-in carts work.

## Steps

1. Create cart state management — use Zustand for client-side, with localStorage persistence.
2. Build cart store: `src/lib/cart/store.ts` with `addItem`, `removeItem`, `updateQuantity`, `clear`, `applyCoupon`.
3. On login, merge guest cart with server cart (Cart collection). Server action.
4. Server actions for cart mutations when logged in.
5. Cart drawer component (slides from right).
6. Cart page at `/[locale]/cart`.
7. Cart icon in header with item count badge.
8. Stock validation before adding (server-checked).
9. Price snapshot on add (use current price; recalculate at checkout).

**Run prompts:** `PROMPTS.md` → **P-7.1 through P-7.5**

## Verification

- [ ] Guest can add items, persists across reloads
- [ ] Cart drawer opens on add, shows correct items
- [ ] Cart page shows all lines correctly
- [ ] Quantity stepper works, respects stock
- [ ] Remove + undo works
- [ ] Logging in merges guest cart with server cart, dedupes
- [ ] Stock validation blocks adding more than available
- [ ] Cart count badge updates immediately

---

# Phase 8 — Wishlist

**Goal:** Users can save products for later.

## Steps

1. Wishlist store (similar to cart) with localStorage for guests.
2. Server-side Wishlist collection sync for logged-in users.
3. Heart icon on product cards and PDPs.
4. Wishlist page at `/[locale]/account/wishlist` (logged in) or `/[locale]/wishlist` (guest with localStorage).
5. "Move to cart" and "Move all to cart" actions.
6. Login merges guest + server wishlists.

**Run prompts:** `PROMPTS.md` → **P-8.1 through P-8.3**

## Verification

- [ ] Heart toggles in real-time
- [ ] Guest wishlist persists
- [ ] Login merges wishlists
- [ ] Move to cart removes from wishlist
- [ ] Move all to cart works
- [ ] Out-of-stock items show indicator on wishlist

---

# Phase 9 — Checkout & payment (Stripe)

**Goal:** Customer can complete a purchase end-to-end.

> This is the most security-critical phase. Read every line of generated code. Test with Stripe test cards exhaustively.

## Steps

1. Install: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`.
2. Create `src/lib/stripe.ts` (server-side Stripe client).
3. Build checkout page `/[locale]/checkout` (server component) with sections:
   - Contact (email)
   - Shipping address (form, with server-side validation via Zod)
   - Shipping method (calculated; placeholder in this phase, real in Phase 12)
   - Payment (Stripe Payment Element)
   - Order summary (sticky on desktop)
4. Server action `createPaymentIntent` — creates Stripe PaymentIntent with order total, customer ID, metadata (cart snapshot).
5. Client-side: confirm payment with `stripe.confirmPayment` using the Payment Element.
6. Order confirmation page `/[locale]/order-confirmation/[orderId]`.
7. Stripe webhook handler at `/api/webhooks/stripe/route.ts`:
   - Verify signature with `STRIPE_WEBHOOK_SECRET`
   - Handle `payment_intent.succeeded` → create Order, decrement stock, send email
   - Handle `payment_intent.payment_failed` → log
   - Handle `charge.refunded` → update order
   - Handle `charge.dispute.created` → admin alert email
   - Idempotency via stored event IDs
8. Local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
9. Order creation is **server-only**, after webhook confirms payment. Never trust client.
10. Enable Stripe Tax for tax calculation.

**Run prompts:** `PROMPTS.md` → **P-9.1 through P-9.8**

## Verification

- [ ] Can complete checkout with test card `4242 4242 4242 4242`
- [ ] Failed payment shows error and lets user retry (test card `4000 0000 0000 0002`)
- [ ] 3DS challenge works (test card `4000 0027 6000 3184`)
- [ ] Order created in DB after webhook
- [ ] Stock decremented after order
- [ ] Order confirmation email received
- [ ] Order shows in `/account/orders`
- [ ] Webhook signature verification rejects unsigned requests
- [ ] Double-clicking "Place order" doesn't double-charge

---

# Phase 10 — Orders & order management

**Goal:** Customers see their orders. Admins manage orders.

## Steps

1. Customer order list at `/[locale]/account/orders`.
2. Customer order detail at `/[locale]/account/orders/[orderNumber]`.
3. Admin order list — customize Payload admin columns and filters.
4. Admin order detail — add custom UI components for status changes.
5. Refund action in admin (calls Stripe Refunds API via server endpoint).
6. Cancel order action (only if not yet shipped).
7. Order status state machine — enforce valid transitions in `beforeChange` hook.
8. Email triggers on status changes (subscribers).

**Run prompts:** `PROMPTS.md` → **P-10.1 through P-10.5**

## Verification

- [ ] Customer sees only their own orders
- [ ] Order detail shows all info
- [ ] Admin can filter orders by status
- [ ] Admin can update status, customer gets email
- [ ] Refund works end-to-end (test refund of test charge)
- [ ] Invalid status transition rejected (e.g., refunded → paid)

---

# Phase 11 — Coupons & discounts

## Steps

1. Coupon collection per `SCHEMAS.md` (built in Phase 3).
2. Server function `validateCoupon(code, cart, user)` returns valid + discount or error.
3. Apply coupon UI on cart and checkout.
4. Display applied coupon line in order summary.
5. Track coupon usage on order creation.
6. Admin coupon stats: usage count, total discount, redemption rate.

**Run prompts:** `PROMPTS.md` → **P-11.1, P-11.2**

## Verification

- [ ] Valid code applies discount
- [ ] Expired code rejected
- [ ] Per-customer limit enforced
- [ ] Minimum order amount enforced
- [ ] Product-scoped coupon only discounts matching products
- [ ] Free-shipping coupon zeros shipping
- [ ] Usage count increments on order paid

---

# Phase 12 — Shipping & tracking

## Steps

1. Sign up for Shippo. Get API key.
2. Install Shippo SDK.
3. Server function `getShippingRates(toAddress, parcel)` returns rates.
4. Cart parcel calculation: aggregate weights, pick smallest fitting box from preset list.
5. Replace Phase 9 placeholder with real rates.
6. Admin "Buy label" action on shipped orders.
7. Shippo tracking webhook at `/api/webhooks/shippo/route.ts`.
8. Tracking display on order page (carrier link + last status).
9. Email on shipped, delivered.

**Run prompts:** `PROMPTS.md` → **P-12.1, P-12.2**

## Verification

- [ ] Rates show at checkout based on address
- [ ] Free shipping triggers above threshold
- [ ] Admin can buy a test label (Shippo test mode)
- [ ] Tracking number stored on order
- [ ] Tracking page works
- [ ] Status updates via webhook
- [ ] Restricted states blocked

---

# Phase 13 — Customer dashboard

## Steps

1. `/account` overview page: greeting, recent orders, quick links.
2. `/account/orders` (done in Phase 10).
3. `/account/addresses` — list, add, edit, delete, set default.
4. `/account/settings` — name, email (with re-verify), password change, marketing preferences, preferred locale.
5. `/account/wishlist` (done in Phase 8).

**Run prompts:** `PROMPTS.md` → **P-13.1**

## Verification

- [ ] All pages reachable from account nav
- [ ] Address CRUD works
- [ ] Default address logic correct (only one true at a time)
- [ ] Email change requires re-verification
- [ ] Password change requires old password

---

# Phase 14 — Email notifications (Resend + React Email)

## Steps

1. Install: `npm install resend @react-email/components react-email`.
2. Create email templates in `src/emails/`:
   - WelcomeEmail
   - VerifyEmail
   - OrderConfirmationEmail
   - OrderShippedEmail
   - OrderDeliveredEmail
   - RefundProcessedEmail
   - PasswordResetEmail
   - ReviewRequestEmail
   - LowStockAdminEmail
3. Sender utility `src/lib/email/send.ts` that logs to EmailLogs.
4. Resend webhook for delivery status: `/api/webhooks/resend/route.ts`.
5. Cron / scheduled job for review request emails (Vercel Cron) — 7 days post-delivery.
6. Bilingual: pick template language from user preferredLocale or order locale.

**Run prompts:** `PROMPTS.md` → **P-14.1 through P-14.4**

## Verification

- [ ] All 9 email types render correctly
- [ ] Spanish versions render correctly
- [ ] EmailLogs collection has entries after each send
- [ ] Resend dashboard shows deliveries
- [ ] Unsubscribe link works (where applicable)
- [ ] Footer has physical address (CAN-SPAM)

---

# Phase 15 — Reviews

## Steps

1. Review submission form on PDP — only visible if user has delivered order with product.
2. Pending review screen for admin in Payload.
3. Approval/rejection in admin.
4. Display approved reviews on PDP with pagination, sort.
5. Helpful vote (anonymous, IP-based dedupe via Upstash).
6. Recompute averageRating + reviewCount on product via hook.
7. Review request email (Phase 14).
8. Photo upload in reviews (uses Media collection).

**Run prompts:** `PROMPTS.md` → **P-15.1, P-15.2**

## Verification

- [ ] Can submit review only with delivered order
- [ ] Pending reviews don't show on PDP
- [ ] After approval, review appears, rating averages update
- [ ] Sort/pagination work
- [ ] Helpful vote increments, blocks duplicate

---

# Phase 16 — Search (Meilisearch)

## Steps

1. Spin up Meilisearch — easiest: Meilisearch Cloud free tier or self-host on Hetzner CX22 (~$5/mo).
2. Install: `npm install meilisearch instantsearch.js react-instantsearch`.
3. Indexer: Payload hook on Products afterChange → upsert to Meilisearch. afterDelete → remove.
4. Initial seed script: index all existing products.
5. Header search component (modal with instant results).
6. Search results page `/[locale]/search?q=...`.
7. Track searches to PostHog.

**Run prompts:** `PROMPTS.md` → **P-16.1, P-16.2**

## Verification

- [ ] Type in search → instant results
- [ ] Typo tolerance works ("collagn" finds "collagen")
- [ ] Filters work on search page
- [ ] New product appears in search within seconds
- [ ] Deleted product disappears from search

---

# Phase 17 — Blog & content pages

## Steps

1. Blog index `/[locale]/blog`.
2. Blog post `/[locale]/blog/[slug]`.
3. Static pages `/[locale]/[slug]` (about, faq, shipping-policy, returns, privacy, terms, contact).
4. Contact form (uses ContactMessages collection).
5. Newsletter signup with double opt-in.
6. Homepage with all blocks from Homepage global.
7. RSS feed for blog at `/feed.xml`.

**Run prompts:** `PROMPTS.md` → **P-17.1 through P-17.4**

## Verification

- [ ] Blog index + post pages work
- [ ] All policy pages live
- [ ] Contact form submits, admin gets email, customer gets auto-reply
- [ ] Newsletter sends double-opt-in, confirmed email gets coupon
- [ ] Homepage CMS-editable
- [ ] RSS feed valid

---

# Phase 18 — Analytics, monitoring, error tracking

## Steps

1. PostHog: install `posthog-js`, init in client provider. Track key events (per `FEATURES.md`).
2. GA4: via Google Tag Manager. Enhanced ecommerce events.
3. Microsoft Clarity: install snippet.
4. Sentry: `npx @sentry/wizard@latest -i nextjs`. Configure source maps in CI.
5. UptimeRobot: add monitors for homepage, /admin, /api/health.
6. Cookie consent — load analytics only after consent.
7. Admin dashboard widget: revenue, orders, low stock (custom Payload component).

**Run prompts:** `PROMPTS.md` → **P-18.1 through P-18.4**

## Verification

- [ ] Events fire to PostHog and GA4 in real time
- [ ] Sentry receives a test error
- [ ] UptimeRobot pings successful
- [ ] Clarity records sessions
- [ ] Cookie banner gates trackers properly

---

# Phase 19 — SEO, performance, security

## Steps

1. Dynamic sitemap: `src/app/sitemap.ts`.
2. robots.txt: `src/app/robots.ts`.
3. Verify JSON-LD on PDP, blog, breadcrumbs.
4. Canonical URLs everywhere.
5. Hreflang tags.
6. Image optimization: Next/Image, AVIF, proper sizes prop.
7. Lighthouse CI in GitHub Actions.
8. Rate limiting with Upstash Redis.
9. Cloudflare Turnstile on register, login (after fails), contact, newsletter, reviews.
10. Age gate component (if applicable).
11. FDA disclaimers in place.
12. CCPA "Do Not Sell" workflow.
13. Cookie consent banner.
14. Security headers via Next config (CSP, HSTS, X-Frame-Options, Referrer-Policy).
15. Dependabot enabled in GitHub.

**Run prompts:** `PROMPTS.md` → **P-19.1 through P-19.6**

## Verification

- [ ] Sitemap.xml valid and includes all routes
- [ ] PSI score ≥ 90 on homepage and PDP (mobile)
- [ ] Rate limits trigger as expected
- [ ] Turnstile blocks scripted submissions
- [ ] Age gate works
- [ ] All disclaimers visible
- [ ] CSP allows necessary domains only
- [ ] Run `npm audit` — no high/critical

---

# Phase 20 — Pre-launch & launch

## Steps

1. Production database: separate Neon project (not staging branch).
2. Vercel production deploy from `main`.
3. Set all production env vars in Vercel.
4. Configure Cloudflare for the domain: DNS → Vercel, Proxy enabled, SSL Full Strict, WAF rules.
5. Stripe: switch from test mode to live mode. Update keys.
6. Stripe webhook: point to production URL.
7. Resend: verify production domain (DKIM, SPF, DMARC).
8. R2 bucket: confirm production keys, CORS configured.
9. Run full LAUNCH-CHECKLIST.md.
10. Final test: place a real order with your own card, fulfill it, refund it.
11. Announce.

**Run prompts:** `PROMPTS.md` → **P-20.1**

---

## After launch

- Daily: check Sentry, refund queue, low stock
- Weekly: review PostHog funnels, abandoned carts
- Monthly: dependency updates, lighthouse audits
- Quarterly: security review, backup restore drill
