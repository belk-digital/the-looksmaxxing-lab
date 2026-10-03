const BRAND = 'Longevia Research'
const BRAND_SEGMENTS = new Set(['longevia research', 'longevia'])
// Trailing "- Longevia Research" / "– Longevia" style suffixes (non-pipe separators).
const TRAILING_BRAND_RE = /\s*[\-–—]\s*(Longevia Research|Longevia)\s*$/i
// Punctuation and connector words that would leave a cut title dangling ("... Certificate of").
const TRAILING_JUNK_RE = /(?:[\s,:;\-–—&]+|\s+(?:of|the|a|an|and|or|to|in|for|with|on|by|vs\.?|versus|from|at|as)\b)+$/i

/**
 * Builds a page <title> that carries the brand exactly once and stays <= maxLen.
 *
 * Titles are treated as `|`-separated segments. Any segment that is just the brand
 * ("Longevia Research" / "Longevia") is dropped, then whole segments are kept in
 * order while they fit. Segments are never cut in half, so a long trailing
 * descriptor is dropped cleanly instead of leaving a dangling fragment. Only if
 * the very first segment alone is too long is it trimmed at a word boundary.
 *
 * Use as `title: { absolute: buildTitle(raw) }` so the root layout's title
 * template (which also appends the brand) doesn't run on top of it.
 */
export function buildTitle(raw: string, maxLen = 60): string {
  const suffix = ` | ${BRAND}`
  const budget = maxLen - suffix.length

  const cleaned = (raw || '').replace(TRAILING_BRAND_RE, '')
  const segments = cleaned
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s && !BRAND_SEGMENTS.has(s.toLowerCase()))

  if (segments.length === 0) return BRAND

  let title = ''
  for (const segment of segments) {
    const next = title ? `${title} | ${segment}` : segment
    if (next.length > budget) break
    title = next
  }

  if (!title) {
    title = segments[0]
      .slice(0, budget)
      .replace(/\s+\S*$/, '')
      .replace(TRAILING_JUNK_RE, '')
      .trim()

    // "Main Title: Subtitle" cut inside the subtitle leaves a 1-2 word remnant that reads as
    // broken ("...2026: What's"). Keep just the main title in that case.
    const colon = title.lastIndexOf(':')
    if (colon >= 12) {
      const remnantWords = title.slice(colon + 1).trim().split(/\s+/).filter(Boolean).length
      if (remnantWords < 3) title = title.slice(0, colon).replace(TRAILING_JUNK_RE, '').trim()
    }
  }

  return `${title}${suffix}`
}

const MIN_USEFUL_LENGTH = 80

/**
 * Returns the longest run of leading COMPLETE sentences that fits in maxLen, or null
 * if the first sentence alone doesn't fit / is too short to be a useful description.
 * Never cuts a sentence, so the result always reads as a finished thought.
 */
export function fitDescription(raw: string, maxLen = 160): string | null {
  const text = (raw || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  if (text.length <= maxLen) return text

  // Split only at ". " / "! " / "? " followed by a sentence start, so decimals ("546.66 Da"),
  // "e.g." and similar don't create fake sentence boundaries.
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9(“"'])/).map((s) => s.trim())
  let out = ''
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence
    if (next.length > maxLen) break
    out = next
  }
  return out.length >= MIN_USEFUL_LENGTH && /[.!?)]$/.test(out) ? out : null
}

/**
 * Meta description: never clipped. Uses the source as-is when it fits, otherwise the
 * leading whole sentences that fit. If neither works, the full source text is returned
 * untouched and a warning names the page so a proper description can be written for it
 * in descriptionOverrides.ts.
 */
export function buildDescription(raw: string, maxLen = 160, label?: string): string {
  const fitted = fitDescription(raw, maxLen)
  if (fitted) return fitted

  const text = (raw || '').replace(/\s+/g, ' ').trim()
  if (label) {
    console.warn(`[seo] no clean ${maxLen}-char description for ${label} (source is ${text.length} chars) — add one to descriptionOverrides.ts`)
  }
  return text
}
