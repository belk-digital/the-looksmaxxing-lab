# SCHEMAS.md — Database Schemas (Payload Collections)

> Every collection, every field, every relationship. The AI must read this before generating any collection code.

---

## Conventions

- All collections have `id`, `createdAt`, `updatedAt` automatically (Payload default)
- All money stored as **integer cents** (USD), never floats. `$19.99` = `1999`
- All weights stored as **grams** (integer)
- All dates ISO 8601
- `slug` fields auto-generated from name via beforeChange hook, unique
- Localized fields marked with `[L]` — translated EN/ES

---

## Collection: Users

Purpose: Both customers and admins. Single source of truth for accounts.

| Field                  | Type                     | Notes                                                |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| email                  | email                    | Unique, required, lowercased                         |
| password               | password                 | Hashed by Payload                                    |
| firstName              | text                     | Required                                             |
| lastName               | text                     | Required                                             |
| phone                  | text                     | Optional, E.164 format                               |
| role                   | select                   | `customer` \| `admin` \| `staff`. Default `customer` |
| emailVerified          | checkbox                 | Default false                                        |
| acceptsMarketing       | checkbox                 | Default false (opt-in only)                          |
| preferredLocale        | select                   | `en` \| `es`. Default `en`                           |
| dateOfBirth            | date                     | Optional, used for age gate persistence              |
| stripeCustomerId       | text                     | Set on first checkout                                |
| defaultShippingAddress | relationship → Addresses | nullable                                             |
| defaultBillingAddress  | relationship → Addresses | nullable                                             |
| lastLoginAt            | date                     | Updated by login hook                                |
| metadata               | json                     | Free-form, for marketing tags etc.                   |

**Access:**

- Create: public (registration)
- Read: own user, or admin
- Update: own user (limited fields), admin (all)
- Delete: admin only (and soft-delete preferred)

**Hooks:**

- `beforeChange`: lowercase email
- `afterChange` (create): send welcome email, create Stripe customer
- `afterLogin`: update `lastLoginAt`

---

## Collection: Addresses

Purpose: Saved shipping/billing addresses per user.

| Field             | Type                 | Notes                                  |
| ----------------- | -------------------- | -------------------------------------- |
| user              | relationship → Users | Required                               |
| label             | text                 | e.g., "Home", "Work"                   |
| firstName         | text                 | Required                               |
| lastName          | text                 | Required                               |
| company           | text                 | Optional                               |
| line1             | text                 | Required                               |
| line2             | text                 | Optional                               |
| city              | text                 | Required                               |
| state             | text                 | 2-letter US state code, required       |
| postalCode        | text                 | Required, US ZIP validated             |
| country           | text                 | Default `US`, required                 |
| phone             | text                 | Required (carriers require)            |
| isDefaultShipping | checkbox             | Only one true per user (hook-enforced) |
| isDefaultBilling  | checkbox             | Only one true per user (hook-enforced) |

**Access:** Owner or admin only.

---

## Collection: Categories

Purpose: Product taxonomy.

| Field              | Type                      | Notes                  |
| ------------------ | ------------------------- | ---------------------- |
| name [L]           | text                      | Required               |
| slug               | text                      | Unique, auto from name |
| description [L]    | richText                  | Optional               |
| parent             | relationship → Categories | Self-ref for nesting   |
| image              | upload → Media            | Optional               |
| sortOrder          | number                    | For manual ordering    |
| isVisible          | checkbox                  | Default true           |
| seoTitle [L]       | text                      | Optional               |
| seoDescription [L] | textarea                  | Optional               |

**Access:** Read public, write admin.

---

## Collection: Products

Purpose: The catalog. Supports variants via nested array.

