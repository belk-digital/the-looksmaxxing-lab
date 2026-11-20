# Subscriptions - rollout and local testing

## What was added (short)

- Customers can choose a plan on subscription-enabled products: **an order every month (25% off), every 3 months (20% off) or every 6 months (15% off)**. Discounts and plans are editable in the admin.
- **The plan length is how often an order is sent, and a subscription never ends by itself.** It continues until the customer pauses it (or staff end it in the admin). There is no "number of months" and no completion.
- The first order is paid at checkout (card through the WordPress/Authorize.net bridge, or Zelle). Every later order is its own order with an emailed pay link, a few days before it is due (the "invoice lead days" setting; the live site uses 3). Nothing is ever charged automatically.
- Staff control everything in the admin: **Subscription Settings** (master switch, plans, rules, wording), the **Subscriptions** collection, and a per-product "subscription enabled" tick.
- One new daily job step (inside the existing `daily-maintenance` cron, so no new Vercel cron is needed) creates invoices, sends at most 3 reminders per invoice, and puts a plan on hold when a month stays unpaid.

## Putting it on the live site - in this order

1. **Back up the database** (Supabase dashboard -> Database -> Backups, or take a snapshot).
2. **Dry run** (changes nothing, prints what is missing):

   ```
   npx tsx scripts/subscriptions/apply-migration.ts
   ```

   It reads `DATABASE_URI` from `.env`. Check the printed host/name is the live database.
3. **Apply** (only adds new tables/columns; one transaction, rolls back if any row count changes):

   ```
   npx tsx scripts/subscriptions/apply-migration.ts --apply --i-have-a-backup
   ```

   Running it twice is harmless. Do **not** use `payload migrate` on live - the live database does not list the older migrations as applied, so it would try to re-run them.
4. **Deploy the code** (after the migration; the old code simply ignores the new columns, so the order matters).
5. In the admin: **Subscription Settings** -> turn on the master switch, review plans/discount/wording. Then tick **Subscription enabled** on each product that should offer plans.
6. Google Sheet (orders): add two header cells, **L1 = Order Type** and **M1 = Subscription Order** (the sheet now writes columns A to M; M holds "Order 1", "Order 2", ...).
7. `CRON_SECRET` must already be set in Vercel (it is). The existing daily cron now also runs the subscription step.

Nothing appears to customers until step 5 (the master switch is off by default; existing subscriptions keep billing if you turn it off later).

## Member discount (20% for logged-in customers) - rollout, 2026-11-20

**One more database migration, and it MUST be applied BEFORE the new code is deployed.** New code deployed first cannot place orders (the order record has two new columns). It is the same safe, additive process as the two above:

1. **Back up the database** (as in "Putting it on the live site").
2. **Dry run**, then **apply** - the runner applies only what is still missing (here just the third migration) and checks that every existing order afterwards reads "no member discount":

   ```
   npx tsx scripts/subscriptions/apply-migration.ts
   npx tsx scripts/subscriptions/apply-migration.ts --apply --i-have-a-backup
   ```

3. **Deploy the code.**

