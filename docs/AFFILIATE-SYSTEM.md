# AFFILIATE-SYSTEM.md — Custom Affiliate Program

> Full architecture, schemas, fraud prevention, commission engine, and payout system.
> This is a significant subsystem. Build it in Phase 21 (after core e-commerce is launched).

---

## Architecture overview

```
User applies → Admin approves
       ↓
Affiliate gets:
  - Unique referral slug  → yoursite.com/ref/[slug]
  - Unique coupon code    → e.g. JOHNDOE15 (gives 15% off, earns 10%)
       ↓
Visitor clicks referral link or uses coupon at checkout
       ↓
AffiliateClick logged (IP, UA, landing page, timestamp)
Cookie set: affiliate_ref = affiliateId (30 days)
       ↓
Visitor checks out:
  - Read affiliate_ref cookie  ← referral link attribution
  - OR read coupon's affiliateId ← coupon attribution
  - Coupon code wins over cookie if both present and different affiliates
       ↓
Fraud checks at checkout:
  - Self-referral? (affiliate email == customer email) → void
  - IP flagged for abuse? → hold for review
  - Velocity anomaly? → hold for review
       ↓
AffiliateConversion created:
  - status: 'pending' for 30 days
  - commissionAmount computed on eligible subtotal
       ↓
Order refunded/cancelled? → Commission reversed automatically (webhook)
30 days pass, order delivered, not refunded? → Commission auto-approved
       ↓
Admin reviews approved commissions:
  - Filter unpaid commissions by affiliate
  - Export CSV (with payout method details)
  - Process payment externally (PayPal / Wise / bank / crypto)
  - Upload receipt, enter transaction ID, mark as paid
       ↓
AffiliatePayout record created → commissions marked paid
Affiliate sees payout in their dashboard
```

---

## Collection: Affiliates

The core affiliate profile. One per user. Created when admin approves an application.

