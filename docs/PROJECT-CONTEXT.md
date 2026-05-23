# PROJECT-CONTEXT.md

> Always-loaded context file. Read this at the start of every AI session.

## What we are building

A direct-to-consumer e-commerce store selling peptides in the United States, available in English and Spanish. Customers can browse products, view detailed information including Certificates of Analysis (COAs), add items to cart or wishlist, check out via Stripe, and track their orders. Admins manage everything from a single Payload admin panel.

## Target users

**Primary customer:** US-based adults (21+), health-and-wellness-focused, willing to spend $50–500 per order. Reads ingredients carefully. Wants third-party lab test results visible. Often comparison-shops across multiple peptide vendors.

**Secondary customer:** Same demographic, Spanish-preferring.

**Admin (you):** Single owner-operator initially. Manages products, orders, customers, coupons, content, all from `/admin`.

## Business model

- One-time purchases (primary)
- Subscriptions / autoship (Phase 2 feature)
- Coupon codes for marketing campaigns
- Tiered shipping (free over $X)
- US-only shipping at launch; international later

## Tech stack (locked)

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 15 App Router | SEO, performance, server components |
| Language | TypeScript strict | Catch errors before runtime |
| CMS / Backend | Payload CMS 3 | TypeScript-native, admin UI included, lives inside Next.js |
| Database | PostgreSQL via Neon | Serverless, branching, free tier |
| ORM | Drizzle (used by Payload) | Type-safe, fast |
| Styling | Tailwind CSS | Utility-first, fast to build |
| Components | shadcn/ui | Copy-paste, fully owned, accessible |
| Auth | Payload built-in | One system, customers + admins |
| Payments | Stripe Checkout + Webhooks | Best DX, mature |
| Storage | Cloudflare R2 (S3-compatible) | Zero egress fees |
| Email | Resend | Developer-friendly, React Email templates |
| i18n | next-intl + Payload localization | UI + content both translated |
| Search | Meilisearch (self-hosted later) | Fast, free, typo-tolerant |
| Analytics | PostHog + GA4 + Microsoft Clarity | Product + traffic + UX |
| Errors | Sentry | Production debugging |
| Uptime | UptimeRobot | Free alerts |
| Hosting | Vercel | Native Next.js |
| CDN/Security | Cloudflare | DDoS, WAF, caching |
| Bot Protection | Cloudflare Turnstile | Free, no CAPTCHA friction |
| Cache/Rate Limit | Upstash Redis | Serverless Redis |
| Reviews | Custom (Payload collection) | Owned data |
| Shipping Labels | Shippo | API-first |

## Folder structure (final)

```
peptides-store/
├── docs/                          # This documentation
├── public/                        # Static assets
├── messages/                      # i18n translation files
│   ├── en.json
│   └── es.json
├── src/
│   ├── app/
│   │   ├── (frontend)/            # Customer-facing routes
│   │   │   ├── [locale]/          # /en/*, /es/*
│   │   │   │   ├── (shop)/        # Shop pages
│   │   │   │   │   ├── page.tsx                    # Homepage
│   │   │   │   │   ├── products/
│   │   │   │   │   │   ├── page.tsx                # PLP
│   │   │   │   │   │   └── [slug]/page.tsx         # PDP
│   │   │   │   │   ├── cart/page.tsx
│   │   │   │   │   ├── wishlist/page.tsx
│   │   │   │   │   ├── checkout/page.tsx
│   │   │   │   │   └── account/
│   │   │   │   │       ├── page.tsx                # Dashboard
│   │   │   │   │       ├── orders/
│   │   │   │   │       │   ├── page.tsx            # Order list
│   │   │   │   │       │   └── [id]/page.tsx       # Order detail
│   │   │   │   │       ├── addresses/page.tsx
│   │   │   │   │       └── settings/page.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── blog/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   └── pages/[slug]/page.tsx           # CMS pages (about, etc.)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── (payload)/             # Payload admin (auto-generated)
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts
│   │   │   │   └── shippo/route.ts
│   │   │   └── revalidate/route.ts
│   │   └── not-found.tsx
│   ├── collections/               # Payload collections
│   │   ├── Users.ts
│   │   ├── Products.ts
│   │   ├── Categories.ts
│   │   ├── Orders.ts
│   │   ├── Carts.ts
│   │   ├── Addresses.ts
│   │   ├── Coupons.ts
│   │   ├── Reviews.ts
│   │   ├── Wishlists.ts
│   │   ├── BlogPosts.ts
│   │   ├── Pages.ts
│   │   ├── Media.ts
│   │   ├── ShippingZones.ts
│   │   ├── EmailLogs.ts
│   │   └── ContactMessages.ts
│   ├── globals/                   # Payload globals
│   │   ├── SiteSettings.ts
│   │   ├── Header.ts
│   │   ├── Footer.ts
│   │   └── Homepage.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── shop/                  # Shop-specific components
│   │   ├── account/
│   │   ├── checkout/
│   │   └── shared/
│   ├── lib/
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   ├── shippo.ts
│   │   ├── payload.ts
│   │   ├── utils.ts
│   │   └── validations/           # Zod schemas
│   ├── hooks/                     # Payload hooks (beforeChange etc.)
│   ├── access/                    # Payload access control functions
│   ├── emails/                    # React Email templates
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   ├── middleware.ts              # i18n + auth routing
│   ├── payload.config.ts
│   └── payload-types.ts           # Generated, do not edit
├── .env.local                     # Local secrets (never commit)
├── .env.example                   # Template (committed)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## Coding conventions

### Naming
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`, prefer `type` over `interface` unless extending
- Files: match the primary export

### Imports
- Absolute imports via `@/` prefix (configured in tsconfig)
- Order: external → internal → relative → type imports
- One blank line between groups

### Server vs Client
- Default: server components
- Add `'use client'` only when needed (state, effects, event handlers)
- Push `'use client'` as deep as possible — keep leaf components client, parents server

### Data fetching
- Server components: direct Payload calls via `getPayload({ config })`
- Mutations: server actions (`'use server'`)
- Never use `fetch('/api/...')` from your own server components to your own API

### Error handling
- Throw early, catch at boundaries
- User-facing errors must be translated
- Log errors to Sentry with context
- Never expose stack traces to users

### Forms
- React Hook Form + Zod for validation
- Server action as the submit handler
- Show loading state, success state, error state — all three

## Security baseline

- All admin routes protected by Payload access control
- All payment-touching code on the server only
- Stripe webhook signature verified on every event
- No customer PII in URL params or analytics events
- HttpOnly + Secure cookies for sessions
- CSRF: Payload handles for admin; for custom mutations use server actions (built-in CSRF)
- Rate limit login, register, checkout, password reset, contact form
- SQL injection: not possible via Drizzle/Payload (parameterized)
- XSS: React escapes by default; never use `dangerouslySetInnerHTML` with user input
- Secrets: only in env vars, never in code, never in client bundle (`NEXT_PUBLIC_` is client-visible)

## Performance budgets

- LCP: < 2.5s on 4G mobile
- INP: < 200ms
- CLS: < 0.1
- Total JS per route: < 200KB gzipped
- Images: WebP/AVIF, responsive `sizes`, lazy below the fold
- Database: no N+1 queries (use Payload `depth` param wisely)

## State of the world

- We are in **Phase 0** until the first commit. Always confirm current phase before making changes.
- The build order in `/docs/BUILD-GUIDE.md` is sacred. Do not jump ahead.
- All work happens on feature branches. `main` is always deployable.