| Field                   | Type                                      | Notes                                                 |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------- |
| name [L]                | text                                      | Required                                              |
| slug                    | text                                      | Unique, auto                                          |
| shortDescription [L]    | textarea                                  | One-liner for cards                                   |
| description [L]         | richText                                  | Long-form                                             |
| categories              | relationship → Categories (many)          | At least one required                                 |
| brand                   | text                                      | Optional                                              |
| sku                     | text                                      | Unique if no variants; else variants have own SKUs    |
| **Pricing**             |                                           |                                                       |
| price                   | number                                    | Integer cents, required if no variants                |
| compareAtPrice          | number                                    | Integer cents, optional (shows strikethrough)         |
| costPerItem             | number                                    | Integer cents, admin-only field (for margin)          |
| **Inventory**           |                                           |                                                       |
| trackInventory          | checkbox                                  | Default true                                          |
| stock                   | number                                    | Required if trackInventory and no variants            |
| lowStockThreshold       | number                                    | Default 5                                             |
| allowBackorder          | checkbox                                  | Default false                                         |
| **Variants**            |                                           |                                                       |
| hasVariants             | checkbox                                  | If true, `variants` array required                    |
| variantOptions          | array                                     | `[{ name: "Size", values: ["10mg", "20mg"] }]`        |
| variants                | array                                     | See structure below                                   |
| **Media**               |                                           |                                                       |
| images                  | array of { image: upload→Media, alt [L] } | At least 1 required                                   |
| **Peptide-specific**    |                                           |                                                       |
| coaFile                 | upload → Media                            | Certificate of Analysis PDF, optional but recommended |
| batchNumber             | text                                      | Optional                                              |
| purity                  | text                                      | e.g., "≥99%"                                          |
| molecularFormula        | text                                      | e.g., "C62H98N16O22"                                  |
| storageInstructions [L] | textarea                                  | "Store at 2–8°C"                                      |
| **Compliance**          |                                           |                                                       |
| requiresAgeVerification | checkbox                                  | Default false (true for Category C)                   |
| researchUseOnly         | checkbox                                  | Default false (true for Category C)                   |
| shippingRestrictions    | array of { state: text }                  | States we cannot ship to                              |
| **Shipping**            |                                           |                                                       |
| weight                  | number                                    | Grams, required                                       |
| dimensions              | group                                     | length, width, height in mm                           |
| requiresColdShipping    | checkbox                                  | Triggers ice pack add-on                              |
| **SEO**                 |                                           |                                                       |
| seoTitle [L]            | text                                      | Optional                                              |
| seoDescription [L]      | textarea                                  | Optional                                              |
| seoImage                | upload → Media                            | OG image                                              |
| **Status**              |                                           |                                                       |
| status                  | select                                    | `draft` \| `active` \| `archived`. Default `draft`    |
| publishedAt             | date                                      | Set when status → active                              |
| featured                | checkbox                                  | Show on homepage                                      |
| **Computed/Cached**     |                                           |                                                       |
| averageRating           | number                                    | 0–5, cached from reviews via hook                     |
| reviewCount             | number                                    | Cached                                                |

**Variant subfield structure:**

```ts
{
  sku: text (required, unique),
  optionValues: array of { name: text, value: text }, // [{name:"Size",value:"10mg"}]
  price: number (cents),
  compareAtPrice: number (cents, optional),
  stock: number,
  weight: number (grams),
  image: upload → Media (optional, overrides parent),
  isDefault: checkbox
}
```

**Access:** Read public (if status=active), write admin/staff.

**Hooks:**

- `beforeChange`: validate variants if hasVariants; set publishedAt when activating
- `afterChange`: invalidate Next.js cache for `/products/[slug]`, sync to Meilisearch

---

## Collection: Carts

Purpose: Server-side cart persistence (for logged-in users). Guests use localStorage which syncs on login.

| Field      | Type                 | Notes                                |
| ---------- | -------------------- | ------------------------------------ |
| user       | relationship → Users | Required, unique (one cart per user) |
| items      | array                | See below                            |
| couponCode | text                 | Applied coupon                       |
| updatedAt  | date                 | Auto                                 |

**Item subfield:**

```ts
{
  product: relationship → Products,
  variantSku: text (if applicable),
  quantity: number,
  addedAt: date,
  priceSnapshot: number (cents, captured at add time)
}
```

**Access:** Owner only.

---

## Collection: Wishlists

Purpose: Saved products per user. One row per user with array of products.

| Field | Type                                                                | Notes            |
| ----- | ------------------------------------------------------------------- | ---------------- |
| user  | relationship → Users                                                | Required, unique |
| items | array of { product: rel→Products, variantSku: text, addedAt: date } |                  |

**Access:** Owner only.

---

## Collection: Coupons

Purpose: Discount codes.

