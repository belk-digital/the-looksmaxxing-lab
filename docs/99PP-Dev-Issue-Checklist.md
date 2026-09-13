# 99 PURITY PEPTIDES — DEV ISSUE CHECKLIST

**Site:** https://99puritypeptides.com
**Source data:** Google Search Console, 13 May – 12 Aug 2026
**Issued:** 15 Aug 2026 · Belk Digital
**Total issues:** 47

---

## HOW TO USE THIS

- Work **top to bottom.** Sections are ordered by impact, and several later items depend on earlier ones being done.
- Tick `[x]` as you go. Each issue has a **Verify** step — don't tick until verification passes.
- Anything marked 🔴 is blocking. 🟡 is high priority. 🟢 is standard.
- If an issue can't be fixed as written, note it in the **Blockers log** at the bottom rather than skipping silently.

**Progress tracker**

| Section | Items | Done |
|---|---|---|
| 1. URL duplication (CRITICAL) | 8 | ☐ |
| 2. Index coverage & crawl | 9 | ☐ |
| 3. Structured data / schema | 10 | ☐ |
| 4. Metadata & titles | 8 | ☐ |
| 5. Internal linking | 5 | ☐ |
| 6. AI crawler access | 2 | ☐ |
| 7. Performance & verification | 5 | ☐ |
| **TOTAL** | **47** | **☐** |

---

# SECTION 1 — URL DUPLICATION 🔴 CRITICAL

**The problem:** 74 URLs exist as both `/path` and `/path/`. Both versions are indexed and ranking independently. This splits ranking signal across 301,200 impressions — **80.6% of all site impressions.**

Do this section first. Everything else is measured after it.

---

### ☐ 1.1 🔴 Decide and document the canonical URL convention

**Recommended:** **non-trailing-slash** (`/page`, not `/page/`).

Reason: Google is currently surfacing the non-slash form in live results, and the majority of `/product/` URLs already use it.

Whatever you pick, it must apply to **all** of these systems:
- Next.js frontend
- Django backend
- `/product/` and `/es/producto/` templates
- `/es/` language tree

**Verify:** Convention written down and shared with the team before any code is written.

---

### ☐ 1.2 🔴 Set framework-level trailing slash config

```js
// next.config.js
module.exports = {
  trailingSlash: false,
}
```

⚠️ **This alone is not enough.** It changes routing. It does **not** update canonical tags or the sitemap. Items 1.3 and 1.4 are separate.

Django: check `APPEND_SLASH` in settings and any `CommonMiddleware` behaviour. The two systems must agree — the `/es/` tree showing the same duplication suggests they currently don't.

**Verify:** Request `/peptide-calculator/` in staging → 301 to `/peptide-calculator`.

---

### ☐ 1.3 🔴 Implement 301 redirects for all 74 duplicate paths

**Rules:**
- **Single hop only.** No chains. `/page/` → `/page`, never `/page/` → `/page/index` → `/page`.
- 301 (permanent), not 302.
- Preserve query strings.
- Preserve the `/es/` prefix — do not redirect ES pages to EN.

**Full list — all 74 paths:**