| Field                               | Type                                                              | Notes                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Identity**                        |                                                                   |                                                                                                   |
| user                                | relationship → Users                                              | Required, unique (one affiliate per user)                                                         |
| status                              | select                                                            | `pending` \| `approved` \| `rejected` \| `suspended`. Default `pending`                           |
| applicationDate                     | date                                                              | Auto-set on create                                                                                |
| approvedAt                          | date                                                              | Set by admin on approval                                                                          |
| approvedBy                          | relationship → Users                                              | Admin who approved                                                                                |
| rejectedAt                          | date                                                              |                                                                                                   |
| rejectedReason                      | textarea                                                          | Shown to applicant on rejection                                                                   |
| suspendedAt                         | date                                                              |                                                                                                   |
| suspensionReason                    | textarea                                                          |                                                                                                   |
| **Application info**                |                                                                   |                                                                                                   |
| displayName                         | text                                                              | Their public/brand name                                                                           |
| websiteUrl                          | text                                                              | Their site or social profile                                                                      |
| promotionMethods                    | textarea                                                          | How they plan to promote (SEO, social, email, etc.)                                               |
| socialLinks                         | array: { platform: select, url: text }                            | Instagram, YouTube, TikTok, Twitter, Reddit                                                       |
| estimatedMonthlyReach               | select                                                            | `<1k` \| `1k-10k` \| `10k-100k` \| `100k+`                                                        |
| **Referral**                        |                                                                   |                                                                                                   |
| referralSlug                        | text                                                              | Unique slug for link: yoursite.com/ref/[slug]. Auto-generated from displayName, editable by admin |
| couponCode                          | text                                                              | Unique code (e.g., JOHNDOE15). Auto-generated, editable by admin                                  |
| coupon                              | relationship → Coupons                                            | Auto-created coupon, linked here. Admin should not manually delete                                |
| cookieDurationDays                  | number                                                            | Days referral cookie lasts. Default 30                                                            |
| **Commission**                      |                                                                   |                                                                                                   |
| commissionRate                      | number                                                            | Percentage of eligible order value. Default 10                                                    |
| commissionType                      | select                                                            | `percentage` only for now (fixed_amount Phase 2)                                                  |
| customerDiscount                    | number                                                            | % discount the customer gets using their coupon. Default 10                                       |
| pendingPeriodDays                   | number                                                            | Days before commission auto-approves. Default 30                                                  |
| commissionOn                        | select                                                            | `subtotal_after_coupon` \| `subtotal_before_coupon`. Default `subtotal_after_coupon`              |
| **Tier**                            |                                                                   |                                                                                                   |
| tier                                | select                                                            | `standard` \| `silver` \| `gold` \| `vip`. Default `standard`                                     |
| tierUpdatedAt                       | date                                                              |                                                                                                   |
| tierNote                            | textarea                                                          | Why they're in this tier (internal)                                                               |
| **Cached stats** (updated by hooks) |                                                                   |                                                                                                   |
| totalClicks                         | number                                                            | All-time clicks                                                                                   |
| uniqueClicks                        | number                                                            | Deduplicated by IP                                                                                |
| totalConversions                    | number                                                            | Orders attributed                                                                                 |
| totalRevenue                        | number                                                            | Cents, total order value attributed                                                               |
| totalCommissionEarned               | number                                                            | Cents, all-time commissions (pending + approved + paid)                                           |
| totalCommissionPending              | number                                                            | Cents, awaiting approval                                                                          |
| totalCommissionApproved             | number                                                            | Cents, approved but not yet paid                                                                  |
| totalCommissionPaid                 | number                                                            | Cents, paid out                                                                                   |
| conversionRate                      | number                                                            | % (totalConversions / uniqueClicks \* 100)                                                        |
| lastClickAt                         | date                                                              |                                                                                                   |
| lastConversionAt                    | date                                                              |                                                                                                   |
| **Payout info**                     |                                                                   |                                                                                                   |
| payoutMethods                       | array                                                             | See subfield below                                                                                |
| minimumPayoutThreshold              | number                                                            | Cents. Default 5000 ($50.00)                                                                      |
| payoutCurrency                      | select                                                            | `USD` \| `BTC` \| `ETH` \| `USDT_ERC20` \| `USDT_TRC20`                                           |
| **Fraud**                           |                                                                   |                                                                                                   |
| flaggedForReview                    | checkbox                                                          | Set by fraud engine. Stops auto-approval.                                                         |
| fraudScore                          | number                                                            | 0–100. Internal risk score                                                                        |
| fraudNotes                          | textarea                                                          | Admin notes on suspicious activity                                                                |
| ipHistory                           | array: { ip: text (hashed), firstSeen: date, clickCount: number } | Rolling 90-day window                                                                             |
| **Internal**                        |                                                                   |                                                                                                   |
| adminNotes                          | textarea                                                          | Private notes from admin                                                                          |
| agreedToTermsAt                     | date                                                              | When they ticked "I agree to affiliate terms"                                                     |
| termsVersion                        | text                                                              | e.g., "v1.2" — track which terms they agreed to                                                   |

**Payout method subfield:**

```ts
{
  type: select ('paypal' | 'wise' | 'bank_wire' | 'crypto_btc' | 'crypto_eth' | 'crypto_usdt_erc20' | 'crypto_usdt_trc20'),
  isPrimary: checkbox,
  // PayPal:
  paypalEmail: text,
  // Wise:
  wiseEmail: text,
  wiseAccountHolder: text,
  // Bank wire:
  bankAccountHolder: text,
  bankName: text,
  bankAccountNumber: text,   // stored encrypted
  bankRoutingNumber: text,   // US ACH
  bankSwiftCode: text,       // International
  bankIban: text,
  bankCountry: text,
  // Crypto:
  walletAddress: text,
  walletNetwork: text,       // e.g., "Ethereum Mainnet", "TRON"
}
```

**Access control:**