| Field              | Type                             | Notes                                                 |
| ------------------ | -------------------------------- | ----------------------------------------------------- |
| code               | text                             | Unique, uppercased, required                          |
| description        | text                             | Internal note                                         |
| type               | select                           | `percentage` \| `fixed_amount` \| `free_shipping`     |
| value              | number                           | For percentage: 0–100. For fixed: cents               |
| **Validity**       |                                  |                                                       |
| startsAt           | date                             | Optional                                              |
| expiresAt          | date                             | Optional                                              |
| isActive           | checkbox                         | Default true                                          |
| **Usage limits**   |                                  |                                                       |
| usageLimit         | number                           | Total uses across all customers, null = unlimited     |
| usageCount         | number                           | Auto-incremented                                      |
| perCustomerLimit   | number                           | Default 1                                             |
| **Conditions**     |                                  |                                                       |
| minimumOrderAmount | number                           | Cents, optional                                       |
| appliesTo          | select                           | `all` \| `specific_products` \| `specific_categories` |
| products           | relationship → Products (many)   | If appliesTo=specific_products                        |
| categories         | relationship → Categories (many) | If appliesTo=specific_categories                      |
| **Restrictions**   |                                  |                                                       |
| firstOrderOnly     | checkbox                         | Default false                                         |
| excludeSaleItems   | checkbox                         | Default false                                         |
| stackable          | checkbox                         | Can combine with other coupons. Default false         |

**Access:** Read public (for validation), write admin.

---

## Collection: Orders

Purpose: Completed and in-progress orders.

| Field                  | Type                                                                              | Notes                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| orderNumber            | text                                                                              | Auto-generated, human-readable e.g., `PEP-2026-00001`                                                                                       |
| user                   | relationship → Users                                                              | Nullable (guest checkout possible)                                                                                                          |
| guestEmail             | email                                                                             | If no user                                                                                                                                  |
| **Status**             |                                                                                   |                                                                                                                                             |
| status                 | select                                                                            | `pending_payment` \| `paid` \| `processing` \| `fulfilled` \| `shipped` \| `delivered` \| `cancelled` \| `refunded` \| `partially_refunded` |
| paymentStatus          | select                                                                            | `pending` \| `paid` \| `failed` \| `refunded`                                                                                               |
| fulfillmentStatus      | select                                                                            | `unfulfilled` \| `partial` \| `fulfilled`                                                                                                   |
| **Items snapshot**     |                                                                                   |                                                                                                                                             |
| items                  | array                                                                             | See below                                                                                                                                   |
| **Addresses snapshot** |                                                                                   |                                                                                                                                             |
| shippingAddress        | group                                                                             | Full address fields (snapshot, not relation)                                                                                                |
| billingAddress         | group                                                                             | Same                                                                                                                                        |
| **Totals (all cents)** |                                                                                   |                                                                                                                                             |
| subtotal               | number                                                                            | Sum of items                                                                                                                                |
| discountTotal          | number                                                                            | From coupons                                                                                                                                |
| shippingTotal          | number                                                                            |                                                                                                                                             |
| taxTotal               | number                                                                            |                                                                                                                                             |
| total                  | number                                                                            | Final charged amount                                                                                                                        |
| **Coupon**             |                                                                                   |                                                                                                                                             |
| couponCode             | text                                                                              | If applied                                                                                                                                  |
| couponDiscount         | number                                                                            | Cents                                                                                                                                       |
| **Payment**            |                                                                                   |                                                                                                                                             |
| stripePaymentIntentId  | text                                                                              |                                                                                                                                             |
| stripeChargeId         | text                                                                              |                                                                                                                                             |
| paymentMethodLast4     | text                                                                              | For display                                                                                                                                 |
| paymentMethodBrand     | text                                                                              | e.g., "visa"                                                                                                                                |
| **Shipping**           |                                                                                   |                                                                                                                                             |
| shippingMethod         | text                                                                              | e.g., "USPS Priority"                                                                                                                       |
| shippoTransactionId    | text                                                                              | After label purchase                                                                                                                        |
| trackingNumber         | text                                                                              |                                                                                                                                             |
| trackingCarrier        | text                                                                              |                                                                                                                                             |
| trackingUrl            | text                                                                              |                                                                                                                                             |
| shippedAt              | date                                                                              |                                                                                                                                             |
| deliveredAt            | date                                                                              |                                                                                                                                             |
| **Refunds**            |                                                                                   |                                                                                                                                             |
| refunds                | array of { amount: number, reason: text, refundedAt: date, stripeRefundId: text } |                                                                                                                                             |
| **Internal**           |                                                                                   |                                                                                                                                             |
| notes                  | textarea                                                                          | Admin-only                                                                                                                                  |
| customerNotes          | textarea                                                                          | What customer wrote at checkout                                                                                                             |
| ipAddress              | text                                                                              | For fraud review                                                                                                                            |
| **Compliance**         |                                                                                   |                                                                                                                                             |
| ageVerified            | checkbox                                                                          | If applicable                                                                                                                               |
| disclaimerAcknowledged | checkbox                                                                          | Customer ticked "research use only" box                                                                                                     |

**Item subfield:**