| # | Path | Impressions | Clicks | Done |
|---|---|---|---|---|
| 1 | /klow-peptide-blend-research-guide-2026 | 62,770 | 940 | ☐ |
| 2 | /peptide-calculator | 59,947 | 1,511 | ☐ |
| 3 | /peptide-reconstitution-calculator | 38,948 | 928 | ☐ |
| 4 | /retatrutide-cancer-research-preclinical-studies | 16,200 | 196 | ☐ |
| 5 | /ghk-cu-copper-peptide-research-guide | 14,496 | 87 | ☐ |
| 6 | /retatrutide-and-carbs | 10,621 | 108 | ☐ |
| 7 | /faq | 8,259 | 18 | ☐ |
| 8 | /retatrutide-peptide-research-guide | 7,673 | 72 | ☐ |
| 9 | /shop | 6,806 | 164 | ☐ |
| 10 | /tesamorelin-visceral-fat-research | 5,823 | 2 | ☐ |
| 11 | /peptide-calculator-reconstitution-guide | 5,725 | 39 | ☐ |
| 12 | /product/ss-31-elamipretide | 5,720 | 120 | ☐ |
| 13 | /es/peptide-calculator | 5,544 | 211 | ☐ |
| 14 | /reconstituted-peptide-stability-storage | 4,768 | 10 | ☐ |
| 15 | /about-us | 4,716 | 40 | ☐ |
| 16 | /affiliate-registration | 4,450 | 87 | ☐ |
| 17 | /contact-us | 3,671 | 50 | ☐ |
| 18 | /retatrutide-weight-loss-research-guide-2026 | 3,637 | 1 | ☐ |
| 19 | /es/peptide-reconstitution-calculator | 3,311 | 88 | ☐ |
| 20 | /blog | 3,106 | 7 | ☐ |
| 21 | /product/retatrutide | 2,863 | 187 | ☐ |
| 22 | /product/semaglutide | 2,494 | 55 | ☐ |
| 23 | /es/peptide-calculator-reconstitution-guide | 2,017 | 13 | ☐ |
| 24 | /certificates | 1,629 | 25 | ☐ |
| 25 | /research-peptide-storage-best-practices | 1,228 | 1 | ☐ |
| 26 | /es | 1,100 | 52 | ☐ |
| 27 | /es/shop | 1,062 | 20 | ☐ |
| 28 | /es/retatrutide-peptide-research-guide | 909 | 3 | ☐ |
| 29 | /es/retatrutide-cancer-research-preclinical-studies | 904 | 23 | ☐ |
| 30 | /tesamorelin-visceral-fat-reduction-percentage | 887 | 4 | ☐ |
| 31 | /es/reconstituted-peptide-stability-storage | 879 | 8 | ☐ |
| 32 | /es/tesamorelin-visceral-fat-research | 748 | 5 | ☐ |
| 33 | /es/certificates | 613 | 30 | ☐ |
| 34 | /bpc-157-tb-500-stack-research | 557 | 0 | ☐ |
| 35 | /es/faq | 547 | 4 | ☐ |
| 36 | /es/research-peptide-storage-best-practices | 545 | 3 | ☐ |
| 37 | /es/ghk-cu-copper-peptide-research-guide | 472 | 7 | ☐ |
| 38 | /product/glow | 467 | 9 | ☐ |
| 39 | /what-are-research-peptides-complete-laboratory-guide-2026 | 452 | 1 | ☐ |
| 40 | /es/about-us | 441 | 14 | ☐ |
| 41 | /medical-disclaimer | 407 | 0 | ☐ |
| 42 | /collagen-peptides-benefits | 394 | 0 | ☐ |
| 43 | /top-peptides-for-metabolic-studies | 358 | 1 | ☐ |
| 44 | /product/mt-1-10mg | 314 | 6 | ☐ |
| 45 | /product/pt-141-bremelanotide | 313 | 4 | ☐ |
| 46 | /collagen-peptides-vs-peptide-therapy-skin | 282 | 2 | ☐ |
| 47 | /es/what-are-research-peptides-complete-laboratory-guide-2026 | 281 | 5 | ☐ |
| 48 | /product/bac-water-bacteriostatic-water | 221 | 0 | ☐ |
| 49 | /product/snap-8 | 158 | 0 | ☐ |
| 50 | /product/bpc-157-spray | 143 | 4 | ☐ |
| 51 | /product/semax | 118 | 1 | ☐ |
| 52 | /privacy-policy | 106 | 0 | ☐ |
| 53 | /es/blog | 93 | 2 | ☐ |
| 54 | /product/selank | 91 | 2 | ☐ |
| 55 | /es/retatrutide-and-carbs | 82 | 1 | ☐ |
| 56 | /product/5-amino-1mq | 80 | 3 | ☐ |
| 57 | /product/pt-141-spray | 74 | 2 | ☐ |
| 58 | /product/mt-2-melanotan-ii | 73 | 1 | ☐ |
| 59 | /es/refund-policy | 71 | 0 | ☐ |
| 60 | /es/klow-peptide-blend-research-guide-2026 | 56 | 1 | ☐ |
| 61 | /product/selank-spray | 54 | 1 | ☐ |
| 62 | /product/ghk-cu | 54 | 1 | ☐ |
| 63 | /product/mots-c | 52 | 0 | ☐ |
| 64 | /terms-and-conditions | 48 | 0 | ☐ |
| 65 | /es/contact-us | 47 | 0 | ☐ |
| 66 | /product/cjc-1295-ipamorelin | 36 | 0 | ☐ |
| 67 | /product/tirzepatide | 34 | 0 | ☐ |
| 68 | /product/cagrilintide | 34 | 1 | ☐ |
| 69 | /shipping-policy | 33 | 1 | ☐ |
| 70 | /product/10-needles | 32 | 1 | ☐ |
| 71 | /es/collagen-peptides-vs-peptide-therapy-skin | 17 | 0 | ☐ |
| 72 | /es/collagen-peptides-benefits | 16 | 0 | ☐ |
| 73 | /product/bpc-157 | 14 | 0 | ☐ |
| 74 | /es/tesamorelin-visceral-fat-reduction-percentage | 9 | 0 | ☐ |