- Read: own affiliate record OR admin
- Create: admin only (created after approving application)
- Update: own affiliate (limited fields: payoutMethods, socialLinks) OR admin (all)
- Delete: never

**Hooks:**

- `beforeChange` (create): auto-generate `referralSlug` from displayName (slugified, unique), auto-generate `couponCode` from displayName + commissionRate
- `afterChange` (create + status→approved): create corresponding Coupon record automatically
- `afterChange` (status→rejected): send rejection email
- `afterChange` (status→suspended): invalidate all pending commissions, send email

---

## Collection: AffiliateApplications

Separate from Affiliates — the pre-approval application. Keeps things clean.

| Field                       | Type                      | Notes                                                    |
| --------------------------- | ------------------------- | -------------------------------------------------------- |
| user                        | relationship → Users      | Required, unique (one application per user)              |
| status                      | select                    | `pending` \| `approved` \| `rejected`. Default `pending` |
| **Application form fields** |                           |                                                          |
| displayName                 | text                      | Required                                                 |
| websiteUrl                  | text                      |                                                          |
| socialLinks                 | array: { platform, url }  |                                                          |
| promotionMethods            | textarea                  | Required — how will you promote us?                      |
| estimatedMonthlyReach       | select                    |                                                          |
| niche                       | textarea                  | Your audience niche (fitness, biohacking, etc.)          |
| whyJoin                     | textarea                  | Why do you want to partner with us?                      |
| agreedToTerms               | checkbox                  | Required, links to affiliate terms page                  |
| **Admin**                   |                           |                                                          |
| reviewedBy                  | relationship → Users      | Admin                                                    |
| reviewedAt                  | date                      |                                                          |
| reviewNotes                 | textarea                  | Internal notes                                           |
| linkedAffiliate             | relationship → Affiliates | Set when approved, creates the Affiliate record          |

**Hooks:**

- `afterChange` (status→approved): create Affiliates record using application data, send approval email with dashboard link
- `afterChange` (status→rejected): send rejection email with reason

---

## Collection: AffiliateClicks

Every click on a referral link or coupon use attempt. High-volume — index heavily.

| Field            | Type                                | Notes                                                                   |
| ---------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| affiliate        | relationship → Affiliates           | Required                                                                |
| source           | select                              | `referral_link` \| `coupon_code_attempt`                                |
| **Request info** |                                     |                                                                         |
| ipHash           | text                                | SHA-256 of IP (privacy-safe, still useful for dedup)                    |
| ipCountry        | text                                | Country from IP geolookup (use geoip-lite npm package, no external API) |
| userAgent        | text                                | Raw UA string                                                           |
| deviceType       | select                              | `desktop` \| `mobile` \| `tablet` (parsed from UA)                      |
| referrer         | text                                | HTTP Referer header (where they came from)                              |
| landingPage      | text                                | Full URL they landed on                                                 |
| sessionId        | text                                | Anonymous session UUID (stored in cookie alongside affiliate cookie)    |
| **Conversion**   |                                     |                                                                         |
| convertedToOrder | checkbox                            | Default false. Set true by checkout flow                                |
| conversion       | relationship → AffiliateConversions | Nullable, set when order created                                        |
| conversionValue  | number                              | Cents, set when converted                                               |
| **Fraud flags**  |                                     |                                                                         |
| isSuspicious     | checkbox                            | Set by fraud engine                                                     |
| suspicionReason  | text                                | e.g., "velocity_exceeded", "known_bad_ip", "bot_ua"                     |
| **Timestamp**    |                                     |                                                                         |
| clickedAt        | date                                | Required, indexed                                                       |

**Indexes:** `affiliate` + `clickedAt`, `ipHash` + `clickedAt`, `sessionId`

---

## Collection: AffiliateConversions

One record per order attributed to an affiliate.

