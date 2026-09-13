# Longevia Research — 3 Standalone Generation Prompts

Three fully self-contained prompts, one per topic. Each can be pasted into
Opus independently — none references the others or any local file.

---
---

# PROMPT 1 of 3 — MT-2 Nasal Spray

Paste everything below this line into Opus.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Every batch is independently
HPLC/LC-MS tested; lot-specific Certificates of Analysis (COAs) are published
in the site's COA Library. The audience is researchers and lab professionals.
Content is Research Use Only (RUO) framing — not for human consumption, no
therapeutic/medical claims.

TOPIC: MT-2 Nasal Spray: Dosage, Administration & Research Protocol
CATEGORY: Guides
COMPOUND COVERED: Melanotan II (MT-2), specifically the nasal spray delivery
  format, supplied as "MT-2 Spray".

ANGLE AND CRITICAL EEAT CONSTRAINT — READ CAREFULLY:
Melanotan II has real, peer-reviewed human pharmacokinetic and mechanism
data, but that published literature is almost entirely from SUBCUTANEOUS
administration studies (the classic early-phase human studies), not
intranasal delivery. Intranasal peptide delivery in general has well-
characterized bioavailability challenges (nasal mucosa absorption limits,
enzymatic degradation, mucociliary clearance) that are legitimate, citable
pharmaceutical science — cite this general intranasal-delivery literature
honestly. But do NOT present community/anecdotal nasal-spray dosing
conventions as if they were peer-reviewed clinical dosing regimens. Write
with an explicit, clear distinction between (a) what is established in
published subcutaneous MT-2 pharmacology/safety literature, (b) what is
established more generally about intranasal peptide bioavailability, and
(c) what is informal research-community practice for nasal administration
that has NOT been validated in controlled human trials. Blurring these
three categories together is the single biggest EEAT failure mode for this
topic — do not let a specific "mcg per spray" number appear without making
clear whether it traces to a real study or to informal practice.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — the "content" field is NOT free-form markdown.
It is a constrained syntax mapping 1:1 to specific editor node types. Use
ONLY these constructs:
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
- Inline formatting: **bold text**. No italics, no inline code, no images.
- Inline links: [anchor text](/journal/<slug>) for other blog posts. If not
  100% certain of an exact slug, do NOT guess — write natural anchor-free
  text and insert a placeholder instead: <!-- LINK: short description -->
  Never link the same URL more than 2–3 times in one post.

=====================================================================
MANDATORY LENGTH / STRUCTURE SPECS
=====================================================================
- "content": 2,000+ words MINIMUM, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 14 question/answer pairs, 1–3 sentences each,
  self-contained and quotable. Work in real user search phrasings around
  MT-2 nasal spray dosing, administration, and storage — not just the
  general MT-2 topic.
- "keyTakeaways": 6–8 short, standalone, factual bullet sentences.
- QUICK ANSWER CALLOUT (new, mandatory): immediately after the opening
  paragraph, before the first "##" heading, include a ":::info" callout
  that directly answers "how is MT-2 nasal spray typically studied/
  administered" in 2–3 sentences — a front-loaded direct answer distinct
  from the closing Key Takeaways, written for snippet/AI-Overview
  extraction.
- Minimum 6 "##" H2 sections, each with real substance (300+ words).
- At least 2 pipe tables (e.g. subcutaneous vs. intranasal comparison,
  and a reconstitution/administration reference table).
- At least 2 more callout boxes beyond the Quick Answer (3 total minimum),
  varied style — at least one ":::warning" addressing the evidence-gap
  distinction described above.
- Bold key terms/compound names on first mention.
- NO FAQ section inside "content". NO Key Takeaways section inside "content".