**Note:** this list is what GSC recorded impressions for. A wildcard rule is better than 74 individual rules — but crawl afterwards to confirm nothing outside the list breaks.

**Verify:** `curl -I` each of the top 20 → single 301, correct `Location` header, no chain.

---

### ☐ 1.4 🔴 Update canonical tags site-wide

Every page must emit `<link rel="canonical">` pointing to the **non-slash absolute URL**.

- Self-referencing canonical on every page.
- Absolute, not relative: `https://99puritypeptides.com/peptide-calculator`
- `/es/` pages canonical to their **own** `/es/` URL, not the EN equivalent.

**Verify:** View source on 10 pages across EN, ES, product, and blog templates. Canonical matches the loaded URL exactly, no trailing slash.

---

### ☐ 1.5 🔴 Regenerate XML sitemap with canonical URLs only

- Only non-slash URLs.
- No redirected URLs.
- No noindexed URLs.
- No 404s.
- `lastmod` accurate.

**Verify:** Every URL in the sitemap returns 200 with no redirect. Sitemap URL count matches indexable page count.

---

### ☐ 1.6 🔴 Update all internal links to canonical form

**Do not rely on redirects for internal navigation.** Every internal link — nav, footer, breadcrumbs, in-body, CTAs, sitemaps, hreflang — must point at the final non-slash URL.

Includes hardcoded links in content/CMS body fields.

**Verify:** Crawl the site. **Zero internal links returning 3xx.** This is a hard pass/fail.

---

### ☐ 1.7 🔴 Staging validation before production

Crawl staging and confirm:
- One canonical URL per path
- No redirect chains (>1 hop)
- No canonical/URL mismatches
- No internal links to redirects
- Sitemap matches canonicals exactly

**Verify:** Clean crawl report attached to the ticket.

---

### ☐ 1.8 🔴 Production deploy + resubmit

- **Do not deploy on a Friday.** Have a rollback ready.
- Post-deploy crawl immediately.
- Resubmit sitemap in Google Search Console.
- Resubmit sitemap in Bing Webmaster Tools (after §2.9).
- Request indexing for the top 20 URLs.

⚠️ **Expect an impressions dip in days 3–7.** That's normal re-indexing behaviour after a large redirect deployment, not a failure. Don't roll back for it.

**Verify:** Production crawl clean; sitemaps resubmitted; indexing requested.

---

# SECTION 2 — INDEX COVERAGE & CRAWL 🔴

**The problem:** 983 URLs not indexed vs 436 indexed. Only 31% of known URLs are in Google's index. Not-indexed count jumped from 266 → 783 overnight on 11 July, then to 978 on 25 July.