**Status: APPLIED to the live database on 2026-11-20** (user's go-ahead). It was run with the narrow form, which touches this one migration only and refuses to run anything that is not a pure "add something new" statement:

```
npx tsx scripts/subscriptions/apply-migration.ts --only member-discount              # dry run
npx tsx scripts/subscriptions/apply-migration.ts --only member-discount --apply --additive-only
```

Result: 2 columns added, 0 new tables, one transaction, row counts identical before/after (132 orders, 244 order items, 44 users, 110 products...), the 6 subscription orders untouched, every existing order reads "no member discount". A second dry run then said "Nothing to do: every migration is already applied". No separate backup was taken (the migration only adds columns, so it cannot alter or remove existing data); the code is NOT deployed yet.

`--additive-only` is accepted instead of `--i-have-a-backup` only when every statement is `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`; the older subscription migrations contain other statements, so for them `--i-have-a-backup` is still required.

What the migration does (`20261120_000000_add_member_discount_to_orders`): adds `orders.member_discount_total` (numeric, default 0) and `orders.member_discount_percent` (numeric, empty). Nothing is dropped or rewritten. Rolling the code back does not require rolling the database back (the old code ignores the columns).

**The rule** (one place: `src/lib/membership/discount.ts`, `MEMBER_DISCOUNT_PERCENT = 20`):

- A customer who is logged in when they place an ordinary (one-time) order gets 20% off the merchandise subtotal, to the nearest cent. It is decided on the server from the login session; nothing the browser sends can switch it on.
- **It cannot be combined with any other discount.** If a customer also enters a discount code (percentage, fixed amount, free shipping...), the order gets WHICHEVER SAVES MORE, never both; an exact tie goes to the member discount. A code that loses is simply not used: it is not applied, not recorded on the order (`couponCode` stays empty), not counted as used (no `usageCount` change) and does not give free shipping; the cart and checkout tell the customer ("Not used: your Member discount saves more"). A code that wins replaces the member discount (the order records no member discount). **Gift cards / store credit are the one exception**: they are money the customer already holds, so they are paid on top (member discount first, the card covers the rest and keeps what it did not need). Flip `MEMBER_DISCOUNT_STACKS_WITH_STORE_CREDIT` in `src/lib/membership/discount.ts` to treat them like any other code. Everything is decided in `splitDiscounts` (the one place).
- **Affiliates:** an affiliate's code is normally worth less than 20%, so for a logged-in customer it loses to the member discount and is not recorded on that order. The sale is still credited if the customer arrived through the affiliate's link (the `affiliate_ref` cookie); a code typed with no link is not credited for that order.
- Subscription plans never get it (they have their own 15-25% plan discount), and neither do later invoices.
- `orders.discount_total` is EVERYTHING taken off (member discount + coupon), so subtotal - discount + shipping + fees - points = total always holds; `member_discount_total` is the member part. Store-credit deduction and affiliate commission use only the coupon part (`couponPartOfDiscount`).
- It is shown as "Member discount (20%)" in the cart, the checkout, the order confirmation page, the account order page and the order email. Logged-out visitors see what logging in would save, and the login popup advertises it.

**Shipping** is now one method, Express Shipping, $20, "2-3 business days" (wording in `src/lib/checkout/shipping.ts`; the price itself is in the admin under Shipping Zones, where the live site already has exactly one method). An order records the method that was actually charged, not the name the browser sent.

**Zelle QR code**: one definition, `src/lib/payments/zelleQr.ts`, used by the confirmation page, the subscription pay page and every email that asks for a Zelle payment.

## How the schedule works

- **Interval** = the plan length: 1, 3 or 6 calendar months (`subscriptions.planMonths` is reused as the interval; no schema change). The next order is due **one interval after the previous order was paid**; its invoice is created and emailed `invoiceLeadDays` earlier (default 7; the live Subscription Settings currently say 3). Month ends are clamped (Aug 31 + 6 months = Feb 28).
- Orders are numbered 1, 2, 3, ... (`orders.cycle_number`); `orders.cycles_total` is no longer written (older orders may still show a number).
- **Skip next delivery** moves the next order back by one full interval (an open unpaid invoice is cancelled). It can be used again and again.
- **Order next delivery now** creates the next invoice immediately; once it is paid the following order is due one interval after *that* payment.
- **Pause** only stops invoices; it never moves a date. On **Resume**: if the order's invoice day is still ahead, nothing is created now and the daily job invoices it on its normal day (the page says "Your next invoice will be emailed on ..."); if the date already passed while paused, the invoice is created right away with 7 days to pay. Staff setting the status back to Active in the admin follow the same rule.
- There is **no customer "stop" button** (pause covers it); the subscription page tells the customer to email support to cancel for good. Staff can set the status to Cancelled (or Ended) in the admin.
- The status "Ended" (internally `completed`) exists only for staff to set by hand; the system never sets it.
- The plan discount percentage is locked on the subscription when it is created; later changes to the plan settings only affect new subscriptions. Each invoice uses the product price on the day it is created.

## Coupons on subscriptions

- Every coupon has **Can be used on subscriptions** (default OFF, so every existing coupon stays out of subscriptions). A coupon without it is rejected on any cart that holds a plan ("This coupon can't be used on subscriptions."), on the cart page, at checkout and again on the server when the order is placed. A switched-on coupon works on subscriptions AND on normal purchases.
- A switched-on coupon also has **On a subscription, the discount applies to**: *First order only* (default) or *Every order*. It stacks on top of the plan discount. Store-credit coupons can only be first-order.
- *Every order*: the code is remembered on the subscription (field "recurringCouponCode", staff can clear it) and taken off every later invoice, however many there are. It counts as ONE use of the coupon. It keeps working after the coupon's expiry date or usage limit is reached (the customer was promised it); it stops when staff switch the coupon off for subscriptions, change it to first-order-only, or delete it - invoices then simply go out without the discount.
- The shop's existing coupon rule rounds percentage discounts DOWN to whole dollars (10% of $34 = $3); that is unchanged.
- Needs the second database migration (`20261021_000000_add_subscription_coupons`: 3 new columns, nothing dropped). Run it BEFORE deploying the code, like the first one (see "Putting it on the live site"; the runner now applies whichever migrations are still missing, in order).

## Status of the live database (done 2026-10-20)

- The migration was applied to the live Supabase database after a verified read-only copy of all 61 tables (4,593 rows) was saved to `.local-test/backups/<timestamp>/` (git-ignored, contains customer data - keep it private).
- Result: 4 new tables + 13 new columns; row counts identical; every existing order is `one_time`; `payload_migrations` got one extra row recording this migration.
- Tools used (all read-only except the migration itself):
  - `npx tsx scripts/subscriptions/backup-live.ts` - copy of every table, re-verified after writing
  - `npx tsx scripts/subscriptions/verify-live.ts <backup-folder>` - compares every live row with the copy
  - `npx tsx scripts/subscriptions/check-live-reads.ts` - the website's real queries work on live
  - `BLOCK_EMAILS=true RESEND_API_KEY=re_fake npx tsx scripts/subscriptions/check-email-guard.ts` - proves the email kill switch works
- Switched ON in the live database (2026-10-20) with `npx tsx scripts/subscriptions/enable-live.ts bpc-157`: master switch on, plans 3/6/12 months at 15%, and the product flag on BPC-157 only. Undo with `npx tsx scripts/subscriptions/enable-live.ts --off bpc-157`. The old deployed site ignores all of this, so customers see nothing until the new code is deployed. (`verify-live.ts` expects the settings tables to be empty, so run it before switching on.)
- **Coupon migration applied to live (2026-10-21)** with the user's approval: fresh verified backup (65 tables, 4,612 rows), `npx tsx scripts/subscriptions/apply-migration.ts --apply --i-have-a-backup` (3 new columns; the runner applies only what is still missing), then `verify-live.ts <backup-folder>` (all rows identical, the 4 test subscription orders untouched, all 26 existing coupons "not for subscriptions") and `check-live-reads.ts` (the app's real queries pass on live).
- **All products switched on for subscriptions (2026-10-21)** at the user's request: `npx tsx scripts/subscriptions/set-products.ts --all --on` (110 of 110; the master switch in Subscription Settings was left OFF by the user, and that script never touches it). Undo with `--all --off` (or restore from the saved `.local-test/product-flags-before-*.json`). Bulk-bundle sizes still cannot be subscribed to.
- **Interval model + test clean-up on live (2026-10-22)**, at the user's request: plans are now every month / every 3 months / every 6 months at 25% / 20% / 15% (this replaces the 3/6/12-month plans mentioned above; no database migration was needed). After a fresh verified backup (65 tables, 4,652 rows, `.local-test/backups/2026-10-22T04-07-24-922Z`) the two test subscriptions SUB-1 and SUB-2 and their 5 orders (#1071-#1075, with their items and notes) were deleted in one transaction, and BPC-157 stock was given back (+2: 498 -> 500). Compared with the backup afterwards: only those 17 rows were gone, everything else identical. In Subscription Settings only the plan names ("Every month" ...) and the agreement text were updated; the master switch (left ON by the user) and all numbers (including invoice lead days = 3) were not touched. `check-live-reads.ts` passes.
- Rollback if ever needed: the new tables/columns are not used by the old code, so the old code keeps working; do not delete anything without asking.