=====================================================================
EEAT / SEO / GEO / AEO REQUIREMENTS
=====================================================================
EEAT:
  - Every entry in "references" must be a REAL, verifiable source (PubMed/
    DOI/journal article) with a working, accurate URL. NEVER fabricate a
    citation, author, journal name, or DOI. If you are not fully confident
    a source is real and correctly attributed, DO NOT include it.
  - Apply the critical EEAT constraint above rigorously throughout, not
    just in one disclaimer paragraph.

SEO:
  - "focusKeyphrase" should center on MT-2 nasal spray dosing/administration
    search intent.
  - "keywords" should include realistic long-tail variants (nasal spray
    dosage, administration protocol, intranasal peptide, etc.) written
    naturally.

GEO:
  - Every factual sentence self-contained and quotable out of context.
  - Each H2 section opens with a direct one-sentence answer to the
    question implied by that heading, then elaborates.

AEO:
  - The 14 FAQs are the primary AEO surface — answer literal likely user
    phrasings, not just the general subject.
  - Every FAQ answer extractable as a standalone snippet.

INTERNAL LINKS: Use these placeholders, not guessed slugs —
  <!-- LINK: Melanotan II research status, legal questions and safety
  profile guide --> (existing site content on legal/safety context) and
  <!-- LINK: peptide dosage calculation guide --> (general mg/mcg/mL
  conversion reference). Max 2–3 uses of any one link.

RELATED PRODUCTS: ["MT-2 Spray"] — use this exact product name.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON object, fully filled in
=====================================================================

{
  "title": "",
  // 50–70 chars. Keyword-rich. Include compound name and format (nasal
  // spray) and the angle (dosage / administration / research protocol).

  "slug": "",
  // lowercase-hyphenated, derived from title, 5–8 words max, no stop words.

  "category": "Guides",

  "excerpt": "",
  // 1–2 sentences, 140–160 chars. Standalone factual summary.

  "featuredImageBrief": "",
  // ONE sentence describing what the featured image should show.

  "featuredImageAlt": "",
  // REQUIRED. One full sentence, 100–125 chars, describing the actual
  // visual, not just the compound name.

  "content": "",
  // Full article body, constrained markdown syntax above. 2,000+ words.
  // Opening paragraph (no heading) on what this covers and why it
  // matters for research, then the Quick Answer callout, then H2/H3
  // sections per the structure specs above.

  "readTime": "",
  // Optional — leave blank, auto-calculated.

  "keyTakeaways": [""],
  // 6–8 short, standalone, factual bullet sentences.

  "faqs": [
    { "question": "", "answer": "" }
  ],
  // EXACTLY 14 pairs.

  "focusKeyphrase": "",
  "keywords": "",
  // 8–12 comma-separated secondary keywords/phrases, one string.

  "metaTitle": "",
  // 55–60 chars: "<keyphrase-driven title> | Longevia Research"

  "metaDescription": "",
  // 150–160 chars, snippet-optimized, distinct from excerpt.

  "relatedProducts": ["MT-2 Spray"],

  "references": [
    { "citationText": "", "url": "" }
  ],
  // 3–8 REAL sources only. See EEAT requirements above.

  "status": "draft",
  "publishedAt": ""
  // Today's date, YYYY-MM-DD, as a placeholder.
}

*(End of Prompt 1 of 3.)*

---
---

# PROMPT 2 of 3 — MOTS-C Dosage and Reconstitution

Paste everything below this line into Opus.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Every batch is independently
HPLC/LC-MS tested; lot-specific Certificates of Analysis (COAs) are published
in the site's COA Library. The audience is researchers and lab professionals.
Content is Research Use Only (RUO) framing — not for human consumption, no
therapeutic/medical claims.

TOPIC: MOTS-C Dosage and Reconstitution Research Guide
CATEGORY: Guides
COMPOUND COVERED: MOTS-c, a mitochondrial-derived peptide.

ANGLE: Operational how-to guide — reconstitution math, storage conditions,
handling protocol — following the same structural pattern as a standard
peptide dosage/reconstitution guide (opening context → reconstitution
math/table → storage table → handling protocol → research context). This
is NOT a mechanism deep-dive; the site already has separate mechanism
content, so keep mechanism explanation brief (one section, not the focus)
and concentrate depth on handling, math, and protocol.