| Field                | Type                            | Notes                                                                                          |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| affiliate            | relationship → Affiliates       | Required                                                                                       |
| order                | relationship → Orders           | Required, **unique** (one conversion per order, enforced)                                      |
| customer             | relationship → Users            | Nullable (guest checkout)                                                                      |
| customerEmail        | email                           | Snapshot at time of attribution                                                                |
| **Attribution**      |                                 |                                                                                                |
| attributionSource    | select                          | `referral_link` \| `coupon_code` \| `both`                                                     |
| attributionClick     | relationship → AffiliateClicks  | The click that led here, if referral link                                                      |
| cookieAgeDays        | number                          | How old the cookie was when order placed                                                       |
| couponCodeUsed       | text                            | Snapshot of coupon code if used                                                                |
| **Financial**        |                                 |                                                                                                |
| orderSubtotal        | number                          | Cents — products only (no shipping, no tax)                                                    |
| orderDiscount        | number                          | Cents — affiliate coupon discount applied                                                      |
| eligibleSubtotal     | number                          | Cents — what commission is computed on (subtotal minus discount if commissionOn=after_coupon)  |
| commissionRate       | number                          | Percentage at time of conversion (snapshot)                                                    |
| commissionAmount     | number                          | Cents — floor(eligibleSubtotal \* commissionRate / 100)                                        |
| **Status**           |                                 |                                                                                                |
| status               | select                          | `pending` \| `approved` \| `paid` \| `reversed` \| `voided`                                    |
| pendingUntil         | date                            | createdAt + pendingPeriodDays — when it CAN be auto-approved                                   |
| approvedAt           | date                            |                                                                                                |
| payout               | relationship → AffiliatePayouts | Set when included in a payout                                                                  |
| paidAt               | date                            |                                                                                                |
| **Reversal**         |                                 |                                                                                                |
| reversedAt           | date                            |                                                                                                |
| reversedReason       | select                          | `order_refunded` \| `order_cancelled` \| `fraud_detected` \| `self_referral` \| `admin_manual` |
| reversedBy           | relationship → Users            | Admin (if manual)                                                                              |
| **Fraud checks**     |                                 |                                                                                                |
| selfReferralDetected | checkbox                        | affiliate.user.email == customer email                                                         |
| ipMatchesAffiliate   | checkbox                        | Customer IP matches known affiliate IP                                                         |
| fraudScore           | number                          | 0–100. Inherits from affiliate + order signals                                                 |
| flaggedForReview     | checkbox                        |                                                                                                |
| fraudNotes           | text                            |                                                                                                |
| **Metadata**         |                                 |                                                                                                |
| createdAt            | date                            | Required, indexed                                                                              |

**Indexes:** `affiliate` + `status`, `order` (unique), `payout`, `pendingUntil` + `status`

---

## Collection: AffiliatePayouts

A payout batch — one or more conversions paid in a single transaction.

