# 99 PURITY PEPTIDES — TECHNICAL INDEXATION & VISIBILITY AUDIT

**Site:** https://99puritypeptides.com
**Stack observed:** Next.js on Vercel (`_next/image`, `dpl_` deployment param, Sentry instrumentation, GTM-KQDPXVVW)
**Crawl date:** 25 Aug 2026 · Live pages fetched: `/affiliates`, `/blog`, `/what-is-the-repair-trio-peptide-stack`
**Performance evidence:** GSC 24 May – 23 Aug 2026, Bing WMT, Bing AI Performance (from earlier in this engagement)
**Prepared by:** Belk Digital

---

## Evidence labelling used throughout

- **[VERIFIED]** — directly observed in a live page fetch or a supplied export
- **[OBSERVED]** — a pattern seen across multiple fetches or datasets
- **[INFERRED]** — a conclusion drawn; reasoning stated
- **[NOT VERIFIED]** — could not be confirmed with available access; flagged for developer confirmation

**Access limitations:** `robots.txt` and `sitemap.xml` could not be fetched directly. JSON-LD `<script>` blocks and `<link rel="hreflang">` tags are stripped by the fetch tool's HTML extraction, so their **absence in my output is not proof of absence on the page**. Every conclusion that depends on those is marked **[NOT VERIFIED]** with a specific verification command.

---
---

# 1. EXECUTIVE DIAGNOSIS

Your blog posts are not underperforming because of content quality. **They are structurally unreachable.**

## The single finding that explains almost everything

**[VERIFIED]** `https://99puritypeptides.com/blog` renders exactly **six blog post links** in server HTML, followed by a **"Load More Posts"** button. There is no `?page=2`, no `/blog/page/2`, no numbered pagination, and no crawlable link to any seventh post.

The six posts exposed on 25 August were dated **20–23 August**. You have 60+ published posts.

**[INFERRED]** Every post older than the six most recent has **no crawlable path from the blog index**. When a new post publishes, the oldest of the six drops off the crawlable surface entirely.

This maps directly onto the GSC data:

| Live page | Impressions (3mo) | Publication age |
|---|---|---|
| /intranasal-peptide-delivery-research-guide | **2** | Recent |
| /how-peptide-labs-ensure-purity | **4** | Older |
| /telomerase-enzyme | **11** | Older |
| /research-peptide-glossary | **11** | Older |
| /semax-vs-selank | 67 | Older |
| /99-percent-peptide-purity-verification | 67 | Recent |
| /tesamorelin-visceral-fat-research | 3,537 (**−39%**) | Old, decaying |

**[INFERRED]** This is also the most likely explanation for **365 URLs at "Crawled – currently not indexed"** and for **not-indexed rising 983 → 1,050**. Google crawls a page once via the sitemap, finds it has almost no internal links pointing at it, and declines to index or re-crawl it.

## The second finding

**[VERIFIED]** Canonical tags are correct and self-referencing in non-trailing-slash form:

```
canonical: https://99puritypeptides.com/affiliates
canonical: https://99puritypeptides.com/blog
canonical: https://99puritypeptides.com/what-is-the-repair-trio-peptide-stack
```

**[INFERRED]** So the trailing-slash duplication is **not a canonical problem — it is a missing-redirect problem.** `/affiliates/` almost certainly returns **200 OK** rather than a 301. Google sees two live URLs, honours the canonical inconsistently, and both accumulate impressions separately. That is why 73 paths still carry 79.8% of impressions across duplicates despite correct canonicals.

**This changes the fix.** You do not need to rewrite canonicals. You need server-level 301s.

## The third finding

**[VERIFIED]** Sitewide footer "Explore" links, present on every page:

Home · About · Shop · Blog · FAQ · Peptide Calculator · **PATHWAY™ Genetic Test** · Certificates · **Shipping Locations** · Affiliates

**[OBSERVED]** `/locations` receives a sitewide footer link. **Not one blog post does.** Ten location pages averaging position 17.8 get more internal link equity than 60 research articles combined.

## Diagnosis summary

The site has **three functioning crawl surfaces** (shop, footer utility pages, six recent blog posts) and **one broken one** (the blog archive). Roughly 60 articles — the entire topical authority investment of this engagement — sit behind a JavaScript button.

Publishing more content into this structure will not work. **[INFERRED]** Fixing blog pagination is likely to recover more visibility than any content project currently planned.

---
---

# 2. TOP 10 MOST CRITICAL ISSUES

| # | Issue | Evidence | Priority |
|---|---|---|---|
| 1 | **Blog index exposes only 6 posts; "Load More" is JS-only with no crawlable pagination** | [VERIFIED] `/blog` fetch | **P0** |
| 2 | **No 301 from `/path/` to `/path`** — canonicals correct, redirects missing | [VERIFIED] canonicals + [VERIFIED] 73 duplicate paths in GSC | **P0** |
| 3 | **No blog category archive pages** — category filters are JS-only, no crawlable URLs | [VERIFIED] `/blog` fetch | **P0** |
| 4 | **148 pages blocked by robots.txt, validation Failed** | [VERIFIED] Coverage export | **P0** |
| 5 | **Image directory contains an unencoded space: `/99 Images/`** | [VERIFIED] all three fetches | **P0** |
| 6 | **hreflang appears absent across 192 `/es/` URLs** | [NOT VERIFIED] — see Task 9 | **P0** |
| 7 | **No breadcrumbs rendered on any page fetched** | [VERIFIED] three fetches | **P1** |
| 8 | **`meta-google: notranslate` sitewide on a bilingual site** | [VERIFIED] all three fetches | **P1** |
| 9 | **Crawlable empty parameter URL `?category=`** in sitewide nav | [VERIFIED] all three fetches | **P1** |
| 10 | **No author or reviewer attribution on articles; byline is the brand** | [VERIFIED] blog post fetch | **P1** |

---
---

# 3. GOOGLE INDEXING ISSUES

**[VERIFIED]** Coverage export, 21 Aug 2026: **538 indexed / 1,050 not indexed** — 33.9% indexed.

| Reason | Pages | Validation | Diagnosis |
|---|---|---|---|
| Crawled – currently not indexed | **365** | Not started | **[INFERRED]** Primary cause is orphaning via issue #1. Google crawled from the sitemap, found no internal links, deprioritised. |
| Excluded by 'noindex' | 259 | Not started | **[NOT VERIFIED]** — needs a list export to confirm all are intentional |
| Page with redirect | 192 | Not started | **[INFERRED]** Likely `/es/` alternates and legacy URLs |
| Blocked by robots.txt | **148** | **Failed** | **[NOT VERIFIED]** — robots.txt not fetchable; this is Task 4 |
| Alternative page with proper canonical | 40 | Not started | Expected behaviour for `/es/` pairs — benign if hreflang is correct |
| Not found (404) | 6 | Not started | Needs URL list |
| Discovered – currently not indexed | 37 | Passed | Crawl-budget symptom |
| Duplicate, Google chose different canonical | 2 | Not started | Investigate individually |
| Duplicate without user-selected canonical | 1 | Not started | Investigate |

**[OBSERVED]** Not-indexed grew from 983 to 1,050 while indexed grew 436 → 538 across the two exports. Both rising simultaneously indicates active crawling of a growing URL set that Google is only partially accepting.

**Rendering:** **[VERIFIED]** Article body content, tables, FAQs, and related-post links are all present in the server HTML response. Next.js SSR is working correctly for article content. **The rendering problem is confined to the blog index's Load More control**, not to page content generally.

---
---