## Emails when testing locally

Emails are sent by every server, including `npm run dev` / `pnpm dev`, so you can see exactly what customers receive.

**Careful while connected to the LIVE database:** anything that emails customers sends a real email - placing an order with a real customer's address, changing a real order's status in the admin, running the cron jobs. For test orders use your own email address.

To stop ALL emails (for example while changing real orders in the admin), put `BLOCK_EMAILS=true` in `.env.local` and restart the dev server. Nothing is sent then: a line is printed in the terminal and an HTML copy is saved in `.local-test/blocked-emails/` (open it in a browser). `RESEND_API_KEY=re_fake BLOCK_EMAILS=true npx tsx scripts/subscriptions/check-email-guard.ts` proves the switch works.

Remember that an order placed from a local site against the live database is a REAL order in the live admin (stock, affiliate commission). Choosing "card" sends you to the real payment bridge. Use Zelle for practice orders and mark them cancelled afterwards.

## Things to know

- There is no cancel button for customers (same as one-time orders): they pause it, or email support. Staff can change a subscription's status in the admin; refunds are manual.
- If a customer pays something late, after the system already cancelled it (for example an unpaid first order that expired), open that order in the admin and double-check stock before shipping.
- The ShipStation migration file is not in the repository history; this migration does not touch it.

## Testing locally (never touches the live database)

Everything uses a throwaway Postgres on port 54329 through `local-env.cjs`, which overrides every live setting and refuses to run if a live host is detected.

- Unit tests: `LM_DB=lm_baseline node scripts/subscriptions/local-env.cjs npx vitest run --config ./vitest.config.mts`
- Real-database tests: `... npx vitest run --config ./vitest.db.config.mts`
- Browser tests (build first with `NODE_ENV=production ... npx next build --webpack`, start with `... npx next start -p 3100`, then): `LM_REUSE_SERVER=1 LM_DB=lm_e2e node scripts/subscriptions/local-env.cjs npx playwright test --config playwright.subscriptions.config.ts`

The test launcher builds/runs the site in its own folder (`.next-test`, via `LM_DIST_DIR` in `next.config.ts`; not set in normal use), so it never collides with a running `pnpm dev`. The first time Next uses that folder it rewrites `tsconfig.json` - restore it afterwards with `git checkout tsconfig.json` (and `src/app/(payload)/admin/importMap.js` if it shows as changed).

Do not run the project's own `playwright.config.ts` for this - it starts the dev server against the live database.