| Reason | Source | Validation | Pages |
|---|---|---|---|
| Crawled – currently not indexed | Google | **FAILED** | 310 |
| Excluded by 'noindex' tag | Website | Not started | 259 |
| Page with redirect | Website | Not started | 184 |
| Blocked by robots.txt | Website | **FAILED** | 145 |
| Alternative page with proper canonical | Website | Not started | 40 |
| Not found (404) | Website | Not started | 6 |
| Discovered – not indexed | Google | Passed | 36 |
| Duplicate without user-selected canonical | Website | Not started | 1 |
| Duplicate, Google chose different canonical | Google | Not started | 2 |
| Indexed, though blocked by robots.txt | Website | Not started | **3** |

---

### ☐ 2.1 🔴 Find what shipped on 10–11 July

Not-indexed went **266 → 783 in one day.** Site impressions fell from 7,014/day (8 Jul) to 2,495/day (22 Jul). These are connected.

Check:
- Git log for 9–11 July
- CMS/plugin update history
- Deployment logs
- robots.txt change history
- Sitemap generation changes
- Any bulk content or taxonomy operation

**This is root cause. Everything else in this section is symptom management.**

**Verify:** The deployment is identified and documented in the ticket, with a note on whether the exclusion was intentional.

---

### ☐ 2.2 🔴 Audit robots.txt line by line — 145 pages blocked

Validation status is **FAILED**. Blocking 145 pages is rarely intentional at that scale.

For each `Disallow` rule, document: what it blocks, how many URLs, and why.

Legitimate: `/cart`, `/checkout`, `/account`, `/wp-admin`, search result pages, faceted filter params.
Not legitimate: content pages, product pages, category pages, `/es/` pages.

**Verify:** Annotated robots.txt in the ticket with a justification per line.

---

### ☐ 2.3 🔴 Fix 3 pages "Indexed, though blocked by robots.txt"