REGULATORY NOTE — VERIFY BEFORE INCLUDING: There has been active 2026 FDA
regulatory activity regarding MOTS-c and the 503A compounding pharmacy
bulks list. Before stating anything about this in the post, search for and
cite the FDA's own primary source (Federal Register notice, FDA advisory
committee meeting record, or FDA.gov page) rather than a secondary
peptide-vendor blog. If you cannot find and verify a primary source, omit
the regulatory-status claim entirely rather than stating it on the
strength of a secondary source — this is a fast-moving regulatory
situation and secondary sources may already be stale or inaccurate by the
time this is published.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — the "content" field is NOT free-form markdown.
It is a constrained syntax mapping 1:1 to specific editor node types. Use
ONLY these constructs:
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
- Inline formatting: **bold text**. No italics, no inline code, no images.
- Inline links: [anchor text](/journal/<slug>) for other blog posts. If not
  100% certain of an exact slug, do NOT guess — write natural anchor-free
  text and insert a placeholder instead: <!-- LINK: short description -->
  Never link the same URL more than 2–3 times in one post.

=====================================================================
MANDATORY LENGTH / STRUCTURE SPECS
=====================================================================
- "content": 2,000+ words MINIMUM, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 14 question/answer pairs, 1–3 sentences each,
  self-contained and quotable. Cover reconstitution math, storage,
  handling, stacking/protocol design, and sourcing/purity verification.
- "keyTakeaways": 6–8 short, standalone, factual bullet sentences.
- QUICK ANSWER CALLOUT (new, mandatory): immediately after the opening
  paragraph, before the first "##" heading, include a ":::info" callout
  giving the core reconstitution answer (e.g. the basic mg-per-mL
  relationship) in 2–3 sentences — a front-loaded direct answer distinct
  from the closing Key Takeaways.
- Minimum 6 "##" H2 sections, each with real substance (300+ words).
- At least 2 pipe tables (a reconstitution-math table mapping solvent
  volume to concentration, and a storage-conditions table).
- At least 2 more callout boxes beyond the Quick Answer (3 total minimum),
  varied style.
- Bold key terms/compound names on first mention.
- NO FAQ section inside "content". NO Key Takeaways section inside "content".

=====================================================================
EEAT / SEO / GEO / AEO REQUIREMENTS
=====================================================================
EEAT:
  - Every entry in "references" must be a REAL, verifiable source (PubMed/
    DOI/journal article) with a working, accurate URL. NEVER fabricate a
    citation, author, journal name, or DOI. If unsure, omit rather than
    include.
  - Follow the regulatory-note verification instruction above exactly.

SEO:
  - "focusKeyphrase" should center on MOTS-C dosage/reconstitution intent.
  - "keywords" should include realistic long-tail variants written
    naturally (reconstitution, storage, dosing protocol, bacteriostatic
    water, etc.).

GEO:
  - Every factual sentence self-contained and quotable out of context.
  - Each H2 section opens with a direct one-sentence answer to the
    question implied by that heading, then elaborates.

AEO:
  - The 14 FAQs are the primary AEO surface — answer literal likely user
    phrasings, not just the general subject.
  - Every FAQ answer extractable as a standalone snippet.

INTERNAL LINKS: Use these placeholders, not guessed slugs —
  <!-- LINK: MOTS-C mitochondrial exercise mimetic mechanism guide -->,
  <!-- LINK: peptide dosage calculation guide -->, and
  <!-- LINK: how long peptides last after reconstitution guide -->.
  Max 2–3 uses of any one link.

RELATED PRODUCTS: ["MOTS-C"] — use this exact product name.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON object, fully filled in
=====================================================================

