# PROMPTS.md — Copy-Paste Prompt Library

> Use these prompts in order with your AI IDE. Each prompt is scoped, specific, and references the docs so the AI stays focused.
>
> **Always start each session with this:**
>
> ```
> Read /docs/CLAUDE.md, /docs/PROJECT-CONTEXT.md, /docs/SCHEMAS.md, and /docs/FEATURES.md before doing anything else. Confirm you've read them by listing the tech stack version numbers from PROJECT-CONTEXT.md. We are currently in Phase [X].
> ```

---

# PHASE 1 — Initialization

## P-1.1 — Scaffold the project

```
Goal: Initialize the Payload + Next.js project from scratch using the official Payload installer.

Steps you will perform one at a time, stopping for me to confirm after each:

1. Tell me the exact command to run `create-payload-app` for Next.js 15 with Postgres and TypeScript. Wait for me to confirm it completed.

2. Once the app is created, walk me through what every top-level file and folder does in plain English (one sentence each).

3. Help me edit `.env.example` and `.env.local` to include every variable from /docs/ENV-VARIABLES.md, with placeholders. Explain what each variable is for. Do not put real secrets — those are mine to fill in.

4. Help me connect to my Neon Postgres database. I will paste the connection string when ready.

5. Run `npm run dev` and tell me what URLs to visit and what to expect.

6. Help me create the first admin user.

7. Help me run `npm run generate:types` and verify `src/payload-types.ts` exists.

8. Show me the exact `git add`, `git commit`, and `git push` commands for the initial commit. Use Conventional Commits: `chore: initial Payload + Next.js scaffold`.

Rules:
- Use npm only, never pnpm or yarn.
- Stop after each numbered step and ask "Done? Proceed?" — do not bundle steps.
- If any command might fail, give me the troubleshooting steps inline.
```

---

# PHASE 2 — Tailwind, shadcn/ui, conventions

## P-2.1 — Set up styling and tooling