```ts
{
  product: relationship → Products,
  productSnapshot: json,  // full product data at time of order
  variantSku: text,
  quantity: number,
  unitPrice: number (cents),
  lineTotal: number (cents),
  weight: number (grams)
}
```

**Access:**

- Read: owner or admin
- Create: server only (via checkout flow)
- Update: admin only (status changes etc.)
- Delete: never (financial records)

**Hooks:**

- `beforeChange` (create): generate orderNumber
- `afterChange`: send status email, log to EmailLogs, fire analytics event
- On status → shipped: send tracking email
- On status → delivered: schedule review request email +7 days

---

## Collection: Reviews

| Field            | Type                    | Notes                                  |
| ---------------- | ----------------------- | -------------------------------------- |
| product          | relationship → Products | Required                               |
| user             | relationship → Users    | Required                               |
| order            | relationship → Orders   | Required (verified purchase)           |
| rating           | number                  | 1–5, required                          |
| title            | text                    | Required                               |
| body             | textarea                | Required, max 2000 chars               |
| status           | select                  | `pending` \| `approved` \| `rejected`  |
| helpfulCount     | number                  | Default 0                              |
| verifiedPurchase | checkbox                | Auto-true if linked to fulfilled order |
| adminResponse    | textarea                | Optional reply                         |
| adminResponseAt  | date                    |                                        |

**Access:**

- Read public: only if status=approved
- Create: authenticated user with delivered order containing the product
- Update own: only if status=pending
- Update any: admin

**Hooks:**

- `afterChange`: recompute product.averageRating and reviewCount

---

## Collection: BlogPosts

| Field              | Type                 | Notes                  |
| ------------------ | -------------------- | ---------------------- |
| title [L]          | text                 | Required               |
| slug               | text                 | Unique                 |
| excerpt [L]        | textarea             |                        |
| content [L]        | richText             | Required               |
| coverImage         | upload → Media       |                        |
| author             | relationship → Users | Required               |
| categories         | array of text        | Tags                   |
| status             | select               | `draft` \| `published` |
| publishedAt        | date                 |                        |
| seoTitle [L]       | text                 |                        |
| seoDescription [L] | textarea             |                        |
| readingTime        | number               | Auto-computed, minutes |

**Access:** Read public (if published), write staff/admin.

---

## Collection: Pages

Purpose: CMS-managed static pages (About, Shipping Policy, etc.).

| Field              | Type     | Notes                  |
| ------------------ | -------- | ---------------------- |
| title [L]          | text     |                        |
| slug               | text     | Unique                 |
| content [L]        | richText | Block-based ideally    |
| status             | select   | `draft` \| `published` |
| seoTitle [L]       | text     |                        |
| seoDescription [L] | textarea |                        |

---

## Collection: Media

Purpose: All uploads (images, PDFs for COAs).

| Field                                              | Type | Notes               |
| -------------------------------------------------- | ---- | ------------------- |
| alt [L]                                            | text | Required for images |
| caption [L]                                        | text | Optional            |
| (auto) filename, mimeType, filesize, width, height |      | Payload-managed     |

**Upload config:** Use Payload's `@payloadcms/storage-s3` adapter pointed at Cloudflare R2.

**Image sizes (auto-generated):**

- thumbnail: 400x400
- card: 768x768
- hero: 1920x1080
- og: 1200x630

---

## Collection: ShippingZones

Purpose: Define shipping rates by destination.

| Field     | Type          | Notes                                |
| --------- | ------------- | ------------------------------------ |
| name      | text          | e.g., "US Lower 48", "Alaska/Hawaii" |
| countries | array of text | ISO codes                            |
| states    | array of text | US state codes                       |
| methods   | array         | See below                            |
| isActive  | checkbox      |                                      |

**Method subfield:**

```ts
{
  name: text,  // "Standard", "Express"
  carrier: text,  // "USPS", "UPS"
  serviceLevel: text,  // "Priority", "Ground"
  baseRate: number (cents),
  perPoundRate: number (cents),
  freeOverAmount: number (cents, optional),
  estimatedDays: text,  // "3-5 business days"
  isActive: checkbox
}
```

---

## Collection: ContactMessages

Purpose: Inbox from contact form.

| Field     | Type                 | Notes                          |
| --------- | -------------------- | ------------------------------ |
| name      | text                 |                                |
| email     | email                |                                |
| subject   | text                 |                                |
| message   | textarea             |                                |
| status    | select               | `new` \| `replied` \| `closed` |
| repliedBy | relationship → Users |                                |
| repliedAt | date                 |                                |
| ipAddress | text                 |                                |

