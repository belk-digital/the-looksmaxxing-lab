# Longevia Research — Blog Post Content Template

This is a fixed content template, not a one-off prompt. Use it with any AI
tool or source — the output format must be identical every time, because it
feeds a real, tested import script (`scripts/import-blog-post.ts`) that
converts it straight into a `blog-posts` document.

---

## How to use this

1. Paste the block under "TEMPLATE TO FILL OUT" into whatever AI/tool you're
   using, along with your researched topic and source material.
2. Tell it: *"Fill out every field in this template exactly as specified,
   including the `content` field's constrained markdown syntax. Output ONLY
   the final JSON object matching the schema — no extra commentary."*
3. Save the JSON output as `blog-drafts/<slug>.json`.
4. Save the one featured image as `blog-drafts/<slug>.webp` (same basename,
   `.jpg`/`.jpeg`/`.png`/`.avif` also work) — the import script finds it
   automatically from the JSON's basename.
5. Run: `pnpm run import:blog -- blog-drafts/<slug>.json`

That's the whole pipeline — no manual admin data entry, no separate step for
me to write custom code per post. The script always does the same thing:
upload the image to `blog-media`, verify every internal link against the
real database, convert `content` to lexical richText, resolve
`relatedProducts` names to real product IDs, set the author to the site's
admin account, and create the post.

---

```
TEMPLATE TO FILL OUT
=====================================================================

CONTEXT (fixed — do not change)
- Site: Longevia Research, longeviaresearch.com — a supplier of research
  peptides. Every batch is independently HPLC/LC-MS tested; lot-specific
  COAs are published in the site's COA Library.
- Audience: researchers and lab professionals.
- Content rules (dosage, usage framing, claims, etc.) are the author's
  call per post — no fixed compliance language is imposed by this
  template. Write the post as directed for that specific topic.

INPUT (fill in before generating)
- TOPIC: ___
- SOURCE MATERIAL: ___ (research notes, study excerpts, links, key facts)
- COMPOUNDS/PEPTIDES COVERED: ___

=====================================================================
CONTENT MARKDOWN SYNTAX — the "content" field below is NOT free-form
markdown. It's a constrained syntax that maps 1:1 to the exact node types
the blog editor supports. Use ONLY these constructs:
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
- Inline formatting: **bold text**. No italics, no inline code, no images
  (there are no inline images anywhere — one featured image per post only).
- Inline links: [anchor text](/product/<slug>) for products,
  [anchor text](/journal/<slug>) for other posts. Only use a slug you
  actually know. If unsure, don't guess — write natural anchor-free text and
  insert a placeholder instead: <!-- LINK: short description of target -->
  Never link the same URL more than 2–3 times in one post.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON object, fully filled in, following
the format rule attached to each key
=====================================================================

{
  "title": "",
  // 50–70 chars. Keyword-rich. Include the primary compound name(s) and
  // the angle (comparison / guide / mechanism / protocol).

  "slug": "",
  // lowercase-hyphenated, derived from title, 5–8 words max, no stop
  // words. (Optional — the import script derives one from title if omitted.)

  "category": "",
  // EXACTLY one of: "Emerging" | "Guidelines" | "Studies" | "Guides"
  // — never a new value. See the guide below each is for.
  //   Studies    = compound-specific mechanism/pharmacokinetic deep dives
  //   Guidelines = multi-compound protocols, stacking, comparisons
  //   Guides     = operational how-tos (purity testing, storage, reconstitution)
  //   Emerging   = newer/less-established compounds, first-look coverage

  "excerpt": "",
  // 1–2 sentences, 140–160 chars. Standalone factual summary — shown on
  // /journal listing cards and as fallback meta description.

  "featuredImageBrief": "",
  // ONE sentence describing what the single featured image should show.
  // Not read by the import script — a note to whoever sources/generates
  // the actual image file.

  "featuredImageAlt": "",
  // REQUIRED. One full sentence, 100–125 chars, detailed and specific
  // (describe the actual visual, not just the compound name).
  // e.g. "Vial and syringe of Tirzepatide research peptide beside a
  // molecular structure diagram on a dark laboratory background."

  "content": "",
  // Full article body using ONLY the constrained markdown syntax above.
  // 1,200–2,500 words.
  // - Opening paragraph (no heading): what this covers and why it
  //   matters for research.
  // - ## for major sections (mechanism, comparative analysis, research
  //   applications, storage/handling, etc.).
  // - ### for subsections.
  // - At least one pipe table if 2+ compounds are discussed.
  // - At least one ::: callout ::: for a genuinely useful note.
  // - Bold key terms/compound names on first mention.
  // - Every factual sentence should be self-contained and quotable on
  //   its own (an AI answer engine may extract single sentences).
  // - NO FAQ section here (goes in "faqs" below).
  // - NO Key Takeaways section here (goes in "keyTakeaways" below).
  // - Internal links wherever a product/compound/related topic is
  //   mentioned, per the CONTENT MARKDOWN SYNTAX rules above.

  "readTime": "",
  // e.g. "12 min read" — estimate from content word count at ~200wpm.
  // Optional — left blank, the site auto-calculates it from content length.

  "keyTakeaways": [""],
  // 5–8 short, standalone, factual bullet sentences summarizing the
  // post's key claims. Each must stand alone as an AI-extractable fact.

  "faqs": [
    { "question": "", "answer": "" }
  ],
  // 8–15 pairs. Answers 1–3 sentences, self-contained.
  // Cover: research protocols, reconstitution, storage, stacking,
  // mechanism comparisons, half-life, sourcing/purity.

  "focusKeyphrase": "",
  // The single primary target keyword/phrase, 3–6 words.

  "keywords": "",
  // 8–12 comma-separated secondary keywords/phrases, one string.

  "metaTitle": "",
  // 55–60 chars: "<keyphrase-driven title> | Longevia Research"
  // Optional — falls back to "title" if left blank.

  "metaDescription": "",
  // 150–160 chars. Distinct from excerpt — snippet-optimized, can end
  // with a soft CTA like "Explore the research."
  // Optional — falls back to "excerpt" if left blank.

  "relatedProducts": [""],
  // Exact Longevia Research product NAME(s) this post should cross-sell
  // (e.g. "Tirzepatide", "BPC-157"). Product names as listed in the
  // store — no dosage/mg in the name, that's a variant-level detail.
  // Names, not IDs — the script resolves them.

  "references": [
    { "citationText": "", "url": "" }
  ],
  // 3–8 REAL sources only (PubMed/DOI/journal/compound data sheets).
  // Never fabricate a citation, author, journal, or DOI. If unsure a
  // source is real and correctly attributed, omit it — an accurate
  // shorter list beats a padded fake one.

  "status": "draft",
  // "draft" (default, review before publishing) or "published" (goes
  // live on /journal immediately on import). Your call per post.

  "publishedAt": ""
  // Today's date, YYYY-MM-DD, as a placeholder. Optional — defaults to
  // "now" if omitted.
}
```