# 4. BING INDEXING ISSUES

**[VERIFIED]** Bing WMT: 6,118 impressions / 134 clicks / 2.19% CTR over three months, growing 26 → 70 impressions/day.

**[VERIFIED]** Bing AI Performance: **1,321 citations over 91 days**; cited-page breadth rose from 1.6 to 3.65 per day.

**[OBSERVED]** AI citations exceed Bing search clicks by roughly **10×**.

**[INFERRED]** Bing's index is materially thinner than Google's for this site. At ~70 impressions/day against Google's ~4,400, Bing is capturing about 1.6% of the visibility. Since **ChatGPT Search and Microsoft Copilot both retrieve through Bing's index**, Bing indexation is not a minor channel — it gates two AI surfaces.

**Recommended:**
- **IndexNow implementation.** Next.js on Vercel makes this straightforward via an API route plus a key file. Bing indexes IndexNow submissions substantially faster than crawl discovery. This is the single highest-leverage Bing action.
- **Submit sitemap in BWT** and confirm it parses.
- **Pull the page-level and query-level AI Performance reports** — you know the citation count but not which pages drive it.

---
---

# 5. CRAWLABILITY ISSUES

## 5.1 🔴 P0 — Blog archive exposes six posts

**[VERIFIED]** Server HTML of `/blog` contains exactly six article links plus a "Load More Posts" control with no `href`.

**[INFERRED]** Crawl depth to any post outside the newest six is effectively infinite from the blog index. Discovery depends entirely on the sitemap plus whatever related-post links happen to point at it.

## 5.2 🔴 P0 — No blog category archives

**[VERIFIED]** `/blog` displays category filters: Product Guides · Growth research · Muscle studies · Recovery protocols · Metabolic research. None is a link. There is no `/blog/category/product-guides` URL.

**[INFERRED]** Five potential archive pages that would each provide a crawlable path to 10–20 posts do not exist. This is the cheapest available fix for orphaning after pagination.

## 5.3 🟡 P1 — "Tools" nav item has no href

**[VERIFIED]** Main nav renders `Tools` as bare text with no link, presumably a JS dropdown.

**[NOT VERIFIED]** Whether `/peptide-calculator` and `/peptide-reconstitution-calculator` are reachable from the nav in server HTML. They **are** in the footer, so a path exists — but your two highest-traffic assets (69,551 and 46,367 impressions) deserve a header link.

## 5.4 🟡 P1 — Crawlable empty parameter URL

**[VERIFIED]** Present on every page: `https://99puritypeptides.com/shop?category=`

**[INFERRED]** An empty-value parameter that resolves to the same content as `/shop`. Sitewide, this generates a duplicate of your shop page on every crawl.

## 5.5 🟢 P2 — Dynamic OG image API route

**[VERIFIED]** `https://99puritypeptides.com/api/og?title=...&description=...`

**[INFERRED]** Unique URL per page, crawlable, serving images. Minor crawl-budget consumption. Should be disallowed in robots.txt.

---
---

# 6. CANONICALIZATION ISSUES

## 6.1 The diagnosis is different from what the export suggested

**[VERIFIED]** Canonicals are correct, absolute, self-referencing, non-trailing-slash on all three pages fetched.

**[VERIFIED]** GSC Pages export still shows **73 paths existing as both `/path` and `/path/`**, carrying **332,003 impressions (79.8%)**.

**[INFERRED]** Correct canonicals plus persistent duplicate indexing means **the slashed variant is returning 200 OK, not a 301.** Google treats a canonical as a hint, not a directive; when both URLs serve identical 200 responses, it frequently indexes both.

**This is a server/routing fix, not a template fix.** See Task 2.

## 6.2 Verification the developer must run

```bash
curl -sI https://99puritypeptides.com/affiliates/ | head -3
curl -sI https://99puritypeptides.com/blog/ | head -3
curl -sI https://99puritypeptides.com/peptide-calculator/ | head -3
```

Expected after fix: `HTTP/2 301` with `location:` pointing to the non-slash URL.
If it currently returns `HTTP/2 200`, the diagnosis is confirmed.

## 6.3 Also verify

```bash
curl -sI https://www.99puritypeptides.com/ | head -3
curl -sI http://99puritypeptides.com/ | head -3
```

**[NOT VERIFIED]** www and HTTP variants. Both should 301 to `https://99puritypeptides.com/`.

---
---

# 7. SITEMAP ISSUES

**[NOT VERIFIED]** — `sitemap.xml` could not be fetched.

**[INFERRED]** A sitemap almost certainly exists and includes older blog posts, because those posts are indexed despite having no crawlable internal path. Discovery is happening via sitemap; **indexation is failing for lack of internal link signals.**

**Developer must verify:**
1. Does `/sitemap.xml` return 200 and valid XML?
2. Is it a sitemap index or a single file?
3. Does it contain all 60+ blog posts?
4. Are all URLs in **non-trailing-slash canonical form**?
5. Are any redirected, noindexed, or 404 URLs present?
6. Is `lastmod` accurate — or is it regenerated on every deploy? **[INFERRED]** A `lastmod` that updates on unrelated deploys trains Google to ignore it.
7. Are the ten `/locations/*` pages included?
8. Are `/es/` URLs included with correct `xhtml:link` alternates?

**Recommended segmentation:** `sitemap-pages.xml`, `sitemap-blog.xml`, `sitemap-products.xml`, `sitemap-es.xml` under a `sitemap.xml` index. Segmentation makes GSC's per-sitemap coverage reporting usable for diagnosis — with one flat sitemap you cannot see which content type is failing.

---
---

# 8. ROBOTS.TXT ISSUES

**[NOT VERIFIED]** — could not be fetched.

**[VERIFIED]** Coverage export: **148 pages blocked by robots.txt, validation status Failed** (up from 145).

**[VERIFIED]** The previously reported "Indexed, though blocked by robots.txt" count has resolved to **0**.

**Developer must fetch and annotate every line.** Legitimate disallows for this stack: `/api/` (except `/api/og` if you want OG images fetchable), `/login`, `/register`, `/cart`, `/checkout`, `/account`, `/_next/static/chunks` is **not** legitimate — blocking JS/CSS breaks rendering.

**Must explicitly verify these are NOT blocked:**

| User-agent | Serves |
|---|---|
| `Googlebot` | Google |
| `Bingbot` | Bing, Copilot, ChatGPT Search |
| `GPTBot` | ChatGPT |
| `OAI-SearchBot` | ChatGPT Search |
| `ClaudeBot` | Claude |
| `PerplexityBot` | Perplexity |
| `Google-Extended` | Gemini / AI Overviews |
| `CCBot` | Common Crawl |

**[INFERRED]** Given you are receiving 1,321 Bing AI citations, `Bingbot` is clearly not blocked. The others are unconfirmed.

**Should be added:**
```
Disallow: /api/
Disallow: /shop?category=
Sitemap: https://99puritypeptides.com/sitemap.xml
```

---
---

# 9. HREFLANG / ENGLISH-SPANISH ISSUES

**[VERIFIED]** A language switcher renders as `en` / `es` text in the header and footer of every page.

**[VERIFIED]** No `hreflang` attributes appeared in the extracted output of any of the three fetches.

**[NOT VERIFIED]** — `<link rel="alternate" hreflang="...">` tags live in `<head>` and are stripped by the extraction method. **Absence in my output is not proof of absence.**

**Verification command:**
```bash
curl -s https://99puritypeptides.com/blog | grep -i 'hreflang'
curl -s https://99puritypeptides.com/es/blog | grep -i 'hreflang'
```