{
  "title": "",
  // 50–70 chars. Keyword-rich. Include compound name and the angle
  // (dosage / reconstitution / research guide).

  "slug": "",
  // lowercase-hyphenated, derived from title, 5–8 words max, no stop words.

  "category": "Guides",

  "excerpt": "",
  // 1–2 sentences, 140–160 chars. Standalone factual summary.

  "featuredImageBrief": "",
  // ONE sentence describing what the featured image should show.

  "featuredImageAlt": "",
  // REQUIRED. One full sentence, 100–125 chars, describing the actual
  // visual, not just the compound name.

  "content": "",
  // Full article body, constrained markdown syntax above. 2,000+ words.
  // Opening paragraph (no heading), then the Quick Answer callout, then
  // H2/H3 sections per the structure specs above.

  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [
    { "question": "", "answer": "" }
  ],
  // EXACTLY 14 pairs.

  "focusKeyphrase": "",
  "keywords": "",
  "metaTitle": "",
  // 55–60 chars: "<keyphrase-driven title> | Longevia Research"
  "metaDescription": "",
  // 150–160 chars, snippet-optimized, distinct from excerpt.

  "relatedProducts": ["MOTS-C"],

  "references": [
    { "citationText": "", "url": "" }
  ],
  // 3–8 REAL sources only.

  "status": "draft",
  "publishedAt": ""
  // Today's date, YYYY-MM-DD, as a placeholder.
}

*(End of Prompt 2 of 3.)*

---
---

# PROMPT 3 of 3 — Semax Nasal Spray

Paste everything below this line into Opus.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Every batch is independently
HPLC/LC-MS tested; lot-specific Certificates of Analysis (COAs) are published
in the site's COA Library. The audience is researchers and lab professionals.
Content is Research Use Only (RUO) framing — not for human consumption, no
therapeutic/medical claims.

TOPIC: Semax Nasal Spray: Dosing, Mixing & Storage Guide
CATEGORY: Guides
COMPOUND COVERED: Semax, specifically the nasal spray delivery format,
  supplied as "Semax Spray".

ANGLE AND NOTABLE FACT TO VERIFY: Semax has an unusually strong published
human evidence base compared to most research peptides — including
registered pharmaceutical status and human clinical studies (including
stroke/neurological research) in Russia, where it has intranasal drop
formulations with real regulatory history. This is a genuinely
differentiating, valuable fact for this post IF accurate — but verify it
independently through real search/research rather than asserting it from
assumption, and cite the specific primary or peer-reviewed secondary
sources you find. Do not overstate this into implying any US regulatory
approval or therapeutic claim — Semax has no FDA approval, and RUO framing
applies to the material Longevia Research supplies regardless of any
approval status elsewhere.

REGULATORY NOTE — VERIFY BEFORE INCLUDING: There has been active 2026 FDA
regulatory activity regarding Semax and the 503A compounding bulks list
(removal from one list, a subsequent advisory committee recommendation on
another). Before stating anything about this, search for and cite the
FDA's own primary source (Federal Register notice, advisory committee
meeting record, or FDA.gov page) rather than a secondary peptide-vendor
blog. If you cannot verify a primary source, omit the claim rather than
stating it on a secondary source's authority alone.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — the "content" field is NOT free-form markdown.
It is a constrained syntax mapping 1:1 to specific editor node types. Use
ONLY these constructs:
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
- Inline formatting: **bold text**. No italics, no inline code, no images.
- Inline links: [anchor text](/journal/<slug>) for other blog posts. If not
  100% certain of an exact slug, do NOT guess — write natural anchor-free
  text and insert a placeholder instead: <!-- LINK: short description -->
  Never link the same URL more than 2–3 times in one post.

=====================================================================
MANDATORY LENGTH / STRUCTURE SPECS
=====================================================================
- "content": 2,000+ words MINIMUM, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 14 question/answer pairs, 1–3 sentences each,
  self-contained and quotable. Cover dosing conventions, mixing/
  reconstitution if applicable to the spray format, storage, cycling
  practice, and sourcing/purity verification.
