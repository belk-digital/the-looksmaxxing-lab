# LEGAL-USA.md — Peptides Compliance for USA Market

> **This is not legal advice.** Hire a US attorney experienced in FDA / FTC / e-commerce before launch. This file lists the issues you must research and address.

## The honest reality

In the USA, "peptides" e-commerce splits into three legal categories. The category determines your payment processor options, your labeling, your liability, and your business viability.

### Category A: Cosmetic peptides (LOWEST RISK)

Topical creams, serums, skincare with peptides like copper peptides, Matrixyl, Argireline.

- Regulated as cosmetics by FDA (much lighter touch than drugs)
- Cannot claim to treat/cure/prevent any disease (that makes it a drug)
- Stripe, PayPal, Square: all accept
- Standard merchant account works
- Standard hosting works

### Category B: Dietary supplement peptides (MEDIUM RISK)

Ingestible products like collagen peptides, whey peptides, creatine.

- Regulated under DSHEA (Dietary Supplement Health and Education Act)
- Must carry FDA "Supplement Facts" panel
- Cannot claim disease treatment ("structure/function claims" only)
- Manufacturing must be cGMP-compliant
- Stripe: generally accepts with proper labeling
- May trigger additional underwriting

### Category C: "Research peptides" (HIGH RISK / GRAY MARKET)

BPC-157, TB-500, semaglutide, tirzepatide, GHK-Cu, MOTS-C, ipamorelin, sermorelin, etc.

- Not FDA-approved for human use
- Sold under "for research use only, not for human consumption" labeling
- FDA has issued warning letters to many vendors
- **Stripe will terminate** when they identify the products (often within months)
- PayPal: terminates and may hold funds 180 days
- You need a **high-risk merchant processor**: NMI gateway with a high-risk reseller, Authorize.net via high-risk MID, CCBill, Easy Pay Direct, eMerchant Authority
- Processing fees: 4–6% (vs Stripe's 2.9%)
- Rolling reserves common (5–10% held for 6 months)
- Chargeback ratio scrutiny is intense
- Some states have additional restrictions
- Federal investigations have hit large vendors

**You must decide which category before Phase 0.** If A or B, this guide works as-is. If C, you need:

- A US attorney consultation BEFORE launch
- LLC formed in a friendly state (Wyoming/Delaware common)
- High-risk merchant account application (4–8 week approval)
- Different payment integration (most use NMI's Collect.js or Authorize.net Accept Hosted)
- Aggressive disclaimer policy (see template below)
- Age gate (21+)
- Restricted shipping list per state law
- Stricter content moderation on reviews (no testimonials about ingestion)

## Required disclaimers (Category B and C)

Display prominently on site footer, product pages, and at checkout:

> **FDA Disclaimer:** These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.

For Category C only, also add:

> **Research Use Only:** Products on this site are sold for laboratory and research purposes only. They are not intended for human or animal consumption. By purchasing, you certify that you are at least 21 years of age and a qualified researcher or licensed professional.

## FTC requirements (all categories)

- No deceptive advertising
- All claims must be substantiated
- Customer testimonials need clear disclosure if compensated
- Refund/return policy must be clear and honored
- Made-in / origin claims must be accurate

## State-specific issues

- **California Prop 65:** May require warning labels for certain ingredients. Check your formulations against the Prop 65 list.
- **New York:** Tighter supplement regulations being discussed.
- **Florida, Texas, Tennessee:** Generally peptide-friendly.
- **Some states** restrict shipping of certain compounds. Maintain a shipping restriction list per SKU.

## Required website pages

You must have all of these published before accepting orders:

1. **Privacy Policy** — covers PII, payment data, cookies, analytics, third-party sharing (Stripe, Resend, etc.). California (CCPA/CPRA) and Virginia (VCDPA) require specific language for state residents.
2. **Terms of Service** — limitation of liability, governing law, dispute resolution (arbitration clause recommended)
3. **Shipping Policy** — processing time, carriers, restrictions, lost package policy
4. **Return & Refund Policy** — window (commonly 30 days unopened), who pays return shipping, refund timeline
5. **Cookie Policy** — separate from Privacy or combined; needed if any tracking cookies
6. **Disclaimer / FDA Statement** — see above
7. **Contact** — physical business address required by CAN-SPAM for emails

Use Termly, iubenda, or a lawyer to draft. Have a lawyer review.

## CAN-SPAM compliance (all marketing emails)

- Physical address in every email footer
- Unsubscribe link in every email, honored within 10 business days
- No deceptive subject lines
- No "from" header spoofing

Resend handles unsubscribe links if you use their broadcasts feature.

## Sales tax

USA sales tax is per-state, with economic nexus thresholds (typically $100K or 200 transactions per state per year).

- **Stripe Tax** automates this — turn it on in your Stripe dashboard ($120/year + 0.5% per transaction in states where active)
- **TaxJar** is the alternative
- Without automation, you'll register and remit in each state manually — impractical past a few thousand orders

For a US LLC selling supplements, you almost certainly need to collect sales tax in your home state from day one. Other states once you cross thresholds.

## Data privacy laws

- **CCPA / CPRA** (California): "Do Not Sell My Personal Information" link required if you sell or share data
- **VCDPA** (Virginia), **CPA** (Colorado), **CTDPA** (Connecticut), **UCPA** (Utah), etc. — similar
- **GDPR** does NOT apply if you only target US customers AND don't track EU residents. If you ship anywhere internationally or use EU-hosted analytics that captures EU visitors, it applies.

Cookie consent banner: required in EU; "Do Not Sell" toggle required in California.

## Age verification

- Category C: 21+ age gate at site entry AND at checkout
- Category B: 18+ recommended
- Category A: not required

Age gate implementation in `/docs/FEATURES.md` under F-44.

## Insurance

- **Product liability insurance:** strongly recommended for B and C, often required by manufacturers
- **Cyber liability insurance:** strongly recommended once you store customer PII
- Typical cost: $500–3000/year for a small operation

## Pre-launch legal checklist

- [ ] Business entity formed (LLC or Corp), EIN obtained
- [ ] Business bank account opened
- [ ] Resale certificate / seller's permit in home state
- [ ] Merchant account approved (high-risk if Category C)
- [ ] Product liability insurance bound
- [ ] All 7 policy pages live and lawyer-reviewed
- [ ] FDA disclaimer on every product page
- [ ] COA (Certificate of Analysis) accessible per product
- [ ] Age gate live (if applicable)
- [ ] Sales tax registration in home state
- [ ] Stripe Tax or TaxJar enabled
- [ ] Cookie consent banner live
- [ ] Privacy request workflow tested (CCPA "delete my data")
- [ ] Email unsubscribe flow tested
- [ ] Domain WHOIS privacy enabled
- [ ] Trademark search done for brand name

## Honest recommendation

If this is your first e-commerce business AND Category C is the plan: **start with Category A or B instead.** The legal, payment, and operational complexity of Category C is genuinely difficult. Many Category C stores die within 12 months from a Stripe ban, a chargeback spike, or an FDA warning letter. Build the skills and revenue on safer ground first, then expand if the business case still makes sense.

If you're committed to Category C: spend $2–5K on a real attorney consultation before writing code. The lawyer fee is the cheapest insurance you'll buy.