**Scale of exposure:** 192 `/es/` URLs carrying 31,288 impressions and 797 clicks. The Spanish calculator cluster is the fastest-growing in the account (`calculadora de peptidos` +846 impressions).

**Required implementation, if absent:**

```html
<!-- On https://99puritypeptides.com/peptide-calculator -->
<link rel="alternate" hreflang="en" href="https://99puritypeptides.com/peptide-calculator" />
<link rel="alternate" hreflang="es" href="https://99puritypeptides.com/es/peptide-calculator" />
<link rel="alternate" hreflang="x-default" href="https://99puritypeptides.com/peptide-calculator" />

<!-- On https://99puritypeptides.com/es/peptide-calculator — MUST be reciprocal -->
<link rel="alternate" hreflang="en" href="https://99puritypeptides.com/peptide-calculator" />
<link rel="alternate" hreflang="es" href="https://99puritypeptides.com/es/peptide-calculator" />
<link rel="alternate" hreflang="x-default" href="https://99puritypeptides.com/peptide-calculator" />
```

**Rules:**
- Self-referencing hreflang required on both sides
- Return tags must be reciprocal — a one-directional hreflang is ignored entirely
- `/es/` pages canonical to **themselves**, never to the English equivalent
- Only emit hreflang where the alternate actually exists; a hreflang pointing at a 404 invalidates the cluster
- Use `es` (language only) unless you're genuinely targeting `es-ES` vs `es-MX` differently — you aren't, and the GSC data spans Spain, Mexico, Colombia and Puerto Rico

## 9.1 🟡 `meta-google: notranslate`

**[VERIFIED]** Present sitewide on every page fetched.

**[INFERRED]** This directive tells Google not to offer translation of your pages. GSC Search Appearance previously showed "Translated results: 8 impressions, 0 clicks" — that surface is being actively suppressed.

On a site with a Spanish tree serving four Spanish-speaking markets, this deserves a deliberate decision rather than a framework default. **[NOT VERIFIED]** whether this was intentional.

---
---

# 10. URL ARCHITECTURE ISSUES

## 10.1 🔴 P0 — Unencoded space in the image directory

**[VERIFIED]** Present on every page:
```
https://99puritypeptides.com/99 Images/99pp-Logo.png
https://99puritypeptides.com/99 Images/vial-closeup.webp
https://99puritypeptides.com/99 Images/purity.webp
```

**[VERIFIED]** Also in R2-hosted blog images:
```
https://pub-82f90d490a8048aa9629f0ae3ea6f567.r2.dev/blog-images/repair trio.webp
.../Product Images/Repair Trio.webp
```

**[INFERRED]** Unencoded spaces in URLs are invalid per RFC 3986. Behaviour varies by crawler — some encode to `%20`, some to `+`, some fail. This creates duplicate image URLs, unreliable image indexing, and potential Image Search exclusion. Mixed capitalisation (`99 Images`, `Product Images`, `Repair Trio.webp`) compounds it.

**Fix:** rename directories and files to lowercase with hyphens: `/99-images/99pp-logo.png`, `/blog-images/repair-trio.webp`. 301 the old paths.

⚠️ **Risk:** image URLs change. Mitigate by 301-ing old paths and resubmitting the image sitemap. **[INFERRED]** Given images currently return negligible Image Search traffic, downside risk is low and upside is real.

## 10.2 Blog posts sit at root level

**[VERIFIED]** `/what-is-the-repair-trio-peptide-stack`, not `/blog/what-is-the-repair-trio-peptide-stack`.

**[INFERRED]** This means `/blog` is not a parent path — it is a disconnected index. There is no directory hierarchy signalling that these 60 URLs form a content set.

⚠️ **DO NOT change this.** Migrating 60 ranking URLs to fix a structural nicety is a large risk for a small benefit. The orphaning problem is solved by pagination and category archives, not by moving URLs. **This is a "leave it alone" finding.**

---
---

# 11. INTERNAL LINKING ISSUES

## 11.1 What is working

**[VERIFIED]** Blog posts render a **"Continue reading"** module with three related-post links, and a **"Featured Product"** card linking to a product page, both in server HTML.

**[VERIFIED]** Posts also render a "Shop Top Products" carousel with eight product links.

**[INFERRED]** So blog→blog and blog→product linking exists. This is why older posts are indexed at all despite the archive problem.

## 11.2 What is broken

**[OBSERVED]** The related-posts module appears to surface the same few destinations repeatedly. On the Repair Trio post it linked to `/peptide-reconstitution-calculator`, `/retatrutide-and-carbs`, `/peptide-calculator-reconstitution-guide` — none topically related to a tissue-repair article.

**[INFERRED]** Related-post selection is not topic-aware. It is passing link equity to already-strong pages and starving the topically relevant ones.

**[VERIFIED]** No blog post receives a sitewide link. `/locations` does.

## 11.3 Priority internal link recommendations

**SOURCE:** `https://99puritypeptides.com/klow-peptide-blend-research-guide-2026`
**ANCHOR:** "exact KLOW blend composition"
**DESTINATION:** `https://99puritypeptides.com/what-is-in-klow-peptide-blend`
**REASON:** The composition page ranks at position 7.86 with **0.43% CTR** and its target queries return zero clicks. It receives no link from the 71,875-impression hub that owns the cluster.

**SOURCE:** `https://99puritypeptides.com/peptide-calculator`
**ANCHOR:** "bacteriostatic water unit conversions"
**DESTINATION:** `https://99puritypeptides.com/how-much-bacteriostatic-water-reconstitute-peptides`
**REASON:** The bac-water page ranks at position 3.75 with 1.76% CTR. The calculator carries 69,551 impressions and is the strongest equity source on the site.

**SOURCE:** `https://99puritypeptides.com/certificates`
**ANCHOR:** "how we verify ≥99% purity"
**DESTINATION:** `https://99puritypeptides.com/99-percent-peptide-purity-verification`
**REASON:** The verification hub is live at **67 impressions** while its target cluster generates ~1,300 non-brand impressions monthly at near-zero clicks. It is effectively orphaned.

**SOURCE:** `https://99puritypeptides.com/product-category/bioregulators`
**ANCHOR:** "what peptide bioregulators are"
**DESTINATION:** (bioregulator pillar, when published)
**REASON:** Category page ranks position 4.36 with **zero clicks**. It has no explanatory content to route users to.

**SOURCE:** All 35 nasal spray product pages (template edit)
**ANCHOR:** rotate 3–4 variants, e.g. "how intranasal peptide delivery works"
**DESTINATION:** `https://99puritypeptides.com/intranasal-peptide-delivery-research-guide`
**REASON:** That page is live at **2 impressions**. One template edit creates 35 contextual inbound links.

**SOURCE:** `https://99puritypeptides.com/product/ss-31-elamipretide`
**ANCHOR:** "SS-31 mechanism and clinical record"
**DESTINATION:** (SS-31 pillar, when published)
**REASON:** 6,110 impressions at position ~13.9 with zero supporting content.

**SOURCE:** `https://99puritypeptides.com/telomerase-enzyme` and `/research-peptide-glossary`
**ANCHOR:** contextual, varied
**DESTINATION:** relevant compound and purity pages
**REASON:** Both sit at 11 impressions. They need inbound links, not outbound ones — see Task 1 and Task 3.

---
---

# 12. ORPHAN PAGE ISSUES

**[INFERRED]** Every blog post outside the six newest is functionally orphaned from the blog archive. Partial mitigation comes from the related-posts module, but that module is not topic-aware and appears to cycle a limited destination set.