These rank without Google being able to read them. Either unblock (if they should be indexed) or add `noindex` and remove the robots block (if they shouldn't) — **you cannot noindex a page Google can't crawl.**

**Verify:** All 3 resolved; GSC report clears on next crawl.

---

### ☐ 2.4 🟡 Triage 310 "Crawled – currently not indexed"

Google fetched these and declined to index them. Validation **FAILED**.

**Cross-reference against the §1.3 duplicate list first** — many are likely slash variants and will resolve automatically after Section 1. Re-check this count 2 weeks post-deploy before treating it as a content problem.

Remaining after that = thin/duplicate content. Escalate to the content team, don't fix in code.

**Verify:** List exported, cross-referenced against duplicates, remainder handed off with counts.

---

### ☐ 2.5 🟡 Confirm 259 `noindex` exclusions are intentional

Expected: cart, checkout, account, thank-you, filtered/faceted views, tag archives, paginated duplicates.
Unexpected: any product, content, or `/es/` page.

**Verify:** List exported and reviewed; any unintended noindex removed.

---

### ☐ 2.6 🟡 Verify 184 "Page with redirect" resolve after Section 1

Likely the slash variants. Should clear once §1.3 ships and Google re-crawls.

**Verify:** Re-check 2 weeks after deploy. Escalate if still elevated.

---

### ☐ 2.7 🟢 Fix 6 × 404 errors

Find inbound and internal references. 301 to the closest relevant page, or restore. **Do not blanket-redirect to homepage** — Google treats that as a soft 404.

**Verify:** All 6 return 200 or a relevant 301.

---

### ☐ 2.8 🟢 Resolve 2 "Google chose different canonical" + 1 "Duplicate without user-selected canonical"

Usually a canonical tag conflicting with what Google infers. Should resolve with §1.4.

**Verify:** Re-check after Section 1 completes.

---

### ☐ 2.9 🔴 Restore Bing Webmaster Tools access

The BWT export currently returns:
```json
{"code":"UserUnAuthorized","message":"User is unauthorized"}
```

Likely an expired delegated-access token or a lapsed site verification.

**Why this matters:** ChatGPT Search and Microsoft Copilot both retrieve through Bing's index. Broken BWT = no visibility into two AI surfaces.

Steps: re-verify site ownership → re-authenticate → confirm exports work → submit sitemap → enable IndexNow if available.

**Verify:** Search Performance export downloads successfully; sitemap accepted.

---

# SECTION 3 — STRUCTURED DATA / SCHEMA 🟡

**The problem:** Product snippet valid items are **declining** (537 → 449). Merchant listings show 41 impressions at position 1.24 with **zero clicks** — you're ranking first in a shopping surface that returns nothing because the markup is incomplete.

Current GSC errors:
- **Critical:** `Either 'offers', 'review' or 'aggregateRating' should be specified`
- Missing `offerCount` (in `offers`)
- Missing `aggregateRating`
- Missing `review`

---

### ☐ 3.1 🔴 Add `offers` to Product schema — 146 product URLs

**This clears the critical error and is the fastest fix.** It's factual data you already have.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Bronchogen",
  "sku": "...",
  "brand": { "@type": "Brand", "name": "99 Purity Peptides" },
  "offers": {
    "@type": "Offer",
    "url": "https://99puritypeptides.com/product/bronchogen",
    "priceCurrency": "USD",
    "price": "00.00",
    "priceValidUntil": "2027-08-15",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

**Verify:** Rich Results Test passes on 5 product pages. GSC critical error count drops.

---

### ☐ 3.2 🟡 Add `offerCount` for multi-variant products

Products with multiple vial sizes need `AggregateOffer`:

```json
"offers": {
  "@type": "AggregateOffer",
  "offerCount": 3,
  "lowPrice": "00.00",
  "highPrice": "00.00",
  "priceCurrency": "USD"
}
```

**Verify:** `offerCount` present on all variant products; GSC non-critical warning clears.

---

### ☐ 3.3 🟡 Add `shippingDetails` for Merchant listings eligibility

Merchant listings currently return 0 clicks at position 1.24. Complete `offers` + `shippingDetails` + `hasMerchantReturnPolicy`.

**Verify:** Merchant listing eligibility confirmed in Rich Results Test.

---

### ☐ 3.4 ⚠️ `aggregateRating` and `review` — **BLOCKED, DO NOT IMPLEMENT YET**

**Do not add these until real review data exists.**

Fabricated review markup is a structured-data spam violation and, on a commerce site in this category, a manual-action risk. The correct fix is to collect real reviews, then mark them up.

**Action for now:** scope a review-collection mechanism. Leave the markup out.

**Verify:** Confirmed with the SEO lead that no placeholder rating values were shipped.

---

### ☐ 3.5 🟡 Implement `FAQPage` schema

Apply to `/faq` and every page with an FAQ block.

- One `Question`/`Answer` pair per FAQ
- Answers 40–70 words
- Answer text must match visible page content exactly
- Don't mark up FAQs that aren't visible to users

**Verify:** Rich Results Test passes; visible content matches markup.

---

### ☐ 3.6 🟡 Add unique anchor IDs to every FAQ on `/faq`

`/faq` gets 8,259 impressions and 18 clicks (0.22% CTR) at position 6.76 — answers are being absorbed into People Also Ask. Anchored Q&As let PAA link into the page.

```html
<h3 id="peptide-purity-verification">How is peptide purity verified?</h3>
```

**Verify:** Every Q has a unique `id`; `/faq#anchor` scrolls correctly.

---

### ☐ 3.7 🟡 Implement `BreadcrumbList` site-wide

**Verify:** Breadcrumbs render visually and validate in Rich Results Test.

---

### ☐ 3.8 🟡 Add `Article` schema to research guides

Must include `datePublished`, `dateModified`, `author`, `publisher`. Dates must be real and must match what's displayed on the page.

**Verify:** Validates; dates match visible content.

---

### ☐ 3.9 🟢 Add `HowTo` schema to reconstitution steps

Applies to calculator guides and reconstitution content.

**Verify:** Validates on Rich Results Test.

---

### ☐ 3.10 🟢 Add `SoftwareApplication` schema to calculators

`/peptide-calculator` and `/peptide-reconstitution-calculator` are genuine tools and eligible.

**Verify:** Validates.

---

# SECTION 4 — METADATA & TITLES 🟡

⚠️ **Timing:** items 4.1–4.5 are content changes — coordinate with the content team.
**Items 4.6–4.8 must wait until Section 1 has been live for ~7 days.** Several near-zero-CTR pages are likely caused by URL duplication, and rewriting them before consolidation means rewriting blind.

---

### ☐ 4.1 🟡 `/klow-peptide-blend-research-guide-2026`

62,770 impressions, 1.50% CTR. Primary query `klow peptide dosage` sits at position 4.74 with 1.32% CTR.

- **Title:** `KLOW Peptide Dosage Chart & Composition (80mg Blend) | 99 Purity`
- **Meta:** `Full KLOW dosage and reconstitution chart for the 80mg four-peptide blend — BPC-157, TB-500, KPV, GHK-Cu. Exact mg ratios, mL conversions, and vial longevity. Research use only.`

⚠️ **Blocked on content:** the mg ratio on this page must be verified against the COA before publishing. See Blockers log.

---

### ☐ 4.2 🟡 `/ghk-cu-copper-peptide-research-guide`

14,496 impressions, **0.60% CTR** — worst CTR of any major page.

- **Title:** `GHK-Cu Copper Peptide: Dosage, Reconstitution & Research Data`
- **Meta:** `GHK-Cu research reference — mechanism, laboratory reconstitution math, concentration tables, and stability data. Third-party purity verification on every batch.`

---

### ☐ 4.3 🟡 `/product/bronchogen`

3,478 impressions at position 7.62, 0.72% CTR.

- **Title:** `Bronchogen (Lung Bioregulator Peptide) — 99%+ Purity, COA Verified`
- **Meta:** `Bronchogen research peptide, third-party HPLC verified at 99%+ purity. Certificate of analysis included with every vial. Research use only — not for human consumption.`

---

### ☐ 4.4 🟡 `/faq`

- **Title:** `Peptide Research FAQ — Purity, Storage, Reconstitution & COAs`

(Pair with 3.5 and 3.6 — the schema and anchors matter more than the title here.)

---

### ☐ 4.5 🟡 `/retatrutide-cancer-research-preclinical-studies`

16,200 impressions, 1.21% CTR.

- **Title:** `Retatrutide & Cancer: What Preclinical Studies Actually Show`
- **Meta:** `A plain review of the preclinical retatrutide oncology literature — what the animal and in-vitro data show, what it does not establish, and where the evidence gaps are.`

⚠️ **Requires editorial review before publishing.** This cluster carries genuine health-anxiety search intent — accuracy matters more than CTR here.

---

### ☐ 4.6 🟢 **[WAIT FOR SECTION 1]** Diagnose `/tesamorelin-visceral-fat-research`

5,823 impressions, **2 clicks, 0.03% CTR** at position 13.68.

Check: is a title/meta being emitted at all? Is Google rewriting it? Is the canonical correct? Is the duplicate variant the one actually being served?

---

### ☐ 4.7 🟢 **[WAIT FOR SECTION 1]** Diagnose `/retatrutide-weight-loss-research-guide-2026`

3,637 impressions, **1 click, 0.03% CTR** at position 7.92. Page-one position returning nothing.

---

### ☐ 4.8 🟢 **[WAIT FOR SECTION 1]** Investigate the systematic near-zero-CTR pattern

Five pages show position 4–9 with CTR under 0.25%:

| Page | Impressions | CTR | Position |
|---|---|---|---|
| /faq | 8,259 | 0.22% | 6.76 |
| /reconstituted-peptide-stability-storage | 4,768 | 0.21% | 9.60 |
| /blog | 3,106 | 0.23% | 3.18 |
| /retatrutide-weight-loss-research-guide-2026 | 3,637 | 0.03% | 7.92 |
| /tesamorelin-visceral-fat-research | 5,823 | 0.03% | 13.68 |

Random title weakness doesn't produce this. Candidate causes:
1. Meta descriptions missing → Google generating poor snippets
2. Titles being rewritten by Google (length / repetition)
3. Duplicate variant splitting the record — **most likely**

**Verify:** Re-pull GSC data 7 days post-Section-1. Document which pages resolved and which need manual fixes.

---

# SECTION 5 — INTERNAL LINKING 🟡

**Do this after Section 1** — otherwise you'll be linking to URLs that are about to change.

---

### ☐ 5.1 🔴 Zero internal links pointing at redirects

Hard requirement after §1.3. Every internal link uses the final canonical URL.

Covers: nav, footer, breadcrumbs, in-body content, CTAs, related-product widgets, CMS body fields, hreflang tags.

**Verify:** Crawl → filter internal links by status code → **zero 3xx.** Pass/fail.

---

### ☐ 5.2 🟡 Run a full crawl and export orphan pages

With 983 not-indexed URLs, there are almost certainly orphans (pages with zero internal links).

Export: orphan list, internal link count per URL, click depth from homepage, anchor text distribution.

**Targets:** hub pages 10+ inbound internal links; product pages 3+; all commercial pages ≤3 clicks from homepage.

**Verify:** Crawl report delivered to SEO lead.

---

### ☐ 5.3 🟡 Verify hreflang between EN and ES

192 `/es/` URLs exist. Confirm:
- Reciprocal hreflang (EN→ES **and** ES→EN)
- `x-default` set
- hreflang URLs use canonical non-slash form
- ES pages canonical to themselves, **not** to EN equivalents

**Verify:** No hreflang errors in GSC International Targeting.

---

### ☐ 5.4 🟢 Implement the priority internal link set

Full source→destination→anchor table is in the main sprint document, §15.1. Rules:

- Contextual in-body links only — no footer link blocks
- One link per destination per page
- Descriptive anchors (`reconstitution calculator`, not `click here`, not `best peptide calculator 2026`)
- `/es/` pages link to `/es/` pages only

---

### ☐ 5.5 🟢 Audit image alt text on the top 30 pages

Descriptive of the image content, not keyword-stuffed. Decorative images get `alt=""`.

Priority: COA images — `Certificate of analysis for {product} batch {ref} showing {X}% HPLC purity`.

---

# SECTION 6 — AI CRAWLER ACCESS 🔴

---

### ☐ 6.1 🔴 Verify robots.txt does not block AI crawlers

Given 145 pages are already unintentionally blocked, check this explicitly:

| Crawler | Serves | Allowed? |
|---|---|---|
| `GPTBot` | ChatGPT | ☐ |
| `OAI-SearchBot` | ChatGPT Search | ☐ |
| `ClaudeBot` | Claude | ☐ |
| `PerplexityBot` | Perplexity | ☐ |
| `Google-Extended` | Gemini / AI Overviews | ☐ |
| `CCBot` | Common Crawl | ☐ |
| `Bingbot` | Bing / Copilot / ChatGPT Search | ☐ |
| `Applebot-Extended` | Apple Intelligence | ☐ |

**Verify:** Each user-agent tested against robots.txt. Any block is intentional and documented.

---

### ☐ 6.2 🟡 Confirm no server-level blocking of AI crawlers

Check Cloudflare / WAF / rate-limiting rules. Bot-protection defaults frequently block AI crawlers even when robots.txt permits them.

**Verify:** Server logs show successful requests from at least GPTBot and ClaudeBot, or firewall rules confirmed permissive.

---

# SECTION 7 — PERFORMANCE & FINAL VERIFICATION 🟢

---

### ☐ 7.1 🟢 Confirm mobile Core Web Vitals stay green

**Already fixed** — mobile went from 66 URLs "needs improvement" to 100% "Good" during the data window. Current LCP issue count: 0.

**This is a regression check only. Don't spend time optimizing here.**

**Verify:** GSC CWV mobile still shows 0 poor, 0 needs-improvement after the Section 1 deploy.

---

### ☐ 7.2 🟢 Request desktop CWV data

Desktop CWV wasn't in the export. Desktop is 45% of impressions with 0.93% CTR and average position 10.18 — worth confirming it isn't a performance issue.

---

### ☐ 7.3 🟢 Final crawl — full site QA

Pass criteria:
- ☐ Zero redirect chains
- ☐ Zero internal links to 3xx
- ☐ Zero canonical/URL mismatches
- ☐ Zero 404s from internal links
- ☐ Sitemap = 100% indexable 200 URLs
- ☐ All schema validates
- ☐ hreflang reciprocal, zero errors
- ☐ CWV mobile still 100% Good

---

### ☐ 7.4 🟢 Validate all schema types in Rich Results Test

Product · FAQPage · BreadcrumbList · Article · HowTo · SoftwareApplication · Organization

**Verify:** Zero critical errors across all types.

---

### ☐ 7.5 🟢 Confirm baseline comparison metrics

Compare against locked baseline (6–12 Aug 2026):

| Metric | Baseline | Post-fix | Δ |
|---|---|---|---|
| Impressions/day | 5,656 | | |
| Clicks/day | 154.6 | | |
| CTR | 2.73% | | |
| Avg position | 7.31 | | |
| Indexed pages | 436 | | |
| Not indexed | 983 | | |
| Product snippet valid | 449 | | |
| Desktop CTR | 0.93% | | |

⚠️ Impressions and average position **will not** improve within 14 days. Consolidation takes 2–6 weeks to re-index. CTR, clicks, index coverage, and schema validity are the near-term indicators.

---

# BLOCKERS LOG

Items that can't proceed until someone outside dev unblocks them.

| # | Blocked item | Blocked by | Owner | Status |
|---|---|---|---|---|
| B1 | §4.1 KLOW title/meta | KLOW mg ratio must be verified against COA. Site currently states BPC-157 is the 50mg component; multiple competitors state GHK-Cu. | Client | ☐ |
| B2 | §3.4 aggregateRating / review schema | No real review data exists. Do not fabricate. | SEO + Client | ☐ |
| B3 | §2.9 Bing sitemap resubmission | BWT authorization must be restored first | SEO | ☐ |
| B4 | All CRO / conversion work | GA4 export not supplied | Client | ☐ |
| B5 | §4.5 Retatrutide cancer metadata | Editorial review required — sensitive health-intent queries | Content | ☐ |
| B6 | §2.4 content triage | Depends on Section 1 completing and re-crawl | Dev → Content | ☐ |

---

# SUGGESTED SPRINT ORDER

| Day | Section | Items |
|---|---|---|
| 1 | Investigation | 2.1, 2.2, 2.9, 6.1, 6.2 |
| 2 | Build (staging) | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7 |
| 3 | Ship + index fixes | 1.8, 2.3, 2.7 |
| 4–5 | Content metadata | 4.1, 4.2, 4.3, 4.4, 4.5 |
| 6–7 | Schema | 3.1, 3.2, 3.3, 3.5, 3.6, 3.7 |
| 8 | Linking + crawl | 5.1, 5.2, 5.3, 5.4 |
| 9 | Post-consolidation diagnosis | 4.6, 4.7, 4.8, 2.4, 2.5, 2.6 |
| 10–13 | Remaining schema + alt text | 3.8, 3.9, 3.10, 5.5, 2.8 |
| 14 | QA | 7.1, 7.2, 7.3, 7.4, 7.5 |

---

**Questions on any item → Belk Digital.**
Full reasoning and data behind every issue is in `99PP-14-Day-Sprint.md`.