| Field                    | Type                                       | Notes                                                                                                           |
| ------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| affiliate                | relationship → Affiliates                  | Required                                                                                                        |
| **Conversions included** |                                            |                                                                                                                 |
| conversions              | relationship → AffiliateConversions (many) | Required, all must be status=approved                                                                           |
| conversionCount          | number                                     | Cached count                                                                                                    |
| **Amount**               |                                            |                                                                                                                 |
| totalAmountCents         | number                                     | Sum of all conversion commissionAmounts                                                                         |
| currency                 | select                                     | `USD` \| `BTC` \| `ETH` \| `USDT`                                                                               |
| cryptoAmountRaw          | text                                       | Exact crypto amount with full precision (e.g., "0.00012847")                                                    |
| exchangeRateUsed         | number                                     | USD/crypto rate at time of payment (for records)                                                                |
| **Payment method used**  |                                            |                                                                                                                 |
| paymentMethod            | select                                     | `paypal` \| `wise` \| `bank_wire` \| `crypto_btc` \| `crypto_eth` \| `crypto_usdt_erc20` \| `crypto_usdt_trc20` |
| paymentDestination       | json                                       | Snapshot of payout method details at time of payment                                                            |
| **Status**               |                                            |                                                                                                                 |
| status                   | select                                     | `draft` \| `processing` \| `paid` \| `failed`                                                                   |
| **Admin**                |                                            |                                                                                                                 |
| createdBy                | relationship → Users                       | Admin who created the payout                                                                                    |
| processedBy              | relationship → Users                       | Admin who marked it paid                                                                                        |
| adminNotes               | textarea                                   |                                                                                                                 |
| **Payment proof**        |                                            |                                                                                                                 |
| transactionId            | text                                       | PayPal tx ID, bank ref, crypto tx hash                                                                          |
| receiptFile              | upload → Media                             | Screenshot or PDF of payment confirmation                                                                       |
| receiptUrl               | text                                       | Alternative to file upload                                                                                      |
| **Dates**                |                                            |                                                                                                                 |
| createdAt                | date                                       |                                                                                                                 |
| exportedAt               | date                                       | When admin exported this to CSV for processing                                                                  |
| paidAt                   | date                                       | When marked as paid                                                                                             |
| failedAt                 | date                                       |                                                                                                                 |
| failureReason            | text                                       |                                                                                                                 |

**Hooks:**

- `afterChange` (status→paid): mark all included conversions as status=`paid`, update affiliate cached stats, send payout notification email to affiliate

---

## Fraud detection rules engine

### Rule 1: Self-referral (HARD BLOCK)

**When:** Order placed  
**Check:** affiliate.user.email === order.customerEmail (case-insensitive)  
Also: affiliate.user.clerkUserId === order.user.clerkUserId (if logged in)  
**Action:** voided immediately. fraudNotes = "self_referral". No commission. Log.

### Rule 2: Cookie velocity (AUTO-FLAG)

**When:** AffiliateClick created  
**Check:** Count of clicks from same ipHash in last 1 hour > 10  
**Action:** isSuspicious = true, suspicionReason = "velocity_exceeded". Downstream conversions flagged.

### Rule 3: Click-to-order velocity (AUTO-FLAG)

**When:** AffiliateConversion created  
**Check:** Time between attributionClick.clickedAt and order.createdAt < 30 seconds  
**Action:** flaggedForReview = true, fraudNotes = "instant_conversion". Requires admin approval.

### Rule 4: IP match (AUTO-FLAG)

**When:** AffiliateConversion created  
**Check:** order.ipAddress (hashed) in affiliate.ipHistory  
**Action:** ipMatchesAffiliate = true. Auto-flag if match within last 7 days.

### Rule 5: Refund exploitation (AUTO-REVERSE)

**When:** Order status → refunded or cancelled (webhook)  
**Check:** Find AffiliateConversion where order = this order  
**Action:** If status is pending or approved → set status = reversed, reversedReason = order_refunded/order_cancelled. Subtract from affiliate cached stats.

### Rule 6: Coupon abuse (AUTO-FLAG)

**When:** Coupon applied at checkout  
**Check:** Same ipHash has used this coupon code more than 3 times in 30 days  
**Action:** Flag conversion. Block coupon if > 5 uses from same IP.

### Rule 7: Fraud score threshold (AUTO-HOLD)

**When:** Any conversion created  
**Check:** fraudScore > 60  
**Action:** flaggedForReview = true. Commission stays pending and blocked from auto-approval regardless of time.

### Rule 8: High-value anomaly (AUTO-FLAG)

**When:** Commission amount > $500 on a single order  
**Action:** Always flag for manual admin review before approval, regardless of other scores.

### Rule 9: Guest checkout with affiliate coupon — same email as affiliate (HARD BLOCK)

**When:** Guest checkout, coupon applied  
**Check:** Checkout contact email === affiliate email  
**Action:** Void commission. Allow order to proceed (customer gets discount still, affiliate gets nothing).

---

## Commission engine (server-side functions)

### `computeCommission(order, affiliateId)` → cents

