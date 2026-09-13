# Longevia Research — Blog Post Generation Prompt (GLP-3 / NAD+ Batch)

Self-contained prompt. Paste everything below the line into Opus as-is —
no other file needed.

---

You are writing 4 separate blog posts for **Longevia Research**
(longeviaresearch.com), a US-based supplier of research peptides.
Every batch is independently HPLC/LC-MS tested; lot-specific Certificates
of Analysis (COAs) are published in the site's COA Library. The audience
is researchers and lab professionals. Content is Research Use Only (RUO)
framing — not for human consumption, no therapeutic/medical claims.

Output ONE complete JSON object per topic, exactly matching the OUTPUT
SCHEMA below. Produce all 4, clearly separated and labeled by topic
number. No commentary outside the JSON objects.

=====================================================================
CONTENT MARKDOWN SYNTAX — the "content" field is NOT free-form markdown.
It is a constrained syntax that maps 1:1 to specific editor node types.
Use ONLY these constructs:
=====================================================================
- Plain lines of text = paragraphs (blank line between paragraphs).
- "## Heading" = H2. "### Heading" = H3. Nothing deeper than H3.
- "- item" lines (consecutive) = bullet list. "1. item" lines = numbered list.
- "> quoted text" (consecutive lines) = blockquote.
- Pipe tables:
    | Header A | Header B |
    |---|---|
    | cell | cell |
- Callout box (info/tip/warning), on its own lines:
    :::tip
    Callout text goes here.
    :::
  (also valid: :::info and :::warning)
- Inline formatting: **bold text**. No italics, no inline code, no images
  (there are no inline images anywhere — one featured image per post only).
- Inline links: [anchor text](/journal/<slug>) for other blog posts, or
  reference a product by name in plain text (do NOT invent a
  `/products/<slug>` URL — you don't have the real catalog in front of
  you). If you want to link to another journal post and are not 100%
  certain of its exact slug, do NOT guess — write natural anchor-free
  text and insert a placeholder instead:
    <!-- LINK: short description of target -->
  Never link the same URL more than 2–3 times in one post.

=====================================================================
MANDATORY LENGTH / STRUCTURE SPECS (apply to all 4 posts)
=====================================================================
- "content": 2,000+ words MINIMUM, excluding FAQs. Count before
  finalizing — this is a hard floor, not a soft target.
- "faqs": EXACTLY 15 question/answer pairs. Each answer 1–3 sentences,
  self-contained and quotable on its own. Cover research protocols,
  reconstitution, storage, mechanism, sourcing/purity, and — critically —
  work in the literal TARGET QUERIES phrasing listed per topic below as
  natural-language questions, not just the general subject.
- "keyTakeaways": 6–8 short, standalone, factual bullet sentences.
- Minimum 6 "##" H2 sections, each with real substance (300+ words) —
  the word count should come from depth, not padding.
- At least 2 pipe tables per post (e.g. one comparison/spec table + one
  dosage-math or protocol table).
- At least 2 callout boxes per post, varied style (don't reuse ":::tip"
  three times) — used for genuinely useful notes, not filler.
- Bold key terms/compound names on first mention.
- NO FAQ section inside "content" (goes in "faqs" field).
- NO Key Takeaways section inside "content" (goes in "keyTakeaways" field).

=====================================================================
EEAT / SEO / GEO / AEO REQUIREMENTS (mandatory, all 4 posts)
=====================================================================
EEAT (critical — read carefully):
  - Every entry in "references" must be a REAL, verifiable source
    (PubMed/DOI/journal article/primary compound data sheet) with a
    working, accurate URL. NEVER fabricate a citation, author, journal
    name, or DOI. If you are not fully confident a source is real and
    correctly attributed, DO NOT include it — an accurate 3-source list
    beats a padded 8-source list with even one fake entry.
  - Every factual/mechanism claim in "content" should be traceable to a
    real source. If you can't source a claim confidently, cut it or
    soften it to clearly-flagged uncertainty — never state it as settled
    fact.
  - Write from genuine research-domain competence — cite primary
    mechanism papers, not marketing pages.

SEO:
  - "focusKeyphrase" must match the real GSC query pattern given per
    topic below — not a generic guess.
  - "keywords" should include the long-tail query variants from GSC
    verbatim where it reads naturally.

GEO (this content will be read and summarized by AI answer engines —
ChatGPT, Perplexity, Claude — not just ranked by Google):
  - Every factual sentence must be self-contained and quotable out of
    context — no "as mentioned above," no pronoun-dependent claims.
  - Open each H2 section with a direct one-sentence answer to the
    question implied by that heading, then elaborate.

