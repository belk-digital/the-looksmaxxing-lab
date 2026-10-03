# Longevia Research — 4 Standalone Prompts (Analytical-Chemistry Topics, Compliance-First)

Each prompt is self-contained. Paste any one into Opus on its own.
Topics: (1) Net peptide content vs HPLC purity, (2) TFA counterions and
residual water, (3) Endotoxin (LAL) testing, (4) Solid-phase synthesis
impurities and LC-MS.

Shared spec changes vs earlier batches: NO dosing, administration,
reconstitution, syringe, diluent, or "protocol" content of any kind (see
COMPLIANCE block in each prompt). FAQ count is 12; change the number in
each prompt if you prefer 15.

---
---

# PROMPT 1 of 4 — Net Peptide Content vs. HPLC Purity

Paste everything below this line.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Audience: laboratory researchers
and analytical staff. All products are Research Use Only (RUO).

TOPIC: Net peptide content vs HPLC purity, and why the two numbers differ
TITLE DIRECTION (no colon, spoken style, adjust freely): "Why Does My
  Peptide Show 99% Purity but Less Peptide by Weight?" or "Net Peptide
  Content vs HPLC Purity Explained"
CATEGORY: Guides
TARGET QUERIES: net peptide content vs purity, peptide purity vs content,
  what is net peptide content, hplc purity vs peptide content, peptide
  gross weight vs net weight, why is my peptide purity 99% but content
  lower, peptide content analysis

ANGLE: An analytical-documentation explainer for reading a Certificate of
Analysis. Explain, with a worked mass-fraction example for lab records
(gross vial mass x net peptide content = peptide mass), why a 99% HPLC
result and a lower net content are both correct. The example must use
mass-fraction arithmetic ONLY.

=====================================================================
COMPLIANCE — HARD RULES (override every other instruction)
=====================================================================
1. NO dosing, dose ranges, frequency, cycles, protocols, administration
   or injection instructions, and NO reconstitution steps, diluent
   volumes, mg/mL working concentrations, syringes, needles, insulin
   units, or bacteriostatic/sterile water. Do not mention any of these
   words except to say they are outside the scope of this article.
2. No health, therapeutic, anti-aging, or performance claims. Do not
   name any disease, condition, or symptom in connection with a
   compound. Discuss the analytical chemistry only.
3. Do NOT include product links, product names, or a product list in the
   body. Leave "relatedProducts" as an empty array.
4. Grade evidence type whenever you cite a study (human RCT / human
   observational / animal / cell culture / analytical method paper /
   pharmacopoeial standard). This topic should rely mostly on analytical
   method papers and pharmacopoeial or regulatory documents.
5. Include a visible RUO disclaimer as a ":::warning" callout: products
   are for laboratory research use only; not for human or veterinary
   use; not intended to diagnose, treat, cure, or prevent disease.
6. Never cite a peptide vendor's web page as a source. Cite peer-reviewed
   papers, USP/Ph. Eur./ICH/FDA documents only.
7. About Longevia, you may state ONLY: every batch is independently
   HPLC/LC-MS tested and lot-specific Certificates of Analysis are
   published in the COA Library. Do not describe any other test, method,
   or specification Longevia performs.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — "content" is a constrained syntax, not
free-form markdown. Use ONLY:
=====================================================================
- Plain lines = paragraphs (blank line between paragraphs).
- "## Heading" = H2, "### Heading" = H3. Nothing deeper.
- "- item" = bullet list; "1. item" = numbered list.
- "> text" = blockquote.
- Pipe tables:  | A | B |  then  |---|---|  then rows.
- Callouts on their own lines:  :::info / :::tip / :::warning  ...  :::
- Inline: **bold** only. No italics, no inline code, no images.
- Internal links: [anchor](/journal/<slug>). If unsure of a slug, do NOT
  guess: insert <!-- LINK: short description --> instead. Max 2-3 uses
  of one URL.

