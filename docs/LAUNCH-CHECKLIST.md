# LAUNCH-CHECKLIST.md — Pre-Launch Verification

> Go through every item before flipping DNS to production. Print this and tick boxes by hand if it helps.

---

## 1. Legal & business

- [ ] Business entity (LLC/Corp) formed, EIN issued
- [ ] Business bank account active
- [ ] Resale certificate / seller's permit in home state
- [ ] Merchant account approved (production-ready, not test)
- [ ] Product liability insurance bound (policy number on file)
- [ ] Cyber liability insurance quoted (recommended)
- [ ] All 7 policy pages live and reviewed by attorney:
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Shipping Policy
  - [ ] Return & Refund Policy
  - [ ] Cookie Policy
  - [ ] FDA Disclaimer
  - [ ] Contact page with physical address
- [ ] Sales tax registered in home state, threshold-tracked for nexus elsewhere
- [ ] Stripe Tax (or TaxJar) enabled and configured
- [ ] Trademark search done (USPTO TESS), brand cleared

---

## 2. Domain & DNS

- [ ] Domain owned, WHOIS privacy on
- [ ] Cloudflare nameservers active (or registrar's DNS)
- [ ] A/CNAME records pointing to Vercel
- [ ] `www` redirect to apex (or vice versa)
- [ ] SSL: Cloudflare Full Strict mode
- [ ] HSTS header set with `max-age=31536000; includeSubDomains; preload`
- [ ] Email DNS records:
  - [ ] SPF record includes Resend
  - [ ] DKIM CNAMEs from Resend added
  - [ ] DMARC record set (start with `p=none`, tighten over 30 days)
- [ ] MX records if you receive email at the domain

Verify with:

- mxtoolbox.com SPF/DKIM/DMARC checker
- ssllabs.com → A or A+ grade

---

## 3. Hosting & infrastructure

- [ ] Production Neon project (separate from staging)
- [ ] Vercel project linked to GitHub `main` branch
- [ ] All production env vars set in Vercel
- [ ] Cloudflare R2 production bucket with proper CORS
- [ ] Cloudflare WAF rules:
  - [ ] OWASP rule set enabled
  - [ ] Block known bad bots
  - [ ] Rate limit `/api/webhooks/*` (high threshold)
  - [ ] Rate limit `/login`, `/register`, `/forgot-password` (low threshold)
  - [ ] Country block list if applicable
- [ ] Cloudflare caching rules:
  - [ ] Static assets long-cached
  - [ ] HTML bypass for logged-in users (cookie-based)
  - [ ] `/admin/*` no-cache
  - [ ] `/api/*` no-cache

---

## 4. Database

- [ ] Production database has backups enabled (Neon does PITR automatically)
- [ ] Backup retention ≥ 7 days
- [ ] Test restore performed once — confirm data recoverable
- [ ] Connection pooling enabled (Neon: use pooled connection string)
- [ ] All migrations applied to production
- [ ] No unused/test data in production DB
- [ ] Database access keys rotated from initial setup

---

## 5. Payments

- [ ] Stripe account switched to **live mode**
- [ ] Live API keys in Vercel env vars
- [ ] Production webhook endpoint registered: `https://yourstore.com/api/webhooks/stripe`
- [ ] Production webhook signing secret in env
- [ ] Required webhook events selected:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
  - [ ] `charge.dispute.created`
  - [ ] `charge.dispute.closed`
- [ ] Stripe Radar rules reviewed (fraud)
- [ ] Stripe Tax active for relevant states
- [ ] Apple Pay domain verified in Stripe dashboard
- [ ] Test the full flow with a **real card** for $1, then refund — verify:
  - [ ] Order created
  - [ ] Confirmation email received
  - [ ] Refund processes
  - [ ] Stock restored (if configured)
  - [ ] Refund email received

---

## 6. Email

- [ ] Resend production domain verified (DKIM passing)
- [ ] Test send for each transactional template:
  - [ ] Welcome
  - [ ] Verify email
  - [ ] Password reset
  - [ ] Order confirmation
  - [ ] Order shipped
  - [ ] Order delivered
  - [ ] Refund processed
  - [ ] Review request
- [ ] Both EN and ES versions tested
- [ ] All emails render in: Gmail (web + mobile), Outlook (web + desktop), Apple Mail, Yahoo
- [ ] Every email has unsubscribe link (if marketing) or footer link to manage preferences
- [ ] CAN-SPAM physical address in footer
- [ ] Resend webhook configured for delivery status tracking

---

## 7. Shipping

- [ ] Shippo account on live mode
- [ ] Carrier accounts connected (USPS minimum, UPS/FedEx if used)
- [ ] Shipping zones configured for all US states
- [ ] Shipping restrictions per product set correctly (if applicable)
- [ ] Test rate quote at checkout for 5 different US ZIPs (NY, CA, TX, FL, AK)
- [ ] Free shipping threshold logic correct
- [ ] Label purchase tested (Shippo test mode)
- [ ] Tracking webhook registered
- [ ] Return address set on Shippo

---

## 8. Search

- [ ] Meilisearch production instance up
- [ ] Initial product index built
- [ ] Search returns relevant results for top 20 expected queries
- [ ] Typo tolerance working
- [ ] New product appears in search within 60s of creation

---

## 9. Analytics & monitoring

- [ ] PostHog: events firing in production environment
- [ ] GA4: enhanced ecommerce events visible in DebugView, then in real-time reports
- [ ] Microsoft Clarity: recording sessions
- [ ] Sentry: source maps uploaded, test error reaches dashboard
- [ ] Sentry alerts configured: new error type, error spike, performance regression
- [ ] UptimeRobot monitors:
  - [ ] Homepage (5 min)
  - [ ] `/api/health` if exists (5 min)
  - [ ] `/admin` (15 min)
  - [ ] Status page or notification on failure
- [ ] Admin email/SMS receives uptime alerts

---

## 10. Security

- [ ] All admin users use strong unique passwords
- [ ] Admin 2FA enabled (Payload TOTP plugin)
- [ ] No `admin@admin.com` / `test` / weak accounts in DB
- [ ] Rate limits live and tested:
  - [ ] Login: locks after 10 failures
  - [ ] Register: limits per IP
  - [ ] Contact form: limits per IP
  - [ ] Password reset: limits per email
- [ ] Cloudflare Turnstile live on:
  - [ ] Register
  - [ ] Login (after failures)
  - [ ] Password reset
  - [ ] Contact form
  - [ ] Newsletter
  - [ ] Reviews
- [ ] Security headers (verify via securityheaders.com → A grade):
  - [ ] Content-Security-Policy
  - [ ] Strict-Transport-Security
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] `npm audit` shows no high/critical
- [ ] Dependabot enabled in GitHub
- [ ] No secrets committed (run `git log -p | grep -i 'sk_\|secret\|password'` to sanity check)
- [ ] Stripe webhook signature verification confirmed working
- [ ] Server-side enforcement of all access control (test as customer trying to access another customer's order via URL manipulation)

---

## 11. Compliance

- [ ] Cookie consent banner live, categories functional
- [ ] Analytics gated on consent (verify by inspecting network in incognito before consent)
- [ ] CCPA "Do Not Sell" link in footer
- [ ] CCPA request handling tested end-to-end
- [ ] Age gate live (if applicable)
- [ ] FDA disclaimers on:
  - [ ] Footer (every page)
  - [ ] Product pages (regulated products)
  - [ ] Checkout (Category C)
- [ ] Research Use Only labeling on Category C products
- [ ] Shipping restriction enforcement tested (try to ship restricted product to restricted state — should block)

---

## 12. Performance

- [ ] Lighthouse mobile scores ≥ 90 on:
  - [ ] Homepage
  - [ ] PLP
  - [ ] PDP
  - [ ] Cart
  - [ ] Checkout
- [ ] LCP < 2.5s on slow 4G simulation
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Images using AVIF/WebP via Next/Image
- [ ] No client-side data fetch where server would do (audit "use client" usage)
- [ ] Bundle analyzer shows no surprise large packages

---

## 13. SEO

- [ ] `sitemap.xml` accessible, includes all products + pages + posts
- [ ] `robots.txt` correct (allow all, disallow `/admin`, `/api`, `/account`, `/checkout`)
- [ ] Canonical URLs set on every page
- [ ] Hreflang tags for EN/ES
- [ ] JSON-LD Product schema on PDPs, validated via Rich Results Test
- [ ] JSON-LD BreadcrumbList on PLPs and PDPs
- [ ] JSON-LD Article schema on blog posts
- [ ] OG tags on every page (title, description, image)
- [ ] Twitter card tags
- [ ] Google Search Console verified, sitemap submitted
- [ ] Bing Webmaster Tools verified

---

## 14. Content

- [ ] At least 5 products live with:
  - [ ] Full descriptions (EN + ES)
  - [ ] Minimum 3 images each
  - [ ] COA uploaded (if applicable)
  - [ ] Categories assigned
  - [ ] Stock set correctly
- [ ] Homepage filled in via CMS
- [ ] Footer navigation populated
- [ ] At least 3 blog posts published (helps SEO from day 1)
- [ ] FAQ has at least 10 questions
- [ ] Contact page has support email + business address + hours

---

## 15. UX

- [ ] Tested on real devices, not just devtools:
  - [ ] iPhone (any model from last 3 years)
  - [ ] Android (a cheap one, like a Moto G or Samsung A-series)
  - [ ] iPad / tablet
  - [ ] Desktop Chrome
  - [ ] Desktop Safari
  - [ ] Desktop Firefox
- [ ] All forms keyboard-navigable
- [ ] Color contrast passes WCAG AA
- [ ] Tap targets ≥ 44x44px on mobile
- [ ] No layout shift on image load
- [ ] Error messages clear and actionable
- [ ] Empty states designed (empty cart, empty wishlist, no search results)
- [ ] 404 page custom, with search and popular products

---

## 16. Final smoke test

Place a real end-to-end order. Document each step works:

1. [ ] Visit homepage in incognito
2. [ ] Accept cookie banner
3. [ ] Browse products
4. [ ] Search for a product
5. [ ] Add to wishlist (as guest)
6. [ ] Register an account
7. [ ] Verify email
8. [ ] Wishlist preserved after login
9. [ ] Add to cart
10. [ ] Apply a real coupon
11. [ ] Proceed to checkout
12. [ ] Enter real address
13. [ ] See shipping rates
14. [ ] Enter real payment ($1 minimum order if possible, or accept the cost of a real test)
15. [ ] Complete order
16. [ ] Receive confirmation email
17. [ ] View order in account
18. [ ] Mark as shipped from admin
19. [ ] Receive shipped email
20. [ ] Refund the order from admin
21. [ ] Receive refund email
22. [ ] Verify Stripe shows refund

---

## 17. Operations readiness

- [ ] You know how to:
  - [ ] Issue a refund in Payload + Stripe
  - [ ] Update tracking number on an order
  - [ ] Add a product (with images, COA, variants)
  - [ ] Create a coupon
  - [ ] Reply to a contact form message
  - [ ] Moderate a review
  - [ ] Restock a product
  - [ ] Block a malicious user
  - [ ] Read Sentry alerts
  - [ ] Check PostHog for traffic
- [ ] Customer support email account set up + monitored
- [ ] Order fulfillment workflow documented (pick, pack, ship steps)
- [ ] Carrier accounts have funds for postage
- [ ] Inventory physically in stock for everything marked "in stock" online

---

## 18. Backup & disaster recovery

- [ ] Document where every credential lives (password manager vault structured)
- [ ] Document who to contact if you're incapacitated (key person dependency plan)
- [ ] Backup contact for domain registrar
- [ ] Backup contact for Stripe account
- [ ] Source code in GitHub (already there, just confirm)
- [ ] Database backup automated (Neon)
- [ ] R2 lifecycle policy if needed (for old logs etc.)
- [ ] A documented rollback procedure (Vercel makes this easy — promote previous deployment)

---

## 19. Marketing readiness

This part isn't "tech ready" but is "launch ready":

- [ ] Email list seeded (friends, family, beta users)
- [ ] Social accounts created (Instagram, X, TikTok minimum)
- [ ] Launch announcement post drafted
- [ ] First 30 days of content planned
- [ ] Google Business Profile created
- [ ] Initial paid campaign (if budget) planned with conversion tracking via GA4 + GTM

---

## 20. The night before

- [ ] Vercel: deploy main, confirm production URL works
- [ ] Test order flow one more time on production
- [ ] Verify all webhook URLs in Stripe, Shippo, Resend point to production domain
- [ ] Sentry: clear out test errors so real ones stand out
- [ ] PostHog: clear test cohorts/events
- [ ] Tell your support email forwarder you're live
- [ ] Sleep

## The morning of

- [ ] Final smoke test
- [ ] Announce
- [ ] Watch dashboards (Sentry, PostHog, Stripe live events)
- [ ] Have refund/cancel-order playbook ready in case of bug

Good luck.