```
Goal: Add Tailwind (if not present), shadcn/ui, ESLint/Prettier strict configs, Husky + lint-staged, and the folder structure from /docs/PROJECT-CONTEXT.md.

Tasks (one at a time, wait for confirmation between each):

1. Check if Tailwind is already configured. If yes, confirm `tailwind.config.ts` and `globals.css` look correct for Next.js 15. If no, set it up.

2. Run `npx shadcn@latest init` walkthrough. Use:
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes
   - Use `@/components/ui` for components.

3. Install initial shadcn components:
   button, input, label, form, select, dialog, drawer, sheet, toast (sonner), skeleton, badge, separator, dropdown-menu, navigation-menu, accordion, tabs, avatar, card, alert, checkbox, radio-group, textarea, switch.

4. Configure ESLint with:
   - next/core-web-vitals
   - @typescript-eslint with strict
   - eslint-plugin-jsx-a11y
   - eslint-config-prettier
   Add `npm run lint` script.

5. Configure Prettier with `prettier-plugin-tailwindcss`. Add `npm run format` script.

6. Set up Husky + lint-staged so pre-commit runs lint + format on staged files. Show me how to test this works.

7. Create the folder structure under `src/` exactly as listed in /docs/PROJECT-CONTEXT.md — empty folders are fine, add `.gitkeep` where needed.

8. Configure `tsconfig.json` with strict: true, paths for `@/*`, and Next.js Payload settings.

9. Add a `<Button>` test on a temporary route to verify shadcn works, then remove.

10. Commit: `chore: tooling, styling, folder structure`.

Rules: npm only, one task per turn, paste full file contents when modifying configs.
```

---

# PHASE 3 — Collections (one prompt per collection)

> Before any prompt below, paste the relevant section of `/docs/SCHEMAS.md` if the AI hasn't loaded it.

## P-3.1 — Media collection

```
Task: Create the Media collection in `src/collections/Media.ts` exactly per /docs/SCHEMAS.md "Collection: Media".

Requirements:
- Use `@payloadcms/storage-s3` adapter pointed at Cloudflare R2 (env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).
- Generate image sizes: thumbnail (400x400), card (768x768), hero (1920x1080), og (1200x630). Use WebP format.
- `alt` field localized (EN/ES).
- Access: read public, write admin/staff only.

After creating:
1. Register in `payload.config.ts` collections array.
2. Show me the migration command and run it.
3. Tell me how to test by uploading an image in /admin.
4. Run `npm run generate:types` and verify `Media` type exists.
5. Commit: `feat(media): add Media collection with R2 storage`.

Do not touch any other collection. Do not modify globals.
```

## P-3.2 — Users collection

```
Task: Extend the default Users collection per /docs/SCHEMAS.md "Collection: Users".

Add fields:
- firstName, lastName, phone (with E.164 validation), role (select with customer/admin/staff, default customer), emailVerified (auto-true after verification flow), acceptsMarketing (default false), preferredLocale (en/es, default en), dateOfBirth (date), stripeCustomerId (text, admin-only readable), defaultShippingAddress + defaultBillingAddress (relationships — note: forward reference Addresses, may need lazy/null handling), lastLoginAt (date, admin-only), metadata (json).

Enable:
- Payload built-in email verification
- Password reset
- Auth tokens via httpOnly cookies

Access control:
- create: public (registration)
- read: own record OR admin/staff
- update: own record (whitelist of safe fields: firstName, lastName, phone, acceptsMarketing, preferredLocale) OR admin (all fields)
- delete: admin only

Hooks:
- beforeChange (create+update): lowercase email
- afterChange (create): TODO comment to add Stripe customer creation + welcome email — we'll fill in later phases

Do not implement the relationships to Addresses yet — leave the fields as `relationship` to 'addresses' and mark TODO.

After:
1. Migrate
2. Generate types
3. Confirm /admin shows new fields
4. Commit: `feat(users): extend Users collection per SCHEMAS.md`
```

## P-3.3 — Addresses collection

```
Task: Create `src/collections/Addresses.ts` per /docs/SCHEMAS.md "Collection: Addresses".

Key requirements:
- 2-letter US state code validation (use Zod or Payload validation)
- US ZIP validation (5 or 9 digits)
- Phone required, E.164 format
- Access: owner only OR admin
- beforeChange hook: if isDefaultShipping=true, unset on all other addresses for same user (same for billing)
- Default country to "US"

Steps:
1. Create collection file
2. Register in payload.config.ts
3. Migrate
4. Generate types
5. Test by creating 2 addresses for one user via admin, verify only one can be default
6. Commit: `feat(addresses): add Addresses collection with default-enforcement hook`
```

## P-3.4 — Categories collection

```
Task: Create `src/collections/Categories.ts` per /docs/SCHEMAS.md.

Specifics:
- Self-referencing `parent` field
- Localized name, description, seoTitle, seoDescription
- Slug auto-generated from English name via beforeChange hook (use `slugify` package — install it)
- Slug unique
- isVisible default true
- sortOrder for manual ordering in admin

Steps: file → register → migrate → types → test → commit `feat(categories): add Categories collection`.
```

## P-3.5 — Products collection

```
Task: Create `src/collections/Products.ts` per /docs/SCHEMAS.md "Collection: Products".

This is the largest collection. Follow SCHEMAS.md exactly. Pay attention to:

- All localized fields marked [L] need `localized: true`
- Variants as nested array with own SKU/price/stock/options
- `hasVariants` toggle — when true, top-level price/stock are ignored; when false, variants array hidden
- Money fields as integer (cents)
- Validation hook: if hasVariants=true, variants array must have ≥1 item; each variant must have unique SKU within the product
- afterChange hook (stub for now): TODO Meilisearch sync, TODO cache invalidation
- averageRating + reviewCount read-only, will be hook-computed in Phase 15
- Access: read public (status=active only) OR admin/staff (all); write admin/staff

Steps:
1. Install `slugify` if not yet (`npm i slugify`)
2. Create file
3. Register
4. Migrate
5. Generate types
6. Add 2 sample products in admin: one simple (no variants), one with 2 variants. Verify validation.
7. Commit: `feat(products): add Products collection with variants and peptide fields`

Reference but do not modify: any other collection.
```

## P-3.6 — Carts collection

```
Task: Create Carts per /docs/SCHEMAS.md. Single cart per user (unique constraint on user field via index).

Items array structure exactly per SCHEMAS.md (product ref, variantSku, quantity, addedAt, priceSnapshot).

Access: owner only.

After: register, migrate, types, commit `feat(carts): add Carts collection`.
```

## P-3.7 — Wishlists collection

```
Same template as Carts. Per /docs/SCHEMAS.md "Collection: Wishlists". Commit: `feat(wishlists): add Wishlists collection`.
```

## P-3.8 — Coupons collection

```
Task: Create Coupons per /docs/SCHEMAS.md.

Specifics:
- code uppercased on save via beforeChange
- code unique
- type select with 3 options
- value: number — meaning depends on type (UI hint via admin description)
- usageCount read-only, will be incremented on order
- Access: read public (for validation lookups), write admin

Validation hook (beforeChange): if appliesTo=specific_products, products array must not be empty; same for categories. If percentage type, value must be 0–100.

Migrate, types, sample 3 coupons (one percentage, one fixed, one free shipping), commit.
```

## P-3.9 — Orders collection

```
Task: Create Orders per /docs/SCHEMAS.md "Collection: Orders". This is critical and complex — go slowly.

Key behaviors:
- orderNumber auto-generated as `PEP-YYYY-NNNNN` using a counter (store counter in a global or use a sequence). Format: zero-padded 5 digits, reset yearly. Generate in beforeChange create hook.
- items as snapshot: copy productSnapshot as JSON from current product data at order creation
- shippingAddress / billingAddress as group fields (snapshot, not relation to Addresses)
- status, paymentStatus, fulfillmentStatus selects with the exact values from SCHEMAS.md
- refunds as array
- Access: read owner OR admin; create server-only (no client create); update admin only; delete forbidden
- beforeChange (update): enforce valid status transitions (e.g., refunded cannot go back to paid). Create a helper `validateStatusTransition(oldStatus, newStatus)` in `src/lib/orders/state.ts`.
- afterChange (update): TODO send status email (Phase 14)

Steps:
1. Create `src/lib/orders/state.ts` with the state machine
2. Create Orders collection
3. Register, migrate, types
4. Manually create one test order via admin to verify orderNumber generation
5. Try an invalid status change — should fail
6. Commit: `feat(orders): add Orders collection with state machine`
```

## P-3.10 — Reviews collection

```
Per /docs/SCHEMAS.md. Important:
- verifiedPurchase auto-true if order field linked
- Status default `pending`
- Access: read public if status=approved else admin only; create authenticated user with delivered order (validate in beforeValidate hook); update own only if status=pending else admin

Migrate, types, commit `feat(reviews): add Reviews collection with verification`.
```

## P-3.11 — ShippingZones collection

```
Per /docs/SCHEMAS.md. Seed two zones via admin: "US Lower 48" and "Alaska/Hawaii" with sample methods. Commit `feat(shipping): add ShippingZones collection`.
```

## P-3.12 — BlogPosts, Pages, ContactMessages, EmailLogs

```
Create these four collections per /docs/SCHEMAS.md, one at a time. After each: register, migrate, types, then move to next. Single commit at end: `feat(content): add BlogPosts, Pages, ContactMessages, EmailLogs collections`.
```

## P-3.13 — Globals

```
Create globals: SiteSettings, Header, Footer, Homepage per /docs/SCHEMAS.md. Block-based richtext where applicable. Commit: `feat(globals): add site config globals`.
```

## P-3.14 — Verification pass

```
Task: Audit all collections registered in `payload.config.ts`. For each:
1. Confirm import is present
2. Confirm registered in collections array
3. Confirm migration ran (`npm run payload migrate:status`)
4. Confirm type exists in payload-types.ts
5. Confirm /admin shows it in sidebar

Output: a markdown table I can paste back if anything is missing. Do not fix anything yet — just report.
```

---

# PHASE 4 — Authentication

## P-4.1 — Configure Resend as email adapter

```
Task: Replace Payload's default email transport with Resend.

Steps:
1. Install: `npm install resend @react-email/components react-email`
2. Create `src/lib/email/resend.ts` exporting a configured Resend client
3. In `payload.config.ts`, set `email` to a Nodemailer-compatible adapter using Resend API
4. Add env vars: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO
5. Test: trigger Payload's password reset email and confirm receipt

Commit: `feat(email): configure Resend as Payload email adapter`
```

## P-4.2 — Registration page

```
Task: Build customer registration at `src/app/(frontend)/[locale]/register/page.tsx`.

Requirements:
- Server component shell, client form component
- Fields: firstName, lastName, email, password, confirmPassword, acceptsMarketing checkbox
- Validation: React Hook Form + Zod schema in `src/lib/validations/auth.ts`
  - Email: valid format
  - Password: min 8, at least 1 number, 1 letter
  - Confirm: matches password
- Submit via server action `registerUser` in `src/app/(frontend)/[locale]/register/actions.ts`
- Server action:
  - Validate again (never trust client)
  - Call Payload `payload.create({ collection: 'users', data: ... })`
  - Set preferredLocale from URL locale param
  - On duplicate email: return user-facing error in correct locale
  - On success: send welcome email, redirect to /[locale]/account
- Error and success states visible
- Use shadcn Form, Input, Button, Checkbox
- All strings translated via next-intl (add keys to /messages/en.json and /messages/es.json)
- Marketing checkbox unchecked by default (legal requirement)

Acceptance:
- Real registration creates user + sends email
- Bad inputs show inline errors
- Submitting twice doesn't double-create (idempotency via button disabled state)

Commit: `feat(auth): customer registration page and server action`
```

## P-4.3 — Login page

```
Task: Build login at `src/app/(frontend)/[locale]/login/page.tsx`.

Requirements:
- Email + password + "Remember me" checkbox + "Forgot password?" link
- Server action `loginUser` using Payload's `payload.login({ collection: 'users', data })`
- Set httpOnly + secure + sameSite=lax session cookie
- "Remember me" extends expiry to 30 days, else session cookie
- Error: always "Invalid email or password" (no enumeration)
- On success:
  - TODO Phase 7: call cart merge function (leave as TODO comment for now)
  - Redirect to ?redirect= param or /[locale]/account
- Block login if emailVerified=false: show "Please verify your email" with resend button

Commit: `feat(auth): login page with session cookie`
```

## P-4.4 — Logout

```
Task: Add logout server action at `src/app/(frontend)/[locale]/(auth)/logout/actions.ts`.

- Clears Payload session cookie
- Clears client-side cart store (we'll wire in Phase 7 — leave TODO)
- Redirects to /[locale]/
- Shows toast on next page load: "Signed out"

Add logout button to header user menu (only visible when logged in).

Commit: `feat(auth): logout flow`
```

## P-4.5 — Password reset flow

```
Task: Build forgot-password and reset-password pages.

`/[locale]/forgot-password`:
- Email input only
- Server action calls Payload's `forgotPassword` method
- Always shows "If an account exists, we sent you an email" (no enumeration)
- Rate limit: 3 attempts per hour per email (use Upstash if available, else TODO)

`/[locale]/reset-password?token=...`:
- New password + confirm
- Calls Payload's `resetPassword`
- On success: log in user, redirect to /account, toast "Password updated"
- On invalid/expired token: show error with "Request new link" CTA

Commit: `feat(auth): password reset flow`
```

## P-4.6 — Route protection middleware

```
Task: Create `src/middleware.ts` (or extend if exists for i18n).

Logic:
- Define protected route prefixes: `/[locale]/account`, `/[locale]/checkout`
- Define admin-only prefixes: `/admin` (Payload handles, but verify)
- For protected routes: check Payload session cookie. If absent or invalid, redirect to `/[locale]/login?redirect=<original>`
- Public routes: no check

Use Payload's `payload.auth` helper or decode the JWT carefully on the edge.

Test: visit /account when logged out → redirected to /login with correct redirect param. Log in → redirected back to /account.

Commit: `feat(auth): route protection middleware`
```

## P-4.7 — Email templates: Welcome, Verify, Reset

```
Task: Create three React Email templates in `src/emails/`:

1. `WelcomeEmail.tsx` — props: firstName, locale
2. `VerifyEmail.tsx` — props: firstName, verifyUrl, locale
3. `PasswordResetEmail.tsx` — props: firstName, resetUrl, locale

Each must:
- Be a React Email component
- Use Tailwind via @react-email/tailwind
- Render correctly in both EN and ES (use a small translations map per file or import from messages)
- Have plain-text fallback
- Footer with business address from SiteSettings (CAN-SPAM)
- Unsubscribe link in marketing-categorized emails only (welcome is transactional, no need)

Update Payload's email hooks to use these templates via the Resend client.

Test: trigger each flow, confirm receipt and rendering in Gmail + Outlook + Apple Mail.

Commit: `feat(email): welcome, verify, password-reset templates (EN/ES)`
```

---

# PHASE 5 — Bilingual (EN/ES)

## P-5.1 — Install and configure next-intl

````
Task: Set up next-intl for UI i18n.

Steps:
1. `npm install next-intl`
2. Create `src/i18n/routing.ts`:
   ```ts
   import { defineRouting } from 'next-intl/routing';
   import { createNavigation } from 'next-intl/navigation';
   export const routing = defineRouting({
     locales: ['en', 'es'],
     defaultLocale: 'en',
     localePrefix: 'always'
   });
   export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
````

3. Create `src/i18n/request.ts` to load messages per locale.
4. Update `next.config.ts` with `createNextIntlPlugin`.
5. Restructure `src/app/(frontend)/` to use `[locale]` segment.
6. Create initial `messages/en.json` and `messages/es.json` with namespaces:
   - common (buttons, labels)
   - nav (header/footer links)
   - auth (login, register, etc.)
   - errors (generic + specific)
7. Update root layout to wrap with `NextIntlClientProvider`.

After: visit /en/ and /es/, confirm switch works. Commit `feat(i18n): set up next-intl with EN and ES`.

```

## P-5.2 — Payload localization

```

Task: Enable Payload's built-in localization.

Steps:

1. In `payload.config.ts`, add:
   ```ts
   localization: {
     locales: ['en', 'es'],
     defaultLocale: 'en',
     fallback: true
   }
   ```
2. Migrate the database (Payload handles localized field column changes).
3. Audit every collection: every field marked [L] in /docs/SCHEMAS.md must have `localized: true`. Show me the diff before applying.
4. Generate types.
5. Test: edit one product, see EN/ES tabs in admin, save Spanish version, confirm both load correctly via API.

Commit: `feat(i18n): enable Payload localization for all [L] fields`.

```

## P-5.3 — Language switcher

```

Task: Create `src/components/shared/LanguageSwitcher.tsx`.

- Dropdown (shadcn DropdownMenu) showing English / Español
- Preserves current pathname when switching
- Sets cookie `NEXT_LOCALE` for persistence
- If user logged in: also update `preferredLocale` on their user record (server action)
- Aria-label translated
- Visible in header desktop and mobile menu

Commit: `feat(i18n): language switcher with persistence`.

```

## P-5.4 — Hreflang and metadata

```

Task: Add hreflang tags to all localized pages.

In root layout, generateMetadata:

- Include `alternates.languages` with en and es URLs for current path
- Canonical = current locale URL
- og:locale = current locale
- og:locale:alternate = other locales

Test with Google Rich Results / view source.

Commit: `feat(seo): hreflang and localized metadata`.

```

---

# PHASE 6 — Product catalog

## P-6.1 — Seed sample products

```

Task: Create `scripts/seed.ts` that uses Payload's local API to create:

- 5 categories: Skincare, Supplements, Research Use Only (if applicable), Beauty, Wellness
- 8 products with realistic peptide data, in both EN and ES
- 2 products with variants

Make it idempotent: skip if slug exists.

Add npm script: `"seed": "tsx scripts/seed.ts"`.

Commit: `chore: seed script with sample products and categories`.

```

## P-6.2 — ProductCard component

```

Task: Create `src/components/shop/ProductCard.tsx` (server component).

Props: `{ product: Product }`

Render:

- Square image (use Next/Image with proper sizes prop)
- Name, short description (truncated)
- Price (and compareAtPrice strikethrough if present)
- Rating stars + review count
- "Add to wishlist" heart icon (client child component)
- Out of stock badge if stock=0
- Hover: subtle scale + shadow
- Link to /[locale]/products/[slug]
- JSON-LD ItemListItem snippet for SEO

Create `<ProductCardSkeleton>` for loading states.

Storybook-style: also create `src/app/(dev)/components/product-card/page.tsx` (only in dev) to preview variations.

Commit: `feat(shop): ProductCard and skeleton`.

```

## P-6.3 — Product Listing Page (PLP)

```

Task: Build `/[locale]/products/page.tsx`.

Server component:

- Read search params: category, minPrice, maxPrice, sort, page (or cursor for infinite scroll)
- Query Payload products: filter by status=active, apply filters
- Render grid of ProductCard
- Pass to client component for filters sidebar

Client filter sidebar (`<ProductFilters>`):

- Category checkboxes (from /api/categories or pre-fetched)
- Price range slider
- In-stock toggle
- Sale toggle
- On change: update URL search params (use useRouter from next-intl)
- Mobile: open in shadcn Sheet

Sort dropdown:

- Featured (default), Newest, Price: Low to High, Price: High to Low, Top Rated

Infinite scroll: use intersection observer + server-side cursor pagination.

Empty state with CTA to clear filters.

JSON-LD CollectionPage.

Commit: `feat(shop): PLP with filters, sort, infinite scroll`.

```

## P-6.4 — Product Detail Page (PDP)

```

Task: Build `/[locale]/products/[slug]/page.tsx`.

Server component:

- Fetch product by slug + locale
- 404 if not found or status != active
- generateMetadata: title, description, OG image, JSON-LD Product schema with offers, aggregateRating

Layout:

- Left: image gallery (client component with thumbnails, swipe on mobile, zoom on desktop). Use embla-carousel or build with shadcn.
- Right:
  - Breadcrumbs (Categories trail)
  - Product name
  - Rating + review count (anchor link to reviews section)
  - Price (with compareAtPrice strikethrough if applicable)
  - Short description
  - Variant selector (if hasVariants) — radio group per option (e.g., Size: 10mg / 20mg)
  - Stock indicator with logic: 0 = "Out of stock", 1-5 = "Only N left", >5 = "In stock"
  - Quantity selector (1 to min(stock, 10))
  - "Add to cart" button (calls cart store from Phase 7 — for now, TODO with toast "Cart coming in Phase 7")
  - "Add to wishlist" button (heart, TODO Phase 8)
  - Shipping restrictions banner if applicable
  - FDA disclaimer if applicable
  - Research Use Only banner if applicable

Tabs below:

- Description (richtext)
- Ingredients
- COA (button to download if present, else "Not available")
- Shipping & Returns
- Reviews (placeholder, real in Phase 15)

Related products carousel (server-fetched, same category, exclude current).

Recently viewed (client component, localStorage).

Mobile: sticky bottom bar with price + add to cart.

Commit: `feat(shop): PDP with gallery, variants, tabs, JSON-LD`.

```

## P-6.5 — Category pages

```

Task: Build `/[locale]/categories/[slug]/page.tsx`.

- Server component
- Fetch category by slug
- Render category name, description, image
- Embedded PLP filtered by this category
- Subcategory chips at top if children exist
- generateMetadata with category SEO fields
- JSON-LD BreadcrumbList

Commit: `feat(shop): category landing pages`.

```

## P-6.6 — Recently viewed hook

```

Task: Create `src/hooks/useRecentlyViewed.ts`.

- Stores last 10 product IDs in localStorage with timestamps
- Returns a function to add and a function to read
- Reads return products (full data, fetched via /api/products?ids=...) via React Query (`npm install @tanstack/react-query` if not installed)
- Skip current product on PDP
- TTL: 30 days, prune older

Create `<RecentlyViewed>` client component using this hook.

Commit: `feat(shop): recently viewed products`.

```

---

# PHASE 7 — Cart

## P-7.1 — Cart store (Zustand)

```

Task: Build cart state management.

Install: `npm install zustand`.

Create `src/lib/cart/store.ts`:

- Zustand store with persist middleware (localStorage)
- State: items array, couponCode, isOpen (drawer state)
- Actions: addItem(product, variantSku, qty), removeItem(lineId), updateQuantity(lineId, qty), clear(), setCoupon(code), toggleDrawer()
- Derived: subtotal, itemCount

Each cart line:

- lineId (uuid generated on add)
- productId
- variantSku (or null)
- quantity
- priceSnapshot
- minimal product info for display (name, image url) — cached, refreshed on view

Commit: `feat(cart): Zustand cart store with persistence`.

```

## P-7.2 — Add to cart wiring

```

Task: Wire up the "Add to Cart" button on PDP and ProductCard.

- On click:
  - Validate variant selected if hasVariants
  - Call server action `validateAndPrice` that re-fetches current price + stock (don't trust client cache for money)
  - If valid: add to cart store + open drawer + show toast
  - If insufficient stock: toast error
  - If unavailable: toast error
- Optimistic UI: show button loading state during server call

Commit: `feat(cart): add-to-cart server validation and toast`.

```

## P-7.3 — Cart drawer

```

Task: Create `src/components/cart/CartDrawer.tsx`.

- Uses shadcn Sheet (right-side)
- Lists items: thumb, name, variant, qty stepper, line price, remove X
- Empty state with CTA
- Subtotal at bottom
- "View Cart" + "Checkout" buttons
- Opens on add-to-cart event (subscribe to store)
- Close on outside click

Commit: `feat(cart): cart drawer with quick edit`.

```

## P-7.4 — Cart page

```

Task: Build `/[locale]/cart/page.tsx`.

- Lists cart lines with full details
- Quantity steppers respect server stock check
- Remove with "Undo" toast for 5s
- Apply coupon input (validation server action; real apply in Phase 11)
- Order summary box (sticky on desktop): subtotal, shipping estimate (TBD), tax estimate (TBD), discount (if coupon), total
- "Proceed to checkout" button → /checkout
- Empty cart state

If any line is out of stock: show warning banner + disable checkout button.

Commit: `feat(cart): cart page with stock validation`.

```

## P-7.5 — Server-side cart sync (logged-in users)

```

Task: Sync client cart to Carts collection for logged-in users.

- On login: server action `mergeCarts(guestCart, userId)` — combines guest cart from client with existing server cart, dedupes by SKU + product, sums quantities, returns merged cart to replace client state
- On cart change for logged-in user: debounced server action `saveCart` that upserts to Carts collection
- On cart load (logged-in): fetch from server, merge with local (server wins on conflict)

Edge cases:

- User has server cart, logs in from new device: server wins
- User has guest cart, logs in: merge
- User logs out: clear server-cached state but keep localStorage (next login will merge again)

Commit: `feat(cart): server-side cart sync for logged-in users`.

```

---

# PHASE 8 — Wishlist

## P-8.1 — Wishlist store

```

Task: Mirror P-7.1 but for wishlist.

`src/lib/wishlist/store.ts` — Zustand + localStorage. Actions: add, remove, toggle, clear, has(productId, variantSku).

Commit: `feat(wishlist): Zustand store`.

```

## P-8.2 — Wishlist button + server sync

```

Task: Heart button component + server sync (per P-7.5 pattern).

- Heart icon button: filled if in wishlist, outline if not
- Click: toggle in store, debounced server sync if logged in
- Login: merge guest + server wishlists

Commit: `feat(wishlist): heart button with server sync`.

```

## P-8.3 — Wishlist page

```

Task: Build `/[locale]/wishlist/page.tsx` (and `/[locale]/account/wishlist` for logged-in users — same component).

- Grid of saved items (reuse ProductCard with extra "Remove from wishlist" + "Add to cart" actions)
- "Move all to cart" button (skip out-of-stock items, toast count of skipped)
- "Share wishlist" — copy a short link (later: implement actual share URLs)
- Empty state

Commit: `feat(wishlist): wishlist page with bulk actions`.

```

---

# PHASE 9 — Checkout & payment

## P-9.1 — Stripe setup

```

Task: Install and configure Stripe.

1. `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
2. Create `src/lib/stripe/server.ts` — instantiated server-side Stripe client with API version pinned
3. Create `src/lib/stripe/client.ts` — `loadStripe(publishableKey)` lazy loader
4. Env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
5. Enable Stripe Tax in Stripe dashboard (manual step — give me instructions)

Commit: `chore(stripe): install and configure SDK`.

```

## P-9.2 — Checkout page UI

```

Task: Build `/[locale]/checkout/page.tsx` — single-page checkout.

Layout:

- Left column (2/3): form sections
- Right column (1/3, sticky on desktop, collapsible on mobile): order summary

Sections (single page, accordion or all-visible):

1. Contact: email (autofilled if logged in), marketing opt-in checkbox (guest only)
2. Shipping Address: form (with optional "Use saved address" select if logged in)
3. Shipping Method: radio cards (placeholder: empty until P-12 — show "Calculating...")
4. Payment: Stripe Payment Element (mounted once we have a PaymentIntent)
5. Order Review: line items list, summary breakdown
6. Disclaimer Acknowledgment: checkbox (only if any cart item has researchUseOnly)
7. "Place Order" button

Use React Hook Form for the shipping address. Zod schema.

Show errors per field. Disable Place Order until valid + payment element complete.

Commit: `feat(checkout): single-page checkout layout`.

```

## P-9.3 — PaymentIntent server action

```

Task: Server action `createPaymentIntent` in `src/app/(frontend)/[locale]/checkout/actions.ts`.

Logic:

1. Read cart server-side (don't trust client total)
2. Re-validate every line: product exists, status=active, stock available, current price
3. Compute totals server-side: subtotal, discount (validate coupon again), shipping (use rate from method ID), tax (call Stripe Tax)
4. Create or update Stripe Customer if user logged in
5. Create Stripe PaymentIntent:
   - amount: final total in cents
   - currency: usd
   - customer: stripe customer ID (if logged in)
   - automatic_payment_methods: { enabled: true }
   - metadata: { cartId, userId, locale, itemCount }
   - idempotency_key: hash of cart contents + user + timestamp window
6. Return: clientSecret, publishableKey, computed totals (to show user)

Client uses clientSecret to mount Payment Element.

Errors:

- Out of stock: refuse, return line details so client can show "Sorry, X is no longer available"
- Coupon invalid: return error, reload summary without coupon
- Tax fail: log to Sentry, fall back to no tax (or refuse — your call, default refuse for safety)

Commit: `feat(checkout): createPaymentIntent server action`.

```

## P-9.4 — Payment confirmation flow

```

Task: Wire up client-side payment confirmation.

In checkout client component:

1. On "Place Order" click: call createPaymentIntent if not already
2. Mount Stripe Payment Element with returned clientSecret
3. On Place Order: call `stripe.confirmPayment({ elements, confirmParams: { return_url: 'https://.../order-pending?pi={PAYMENT_INTENT_ID}' } })`
4. Stripe handles 3DS if needed
5. After confirmation, user lands on /order-pending which polls or waits for webhook to create order

Order page `/[locale]/order-pending?pi=...`:

- Server component
- Reads PaymentIntent status from Stripe
- If succeeded but no order yet: poll every 2s for max 30s — webhook should arrive quickly
- Once order found in DB: redirect to /order-confirmation/[orderNumber]
- If still no order after 30s: show "Payment received but processing — we'll email you" + log to Sentry

Commit: `feat(checkout): payment confirmation flow with order pending page`.

```

## P-9.5 — Stripe webhook handler

```

Task: Critical security code. Read every line. Test exhaustively.

Create `src/app/api/webhooks/stripe/route.ts`.

Logic:

1. Read raw body (NOT parsed JSON — Next.js App Router: use `await req.text()`)
2. Get `stripe-signature` header
3. Verify with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
4. If verification fails: return 400 immediately, log to Sentry
5. Check event ID against an idempotency table (create `StripeEvents` collection or store in Redis): if seen, return 200 (already processed)
6. Switch on event.type:
   - `payment_intent.succeeded`:
     - Read metadata for cartId/userId
     - Re-read cart from DB (or use saved order draft if you go that route)
     - Re-validate stock atomically; if fails: refund immediately, alert
     - Create Order with all snapshots
     - Decrement stock atomically (use database transaction)
     - Increment coupon usageCount
     - Clear user's cart
     - Send order confirmation email
     - Fire PostHog purchase event server-side
   - `payment_intent.payment_failed`: log
   - `charge.refunded`: update order with refund details
   - `charge.dispute.created`: send admin alert email
7. Store event ID as processed
8. Return 200

Important:

- All DB writes in a transaction
- Function must complete in < 25s (Stripe retries on timeout)
- Send email after DB commit
- If anything throws, return 500 — Stripe will retry

Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Commit: `feat(webhooks): Stripe webhook handler with idempotency and atomic stock decrement`.

```

## P-9.6 — Order confirmation page

```

Task: Build `/[locale]/order-confirmation/[orderNumber]/page.tsx`.

- Server component
- Fetch order by orderNumber
- Check authorization: only the owner (by userId or guestEmail in session token from checkout) can view
- Render: order number prominent, "we sent a confirmation to X", shipping address, items table, totals, estimated delivery (TBD by shipping method)
- "Continue shopping" + "View order" buttons
- Client child: fire GA4 + PostHog purchase event ONCE (use sessionStorage flag to avoid double-fire on refresh)

Commit: `feat(checkout): order confirmation page with analytics`.

```

## P-9.7 — Local testing checklist

```

Task: Set up local Stripe webhook listener and test:

1. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — copy the signing secret to .env.local
2. Place test order with card 4242 4242 4242 4242, verify:
   - Webhook received
   - Order created
   - Stock decremented
   - Confirmation email received
3. Test card 4000 0000 0000 0002 (declined): verify error displayed, no order created
4. Test card 4000 0027 6000 3184 (3DS required): verify challenge appears and works
5. Test refund via Stripe dashboard → webhook → order updated to refunded
6. Test double-click on "Place Order": verify no double charge (idempotency)

Document any failures and fix.

No commit — this is a verification step.

```

## P-9.8 — Guest checkout finalization

```

Task: Ensure guest checkout works end-to-end.

Specifics:

- Guest email captured at top of checkout, stored on order as guestEmail
- Order accessible via signed token in confirmation URL (so they can refresh and still see it)
- Tracking link in email always works without login
- If guest later registers with same email: link past orders (optional, Phase 13)

Commit: `feat(checkout): guest checkout finalized`.

```

---

# PHASES 10–20 — Detailed prompts

> The remaining phases follow the same pattern. To keep this doc usable, here are the *named prompts* for each phase. Expand each one using the same structure as Phase 9 above when you reach that phase. Ask your AI to "Expand prompt P-10.1 following the format of P-9.5" and it will produce a detailed prompt.

## Phase 10 (Orders)
- P-10.1: Customer order list page
- P-10.2: Customer order detail page
- P-10.3: Admin order list customization (Payload columns, filters, bulk actions)
- P-10.4: Admin order detail (status changes, internal notes, refund action)
- P-10.5: Order state machine enforcement

## Phase 11 (Coupons)
- P-11.1: Coupon validation server function
- P-11.2: Coupon UI on cart and checkout (apply, remove, display)

## Phase 12 (Shipping)
- P-12.1: Shippo integration — rate calculation server function
- P-12.2: Shipping method selector in checkout, label purchase in admin, tracking display, webhook for tracking events

## Phase 13 (Account dashboard)
- P-13.1: All /account subpages — overview, addresses, settings

## Phase 14 (Email)
- P-14.1: Remaining email templates (order confirmation, shipped, delivered, refund, review request, low stock)
- P-14.2: EmailLogs auto-creation on every send
- P-14.3: Resend delivery webhook
- P-14.4: Vercel Cron for review request emails (7 days post-delivery)

## Phase 15 (Reviews)
- P-15.1: Review submission UI + verification (only delivered-order customers)
- P-15.2: Review display on PDP, helpful votes, admin moderation
- P-15.3: averageRating + reviewCount hook

## Phase 16 (Search)
- P-16.1: Meilisearch setup (cloud or self-host), indexer hook on Products
- P-16.2: Search modal + dedicated search page with InstantSearch

## Phase 17 (Content)
- P-17.1: Blog index and post pages
- P-17.2: CMS pages (About, FAQ, all policies)
- P-17.3: Contact form + ContactMessages handling
- P-17.4: Newsletter signup with double opt-in
- P-17.5: Homepage with block-based editing

## Phase 18 (Analytics & monitoring)
- P-18.1: PostHog client + server events
- P-18.2: GA4 via GTM
- P-18.3: Sentry setup
- P-18.4: Admin dashboard widget (revenue, orders, low stock)

## Phase 19 (SEO, performance, security)
- P-19.1: Dynamic sitemap.xml and robots.txt
- P-19.2: Rate limiting with Upstash Redis
- P-19.3: Cloudflare Turnstile on auth and forms
- P-19.4: Age gate component
- P-19.5: Cookie consent banner with category-gated trackers
- P-19.6: CCPA "Do Not Sell" workflow
- P-19.7: Security headers in next.config.ts

## Phase 20 (Launch)
- P-20.1: Production deployment checklist execution

---

# Tips for using these prompts effectively

1. **One prompt per session if possible.** Don't chain 5 prompts; each one is a complete unit of work.
2. **Always start with "Read /docs/..." reminder.** Cheap insurance.
3. **Confirm the AI read the docs** by asking for a 1-line summary before it generates code.
4. **Reject suggestions to deviate.** If the AI proposes Medusa, Yarn, or a different schema — stop, re-paste the relevant doc.
5. **Test after every prompt.** A failing test means the next prompt is built on broken code.
6. **Commit between prompts.** Always.
7. **Show errors back verbatim.** Never paraphrase compile/runtime errors to the AI.

# When something goes wrong

```

The AI broke X. Here's the error: [paste]. Here's the file it changed: [paste]. Without making other changes, explain what likely went wrong and propose 2 fixes with tradeoffs. Do not write code yet.

```

---

# CLERK AUTHENTICATION PROMPTS

## P-CLERK-1 — Install and configure Clerk

```

Task: Replace Phase 4 custom auth with Clerk. Read /docs/CLERK-AUTH.md fully before starting.

Steps (one at a time, confirm between each):

1. Install: `npm install @clerk/nextjs svix`

2. Add env vars to .env.local (I will fill real values):
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   CLERK_WEBHOOK_SECRET=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/en/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/en/register
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/en/account
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/en/account

3. Wrap root layout with ClerkProvider. Add appearance config matching brand colors (use CSS variables from tailwind.config.ts). Show me the exact layout change.

4. Create the Clerk + i18n combined middleware at src/middleware.ts exactly per /docs/CLERK-AUTH.md. Protect: /[locale]/account/_, /[locale]/checkout/_, /[locale]/affiliates/dashboard/\*.

5. Create src/lib/auth/getPayloadUser.ts exactly per /docs/CLERK-AUTH.md.

6. Replace register page with Clerk <SignUp /> component.

7. Replace login page with Clerk <SignIn /> component.

8. Add clerkUserId field to Users collection in src/collections/Users.ts. Index it. Admin read-only.

9. Add <UserButton> from Clerk to header for signed-in users. Add sign-in link for signed-out users. Use Clerk's <SignedIn> and <SignedOut> wrapper components.

Test: Register a new user via Clerk → confirm user appears in Payload admin Users collection.

Commit: `feat(auth): replace custom auth with Clerk, add webhook sync`

```

## P-CLERK-2 — Clerk webhook → Payload sync

```

Task: Create the webhook handler that syncs Clerk users to Payload Users collection.

Create: src/app/api/webhooks/clerk/route.ts

Full implementation per /docs/CLERK-AUTH.md — copy the code exactly, then:

1. Replace the password with: `crypto.randomUUID() + crypto.randomUUID()` (completely random, unusable as login)
2. Add Sentry error capture in the catch block
3. Add EmailLogs entry after user.created for the welcome email trigger

After creating the route:

1. Tell me how to register it in Clerk dashboard (Events, URL, signing secret)
2. Tell me how to test it locally using the Clerk CLI or by triggering a test event from dashboard
3. Show me how to verify a new Clerk signup creates a Payload User

Commit: `feat(auth): Clerk webhook handler with Payload user sync`

```

---

# AFFILIATE SYSTEM PROMPTS

> Read /docs/AFFILIATE-SYSTEM.md fully before running any of these prompts. The system has 5 collections and a fraud engine — each must be built in order.

## P-AFF-1 — Affiliate collections (all 5)

```

Task: Create all 5 affiliate collections per /docs/AFFILIATE-SYSTEM.md. Build in this order — each depends on the previous.

Read AFFILIATE-SYSTEM.md sections: Collection: Affiliates, AffiliateApplications, AffiliateClicks, AffiliateConversions, AffiliatePayouts.

For each collection:

1. Create the file in src/collections/
2. Register in payload.config.ts
3. Run migration
4. Generate types
5. Confirm visible in /admin
6. Move to next — do NOT bundle

Special requirements:

- AffiliateConversions: add unique index on the `order` field — one conversion per order, enforced at DB level
- AffiliateClicks: index on (affiliate + clickedAt) AND (ipHash + clickedAt)
- All money fields: integer cents
- All date fields: proper Date types with index where specified

After all 5 created:

- Run `npm run generate:types`
- Confirm all 5 types exist in payload-types.ts
- Commit: `feat(affiliates): all 5 affiliate collections with migrations`

```

## P-AFF-2 — AffiliateSettings global + coupon auto-creation hook

```

Task: Two things in this prompt.

1. Create AffiliateSettings global at src/globals/AffiliateSettings.ts with fields:
   - defaultCommissionRate: number (default 10)
   - defaultCustomerDiscount: number (default 10)
   - defaultPendingDays: number (default 30)
   - defaultCookieDuration: number (days, default 30)
   - minimumPayoutDefault: number (cents, default 5000)
   - payoutScheduleDescription: text (e.g., "Processed every Monday")
   - affiliateTerms: richText [L] (the affiliate program T&C)
2. Add beforeChange hook on Affiliates collection:
   - Auto-generate referralSlug from displayName: slugify(displayName), ensure unique (append -2, -3 if collision)
   - Auto-generate couponCode: uppercase(displayName_first_part) + commissionRate (e.g., "JOHN15")
   - Validate slug is URL-safe (alphanumeric + hyphens only)

3. Add afterChange hook on Affiliates collection for status → 'approved':
   - Create a Coupon record: code = affiliate.couponCode, type = percentage, value = affiliate.customerDiscount, appliesTo = all, perCustomerLimit = 1, usageLimit = null, isActive = true, description = "Affiliate coupon for " + affiliate.displayName
   - Store the created coupon ID back in affiliate.coupon field
   - Send approval email (TODO — wire in P-AFF-8)

Commit: `feat(affiliates): settings global, auto-slug, auto-coupon on approval`

```

## P-AFF-3 — Fraud engine

```

Task: Build the affiliate fraud detection engine at src/lib/affiliates/fraud.ts

Implement ALL 9 rules from /docs/AFFILIATE-SYSTEM.md "Fraud detection rules engine":

Export the main function:

```ts
export async function runFraudChecks(
  order: Order,
  affiliate: Affiliate,
  click: AffiliateClick | null,
  customerEmail: string,
  orderIpHash: string,
): Promise<{
  void: boolean // true = do not create commission
  flag: boolean // true = needs admin review
  selfReferral: boolean
  ipMatch: boolean
  score: number // 0-100 risk score
  notes: string // comma-separated reasons
}>
```

Score weights:

- Self-referral: +100 (void immediately)
- Instant conversion (< 30s): +40
- IP match with affiliate: +30
- High velocity clicks (> 10/hour same IP): +20
- Commission > $500: always flag (doesn't add to score, separate flag)
- Guest checkout with affiliate email match: +100 (void)

Score → action:

- > = 100: void = true (no commission)
- 61-99: flag = true (hold for manual review)
- 31-60: flag = true (auto-approve still allowed, but admin sees flag)
- 0-30: clean

Create a helper for IP hashing: `hashIp(ip: string): string` using Node's built-in crypto SHA-256.

Add unit tests in src/lib/affiliates/fraud.test.ts covering:

- Self-referral email match → void
- Instant conversion → flagged
- Low risk scenario → passes clean

Commit: `feat(affiliates): fraud detection engine with 9 rules and unit tests`

```

## P-AFF-4 — Commission engine + order attribution

```

Task: Build the commission computation and order attribution system.

Create src/lib/affiliates/commission.ts with:

1. `computeCommission(order, affiliate)` → cents — per /docs/AFFILIATE-SYSTEM.md
2. `attributeOrder(order, cookieAffiliateId, couponCode)` → void — per /docs/AFFILIATE-SYSTEM.md

Create src/lib/affiliates/stats.ts: 3. `updateAffiliateStats(affiliateId)` — recomputes ALL cached stats fields on the Affiliate record from scratch (counts, totals, conversion rate). Call this after any conversion status change.

Wire attribution into the Stripe webhook handler (src/app/api/webhooks/stripe/route.ts):

- After order is created (in payment_intent.succeeded handler):
  - Read affiliate_ref cookie from stored checkout session (you'll need to pass it through the PaymentIntent metadata: add affiliateId and affiliateCouponCode to metadata when creating PaymentIntent)
  - Call attributeOrder()
  - Clear the affiliate cookies from response (set maxAge=0)

Wire reversal into the Stripe webhook handler:

- In charge.refunded handler: find AffiliateConversion by orderId, reverse it
- Add similar logic for order cancellation in the Orders afterChange hook

Commit: `feat(affiliates): commission engine and order attribution wired into checkout`

```

## P-AFF-5 — Referral link redirect route

```

Task: Create the referral link redirect at src/app/ref/[slug]/route.ts

Behavior:

1. Look up Affiliate by referralSlug. If not found or status != 'approved': redirect to / with no cookie
2. Log AffiliateClick: ipHash (SHA-256 of X-Forwarded-For or CF-Connecting-IP), userAgent, referrer, landingPage='/', clickedAt=now, source='referral_link', deviceType (parse UA — use `ua-parser-js` npm package)
3. Run velocity check: if clicks from same ipHash in last 1 hour > 10 → mark isSuspicious=true on the click
4. Set cookies on redirect response:
   - affiliate_ref: affiliateId, httpOnly, secure, sameSite=lax, maxAge=cookieDurationDays\*86400
   - affiliate_click_id: clickId, same settings
5. Redirect 302 to / (homepage)

Also: in checkout PaymentIntent creation, read both cookies and add to metadata:

- metadata.affiliateId = cookie value
- metadata.affiliateClickId = cookie value
  These are already passed to attributeOrder() in the webhook.

Test: visit /ref/test-slug (create a test approved affiliate first), confirm:

- Redirected to /
- Cookies set (check devtools Application → Cookies)
- AffiliateClick record created in /admin
- Visiting /ref/nonexistent → redirects to / with no cookie

Commit: `feat(affiliates): referral redirect route with click logging and cookie setting`

```

## P-AFF-6 — Auto-approval cron job

```

Task: Build the daily commission auto-approval cron job.

Create src/app/api/cron/affiliate-approve/route.ts:

- Verify request has Authorization: Bearer ${CRON_SECRET} header
- Find all AffiliateConversions where:
  - status === 'pending'
  - pendingUntil <= new Date()
  - flaggedForReview === false
  - fraudScore <= 60
  - (ensure related order is still in a delivered/fulfilled state — not refunded)
- Batch update status → 'approved', set approvedAt = now
- For each affected affiliate: call updateAffiliateStats()
- Return count of approved conversions

Add to vercel.json:

```json
{
  "crons": [
    {
      "path": "/api/cron/affiliate-approve",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Add CRON_SECRET to .env.local.

Test: manually create a conversion with pendingUntil set to yesterday, call the route, confirm it approves.

Commit: `feat(affiliates): daily auto-approval cron job`

```

## P-AFF-7 — Affiliate application page + dashboard

```

Task: Build customer-facing affiliate pages. These are the biggest frontend task in the affiliate system.

Files to create (one sub-task at a time):

1. Public affiliate landing page: src/app/(frontend)/[locale]/affiliates/page.tsx
   - Server component
   - Sections: Hero (why join), How it works (3 steps), Commission structure, FAQ (3 questions), CTA
   - All content editable via AffiliateSettings global
   - "Apply now" button → /affiliates/apply (only if logged in; else → /login?redirect=/affiliates/apply)

2. Application form: src/app/(frontend)/[locale]/affiliates/apply/page.tsx
   - Protected by Clerk (must be logged in)
   - Check: if user already has an AffiliateApplication → show status instead of form
   - Check: if user already has an Affiliate (approved) → redirect to /affiliates/dashboard
   - Form fields (React Hook Form + Zod): displayName, websiteUrl, socialLinks (dynamic array), promotionMethods (textarea), estimatedMonthlyReach (select), niche (textarea), whyJoin (textarea), agreedToTerms (checkbox required)
   - Server action: create AffiliateApplication record, send "we received it" email
   - Success state: "Application submitted! We'll review within 2-5 business days."

3. Dashboard layout: src/app/(frontend)/[locale]/affiliates/dashboard/layout.tsx
   - Protected: must be logged in AND affiliate.status === 'approved'
   - Sidebar nav: Overview, Links, Conversions, Earnings, Payouts, Settings
   - Show affiliate status badge and tier

4. Dashboard overview: /affiliates/dashboard/page.tsx
   - 6 stat cards (from affiliate record): Clicks, Unique Clicks, Conversions, Conversion Rate, Pending Earnings, Approved Earnings
   - Last 5 conversions mini-table
   - Referral link with copy button (prominent)

5. Links page: /affiliates/dashboard/links/page.tsx
   - Referral URL: https://yoursite.com/ref/[slug] — copy button, QR code
   - Coupon code — copy button
   - Custom UTM link builder (form: utm_source, utm_medium, utm_campaign → generates complete URL)

6. Conversions page: /affiliates/dashboard/conversions/page.tsx
   - Table: Date | Order # | Order Value | Commission | Status | Pending Until
   - Client filter: status dropdown
   - Paginated (20/page)

7. Earnings page: /affiliates/dashboard/earnings/page.tsx
   - 3 cards: Pending (locked with lock icon), Approved (ready), Total Paid
   - "Request Payout" button — only active if approved earnings >= minimumPayoutThreshold
   - Clicking opens a sheet to select payout method and confirm
   - Creates a request (not a payment — admin processes manually)
   - Note about payout schedule from AffiliateSettings

8. Payouts page: /affiliates/dashboard/payouts/page.tsx
   - Table: Date | Amount | Method | Transaction ID | Status
9. Settings page: /affiliates/dashboard/settings/page.tsx
   - Add payout method form (renders different fields based on method type)
   - Edit existing payout methods
   - W-9 upload section (if US-based)
   - Notification preferences

Build one sub-task at a time, confirm, then proceed.

Commit: `feat(affiliates): complete affiliate frontend (apply, dashboard all pages)`

```

## P-AFF-8 — Affiliate admin views + payout workflow

```

Task: Build admin capabilities for managing affiliates and processing payouts.

1. Customize Affiliates collection in Payload admin:
   - Add custom list columns: user email, status badge (color-coded), tier, commissionRate, totalCommissionApproved (with "$" formatting), lastConversionAt
   - Add custom filters: status, tier
   - Add a custom Payload admin component "QuickStats" sidebar widget on the affiliate edit view showing: clicks, conversions, total earned, total paid, fraud score indicator

2. Fraud review queue — custom Payload admin view at /admin/affiliates/fraud-queue:
   - List all AffiliateConversions where flaggedForReview=true AND status=pending
   - Per row: affiliate name, order number, commission amount, fraud score, fraud notes, age (days since created)
   - Action buttons: "Approve" (bypasses auto-approval hold), "Void" (with reason)

3. Payout management — custom Payload admin view at /admin/affiliates/payouts/new:
   - Step 1: Select affiliate (searchable dropdown)
   - Step 2: Show all approved, unpaid conversions for that affiliate in a table with checkboxes
   - Step 3: Show total payout amount in USD. Input: current exchange rate (for crypto). Show crypto equivalent.
   - Step 4: Confirm payout method (from affiliate's saved methods, read-only)
   - "Export to CSV" button: downloads CSV with all needed payment info
   - After paying externally: return to this view, enter transaction ID, upload receipt, "Mark as Paid" button
   - On Mark as Paid: creates AffiliatePayout, marks all conversions as paid, emails affiliate

4. Create the CSV export server action:
   - Columns: Affiliate Name, Payout Method, PayPal Email / Wallet Address / Bank Details, Amount USD, Conversion Count, Period
   - File: affiliates_payout_YYYY-MM-DD.csv
   - Download via Response with Content-Disposition header

Commit: `feat(affiliates): admin payout workflow, fraud queue, custom admin views`

```

## P-AFF-9 — Affiliate email templates

```

Task: Create all affiliate-related email templates in src/emails/affiliate/.

Templates needed (each in EN + ES):

1. AffiliateApplicationReceived.tsx — "We received your application"
2. AffiliateApproved.tsx — "You're approved!" with dashboard link, referral link, coupon code
3. AffiliateRejected.tsx — props: rejectedReason
4. AffiliateFirstConversion.tsx — "Your first sale! $X pending"
5. AffiliateCommissionApproved.tsx — "$X commission approved and ready for payout"
6. AffiliatePayoutSent.tsx — props: amount, method, transactionId
7. AffiliateSuspended.tsx — props: reason, contactLink
8. AffiliatePayoutThreshold.tsx — "You're $X away from minimum payout"

Each template:

- Uses @react-email/components
- Matches site brand colors
- Has physical business address in footer (CAN-SPAM)
- Bilingual: accept locale prop, use small translation map per file
- Has plain text fallback

Wire all 8 templates into their respective trigger points (webhook hooks, status change hooks).

Commit: `feat(affiliates): all 8 affiliate email templates wired to triggers`

```

```