---

## Collection: EmailLogs

Purpose: Audit trail of all transactional emails sent.

| Field        | Type                  | Notes                                                                                                                                  |
| ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| to           | email                 |                                                                                                                                        |
| type         | select                | `welcome` \| `order_confirmation` \| `shipped` \| `delivered` \| `refund` \| `password_reset` \| `review_request` \| `low_stock_admin` |
| subject      | text                  |                                                                                                                                        |
| status       | select                | `sent` \| `delivered` \| `bounced` \| `complained` (from Resend webhook)                                                               |
| resendId     | text                  |                                                                                                                                        |
| relatedOrder | relationship → Orders |                                                                                                                                        |
| relatedUser  | relationship → Users  |                                                                                                                                        |
| sentAt       | date                  |                                                                                                                                        |

---

## Global: SiteSettings

Singleton document for site-wide config.

| Field                 | Type                                   | Notes                    |
| --------------------- | -------------------------------------- | ------------------------ |
| siteName [L]          | text                                   |                          |
| logo                  | upload → Media                         |                          |
| favicon               | upload → Media                         |                          |
| contactEmail          | email                                  |                          |
| supportEmail          | email                                  |                          |
| businessAddress       | group                                  | For CAN-SPAM footer      |
| socialLinks           | array of { platform: text, url: text } |                          |
| defaultSeoImage       | upload → Media                         |                          |
| announcementBar [L]   | text                                   | Top banner content       |
| announcementBarActive | checkbox                               |                          |
| maintenanceMode       | checkbox                               | Toggles maintenance page |

---

## Global: Header / Footer

Configurable navigation, columns, links.

---

## Global: Homepage

Block-based: hero, featured products, categories grid, testimonials, blog teaser, newsletter signup.

---

## Relationships diagram (text)

```
Users
 ├── has many Addresses
 ├── has one Cart
 ├── has one Wishlist
 ├── has many Orders
 ├── has many Reviews
 └── has many BlogPosts (if staff)

Products
 ├── belongs to many Categories
 ├── has many Reviews
 ├── appears in Cart.items
 ├── appears in Wishlist.items
 └── appears in Order.items (snapshot)

Orders
 ├── belongs to User (optional)
 ├── has many items (snapshots of Products)
 ├── has many Refunds (subfield)
 └── related to ShippingZone via method
```

## Indexes to create

Payload auto-indexes `id`. Add manual indexes for:

- `Users.email` (unique)
- `Products.slug` (unique)
- `Products.status` + `Products.publishedAt`
- `Orders.user` + `Orders.createdAt`
- `Orders.orderNumber` (unique)
- `Coupons.code` (unique)
- `Reviews.product` + `Reviews.status`

---

## Schema additions from reference site audit

### SiteSettings Global — additional fields

Add to existing SiteSettings global:

| Field                  | Type                                | Notes                                                      |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------- |
| ordersEmail            | email                               | Displayed in header + footer; routes order notifications   |
| supportEmail           | email                               | Displayed in header + footer; routes support notifications |
| phone                  | text                                | E.164 or display format, shown in header                   |
| footerDisclaimer [L]   | richText                            | Full FDA/RUO disclaimer paragraph in footer                |
| **Promo Popup**        |                                     |                                                            |
| promoPopupActive       | checkbox                            | Default false                                              |
| promoPopupDesktopImage | upload → Media                      |                                                            |
| promoPopupMobileImage  | upload → Media                      |                                                            |
| promoPopupExpireDays   | number                              | Days before showing again. Default 7                       |
| promoPopupCoupons      | array: { label, code, description } | Max 3                                                      |

### Orders Collection — additional field

| Field         | Type | Notes                                                   |
| ------------- | ---- | ------------------------------------------------------- |
| affiliateCode | text | Rewardful referral token captured at checkout; nullable |

### Products Collection — additional notes

**Free shipping threshold:** Managed in SiteSettings global as `freeShippingThreshold` (cents, integer). Display on product pages and cart as "Add $X more for free 2-day shipping."

### New Global: Navigation

To manage header nav and footer links from Payload admin rather than hardcoded:

| Field             | Type                                                                         | Notes                        |
| ----------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| headerLinks       | array: { label [L], url, children: array of { label [L], url } }             | Supports 1 level of dropdown |
| footerQuickLinks  | array: { label [L], url }                                                    |                              |
| footerPolicyLinks | array: { label [L], url }                                                    |                              |
| footerSocials     | array: { platform: select (facebook/instagram/youtube/twitter/tiktok), url } |                              |