=====================================================================
SPECS
=====================================================================
- "content": 2,000+ words, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 12 pairs, real problems a lab actually hits (e.g. "why
  doesn't my COA content match the vial label mass"), 1-3 sentences,
  self-contained.
- "keyTakeaways": 6-8 short standalone factual sentences.
- QUICK ANSWER: right after the opening paragraph and before the first
  "##", a ":::info" callout answering the core question in 2-3 sentences.
- 6+ "##" sections of 300+ words each. Question-phrased H2s, each opening
  with a direct one-sentence answer (answer-first).
- 2+ tables (e.g. purity vs net content comparison; a worked mass-
  fraction table) and 3+ callouts total including the Quick Answer and
  the RUO disclaimer.
- No FAQ or Key Takeaways section inside "content".

=====================================================================
WRITING STYLE — HUMAN, PLAIN, SEO-FOCUSED (strict; check before output)
=====================================================================
Voice: a knowledgeable lab colleague explaining something over coffee.
Direct, specific, a little dry. Never a brochure, never an AI summary.

READABILITY
- Grade 8 vocabulary. When a technical term is needed, use it, then
  explain it in plain words in the same sentence, once.
- Sentences 20 words or fewer. Up to 25 only for a genuinely complex
  idea. Mix short and long on purpose. A four-word sentence is fine.
- Vary paragraph openings. No two paragraphs in a row may start with the
  same word or the same sentence shape. Keep paragraphs to 2-4 sentences.
- Start with a fact or a specific observation. Never open a paragraph
  or the article with a generic line about science, research, or how
  important something is.
- Prefer concrete numbers, named methods, and real examples over
  adjectives.

FORBIDDEN
- Em dashes anywhere (content, FAQs, titles, meta). Use a period or comma.
- Colons in ANY heading, including the title, H2s, and H3s.
- AI connectors: Furthermore, Moreover, Additionally, In addition,
  Overall, Ultimately, In conclusion, To summarize, It is worth noting,
  It's important to note, In today's.
- Power and filler words: leverage, seamless, unlock, delve, robust,
  game-changer, cutting-edge, comprehensive, landscape, tapestry, elevate,
  navigate (as a metaphor), crucial, pivotal, utilize, realm, holistic.
- Restating a heading as the first sentence under it.
- Stacked hedges ("may potentially help"). State settled facts flatly.
  Flag only genuinely uncertain claims, once, plainly.
- Keyword stuffing of any kind.

HEADINGS
- The title and every H2/H3 should read like something a person would
  say out loud, not a label. Most H2s are natural questions or plain
  statements ("Why does my COA show 99% purity but a lower content
  figure?"). No colons, no title case shouting, no "Introduction" or
  "Conclusion" headings.
- The title is the only H1. Do not write a second H1 inside content.

SEO / AEO / GEO
- Primary keyphrase: in the title, in the first 100 words, in one or two
  H2s, in the metaTitle (first), and in the metaDescription. Secondary
  phrases appear naturally, once or twice each, never forced.
- Answer-first: every H2 opens with a one-to-two sentence direct answer
  that could be quoted alone by a search engine or AI answer tool. Then
  explain.
- Definitions use a clean "X is Y" pattern the first time a term appears.
- Tables hold comparisons and specs; keep cell text short.
- FAQs are literal questions a real person types into a search box,
  answered in 1-3 sentences that make sense without the article.
- metaTitle 50-60 chars with the primary keyphrase first and the brand
  once at the end. metaDescription 145-160 chars, specific, no hype.

BEFORE YOU WRITE (do this silently, output only the JSON)
1. If you can browse: look at the top 3 Google results for the primary
   keyphrase. Note their headings, length, and what they skip. Use them
   ONLY to find gaps and to make yours clearer and more useful. Never
   copy wording, and never cite them (guardrail 6 still applies).
   If you cannot browse, skip this step.
2. Draft an outline: title, then each H2 with 3-5 specific bullet points
   saying exactly what facts, numbers, or examples go under it. Generic
   notes like "explain the concept" are not allowed.
3. Write from the outline, then proofread against every rule above
   (sentence length, em dashes, colons in headings, connectors, banned
   words) and fix violations before returning the JSON.

EEAT: every "references" entry must be REAL and verifiable with a working
URL; never fabricate authors, journals, or DOIs; omit if unsure. Look for
real sources on amino acid analysis, peptide content determination, and
USP General Chapter <1503> (quality attributes of synthetic peptide drug
substances). Verify each yourself.

SEO/GEO/AEO: work target queries into headings and openers naturally;
every factual sentence quotable standalone; the 12 FAQs answer literal
real-world questions.

INTERNAL LINKS (placeholders, do not guess slugs): <!-- LINK: how to read
  a peptide COA guide -->, <!-- LINK: why peptide purity matters guide -->.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON
=====================================================================
{
  "title": "",          // 50-70 chars
  "slug": "",           // 5-8 words, lowercase-hyphenated
  "category": "Guides",
  "excerpt": "",        // 140-160 chars
  "featuredImageBrief": "",
  "featuredImageAlt": "", // 100-125 chars, describe the actual visual
  "content": "",
  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [ { "question": "", "answer": "" } ],  // exactly 12
  "focusKeyphrase": "",
  "keywords": "",       // 8-12 comma-separated
  "metaTitle": "",      // 50-60 chars, primary keyphrase first, brand once at end: "... | Longevia Research"
  "metaDescription": "", // 145-160 chars
  "relatedProducts": [],
  "references": [ { "citationText": "", "url": "" } ],  // 3-8 real
  "status": "draft",
  "publishedAt": ""
}

*(End of Prompt 1 of 4.)*

---
---

# PROMPT 2 of 4 — TFA Counterions and Residual Water

Paste everything below this line.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Audience: laboratory researchers
and analytical staff. All products are Research Use Only (RUO).

TOPIC: TFA counterions and residual water in lyophilized peptides, and why
  they matter for lab records
TITLE DIRECTION (no colon, spoken style, adjust freely): "What Is TFA in
  a Peptide and Why Does It Matter in the Lab?"
CATEGORY: Guides
TARGET QUERIES: tfa in peptides, trifluoroacetate counterion, tfa salt vs
  acetate salt peptide, residual water in lyophilized peptides, peptide
  counterion removal, does tfa affect cell assays, peptide salt form

ANGLE: A chemistry primer. How trifluoroacetic acid enters solid-phase
synthesis and cleavage, why peptides are commonly supplied as TFA salts,
what acetate or HCl exchange means, how residual water and counterions
reduce peptide mass fraction, and how the published literature discusses
TFA's effects on in-vitro assays. Include a COA-field table (what each
field means and what to look for). Label the evidence type of every
biological finding (cell-culture study vs analytical paper).

=====================================================================
COMPLIANCE — HARD RULES (override every other instruction)
=====================================================================
1. NO dosing, dose ranges, frequency, cycles, protocols, administration
   or injection instructions, and NO reconstitution steps, diluent
   volumes, working concentrations, syringes, needles, insulin units, or
   bacteriostatic/sterile water. Do not mention these except to say they
   are outside scope.
2. No health, therapeutic, anti-aging, or performance claims. Do not
   name any disease, condition, or symptom in connection with a
   compound.
3. NO product links, product names, or product lists in the body.
   "relatedProducts" stays an empty array.
4. Grade evidence type for every study cited (cell culture / animal /
   human / analytical method / pharmacopoeial standard). Never present
   cell or animal data as human data.
5. Include a visible RUO disclaimer as a ":::warning" callout: for
   laboratory research use only; not for human or veterinary use; not
   intended to diagnose, treat, cure, or prevent disease.
6. Never cite a peptide vendor page. Cite peer-reviewed papers,
   pharmacopoeial or regulatory documents only.
7. About Longevia, state ONLY: every batch is independently HPLC/LC-MS
   tested and lot-specific COAs are published in the COA Library. Do not
   claim any other test, salt form, or specification.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — "content" is a constrained syntax, not
free-form markdown. Use ONLY:
=====================================================================
- Plain lines = paragraphs (blank line between paragraphs).
- "## Heading" = H2, "### Heading" = H3. Nothing deeper.
- "- item" = bullet list; "1. item" = numbered list.
- "> text" = blockquote.
- Pipe tables:  | A | B |  then  |---|---|  then rows.
- Callouts on their own lines:  :::info / :::tip / :::warning  ...  :::
- Inline: **bold** only. No italics, no inline code, no images.
- Internal links: [anchor](/journal/<slug>). If unsure of a slug, do NOT
  guess: insert <!-- LINK: short description --> instead. Max 2-3 uses
  of one URL.

=====================================================================
SPECS
=====================================================================
- "content": 2,000+ words, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 12 pairs, real lab problems (e.g. "can TFA affect my
  cell-based assay", "why is the label mass higher than peptide mass"),
  1-3 sentences, self-contained.
- "keyTakeaways": 6-8 short standalone factual sentences.
- QUICK ANSWER: right after the opening paragraph and before the first
  "##", a ":::info" callout answering the core question in 2-3 sentences.
- 6+ "##" sections of 300+ words each, question-phrased, answer-first.
- 2+ tables (COA-field table required) and 3+ callouts total including
  the Quick Answer and RUO disclaimer.
- No FAQ or Key Takeaways section inside "content".

=====================================================================
WRITING STYLE — HUMAN, PLAIN, SEO-FOCUSED (strict; check before output)
=====================================================================
Voice: a knowledgeable lab colleague explaining something over coffee.
Direct, specific, a little dry. Never a brochure, never an AI summary.

READABILITY
- Grade 8 vocabulary. When a technical term is needed, use it, then
  explain it in plain words in the same sentence, once.
- Sentences 20 words or fewer. Up to 25 only for a genuinely complex
  idea. Mix short and long on purpose. A four-word sentence is fine.
- Vary paragraph openings. No two paragraphs in a row may start with the
  same word or the same sentence shape. Keep paragraphs to 2-4 sentences.
- Start with a fact or a specific observation. Never open a paragraph
  or the article with a generic line about science, research, or how
  important something is.
- Prefer concrete numbers, named methods, and real examples over
  adjectives.

FORBIDDEN
- Em dashes anywhere (content, FAQs, titles, meta). Use a period or comma.
- Colons in ANY heading, including the title, H2s, and H3s.
- AI connectors: Furthermore, Moreover, Additionally, In addition,
  Overall, Ultimately, In conclusion, To summarize, It is worth noting,
  It's important to note, In today's.
- Power and filler words: leverage, seamless, unlock, delve, robust,
  game-changer, cutting-edge, comprehensive, landscape, tapestry, elevate,
  navigate (as a metaphor), crucial, pivotal, utilize, realm, holistic.
- Restating a heading as the first sentence under it.
- Stacked hedges ("may potentially help"). State settled facts flatly.
  Flag only genuinely uncertain claims, once, plainly.
- Keyword stuffing of any kind.

HEADINGS
- The title and every H2/H3 should read like something a person would
  say out loud, not a label. Most H2s are natural questions or plain
  statements ("Why does my COA show 99% purity but a lower content
  figure?"). No colons, no title case shouting, no "Introduction" or
  "Conclusion" headings.
- The title is the only H1. Do not write a second H1 inside content.

SEO / AEO / GEO
- Primary keyphrase: in the title, in the first 100 words, in one or two
  H2s, in the metaTitle (first), and in the metaDescription. Secondary
  phrases appear naturally, once or twice each, never forced.
- Answer-first: every H2 opens with a one-to-two sentence direct answer
  that could be quoted alone by a search engine or AI answer tool. Then
  explain.
- Definitions use a clean "X is Y" pattern the first time a term appears.
- Tables hold comparisons and specs; keep cell text short.
- FAQs are literal questions a real person types into a search box,
  answered in 1-3 sentences that make sense without the article.
- metaTitle 50-60 chars with the primary keyphrase first and the brand
  once at the end. metaDescription 145-160 chars, specific, no hype.

BEFORE YOU WRITE (do this silently, output only the JSON)
1. If you can browse: look at the top 3 Google results for the primary
   keyphrase. Note their headings, length, and what they skip. Use them
   ONLY to find gaps and to make yours clearer and more useful. Never
   copy wording, and never cite them (guardrail 6 still applies).
   If you cannot browse, skip this step.
2. Draft an outline: title, then each H2 with 3-5 specific bullet points
   saying exactly what facts, numbers, or examples go under it. Generic
   notes like "explain the concept" are not allowed.
3. Write from the outline, then proofread against every rule above
   (sentence length, em dashes, colons in headings, connectors, banned
   words) and fix violations before returning the JSON.

EEAT: every "references" entry REAL and verifiable with a working URL;
never fabricate authors, journals, or DOIs; omit if unsure. A 2025
open-access paper on reaching a consensus for TFA counterion analysis in
synthetic peptides appears to exist (PMC ID PMC12389442) - find it,
verify the real title, authors, and journal yourself before citing, and
describe only what it actually reports.

SEO/GEO/AEO: target queries in headings and openers naturally; every
factual sentence quotable standalone; FAQs answer literal questions.

INTERNAL LINKS (placeholders, do not guess slugs): <!-- LINK: net peptide
  content vs HPLC purity guide -->, <!-- LINK: how to read a peptide COA
  guide -->.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON
=====================================================================
{
  "title": "",
  "slug": "",
  "category": "Guides",
  "excerpt": "",
  "featuredImageBrief": "",
  "featuredImageAlt": "",
  "content": "",
  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [ { "question": "", "answer": "" } ],  // exactly 12
  "focusKeyphrase": "",
  "keywords": "",
  "metaTitle": "",       // 50-60 chars, primary keyphrase first, brand once at end
  "metaDescription": "", // 145-160 chars
  "relatedProducts": [],
  "references": [ { "citationText": "", "url": "" } ],  // 3-8 real
  "status": "draft",
  "publishedAt": ""
}

*(End of Prompt 2 of 4.)*

---
---

# PROMPT 3 of 4 — Endotoxin (LAL) Testing

Paste everything below this line.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Audience: laboratory researchers
and analytical staff. All products are Research Use Only (RUO).

TOPIC: Endotoxin (LAL) testing, what it measures, and why it rarely appears
  on peptide COAs
TITLE DIRECTION (no colon, spoken style, adjust freely): "What Does an
  Endotoxin Test Measure, and Why Is It Missing From Most Peptide COAs?"
CATEGORY: Guides
TARGET QUERIES: peptide endotoxin testing, lal test peptides, bacterial
  endotoxin test usp 85, endotoxin vs sterility, endotoxin on certificate
  of analysis, what is eu/mg endotoxin, do research peptides get endotoxin
  tested

ANGLE: A method explainer. What endotoxins (LPS) are, how the LAL assay
works (gel-clot, turbidimetric, chromogenic), what USP <85> and Ph. Eur.
2.6.14 describe, how endotoxin differs from sterility, why in-vitro
research (e.g. immune-cell assays) is sensitive to it, and how to read an
endotoxin line on a COA if present, including the absence of one. Be
explicit that an absent endotoxin result means "not reported", which is
different from "passed".

IMPORTANT: Do NOT state or imply that Longevia performs endotoxin
testing. Describe the method generally.

=====================================================================
COMPLIANCE — HARD RULES (override every other instruction)
=====================================================================
1. NO dosing, dose ranges, frequency, cycles, protocols, administration
   or injection instructions, and NO reconstitution steps, diluent
   volumes, working concentrations, syringes, needles, insulin units, or
   bacteriostatic/sterile water. Do not discuss injectable or parenteral
   use of any peptide, and do not describe endotoxin limits "for
   injection" as guidance for any product. Frame all discussion around
   in-vitro laboratory assays and analytical standards.
2. No health, therapeutic, anti-aging, or performance claims. Do not
   name any disease, condition, or symptom in connection with a
   compound.
3. NO product links, product names, or product lists in the body.
   "relatedProducts" stays an empty array.
4. Grade evidence type for every study cited (cell culture / animal /
   human / analytical method / pharmacopoeial standard). Never present
   cell or animal data as human data.
5. Include a visible RUO disclaimer as a ":::warning" callout: for
   laboratory research use only; not for human or veterinary use; not
   intended to diagnose, treat, cure, or prevent disease.
6. Never cite a peptide vendor page. Cite peer-reviewed papers,
   pharmacopoeial (USP, Ph. Eur.) and regulatory (FDA) documents only.
7. About Longevia, state ONLY: every batch is independently HPLC/LC-MS
   tested and lot-specific COAs are published in the COA Library.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — "content" is a constrained syntax, not
free-form markdown. Use ONLY:
=====================================================================
- Plain lines = paragraphs (blank line between paragraphs).
- "## Heading" = H2, "### Heading" = H3. Nothing deeper.
- "- item" = bullet list; "1. item" = numbered list.
- "> text" = blockquote.
- Pipe tables:  | A | B |  then  |---|---|  then rows.
- Callouts on their own lines:  :::info / :::tip / :::warning  ...  :::
- Inline: **bold** only. No italics, no inline code, no images.
- Internal links: [anchor](/journal/<slug>). If unsure of a slug, do NOT
  guess: insert <!-- LINK: short description --> instead. Max 2-3 uses
  of one URL.

=====================================================================
SPECS
=====================================================================
- "content": 2,000+ words, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 12 pairs, real lab problems (e.g. "is endotoxin the
  same as sterility", "what does '<1 EU/mg' mean on a COA"), 1-3
  sentences, self-contained.
- "keyTakeaways": 6-8 short standalone factual sentences.
- QUICK ANSWER: right after the opening paragraph and before the first
  "##", a ":::info" callout answering the core question in 2-3 sentences.
- 6+ "##" sections of 300+ words each, question-phrased, answer-first.
- 2+ tables (e.g. LAL method comparison; endotoxin vs sterility vs
  bioburden) and 3+ callouts total including Quick Answer and RUO
  disclaimer.
- No FAQ or Key Takeaways section inside "content".

=====================================================================
WRITING STYLE — HUMAN, PLAIN, SEO-FOCUSED (strict; check before output)
=====================================================================
Voice: a knowledgeable lab colleague explaining something over coffee.
Direct, specific, a little dry. Never a brochure, never an AI summary.

READABILITY
- Grade 8 vocabulary. When a technical term is needed, use it, then
  explain it in plain words in the same sentence, once.
- Sentences 20 words or fewer. Up to 25 only for a genuinely complex
  idea. Mix short and long on purpose. A four-word sentence is fine.
- Vary paragraph openings. No two paragraphs in a row may start with the
  same word or the same sentence shape. Keep paragraphs to 2-4 sentences.
- Start with a fact or a specific observation. Never open a paragraph
  or the article with a generic line about science, research, or how
  important something is.
- Prefer concrete numbers, named methods, and real examples over
  adjectives.

FORBIDDEN
- Em dashes anywhere (content, FAQs, titles, meta). Use a period or comma.
- Colons in ANY heading, including the title, H2s, and H3s.
- AI connectors: Furthermore, Moreover, Additionally, In addition,
  Overall, Ultimately, In conclusion, To summarize, It is worth noting,
  It's important to note, In today's.
- Power and filler words: leverage, seamless, unlock, delve, robust,
  game-changer, cutting-edge, comprehensive, landscape, tapestry, elevate,
  navigate (as a metaphor), crucial, pivotal, utilize, realm, holistic.
- Restating a heading as the first sentence under it.
- Stacked hedges ("may potentially help"). State settled facts flatly.
  Flag only genuinely uncertain claims, once, plainly.
- Keyword stuffing of any kind.

HEADINGS
- The title and every H2/H3 should read like something a person would
  say out loud, not a label. Most H2s are natural questions or plain
  statements ("Why does my COA show 99% purity but a lower content
  figure?"). No colons, no title case shouting, no "Introduction" or
  "Conclusion" headings.
- The title is the only H1. Do not write a second H1 inside content.

SEO / AEO / GEO
- Primary keyphrase: in the title, in the first 100 words, in one or two
  H2s, in the metaTitle (first), and in the metaDescription. Secondary
  phrases appear naturally, once or twice each, never forced.
- Answer-first: every H2 opens with a one-to-two sentence direct answer
  that could be quoted alone by a search engine or AI answer tool. Then
  explain.
- Definitions use a clean "X is Y" pattern the first time a term appears.
- Tables hold comparisons and specs; keep cell text short.
- FAQs are literal questions a real person types into a search box,
  answered in 1-3 sentences that make sense without the article.
- metaTitle 50-60 chars with the primary keyphrase first and the brand
  once at the end. metaDescription 145-160 chars, specific, no hype.

BEFORE YOU WRITE (do this silently, output only the JSON)
1. If you can browse: look at the top 3 Google results for the primary
   keyphrase. Note their headings, length, and what they skip. Use them
   ONLY to find gaps and to make yours clearer and more useful. Never
   copy wording, and never cite them (guardrail 6 still applies).
   If you cannot browse, skip this step.
2. Draft an outline: title, then each H2 with 3-5 specific bullet points
   saying exactly what facts, numbers, or examples go under it. Generic
   notes like "explain the concept" are not allowed.
3. Write from the outline, then proofread against every rule above
   (sentence length, em dashes, colons in headings, connectors, banned
   words) and fix violations before returning the JSON.

EEAT: every "references" entry REAL and verifiable with a working URL;
never fabricate authors, journals, or DOIs; omit if unsure. Look for
USP General Chapter <85> Bacterial Endotoxins Test, Ph. Eur. 2.6.14, FDA
guidance on endotoxin testing, and peer-reviewed literature on
endotoxin contamination in cell-culture reagents. Verify each yourself.

SEO/GEO/AEO: target queries in headings and openers naturally; every
factual sentence quotable standalone; FAQs answer literal questions.

INTERNAL LINKS (placeholders, do not guess slugs): <!-- LINK: how to read
  a peptide COA guide -->, <!-- LINK: why peptide purity matters guide -->.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON
=====================================================================
{
  "title": "",
  "slug": "",
  "category": "Guides",
  "excerpt": "",
  "featuredImageBrief": "",
  "featuredImageAlt": "",
  "content": "",
  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [ { "question": "", "answer": "" } ],  // exactly 12
  "focusKeyphrase": "",
  "keywords": "",
  "metaTitle": "",       // 50-60 chars, primary keyphrase first, brand once at end
  "metaDescription": "", // 145-160 chars
  "relatedProducts": [],
  "references": [ { "citationText": "", "url": "" } ],  // 3-8 real
  "status": "draft",
  "publishedAt": ""
}

*(End of Prompt 3 of 4.)*

---
---

# PROMPT 4 of 4 — Synthesis Impurities and LC-MS

Paste everything below this line.

---

You are writing one blog post for **Longevia Research** (longeviaresearch.com),
a US-based supplier of research peptides. Audience: laboratory researchers
and analytical staff. All products are Research Use Only (RUO).

TOPIC: How solid-phase synthesis creates peptide impurities, and how LC-MS
  catches them
TITLE DIRECTION (no colon, spoken style, adjust freely): "Where Do Peptide
  Impurities Come From, and How Does LC-MS Catch Them?"
CATEGORY: Guides
TARGET QUERIES: peptide impurities, deletion sequences peptide synthesis,
  spps impurities, what does lc-ms confirm in a peptide, hplc vs lc-ms
  peptide, truncated peptide sequences, peptide identity confirmation,
  n-1 impurities

ANGLE: A chemistry primer. Explain Fmoc solid-phase synthesis in plain
terms, where deletion sequences, truncations, insertions, racemization,
deamidation, and oxidation arise, why n-1 impurities co-elute in HPLC,
how mass accuracy in LC-MS separates identity from purity, and what a
mass tolerance on a COA does and doesn't rule out (for example, a wide
percent tolerance can mask substitutions). Include an impurity-type
table (origin, mass shift, whether HPLC or LC-MS sees it best). Use
generic illustrative peptides only; do not name commercial products.

=====================================================================
COMPLIANCE — HARD RULES (override every other instruction)
=====================================================================
1. NO dosing, dose ranges, frequency, cycles, protocols, administration
   or injection instructions, and NO reconstitution steps, diluent
   volumes, working concentrations, syringes, needles, insulin units, or
   bacteriostatic/sterile water.
2. No health, therapeutic, anti-aging, or performance claims. Do not
   name any disease, condition, or symptom in connection with a
   compound. Do not discuss immunogenicity of impurities as a human
   safety claim; if the literature does, report it as an analytical
   quality-attribute discussion and grade the evidence type.
3. NO product links, product names, or product lists in the body.
   "relatedProducts" stays an empty array.
4. Grade evidence type for every study cited (cell culture / in-silico /
   animal / human / analytical method / pharmacopoeial or regulatory
   document). Never present non-human data as human data.
5. Include a visible RUO disclaimer as a ":::warning" callout: for
   laboratory research use only; not for human or veterinary use; not
   intended to diagnose, treat, cure, or prevent disease.
6. Never cite a peptide vendor page. Cite peer-reviewed papers,
   pharmacopoeial and regulatory documents only.
7. About Longevia, state ONLY: every batch is independently HPLC/LC-MS
   tested and lot-specific COAs are published in the COA Library.

Output ONE complete JSON object matching the OUTPUT SCHEMA below. No
commentary outside the JSON.

=====================================================================
CONTENT MARKDOWN SYNTAX — "content" is a constrained syntax, not
free-form markdown. Use ONLY:
=====================================================================
- Plain lines = paragraphs (blank line between paragraphs).
- "## Heading" = H2, "### Heading" = H3. Nothing deeper.
- "- item" = bullet list; "1. item" = numbered list.
- "> text" = blockquote.
- Pipe tables:  | A | B |  then  |---|---|  then rows.
- Callouts on their own lines:  :::info / :::tip / :::warning  ...  :::
- Inline: **bold** only. No italics, no inline code, no images.
- Internal links: [anchor](/journal/<slug>). If unsure of a slug, do NOT
  guess: insert <!-- LINK: short description --> instead. Max 2-3 uses
  of one URL.

=====================================================================
SPECS
=====================================================================
- "content": 2,000+ words, excluding FAQs. Verify before finalizing.
- "faqs": EXACTLY 12 pairs, real lab problems (e.g. "can HPLC purity be
  99% and the peptide still be wrong", "what mass error is acceptable"),
  1-3 sentences, self-contained.
- "keyTakeaways": 6-8 short standalone factual sentences.
- QUICK ANSWER: right after the opening paragraph and before the first
  "##", a ":::info" callout answering the core question in 2-3 sentences.
- 6+ "##" sections of 300+ words each, question-phrased, answer-first.
- 2+ tables (impurity-type table required) and 3+ callouts total
  including Quick Answer and RUO disclaimer.
- No FAQ or Key Takeaways section inside "content".

=====================================================================
WRITING STYLE — HUMAN, PLAIN, SEO-FOCUSED (strict; check before output)
=====================================================================
Voice: a knowledgeable lab colleague explaining something over coffee.
Direct, specific, a little dry. Never a brochure, never an AI summary.

READABILITY
- Grade 8 vocabulary. When a technical term is needed, use it, then
  explain it in plain words in the same sentence, once.
- Sentences 20 words or fewer. Up to 25 only for a genuinely complex
  idea. Mix short and long on purpose. A four-word sentence is fine.
- Vary paragraph openings. No two paragraphs in a row may start with the
  same word or the same sentence shape. Keep paragraphs to 2-4 sentences.
- Start with a fact or a specific observation. Never open a paragraph
  or the article with a generic line about science, research, or how
  important something is.
- Prefer concrete numbers, named methods, and real examples over
  adjectives.

FORBIDDEN
- Em dashes anywhere (content, FAQs, titles, meta). Use a period or comma.
- Colons in ANY heading, including the title, H2s, and H3s.
- AI connectors: Furthermore, Moreover, Additionally, In addition,
  Overall, Ultimately, In conclusion, To summarize, It is worth noting,
  It's important to note, In today's.
- Power and filler words: leverage, seamless, unlock, delve, robust,
  game-changer, cutting-edge, comprehensive, landscape, tapestry, elevate,
  navigate (as a metaphor), crucial, pivotal, utilize, realm, holistic.
- Restating a heading as the first sentence under it.
- Stacked hedges ("may potentially help"). State settled facts flatly.
  Flag only genuinely uncertain claims, once, plainly.
- Keyword stuffing of any kind.

HEADINGS
- The title and every H2/H3 should read like something a person would
  say out loud, not a label. Most H2s are natural questions or plain
  statements ("Why does my COA show 99% purity but a lower content
  figure?"). No colons, no title case shouting, no "Introduction" or
  "Conclusion" headings.
- The title is the only H1. Do not write a second H1 inside content.

SEO / AEO / GEO
- Primary keyphrase: in the title, in the first 100 words, in one or two
  H2s, in the metaTitle (first), and in the metaDescription. Secondary
  phrases appear naturally, once or twice each, never forced.
- Answer-first: every H2 opens with a one-to-two sentence direct answer
  that could be quoted alone by a search engine or AI answer tool. Then
  explain.
- Definitions use a clean "X is Y" pattern the first time a term appears.
- Tables hold comparisons and specs; keep cell text short.
- FAQs are literal questions a real person types into a search box,
  answered in 1-3 sentences that make sense without the article.
- metaTitle 50-60 chars with the primary keyphrase first and the brand
  once at the end. metaDescription 145-160 chars, specific, no hype.

BEFORE YOU WRITE (do this silently, output only the JSON)
1. If you can browse: look at the top 3 Google results for the primary
   keyphrase. Note their headings, length, and what they skip. Use them
   ONLY to find gaps and to make yours clearer and more useful. Never
   copy wording, and never cite them (guardrail 6 still applies).
   If you cannot browse, skip this step.
2. Draft an outline: title, then each H2 with 3-5 specific bullet points
   saying exactly what facts, numbers, or examples go under it. Generic
   notes like "explain the concept" are not allowed.
3. Write from the outline, then proofread against every rule above
   (sentence length, em dashes, colons in headings, connectors, banned
   words) and fix violations before returning the JSON.

EEAT: every "references" entry REAL and verifiable with a working URL;
never fabricate authors, journals, or DOIs; omit if unsure. Look for
peer-reviewed reviews of peptide-related impurities (one titled "Related
impurities in peptide medicines" appears to exist, PubMed ID 25044089 -
verify the real authors, journal, and year yourself), USP <1503>, and
regulatory guidance on synthetic peptide impurity characterization.

SEO/GEO/AEO: target queries in headings and openers naturally; every
factual sentence quotable standalone; FAQs answer literal questions.

INTERNAL LINKS (placeholders, do not guess slugs): <!-- LINK: how to read
  a peptide COA guide -->, <!-- LINK: net peptide content vs HPLC purity
  guide -->.

=====================================================================
OUTPUT SCHEMA — return ONLY this JSON
=====================================================================
{
  "title": "",
  "slug": "",
  "category": "Guides",
  "excerpt": "",
  "featuredImageBrief": "",
  "featuredImageAlt": "",
  "content": "",
  "readTime": "",
  "keyTakeaways": [""],
  "faqs": [ { "question": "", "answer": "" } ],  // exactly 12
  "focusKeyphrase": "",
  "keywords": "",
  "metaTitle": "",       // 50-60 chars, primary keyphrase first, brand once at end
  "metaDescription": "", // 145-160 chars
  "relatedProducts": [],
  "references": [ { "citationText": "", "url": "" } ],  // 3-8 real
  "status": "draft",
  "publishedAt": ""
}

*(End of Prompt 4 of 4.)*