AEO:
  - The 15 FAQs are the primary AEO surface. Write them to answer the
    literal query strings under TARGET QUERIES per topic, not just the
    general topic.
  - Keep every FAQ answer extractable as a standalone snippet.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON object per topic, fully filled in
=====================================================================

{
  "title": "",
  // 50–70 chars. Keyword-rich. Include the primary compound name(s) and
  // the angle (comparison / guide / mechanism / protocol).

  "slug": "",
  // lowercase-hyphenated, derived from title, 5–8 words max, no stop words.

  "category": "",
  // EXACTLY one of: "Emerging" | "Guidelines" | "Studies" | "Guides"
  //   Studies    = compound-specific mechanism/pharmacokinetic deep dives
  //   Guidelines = multi-compound protocols, stacking, comparisons
  //   Guides     = operational how-tos (purity testing, storage, reconstitution)
  //   Emerging   = newer/less-established compounds, first-look coverage
  // (Each topic below specifies which one to use.)

  "excerpt": "",
  // 1–2 sentences, 140–160 chars. Standalone factual summary.

  "featuredImageBrief": "",
  // ONE sentence describing what the single featured image should show.
  // Not stored — just a note for whoever sources the actual image file.

  "featuredImageAlt": "",
  // REQUIRED. One full sentence, 100–125 chars, detailed and specific
  // (describe the actual visual, not just the compound name).

  "content": "",
  // Full article body, constrained markdown syntax above.
  // 2,000+ words. Opening paragraph (no heading) stating what this
  // covers and why it matters for research, then H2/H3 sections per
  // the structure specs above.

  "readTime": "",
  // Optional — leave blank, auto-calculated.

  "keyTakeaways": [""],
  // 6–8 short, standalone, factual bullet sentences.

  "faqs": [
    { "question": "", "answer": "" }
  ],
  // EXACTLY 15 pairs. See AEO requirements above.

  "focusKeyphrase": "",
  // Primary target keyword/phrase, 3–6 words.

  "keywords": "",
  // 8–12 comma-separated secondary keywords/phrases, one string.

  "metaTitle": "",
  // 55–60 chars: "<keyphrase-driven title> | Longevia Research"

  "metaDescription": "",
  // 150–160 chars, snippet-optimized, distinct from excerpt.

  "relatedProducts": [""],
  // Exact Longevia Research product NAME(s) — see per-topic notes below.
  // If uncertain a product name is currently active in the catalog,
  // leave this array empty rather than guessing.

  "references": [
    { "citationText": "", "url": "" }
  ],
  // 3–8 REAL sources only. See EEAT requirements above.

  "status": "draft",

  "publishedAt": ""
  // Today's date, YYYY-MM-DD, as a placeholder.
}

=====================================================================
TOPIC 1 of 4
=====================================================================
TOPIC: What Is GLP-3? Meaning, Mechanism & How Triple Receptor Agonists
  Work
CATEGORY: Studies
COMPOUNDS COVERED: GLP-3 (Rt) — a triple receptor agonist targeting
  GLP-1, GIP, and glucagon receptors.
ANGLE: Short, punchy, glossary/explainer format — NOT a deep research
  guide (the site already has two of those). This post's job is to be
  the single best plain-English answer to "what is this thing," then
  hand the reader off to deeper guides via internal links.
TARGET QUERIES (work these into FAQs/headings verbatim where natural):
  "glp3 meaning" · "what does glp-3 stand for" · "what's a glp3" ·
  "how does glp-3 work" · "how do glp3s work" · "what is glp 3" ·
  "what is glp 3 used for" · "what is glp-3 used for" ·
  "triple agonist" · "triple agonists" · "triple agonist mechanism" ·
  "triple hormone receptor agonist" · "glp 3 agonist" · "glp-3 agonist" ·
  "ggg tri-agonist" · "triple g agonist"
INTERNAL LINKS: Use <!-- LINK: deep-dive GLP-3 mechanism guide -->,
  <!-- LINK: GLP-3 (Rt) product-specific research guide -->, and
  <!-- LINK: Semaglutide vs Tirzepatide vs GLP-3 comparison --> as
  placeholders — do not guess exact slugs.
RELATED PRODUCTS: ["GLP-3 (Rt)"]
STRUCTURE GUIDANCE: plain-English definition → why "triple" → receptor
  breakdown (GLP-1 / GIP / glucagon, each explained individually) → how
  triple agonism differs mechanistically from dual/single agonists →
  research context → where to find deeper technical/dosage content.