- "keyTakeaways": 6–8 short, standalone, factual bullet sentences.
- QUICK ANSWER CALLOUT (new, mandatory): immediately after the opening
  paragraph, before the first "##" heading, include a ":::info" callout
  directly answering "how is Semax nasal spray typically administered in
  research contexts" in 2–3 sentences — a front-loaded direct answer
  distinct from the closing Key Takeaways.
- Minimum 6 "##" H2 sections, each with real substance (300+ words).
- At least 2 pipe tables (e.g. a dosing-convention reference table and a
  storage-conditions table).
- At least 2 more callout boxes beyond the Quick Answer (3 total minimum),
  varied style.
- Bold key terms/compound names on first mention.
- NO FAQ section inside "content". NO Key Takeaways section inside "content".

=====================================================================
EEAT / SEO / GEO / AEO REQUIREMENTS
=====================================================================
EEAT:
  - Every entry in "references" must be a REAL, verifiable source (PubMed/
    DOI/journal article) with a working, accurate URL. NEVER fabricate a
    citation, author, journal name, or DOI. If unsure, omit rather than
    include.
  - Follow both verification instructions above (the Russia regulatory/
    evidence-base claim and the 2026 US FDA regulatory claim) exactly —
    both are asserted as needing independent verification, not stated
    as pre-confirmed fact in this prompt.

SEO:
  - "focusKeyphrase" should center on Semax nasal spray dosing intent.
  - "keywords" should include realistic long-tail variants written
    naturally (nasal spray dosage, intranasal protocol, mixing/storage,
    nootropic peptide, etc.).

GEO:
  - Every factual sentence self-contained and quotable out of context.
  - Each H2 section opens with a direct one-sentence answer to the
    question implied by that heading, then elaborates.

AEO:
  - The 14 FAQs are the primary AEO surface — answer literal likely user
    phrasings, not just the general subject.
  - Every FAQ answer extractable as a standalone snippet.

INTERNAL LINKS: Use these placeholders, not guessed slugs —
  <!-- LINK: Semax vs Selank nootropic peptide comparison -->,
  <!-- LINK: peptide dosage calculation guide -->, and
  <!-- LINK: how long peptides last after reconstitution guide -->.
  Max 2–3 uses of any one link.

RELATED PRODUCTS: ["Semax Spray"] — use this exact product name.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON object, fully filled in
=====================================================================

{
  "title": "",
  // 50–70 chars. Keyword-rich. Include compound name, format (nasal
  // spray), and the angle (dosing / mixing / storage guide).

  "slug": "",
  // lowercase-hyphenated, derived from title, 5–8 words max, no stop words.

  "category": "Guides",

  "excerpt": "",
  // 1–2 sentences, 140–160 chars. Standalone factual summary.

  "featuredImageBrief": "",
  // ONE sentence describing what the featured image should show.

  "featuredImageAlt": "",
  // REQUIRED. One full sentence, 100–125 chars, describing the actual
  // visual, not just the compound name.

  "content": "",
  // Full article body, constrained markdown syntax above. 2,000+ words.
  // Opening paragraph (no heading), then the Quick Answer callout, then
  // H2/H3 sections per the structure specs above.

  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [
    { "question": "", "answer": "" }
  ],
  // EXACTLY 14 pairs.

  "focusKeyphrase": "",
  "keywords": "",
  "metaTitle": "",
  // 55–60 chars: "<keyphrase-driven title> | Longevia Research"
  "metaDescription": "",
  // 150–160 chars, snippet-optimized, distinct from excerpt.

  "relatedProducts": ["Semax Spray"],

  "references": [
    { "citationText": "", "url": "" }
  ],
  // 3–8 REAL sources only.

  "status": "draft",
  "publishedAt": ""
  // Today's date, YYYY-MM-DD, as a placeholder.
}

*(End of Prompt 3 of 3.)*