**Confirmed low-visibility pages consistent with orphaning:**

| Page | Impressions | Likely status |
|---|---|---|
| /intranasal-peptide-delivery-research-guide | 2 | Orphaned |
| /how-peptide-labs-ensure-purity | 4 | Orphaned |
| /telomerase-enzyme | 11 | Orphaned |
| /research-peptide-glossary | 11 | Orphaned |
| /peptide-synthesis-methods | 0 in export | Orphaned or very new |
| /semax-vs-selank | 67 | Weakly linked |
| /99-percent-peptide-purity-verification | 67 | Weakly linked |

**[NOT VERIFIED]** A full orphan list requires a Screaming Frog or Sitebulb crawl configured to compare sitemap URLs against crawl-discovered URLs. **This has been requested repeatedly across this engagement and never supplied.** It is the single most useful missing dataset.

---
---

# 13. CONTENT / CANNIBALIZATION ISSUES

## 13.1 🔴 The KLOW mg-ratio question now has an answer

**[VERIFIED]** From the live product carousel on `/what-is-the-repair-trio-peptide-stack`:

> **KLOW** — "research-grade KLOW **50mg/10mg/10mg/10mg** (3ML)"
> **GLOW** — "research-grade GLOW **50mg/10mg/10mg** (3ML)"

**[VERIFIED]** From the Repair Trio article body: market GLOW listings use "GHK-Cu 50mg : TB-500 10mg : BPC-157 10mg."

**[INFERRED]** GLOW is GHK-Cu + BPC-157 + TB-500. Your own GLOW product page states 50/10/10. If GLOW's 50mg component is GHK-Cu — which the market consensus and your own article both state — then **KLOW's 50mg component is GHK-Cu, not BPC-157.**

This contradicts `/klow-peptide-blend-research-guide-2026`, which states the "verified 50/10/10/10mg composition" with **BPC-157 as the 50mg component**. It aligns with the eight third-party vendors flagged earlier in this engagement.

**[INFERRED]** This is the most likely reason `/what-is-in-klow-peptide-blend` converts at **0.43%** while the dosage page converts at **7.31%** — the composition page is hedging on a figure the site itself states inconsistently across pages.

**This is now a same-site contradiction, not just a market disagreement.** It needs the lot COA and a corrections-policy entry. **P0, and it is a content/E-E-A-T task, not a developer task.**

## 13.2 Calculator cluster cannibalization

**[VERIFIED]** Four URLs serve overlapping reconstitution intent:

| URL | Impressions | CTR | Position |
|---|---|---|---|
| /peptide-calculator | 69,551 | 2.38% | 7.17 |
| /peptide-reconstitution-calculator | 46,367 | 2.24% | 6.54 |
| /peptide-calculator-reconstitution-guide | 5,929 | **0.79%** | 8.14 |
| /how-much-bacteriostatic-water-reconstitute-peptides | 2,276 | 1.76% | 3.75 |

**[VERIFIED]** The query `peptide reconstitution calculator` ranks at **position 18.66**.

**[INFERRED]** A site with a URL named exactly `/peptide-reconstitution-calculator` holding 46,367 impressions should not rank 18th for that phrase. That is Google failing to select between competing URLs.

⚠️ **DO NOT merge yet.** The trailing-slash fix may resolve this without any merge, because each of these four also has a slashed twin. **Re-measure two weeks after Task 2 ships**, and only then consider consolidating `/peptide-calculator-reconstitution-guide` (0.79% CTR, no distinct job).

**RISK of premature merge:** these pages hold 124,000 impressions combined. A merge that turns out to be wrong is not cleanly reversible.

## 13.3 Classification of issues by owner

| Issue | Type | Owner |
|---|---|---|
| Blog pagination | **A. Technical** | Developer |
| Trailing-slash redirects | **A. Technical** | Developer |
| Category archives | **A. Technical** | Developer |
| Image path spaces | **A. Technical** | Developer |
| hreflang | **A. Technical** | Developer |
| Related-posts relevance | **C. Internal linking** | Developer + SEO |
| KLOW ratio contradiction | **B. Content** + E-E-A-T | Content + Client |
| Calculator cannibalization | **D. Search intent** | SEO (after Task 2) |
| /faq at 0.19% CTR | **D. Search intent** | Content |
| Author/reviewer absence | **B. Content** | Content |
| Location pages | **E. Authority** + compliance | SEO + Client |

---
---

# 14. ON-PAGE STRUCTURE ISSUES

**[VERIFIED]** Single H1 on every page fetched. No multiple-H1 problem.

**[VERIFIED]** Heading hierarchy on the blog post is clean: H1 → H2 → H3, logically nested, question-form H2s present.

**[VERIFIED]** Titles and meta descriptions present and distinct on all three pages.

## Issues found

**🟡 P1 — `/affiliates` H1 is "Affiliates"**
**[VERIFIED]** A one-word H1 against a title of "Affiliate Program | Earn 15% Commission | 99 Purity Peptides". The H1 carries no keyword or intent signal.

**🟡 P1 — Blog card metadata is hardcoded**
**[VERIFIED]** Every post on `/blog` displays "5 min read" and "Product Guides". The Repair Trio post's own page shows "13 min read". The archive is showing a placeholder value.

**[INFERRED]** All six posts labelled "Product Guides" suggests categories are either not assigned or not surfaced — which is consistent with the missing category archives in §5.2.

**🟡 P1 — No author attribution**
**[VERIFIED]** Byline reads "99 Purity Peptides". No named author, no reviewer, no "last updated" date. Publication date only.

**🟢 P2 — No breadcrumbs**
**[VERIFIED]** No breadcrumb trail rendered on any of the three pages.

---
---

# 15. SCHEMA / STRUCTURED DATA ISSUES

**[NOT VERIFIED]** — JSON-LD lives in `<script type="application/ld+json">` blocks, which the fetch extraction strips. **I cannot confirm presence or absence.**

**Verification commands:**
```bash
curl -s https://99puritypeptides.com/what-is-the-repair-trio-peptide-stack | grep -o 'application/ld+json' | wc -l
curl -s https://99puritypeptides.com/product/klow | grep -A5 'application/ld+json'
```
Then validate each page type in Google's Rich Results Test.

**What the GSC exports DO establish [VERIFIED]:**

| Report | Finding |
|---|---|
| Product snippets | Valid items **declining** 537 → 449 |
| Product snippets — critical | `Either 'offers', 'review' or 'aggregateRating' should be specified` |
| Product snippets — warnings | Missing `offerCount`, `aggregateRating`, `review` |
| Review snippets | 92 → 80 valid, 7 impressions — effectively dead |
| Merchant listings | 41 impressions, **position 1.24, zero clicks** |

**[INFERRED]** Product schema exists but is incomplete. Merchant listings ranking at position 1.24 with zero clicks means you are eligible in a shopping surface and returning nothing because the markup lacks required fields.

## Recommended, in order

1. **`offers` with `price`, `priceCurrency`, `availability`, `priceValidUntil`** on all product pages — clears the critical error using data you already have. **P0.**
2. **`AggregateOffer` with `offerCount`** for multi-variant products. **P1.**
3. **`BreadcrumbList`** sitewide — requires visible breadcrumbs first. **P1.**
4. **`Article`** on blog posts with `author`, `datePublished`, `dateModified`, `publisher`. **P1.**
5. **`FAQPage`** on `/faq` and on article FAQ blocks — the Repair Trio post has 15 visible FAQs. **P1.**