AVOID: Duplicating mechanism-paper-level technical depth — this is the
  accessible on-ramp, not a third technical deep dive.

=====================================================================
TOPIC 2 of 4
=====================================================================
TOPIC: GLP-3 (Rt) Dosage and Reconstitution Research Guide
CATEGORY: Guides
COMPOUNDS COVERED: GLP-3 (Rt)
ANGLE: Operational how-to guide — reconstitution math, storage
  conditions, handling protocol. Mirror the structure of a standard
  peptide dosage/reconstitution guide (opening context → reconstitution
  math/table → storage table → handling notes → research protocol
  considerations).
TARGET QUERIES: No direct high-volume GSC cluster yet for this specific
  angle — this fills a structural content gap for a product page that
  already receives real search impressions but has no supporting
  dosage/reconstitution content.
INTERNAL LINKS: Use <!-- LINK: peptide dosage calculation guide -->,
  <!-- LINK: how long peptides last after reconstitution -->, and
  <!-- LINK: GLP-3 (Rt) mechanism guide --> as placeholders.
RELATED PRODUCTS: ["GLP-3 (Rt)"]
STRUCTURE GUIDANCE: Include a reconstitution-math table (bacteriostatic
  water volume → resulting concentration) and a storage-conditions
  table (temperature, reconstituted shelf life, light sensitivity).

=====================================================================
TOPIC 3 of 4
=====================================================================
TOPIC: GLP-3 vs. Tirzepatide: Direct Research Comparison
CATEGORY: Guidelines
COMPOUNDS COVERED: GLP-3 (Rt), Tirzepatide (discussed for comparison
  only — see RELATED PRODUCTS note below)
ANGLE: Sharp, focused 2-compound head-to-head — distinct from a broader
  3-way comparison that may already exist on the site. Go deeper on just
  these two: receptor targets, mechanism class differences, what "triple"
  agonism adds over "dual" agonism, research-context differences.
TARGET QUERIES: "tirzepatide vs glp 3" · "glp-3 vs tirzepatide"
INTERNAL LINKS: Use <!-- LINK: Semaglutide vs Tirzepatide vs GLP-3
  three-way comparison -->, <!-- LINK: GLP-3 (Rt) mechanism guide -->,
  and <!-- LINK: Tirzepatide dosage and reconstitution guide --> as
  placeholders.
RELATED PRODUCTS: ["GLP-3 (Rt)"] ONLY. Do NOT include "Tirzepatide" in
  relatedProducts — its current catalog/active status is unconfirmed.
  Discuss it in the content as a comparison compound only, never as a
  purchasable cross-sell.
STRUCTURE GUIDANCE: A comparison table is mandatory (receptor targets,
  mechanism class, key differentiator, typical research context) — this
  is the core deliverable of a head-to-head post.

=====================================================================
TOPIC 4 of 4
=====================================================================
TOPIC: Sourcing NAD+ Research Compound: COA, Purity & What to Check
  Before You Order
CATEGORY: Guides
COMPOUNDS COVERED: NAD+
ANGLE: Commercial/trust/sourcing angle — NOT mechanism (the site already
  has a mitochondrial/sirtuin-pathway mechanism deep dive). This is a
  buyer's-checklist post: how to verify a Certificate of Analysis, what
  a ≥99% purity / HPLC-LC-MS testing standard actually means, lot
  traceability, and general red flags when sourcing research compounds.
TARGET QUERIES: "nad research compound for sale" · "buy nad research
  compound" · "nad+ research compound"
INTERNAL LINKS: Use <!-- LINK: NAD+ mitochondrial/sirtuin mechanism
  guide -->, <!-- LINK: how to read a peptide COA guide -->, and
  <!-- LINK: why peptide purity matters guide --> as placeholders. You
  may reference "the COA library" and "Certificates of Analysis" as
  concepts without linking a specific URL.
RELATED PRODUCTS: ["NAD+"]
COMPLIANCE NOTE: Keep RUO framing consistent throughout — Research Use
  Only, not for human consumption — even though the target queries use
  "for sale"/"buy" language. Frame the content around sourcing and
  verification for legitimate research use, not consumption. A
  ":::warning" callout on this distinction is a good fit if it reads
  naturally — don't force it awkwardly into body paragraphs.

---

*(End of prompt. Output 4 JSON objects, one per topic, in order.)*