```ts
src / lib / affiliates / commission.ts

export async function computeCommission(order: Order, affiliateId: string): Promise<number> {
  const affiliate = await getAffiliate(affiliateId)

  // Base: sum of product line totals only (not shipping, not tax)
  const productSubtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0)

  // The affiliate coupon discount (they gave away X% so don't earn on the discount amount)
  const affiliateCouponDiscount =
    order.couponCode === affiliate.couponCode ? (order.discountTotal ?? 0) : 0

  const eligibleSubtotal =
    affiliate.commissionOn === 'subtotal_after_coupon'
      ? productSubtotal - affiliateCouponDiscount
      : productSubtotal

  // Floor to avoid floating point issues (everything in cents)
  return Math.floor((eligibleSubtotal * affiliate.commissionRate) / 100)
}
```

### `attributeOrder(order, cookieAffiliateId, couponAffiliateId)` → AffiliateConversion | null

Attribution priority:

1. If coupon used → coupon affiliate wins
2. If cookie present (different affiliate, or no coupon) → cookie affiliate
3. Both same → one conversion, source = 'both'
4. If none → no conversion

```ts
export async function attributeOrder(
  order: Order,
  cookieAffiliateId: string | null,
  couponCode: string | null,
): Promise<void> {
  const couponAffiliate = couponCode ? await getAffiliateByCode(couponCode) : null
  const cookieAffiliate = cookieAffiliateId ? await getAffiliate(cookieAffiliateId) : null

  const affiliate = couponAffiliate ?? cookieAffiliate
  if (!affiliate) return

  const source: AttributionSource =
    couponAffiliate && cookieAffiliate && couponAffiliate.id === cookieAffiliate.id
      ? 'both'
      : couponAffiliate
        ? 'coupon_code'
        : 'referral_link'

  const commissionAmount = await computeCommission(order, affiliate.id)

  // Run all fraud checks
  const fraudResult = await runFraudChecks(order, affiliate)

  await payload.create({
    collection: 'affiliate-conversions',
    data: {
      affiliate: affiliate.id,
      order: order.id,
      customerEmail: order.guestEmail ?? order.user?.email,
      attributionSource: source,
      orderSubtotal: order.subtotal,
      orderDiscount: order.discountTotal,
      eligibleSubtotal: /* computed above */,
      commissionRate: affiliate.commissionRate,
      commissionAmount: fraudResult.void ? 0 : commissionAmount,
      status: fraudResult.void ? 'voided' : 'pending',
      pendingUntil: addDays(new Date(), affiliate.pendingPeriodDays),
      selfReferralDetected: fraudResult.selfReferral,
      fraudScore: fraudResult.score,
      flaggedForReview: fraudResult.flag,
      fraudNotes: fraudResult.notes,
    },
  })

  // Update affiliate cached stats (if not voided)
  if (!fraudResult.void) {
    await updateAffiliateStats(affiliate.id)
  }
}
```

### Auto-approval cron job (runs daily)

`src/app/api/cron/affiliate-approve/route.ts` (Vercel Cron — add to vercel.json)

```ts
// Finds all conversions where:
// - status === 'pending'
// - pendingUntil <= now
// - flaggedForReview === false
// - fraudScore <= 60
// Sets status → 'approved'
// Updates affiliate stats
```

---

## Cookie tracking implementation

### Setting the cookie (referral link click)

`src/app/ref/[slug]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  // Look up affiliate by slug
  const affiliate = await getAffiliateBySlug(params.slug)
  if (!affiliate || affiliate.status !== 'approved') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Log the click
  const clickId = await logAffiliateClick(affiliate, request, 'referral_link')

  // Set cookies
  const response = NextResponse.redirect(new URL('/', request.url))
  const maxAge = affiliate.cookieDurationDays * 24 * 60 * 60 // seconds

  response.cookies.set('affiliate_ref', affiliate.id, {
    maxAge,
    httpOnly: true, // Not readable by JS (prevents easy manipulation)
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  response.cookies.set('affiliate_click_id', clickId, {
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
```