⚠️ **Do NOT add `aggregateRating` or `review` until real review data exists.** Fabricated review markup is a structured-data spam violation and, on a commerce site in this category, a manual-action risk. Ship `offers` instead — it's factual and clears the same critical error.

---
---

# 16. CORE WEB VITALS / PERFORMANCE ISSUES

**[VERIFIED]** Previous CWV export: mobile moved from 66 URLs "needs improvement" to **0 poor / 0 needs-improvement / 61 good**. Mobile LCP issue count: 0.

**This is already fixed. Do not spend engineering time here.** Add a post-deploy regression check only.

**[NOT VERIFIED]** Desktop CWV — no export supplied.

**[OBSERVED]** Desktop generates **45% of impressions but only 17% of clicks**, at 0.93% CTR and average position 10.18. **[INFERRED]** A 0.93% desktop CTR is more likely explained by SERP composition (AI Overviews, shopping modules) than by page speed, but desktop CWV should be pulled to rule it out.

**[VERIFIED]** Next.js `next/image` optimisation is in use with `w=3840&q=75` parameters. Images are served WebP. **[INFERRED]** Serving at 3840px width for thumbnail contexts is wasteful; verify `sizes` attributes are set correctly per breakpoint.

---
---

# 17. MOBILE / UX ISSUES

**[VERIFIED]** `meta-viewport: width=device-width, initial-scale=1` — correct.
**[VERIFIED]** Mobile CWV all green.

**[INFERRED]** The "Load More Posts" pattern is a UX problem as well as a crawl problem. A user looking for an older article has no browse path, no search, and no category filter that produces a shareable URL.

**Recommended:** add on-site blog search and make category filters produce real URLs (Task 3).

---
---

# 18. GEO / AEO / LLM DISCOVERABILITY ISSUES

## What is working

**[VERIFIED]** Article content is fully server-rendered — tables, FAQs, key takeaways, and headings all present in raw HTML. This is genuinely good for retrieval; many JS-heavy sites fail here.

**[VERIFIED]** Content is well-chunked: question-form H2s, tables as real HTML markup (not images), a "Key Takeaways" block, and 15 standalone FAQ answers.

**[VERIFIED]** 1,321 Bing AI citations over 91 days with cited-page breadth rising 1.6 → 3.65 per day.

**[INFERRED]** The content structure is already retrieval-friendly. **The constraint is discovery, not extractability.** Pages that can't be crawled can't be cited.

## What is missing

| Gap | Evidence | Impact on retrieval |
|---|---|---|
| **No author or reviewer entity** | [VERIFIED] byline is the brand | Weakens source-credibility signals |
| **No `dateModified`** | [VERIFIED] publication date only | Retrieval systems favour demonstrably current sources |
| **No breadcrumbs** | [VERIFIED] | Weakens entity hierarchy |
| **Same-site factual contradiction on KLOW composition** | [VERIFIED] §13.1 | **Directly damaging** — a source that contradicts itself on a checkable number gets down-weighted |
| **Orphaned pages** | [INFERRED] §12 | Cannot be retrieved if not crawled |
| **JSON-LD unconfirmed** | [NOT VERIFIED] | Entity relationships may be absent |

**[INFERRED]** The KLOW contradiction is the most consequential GEO issue on the site. Fixing crawlability makes more pages retrievable; fixing the contradiction makes the site more trustworthy as a source. **Both matter, and the second is cheaper.**

---
---

# 19. HIGH-VALUE EXISTING PAGES TO PROTECT

**Do not touch these except as specified. They carry the account.**

| URL | Impressions | Clicks | CTR | Position | Protection note |
|---|---|---|---|---|---|
| /klow-peptide-blend-research-guide-2026 | 71,875 | 1,150 | 1.60% | 6.72 | **Recently fixed — dosage query went 1.32% → 7.31% CTR.** Do not revert the title. |
| /peptide-calculator | 69,551 | 1,655 | 2.38% | 7.17 | Highest-traffic asset. No URL change. |
| /peptide-reconstitution-calculator | 46,367 | 1,039 | 2.24% | 6.54 | **Do not merge until §13.2 re-measurement.** |
| / (homepage) | 24,479 | 2,285 | 9.33% | 8.41 | Healthy |
| /retatrutide-cancer-research-preclinical-studies | 18,452 | 229 | 1.24% | 8.77 | Metadata only; sensitive topic, editorial review required |
| /retatrutide-and-carbs | 11,151 | 126 | 1.13% | 7.81 | Metadata only |
| /shop | 7,215 | 157 | 2.18% | 8.73 | CTR declining — investigate, don't restructure |
| /product/retatrutide | 3,687 | 241 | **6.54%** | 13.20 | Best product CTR on site. Protect the title. |
| /es/peptide-calculator | 7,079 | 259 | 3.66% | 7.12 | Fastest-growing cluster |

---
---

# 20. PAGES THAT NEED IMMEDIATE FIXES

| URL | Problem | Category | Owner |
|---|---|---|---|
| /what-is-in-klow-peptide-blend | 0.43% CTR at position 7.86; composition likely hedged | **B. Content** | Content + Client |
| /faq | 7,715 impressions, **0.19% CTR** at position 7.13 | **D. Intent** | Content |
| /tesamorelin-visceral-fat-research | **−39% impressions**, 0.03% CTR | **A + B** | Dev then Content |
| /blog | 3,095 impressions, **0.16% CTR** at position 3.09 | **A. Technical** | Developer |
| /ghk-cu-copper-peptide-research-guide | ~14,500 impressions, **0.60% CTR** | **D. Intent** | Content |
| /intranasal-peptide-delivery-research-guide | **2 impressions** — orphaned | **C. Linking** | Developer |
| /99-percent-peptide-purity-verification | **67 impressions** — orphaned | **C. Linking** | Developer |
| /product-category/bioregulators | Position 4.36, **zero clicks** | **D. Intent** | Content |
| /about-us | Position 3.72, **0.83% CTR** | **D. Intent** | Content |

---
---

# 21. COMPLETE DEVELOPER FIX LIST

---

## TASK #1
**TITLE:** Add crawlable pagination to the blog archive
**CATEGORY:** Crawlability
**PRIORITY:** **P0 — highest impact item in this audit**
**AFFECTED URLS:** `/blog`, `/es/blog`, and all 60+ blog post URLs

**CURRENT PROBLEM:**
`/blog` renders exactly six post links in server HTML followed by a "Load More Posts" button with no `href`. No `?page=2`, no `/blog/page/2`, no numbered pagination. Every post outside the newest six has no crawlable path from the archive.

**EXACT CHANGE REQUIRED:**
1. Implement server-rendered pagination at `/blog/page/2`, `/blog/page/3`, … Each page must render 10–12 post links in the initial HTML response.
2. Render `<a href="/blog/page/2">` links in server HTML. The Load More button may remain as a progressive enhancement, but crawlable links must exist alongside it.
3. Add `<link rel="next">` and `<link rel="prev">` to paginated pages.
4. Each paginated page self-canonicals to itself — **not** to `/blog`.
5. Paginated pages should be indexable (no `noindex`).
6. Mirror the same implementation on `/es/blog`.

**IMPLEMENTATION NOTES:**
Next.js App Router: create `app/blog/page/[page]/page.tsx` with `generateStaticParams` covering all pages. Ensure data fetching happens server-side so links render without JS.

**SEO REASON:**
Restores a crawl path to ~54 currently unreachable articles. This is the most likely cause of 365 URLs sitting at "Crawled – currently not indexed" and of recently published pages returning 2–67 impressions.