---

## Field → Payload field map

| Template key | Collection field | Notes |
|---|---|---|
| title | `title` | |
| slug | `slug` | Optional, derived from title if omitted |
| category | `category` | Fixed 4-option select: Emerging / Guidelines / Studies / Guides |
| excerpt | `excerpt` | |
| featuredImageBrief | — | Not stored; only used to source/generate the image file |
| featuredImageAlt | `featuredImage` → `blog-media.alt` | Required on every upload |
| content | `content` | Constrained markdown → parsed into lexical richText by the script |
| readTime | `readTime` | Left blank → auto-calculated from content length |
| keyTakeaways | `keyTakeaways` | One row per string |
| faqs | `faqs` | One row per Q/A pair |
| focusKeyphrase | `focusKeyphrase` | |
| keywords | `keywords` | |
| metaTitle | `metaTitle` | Falls back to `title` if blank |
| metaDescription | `metaDescription` | Falls back to `excerpt` if blank |
| relatedProducts | `relatedProducts` | Names resolved to product IDs by the script |
| references | `references` | One row per citation |
| status | `status` | `draft` or `published`, as set |
| publishedAt | `publishedAt` | |
| author | `author` | Not in the template — the script always sets it to the site's admin user account |

---

## Running the import

```
pnpm run import:blog -- blog-drafts/<slug>.json
```

The script (`scripts/import-blog-post.ts`, using `src/lib/blog/markdownToLexical.ts`):

1. Finds the featured image next to the JSON file by matching basename (`.webp`/`.jpg`/`.jpeg`/`.png`/`.avif`), or accepts an explicit second argument. Uploads it to **`blog-media`** (never `media`) with `featuredImageAlt` as its `alt`.
2. Verifies every `[text](/product/<slug>)` and `[text](/journal/<slug>)` link in `content` against the real `products`, `blog-posts`, and `pages` collections — and flags every `<!-- LINK: ... -->` placeholder. Broken/unresolved links are printed as warnings for manual review; nothing is silently guessed or auto-fixed.
3. Parses `content`'s constrained markdown into lexical richText (paragraphs, headings, lists, blockquotes, tables, callout boxes, inline bold, inline links).
4. Resolves `relatedProducts` names to real product IDs via a name lookup; unmatched names are flagged.
5. Sets `author` to the site's admin user account.
6. Creates the post (or updates it, if a post with that slug already exists) at whatever `status` you set in the JSON.

After it runs, review the warnings it prints, open the post in
`/admin/collections/blog-posts`, fix anything flagged, and confirm it
renders correctly at `/journal/<slug>` before treating it as final.