### Reading the cookie at checkout

In `createPaymentIntent` server action:

```ts
const cookieStore = await cookies()
const affiliateId = cookieStore.get('affiliate_ref')?.value ?? null
const clickId = cookieStore.get('affiliate_click_id')?.value ?? null
// Pass affiliateId and coupon.affiliateId into attributeOrder() after order created
```

### Clearing the cookie after successful order

After conversion recorded: clear `affiliate_ref` and `affiliate_click_id` cookies so the same session doesn't double-count if the customer buys again the same day.

---

## Affiliate dashboard pages

All under `/[locale]/affiliates/dashboard/` — protected by Clerk auth + affiliate status check.

```
/affiliates/apply                    — Application form (any logged-in user)
/affiliates/dashboard                — Overview: stats summary cards
/affiliates/dashboard/links          — Referral link, coupon code, share tools
/affiliates/dashboard/conversions    — Table of attributed orders + commission status
/affiliates/dashboard/earnings       — Chart + breakdown (pending / approved / paid)
/affiliates/dashboard/payouts        — Payout history table
/affiliates/dashboard/settings       — Payout method config, notification prefs
```

### Per-page spec

**Overview (`/dashboard`):**

- Cards: Total clicks, Unique clicks, Conversions, Conversion rate, Pending earnings, Approved earnings, Total paid
- Mini chart: clicks + conversions over last 30 days
- Quick link to referral link + copy button
- Recent conversions table (last 5)

**Links (`/dashboard/links`):**

- Referral link with copy button and QR code (use `qrcode` npm package)
- Coupon code with copy button
- Custom UTM builder: append utm_source, utm_medium, utm_campaign to referral link
- Social share buttons (Twitter/X, Reddit, copy)
- Banner assets download (if uploaded by admin to Media collection)

**Conversions (`/dashboard/conversions`):**

- Table: Order #, Date, Order value, Commission, Status badge, Pending until
- Status colors: pending=yellow, approved=green, paid=blue, reversed=red, voided=gray
- Filter by status, date range
- Pagination

**Earnings (`/dashboard/earnings`):**

- Summary: Pending (locked), Approved (ready to request), Total paid out
- Request payout button (if approved earnings ≥ minimumPayoutThreshold)
- Payout request form: select payout method (from their saved methods), confirm amount
- Note: "Payout requests are processed weekly by our team"

**Payouts (`/dashboard/payouts`):**

- Table: Date, Amount, Method, Transaction ID, Status
- Status: processing, paid, failed

**Settings (`/dashboard/settings`):**

- Add / edit payout methods (form per type)
- Notification preferences: email on new conversion, email on payout
- Tax info upload (W-9 for US affiliates earning > $600/year — required by IRS)

---

## Admin affiliate management (Payload admin extensions)

### Custom views in Payload admin

**Affiliate list** (`/admin/collections/affiliates`):

- Default columns: displayName, user email, status, tier, commissionRate, totalCommissionPaid, lastConversionAt
- Filters: status, tier, date range
- Bulk actions: approve selected, suspend selected, export CSV

**Affiliate detail** (`/admin/collections/affiliates/[id]`):

- Custom sidebar widgets:
  - Quick stats: clicks, conversions, earned, paid
  - Fraud score indicator (color-coded)
  - "Regenerate coupon code" button (with confirmation)
  - "Suspend affiliate" button (with reason textarea)
  - "View all conversions" link

**Conversions queue** (custom admin view):

- Separate view for fraud-flagged conversions
- Per row: affiliate name, order #, commission, fraud notes, fraud score
- Actions: approve manually, void, add notes

**Payout management** (custom admin view):
This is the most important admin workflow:

1. **Select affiliate** (dropdown or search)
2. **See approved, unpaid commissions** for that affiliate
3. **Generate payout batch:**
   - Select all or specific conversions to include
   - See total payout amount in USD
   - If crypto: enter current exchange rate → see crypto equivalent
4. **Export to CSV** (button):
   - One row per affiliate with: name, total USD, payout method, payout details
   - File: `payout_batch_2026_05_23.csv`
   - Marks all included conversions as exportedAt = now
5. **After paying externally (PayPal dashboard, bank, crypto):**
   - Return to admin
   - Enter transaction ID
   - Upload receipt (optional)
   - Click "Mark as Paid"
   - System: creates AffiliatePayout record, marks all conversions as paid, emails affiliates

---

## Automated emails

| Trigger                      | Email                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Application submitted        | "We received your application — review in 2–5 days"                           |
| Application approved         | "You're approved! Here's your dashboard link, referral link, and coupon code" |
| Application rejected         | "Unfortunately..." + rejectedReason                                           |
| First conversion             | "You made your first sale! $X pending"                                        |
| Commission approved          | "Good news — $X commission approved, ready for payout"                        |
| Payout processed             | "Your $X payout has been sent" with transaction ID                            |
| Account suspended            | "Your affiliate account has been suspended"                                   |
| Approaching payout threshold | "You're $X away from your minimum payout threshold"                           |

All templates in `src/emails/affiliate/` — bilingual (EN/ES).

---

## Payload config additions

Add to `payload.config.ts` collections array:

```ts
import AffiliateApplications from './collections/AffiliateApplications'
import Affiliates from './collections/Affiliates'
import AffiliateClicks from './collections/AffiliateClicks'
import AffiliateConversions from './collections/AffiliateConversions'
import AffiliatePayouts from './collections/AffiliatePayouts'
```

Add to globals (optional — for admin dashboard widget config):

```ts
import AffiliateSettings from './globals/AffiliateSettings'
// Fields: defaultCommissionRate, defaultCustomerDiscount, defaultPendingDays,
//         affiliateTermsContent [L], bannerAssets (array of uploadable promo images)
//         payoutSchedule (text, e.g. "Every Monday"), minimumPayoutDefault
```

---

## Referral link redirect route

`src/app/ref/[slug]/route.ts` — GET handler only. No page, just a redirect with cookie setting. Returns 302 to `/`.

Register in `next.config.ts` under `redirects` OR handle in the route handler directly (route handler is cleaner).

---

## Build order for affiliates

1. All 5 Payload collections + AffiliateSettings global
2. Referral redirect route (`/ref/[slug]`)
3. Fraud engine functions in `src/lib/affiliates/`
4. Cookie logic (set on click, read at checkout)
5. `attributeOrder()` wired into Stripe webhook (after order created)
6. Order refund/cancel webhook → commission reversal
7. Auto-approval cron job
8. Affiliate application page (public)
9. Affiliate dashboard pages (protected)
10. Admin payout management view (Payload custom view)
11. All transactional emails
12. Affiliate-specific public pages (landing page at `/affiliates`, terms at `/affiliates/terms`)

---

## Security notes

- **Referral slug is public** — don't put any sensitive data in it. Just displayName slug.
- **IP storage:** Hash all IPs with SHA-256 before storing. You're logging click data, GDPR applies.
- **Payout method data:** Bank account numbers and crypto wallet addresses are sensitive PII. Encrypt at rest using Payload's field-level encryption or store outside Payload in a secrets vault and store only a reference key.
- **Affiliate coupon codes:** When you create the corresponding Coupon record, set `perCustomerLimit: 1` and `usageLimit: null` (unlimited overall, but each customer can only use it once). This is the baseline abuse protection.
- **Admin payout CSV:** Contains full payout method details. Mark as confidential. Store in R2 with private access only.
- **W-9 uploads:** If an affiliate earns >$600 USD, US law requires you to collect a W-9 and issue a 1099-NEC. Store W-9 PDFs in a private R2 folder, not the public media bucket.