**HOW TO VERIFY:**
```bash
curl -s https://99puritypeptides.com/blog | grep -c 'href="https://99puritypeptides.com/[a-z0-9-]*"'
curl -sI https://99puritypeptides.com/blog/page/2 | head -1
```
Then crawl with Screaming Frog using JavaScript rendering **disabled** — all 60+ posts must be discoverable from `/blog`.

**EXPECTED RESULT:**
All blog posts reachable within 2–3 clicks of the homepage without JavaScript. Expect indexation improvement over 3–6 weeks, not immediately.

---

## TASK #2
**TITLE:** Add 301 redirects from trailing-slash to non-trailing-slash URLs
**CATEGORY:** Canonicalization
**PRIORITY:** **P0**
**AFFECTED URLS:** 73 confirmed duplicate paths carrying 332,003 impressions (79.8% of site impressions). Full list in `99PP-Dev-Issue-Checklist.md` §1.3.

**CURRENT PROBLEM:**
Canonical tags are already correct and non-trailing-slash — verified on `/affiliates`, `/blog`, `/what-is-the-repair-trio-peptide-stack`. But GSC shows both `/path` and `/path/` indexed and accumulating impressions independently. This indicates the slashed variant returns **200 OK** rather than a 301.

**EXACT CHANGE REQUIRED:**
```js
// next.config.js
module.exports = {
  trailingSlash: false,
}
```
Plus verify Vercel is issuing a 301 (not 308, not 200) for slashed requests. If Next.js emits 308, that is acceptable to Google but confirm it is consistent.

**IMPLEMENTATION NOTES:**
- Single hop only — no chains
- Preserve query strings
- **Preserve the `/es/` prefix** — never redirect ES to EN
- Update the sitemap to emit non-slash URLs only
- Update every internal link to the canonical form; do not rely on redirects for internal navigation

**SEO REASON:**
Consolidates ranking signal currently split across 73 URL pairs.

**HOW TO VERIFY:**
```bash
for p in affiliates blog peptide-calculator faq shop about-us; do
  echo -n "$p: "; curl -sI "https://99puritypeptides.com/$p/" | head -1
done
```
Every line must show `301` or `308`.

**EXPECTED RESULT:**
Signal consolidation over 2–6 weeks. ⚠️ **Expect a temporary impressions dip in days 3–7 after deploy.** This is normal re-indexing behaviour, not a failure. Do not roll back for it. Do not deploy on a Friday.

---

## TASK #3
**TITLE:** Create crawlable blog category archive pages
**CATEGORY:** Crawlability / Internal linking
**PRIORITY:** **P0**
**AFFECTED URLS:** `/blog`, new `/blog/category/*` URLs

**CURRENT PROBLEM:**
`/blog` displays five category filters — Product Guides, Growth research, Muscle studies, Recovery protocols, Metabolic research — as JavaScript filters with no URLs. No category archive pages exist.

**EXACT CHANGE REQUIRED:**
1. Create server-rendered archives at `/blog/category/{slug}` for each category.
2. Render category filter buttons as real `<a href>` links.
3. Each archive lists all posts in that category, paginated per Task 1.
4. Self-canonical, indexable, unique title and meta description per category.
5. Confirm categories are actually assigned — the archive currently labels all six visible posts "Product Guides."

**SEO REASON:**
Creates five additional crawl paths, each reaching 10–20 posts. Provides topical clustering signal that Google and AI retrieval systems can use to associate related content.

**HOW TO VERIFY:**
```bash
curl -sI https://99puritypeptides.com/blog/category/product-guides | head -1
```
Crawl with JS disabled; confirm category pages appear and link to posts.

**EXPECTED RESULT:**
Reduced crawl depth for all posts; improved topical clustering.

---

## TASK #4
**TITLE:** Audit robots.txt line by line — 148 pages blocked, validation Failed
**CATEGORY:** Crawlability
**PRIORITY:** **P0**
**AFFECTED URLS:** 148 pages

**CURRENT PROBLEM:**
GSC Coverage reports 148 pages blocked by robots.txt with validation status **Failed**, up from 145. Could not be fetched during this audit.

**EXACT CHANGE REQUIRED:**
1. Fetch and document every `Disallow` line: what it blocks, how many URLs, and why.
2. Confirm no content, product, category, or `/es/` page is blocked.
3. Confirm `/_next/static/` is **NOT** blocked — blocking JS/CSS breaks Google's rendering.
4. Verify these user-agents are permitted: `Googlebot`, `Bingbot`, `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`.
5. Add: `Disallow: /api/`, `Disallow: /shop?category=`, and `Sitemap: https://99puritypeptides.com/sitemap.xml`.

**SEO REASON:**
148 unintentionally blocked pages is a direct, mechanical loss of visibility. AI crawler access gates the GEO channel, which is currently producing more citations than Bing produces clicks.

**HOW TO VERIFY:**
Google Search Console → robots.txt Tester, plus the Coverage report's "Blocked by robots.txt" validation.

**EXPECTED RESULT:**
Blocked count drops to only intentional exclusions.

---

## TASK #5
**TITLE:** Rename image directories to remove unencoded spaces
**CATEGORY:** URL architecture
**PRIORITY:** **P0**
**AFFECTED URLS:** All images under `/99 Images/`, plus R2-hosted `/blog-images/` and `/Product Images/`

**CURRENT PROBLEM:**
Image URLs contain literal unencoded spaces:
```
https://99puritypeptides.com/99 Images/99pp-Logo.png
https://pub-82f90d490a8048aa9629f0ae3ea6f567.r2.dev/blog-images/repair trio.webp
.../Product Images/Repair Trio.webp
```
Unencoded spaces are invalid per RFC 3986. Crawlers encode them inconsistently (`%20` vs `+` vs failure), producing duplicate or unresolvable image URLs.

**EXACT CHANGE REQUIRED:**
1. Rename `/99 Images/` → `/99-images/`
2. Rename all files to lowercase-hyphenated: `99pp-Logo.png` → `99pp-logo.png`
3. Same for R2: `/blog-images/repair trio.webp` → `/blog-images/repair-trio.webp`, `/Product Images/` → `/product-images/`
4. Update all references in code and CMS content
5. 301 old paths where the platform allows

**IMPLEMENTATION NOTES:**
⚠️ **RISK:** image URLs change. **MITIGATION:** 301 old paths, resubmit image sitemap. **BENEFIT:** reliable image indexing and Image Search eligibility. **ALTERNATIVE if risk is unacceptable:** URL-encode to `%20` everywhere as a stopgap — functional but leaves the capitalisation inconsistency.

**HOW TO VERIFY:**
```bash
curl -s https://99puritypeptides.com/ | grep -c '99 Images'
```
Must return 0.

**EXPECTED RESULT:**
Valid image URLs; Image Search eligibility restored.

---

## TASK #6
**TITLE:** Implement and verify hreflang across EN/ES
**CATEGORY:** Internationalization
**PRIORITY:** **P0**
**AFFECTED URLS:** All EN pages with `/es/` equivalents — 192 `/es/` URLs, 31,288 impressions

**CURRENT PROBLEM:**
No hreflang observed in fetched output. **NOT VERIFIED** — `<head>` link tags are stripped by the extraction method. Must be confirmed before acting.

**EXACT CHANGE REQUIRED:**
First run:
```bash
curl -s https://99puritypeptides.com/peptide-calculator | grep -i hreflang
```
If absent, implement reciprocal self-referencing hreflang per §9, including `x-default`. Emit only where the alternate exists.

**SEO REASON:**
Prevents EN/ES pages competing, and directs the correct language version to the correct market. The Spanish calculator cluster is the fastest-growing in the account.

**HOW TO VERIFY:**
GSC → International Targeting → zero hreflang errors. Confirm reciprocity in both directions.

---

## TASK #7
**TITLE:** Remove the empty `?category=` parameter link
**CATEGORY:** Crawlability
**PRIORITY:** **P1**
**AFFECTED URLS:** Sitewide navigation component

**CURRENT PROBLEM:**
Every page contains `<a href="https://99puritypeptides.com/shop?category=">View All in Category</a>` — an empty-value parameter creating a crawlable duplicate of `/shop`.

**EXACT CHANGE REQUIRED:**
Change the href to `https://99puritypeptides.com/shop`.

**HOW TO VERIFY:**
```bash
curl -s https://99puritypeptides.com/blog | grep -c 'shop?category='
```
Must return 0.

---

## TASK #8
**TITLE:** Fix hardcoded blog card metadata
**CATEGORY:** On-page
**PRIORITY:** **P1**
**AFFECTED URLS:** `/blog` and category archives

**CURRENT PROBLEM:**
All posts on `/blog` display "5 min read" and category "Product Guides". The Repair Trio post's own page shows "13 min read". The archive is rendering a placeholder.

**EXACT CHANGE REQUIRED:**
Pull `readingTime` and `category` from the post record rather than a default. Confirm categories are assigned in the CMS.

**HOW TO VERIFY:**
Compare archive card values against each post's own page.

---

## TASK #9
**TITLE:** Add visible breadcrumbs with BreadcrumbList schema
**CATEGORY:** On-page / Schema
**PRIORITY:** **P1**
**AFFECTED URLS:** All blog posts, product pages, category pages

**CURRENT PROBLEM:**
No breadcrumb trail rendered on any page fetched.

**EXACT CHANGE REQUIRED:**
Render visible breadcrumbs, then add matching `BreadcrumbList` JSON-LD.
- Blog: `Home → Blog → {Category} → {Post}`
- Product: `Home → Shop → {Category} → {Product}`

**IMPLEMENTATION NOTE:** Schema must match visible content. Do not add the markup without the visible trail.

**HOW TO VERIFY:** Rich Results Test passes; breadcrumbs render.

---

## TASK #10
**TITLE:** Complete Product schema `offers`
**CATEGORY:** Schema
**PRIORITY:** **P1**
**AFFECTED URLS:** All product pages

**CURRENT PROBLEM:**
GSC Product snippets show valid items declining 537 → 449 with critical error `Either 'offers', 'review' or 'aggregateRating' should be specified`. Merchant listings show 41 impressions at position 1.24 with **zero clicks**.

**EXACT CHANGE REQUIRED:**
```json
"offers": {
  "@type": "Offer",
  "url": "https://99puritypeptides.com/product/klow",
  "priceCurrency": "USD",
  "price": "139.99",
  "priceValidUntil": "2027-08-25",
  "availability": "https://schema.org/InStock",
  "itemCondition": "https://schema.org/NewCondition"
}
```
For multi-variant products use `AggregateOffer` with `offerCount`, `lowPrice`, `highPrice`.

⚠️ **DO NOT add `aggregateRating` or `review` until real review data exists.** Fabricated review markup is a structured-data spam violation and a manual-action risk on a commerce site in this category. `offers` clears the same critical error using data you already have.

**HOW TO VERIFY:** Rich Results Test on five product pages; GSC critical error count drops.

---

## TASK #11
**TITLE:** Add Article schema with author and dateModified
**CATEGORY:** Schema / E-E-A-T
**PRIORITY:** **P1**
**AFFECTED URLS:** All blog posts

**CURRENT PROBLEM:**
Byline is "99 Purity Peptides". No named author, no reviewer, no last-updated date. JSON-LD presence **NOT VERIFIED**.

**EXACT CHANGE REQUIRED:**
Add `Article` schema with `author` (Person), `datePublished`, `dateModified`, `publisher` (Organization). Render a visible author byline and "Last updated" date matching the schema.

⚠️ **Do not invent an author or reviewer.** If no named person is available, publish an editorial process statement instead. A fabricated credential is worse than none.

**HOW TO VERIFY:** Rich Results Test; visible dates match schema values.

---

## TASK #12
**TITLE:** Make related-posts selection topic-aware
**CATEGORY:** Internal linking
**PRIORITY:** **P1**
**AFFECTED URLS:** All blog posts

**CURRENT PROBLEM:**
The "Continue reading" module on the Repair Trio article surfaced `/peptide-reconstitution-calculator`, `/retatrutide-and-carbs`, and `/peptide-calculator-reconstitution-guide` — none topically related to a tissue-repair article. Link equity is flowing to already-strong pages instead of topically relevant ones.

**EXACT CHANGE REQUIRED:**
Select related posts by shared category or tag, falling back to recency only when fewer than three matches exist. Increase from 3 to 4–6 related posts to widen the internal link graph.

**SEO REASON:**
Related-post modules are currently the only internal link path many orphaned posts receive. Making them topical converts them from noise into cluster signal.

**HOW TO VERIFY:**
Spot-check five posts across different categories; related posts should share topic.

---

## TASK #13
**TITLE:** Verify sitemap integrity and segment it
**CATEGORY:** Sitemap
**PRIORITY:** **P1**
**AFFECTED URLS:** `/sitemap.xml`

**CURRENT PROBLEM:** **NOT VERIFIED** — could not be fetched.

**EXACT CHANGE REQUIRED:**
Confirm the checklist in §7, then segment into `sitemap-pages.xml`, `sitemap-blog.xml`, `sitemap-products.xml`, `sitemap-es.xml` under an index. Ensure `lastmod` reflects genuine content changes, not deploy timestamps.

**SEO REASON:**
Segmentation makes GSC per-sitemap coverage reporting usable — you can then see which content type is failing to index.

**HOW TO VERIFY:** GSC Sitemaps report shows discovered/indexed counts per segment.

---

## TASK #14
**TITLE:** Add header nav links to the calculator tools
**CATEGORY:** Internal linking
**PRIORITY:** **P1**
**AFFECTED URLS:** Sitewide header

**CURRENT PROBLEM:**
"Tools" renders as bare text with no href. **NOT VERIFIED** whether the dropdown contents are in server HTML.

**EXACT CHANGE REQUIRED:**
Ensure `/peptide-calculator` and `/peptide-reconstitution-calculator` render as `<a href>` in server HTML, or link "Tools" itself to a tools index page.

**SEO REASON:** These are your two highest-traffic assets (69,551 and 46,367 impressions).

**HOW TO VERIFY:**
```bash
curl -s https://99puritypeptides.com/ | grep -c 'peptide-calculator'
```

---

## TASK #15
**TITLE:** Implement IndexNow for Bing
**CATEGORY:** Bing indexing
**PRIORITY:** **P1**
**AFFECTED URLS:** Sitewide

**CURRENT PROBLEM:**
Bing carries 6,118 impressions over three months against Google's ~377,000 — roughly 1.6%. Bing gates ChatGPT Search and Copilot.

**EXACT CHANGE REQUIRED:**
Generate an IndexNow key, host it at `https://99puritypeptides.com/{key}.txt`, and POST changed URLs to `https://api.indexnow.org/indexnow` on publish and update.

**SEO REASON:**
Faster Bing indexation compounds across three surfaces: Bing search, Copilot, and ChatGPT Search. Given AI citations already exceed Bing clicks 10×, this is a GEO action as much as a search one.

**HOW TO VERIFY:** BWT → URL Submission shows IndexNow submissions.

---

## TASK #16
**TITLE:** Decide on `meta-google: notranslate`
**CATEGORY:** Internationalization
**PRIORITY:** **P2**
**AFFECTED URLS:** Sitewide

**CURRENT PROBLEM:**
`<meta name="google" content="notranslate">` present sitewide. GSC previously showed Translated results at 8 impressions, 0 clicks — that surface is suppressed.

**EXACT CHANGE REQUIRED:**
Confirm whether this was intentional. If not, remove it. If it was a deliberate choice to protect technical terminology, document the reasoning.

---

## TASK #17
**TITLE:** Fix the 6 × 404 URLs
**CATEGORY:** Indexability
**PRIORITY:** **P2**

**EXACT CHANGE REQUIRED:**
Export the list from GSC Coverage. 301 each to the closest relevant page, or restore. **Do not blanket-redirect to the homepage** — Google treats that as a soft 404.

---

## TASK #18
**TITLE:** Verify www / HTTP / preview-domain canonicalization
**CATEGORY:** Technical trust
**PRIORITY:** **P2**

**EXACT CHANGE REQUIRED:**
```bash
curl -sI https://www.99puritypeptides.com/ | head -3
curl -sI http://99puritypeptides.com/ | head -3
```
Both must 301 to `https://99puritypeptides.com/`.

Additionally, confirm Vercel **preview deployment URLs** (`*.vercel.app`) carry `X-Robots-Tag: noindex`. **[NOT VERIFIED]** — Vercel noindexes previews by default, but confirm it hasn't been overridden.

Also audit the `research.99puritypeptides.com` subdomain — 19 URLs indexed, competing on the same entities as the main site. Decide: consolidate or noindex. Leaving it split is the worst option.

---
---

# 22. COMPLETE SEO / CONTENT FIX LIST

*For the content team, not the developer.*

| # | Task | Evidence | Priority |
|---|---|---|---|
| C1 | **Resolve the KLOW mg-ratio contradiction.** Your GLOW product states 50/10/10 and your article says market GLOW is GHK-Cu 50mg — implying KLOW's 50mg is GHK-Cu, contradicting the research guide. Pull the lot COA, correct whichever page is wrong, log it under a corrections policy. | [VERIFIED] §13.1 | **P0** |
| C2 | Publish a corrections policy page | Required by C1 | **P0** |
| C3 | Restructure `/faq` — anchored Q&As, 40–70 word answers, FAQPage schema | 7,715 impr, 0.19% CTR | **P0** |
| C4 | Rewrite `/ghk-cu-copper-peptide-research-guide` title/meta, add answer block | ~14,500 impr, 0.60% CTR | **P0** |
| C5 | Diagnose `/what-is-in-klow-peptide-blend` — likely blocked on C1 | 0.43% CTR at position 7.86 | **P0** |
| C6 | Diagnose `/tesamorelin-visceral-fat-research` | −39% impressions, 0.03% CTR | P1 |
| C7 | Rewrite `/blog` and `/about-us` metadata | Positions 3.09 and 3.72 at 0.16% and 0.83% | P1 |
| C8 | Add named author + editorial process statement | No attribution anywhere | P1 |
| C9 | Decide on the ten `/locations/*` pages — unique per-jurisdiction content or removal | Avg position 17.8, diluting site metrics | P1 |
| C10 | Reconcile the footer's "purity may vary by lot, certain items may test below 99%" disclosure with on-page purity claims | [VERIFIED] footer | P1 |
| C11 | Re-measure calculator cannibalization **after** Task 2 | Position 18.66 anomaly | P2 |

---
---

# 23. PRIORITY ROADMAP

## Week 1 — Crawl surface restoration

| Task | Owner |
|---|---|
| #1 Blog pagination | Developer |
| #2 Trailing-slash 301s | Developer |
| #3 Category archives | Developer |
| #4 robots.txt audit | Developer |
| C1 KLOW ratio resolution | Content + Client |

**Do not publish new content this week.** Nine recently published pages sit at 2–506 impressions; the constraint is not content supply.

## Week 2 — Structural integrity

Tasks #5 (image paths), #6 (hreflang), #7 (parameter URL), #13 (sitemap), #18 (domain canonicalization), plus C2 and C3.

## Week 3 — Schema, linking, Bing

Tasks #9–#12, #14, #15. Plus C4, C5.

## Week 4 — Measure, then resume content

Re-pull GSC. Compare against the locked baseline (5,656 impr/day, 154.6 clicks/day, 2.73% CTR, position 7.31 as of 6–12 Aug). Only then resume publishing.

**[INFERRED]** Expect indexation improvement to lag the fix by 3–6 weeks. Impressions and average position will move last. CTR, index coverage, and schema validity will move first.

---
---

# 24. VERIFICATION CHECKLIST

## Crawlability
- [ ] `/blog` exposes all posts via crawlable pagination (JS disabled)
- [ ] `/blog/page/2` returns 200
- [ ] Five category archives return 200 and link to posts
- [ ] robots.txt annotated line by line
- [ ] All eight named user-agents confirmed permitted
- [ ] `/api/` disallowed
- [ ] Screaming Frog crawl with JS disabled discovers 60+ blog posts

## Indexability
- [ ] All slashed URLs return 301/308
- [ ] www and HTTP 301 to canonical
- [ ] `*.vercel.app` previews carry `X-Robots-Tag: noindex`
- [ ] `research.` subdomain decision made and implemented
- [ ] 6 × 404s resolved
- [ ] Zero internal links returning 3xx

## Sitemap
- [ ] Returns 200, valid XML
- [ ] Contains all 60+ blog posts
- [ ] All URLs non-trailing-slash
- [ ] No redirected, noindexed, or 404 URLs
- [ ] `lastmod` reflects content changes, not deploys
- [ ] Segmented and submitted to both GSC and BWT

## Internationalization
- [ ] hreflang present, reciprocal, self-referencing
- [ ] `x-default` set
- [ ] `/es/` pages canonical to themselves
- [ ] Zero errors in GSC International Targeting
- [ ] `notranslate` decision documented

## On-page & schema
- [ ] Zero `99 Images` references remain
- [ ] Breadcrumbs visible and marked up
- [ ] Blog card metadata reads from post records
- [ ] Product `offers` complete; GSC critical error cleared
- [ ] `aggregateRating` / `review` **NOT** added without real data
- [ ] Article schema with author and dateModified
- [ ] All schema validates in Rich Results Test

## Performance
- [ ] Mobile CWV still 0 poor / 0 needs-improvement
- [ ] Desktop CWV pulled and reviewed

## Content
- [ ] KLOW ratio resolved against lot COA
- [ ] Corrections policy published
- [ ] No same-site factual contradictions on composition figures

---

## Two closing notes

**On the KLOW finding.** Your own GLOW product listing and your own Repair Trio article, read together, point to GHK-Cu being the 50mg component — which is what eight third-party vendors have said all along and what your research guide contradicts. That is no longer a market disagreement; it is a same-site contradiction on a checkable number, sitting on the page that anchors your largest content cluster. It's cheap to fix and it's the most consequential single item in the content list.

**On sequencing.** Blog pagination is the highest-impact item in this audit, and it is a contained engineering change — likely a day of work. Roughly 54 articles, representing the entire topical authority investment of this engagement, are currently sitting behind a JavaScript button. Fixing that will almost certainly recover more visibility than any content project on the roadmap.
