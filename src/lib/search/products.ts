import Fuse from 'fuse.js'

export interface SearchableProduct {
  id: number | string
  name: string
  slug: string
  description: string
  price: unknown
  imageUrl: string | null
  categories: string
  descriptor: string
}

// The Glp-3RTA products were previously named "Retatrutide", and shoppers still search by that name
// (or "reta", or a misspelling). The old name no longer appears in the product content, so the search
// query is rewritten: any token that is a prefix of, or within two typos of, the old name becomes the
// current name before searching. Queries with no such token are left exactly as typed.
const PREVIOUS_NAME = 'retatrutide'
const CURRENT_NAME = 'Glp-3RTA'

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = row
  }
  return prev[b.length]
}

function isPreviousName(token: string): boolean {
  const t = token.toLowerCase().replace(/[^a-z]/g, '')
  if (t.length < 4) return false // "reta" is the shortest accepted form
  return PREVIOUS_NAME.startsWith(t) || (t.length >= 6 && editDistance(t, PREVIOUS_NAME) <= 2)
}

export function rewriteQuery(query: string): string {
  return query
    .split(/\s+/)
    .map((token) => (isPreviousName(token) ? CURRENT_NAME : token))
    .join(' ')
}

/** The fields the shop search looks at. */
export interface RankableProduct {
  name: string
  description?: string
  categories?: string
}

// Letters and digits only, so "BPC-157", "bpc 157" and "BPC/157" all read the same.
const simplify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/**
 * Search for the shop grid: EVERY product that matches the query, best match first.
 *
 * The header search above only shows the top 8 of a loose fuzzy match, which is fine for a small dropdown but would
 * fill a full grid with weak matches (a 3-letter query "fuzzily" matches almost any long description). So here:
 *   1. a product matches when every word of the query appears in its name, categories or description
 *      (name matches rank first, then categories, then description; ties keep the incoming order);
 *   2. only when nothing matches that way, fall back to a tight fuzzy match on names and categories, so a typo
 *      such as "tirzepatid" still finds something.
 * The old-name rewrite ("reta" -> Glp-3RTA) is applied first, exactly as in the header search.
 */
export function rankProducts<T extends RankableProduct>(products: readonly T[], query: string): T[] {
  const tokens = simplify(rewriteQuery(query)).split(' ').filter(Boolean)
  if (tokens.length === 0) return [...products]

  const scored: Array<{ product: T; score: number; order: number }> = []
  products.forEach((product, order) => {
    const name = simplify(product.name)
    const categories = simplify(product.categories ?? '')
    const description = simplify(product.description ?? '')
    // "bpc157" (no separator) should still find "BPC-157", so also compare with the spaces taken out.
    const has = (field: string, token: string) => field.includes(token) || field.replace(/ /g, '').includes(token)

    let score = 0
    for (const token of tokens) {
      if (has(name, token)) score += name.split(' ').some((word) => word.startsWith(token)) ? 6 : 4
      else if (has(categories, token)) score += 2
      else if (has(description, token)) score += 1
      else return // a word of the query is nowhere in this product: not a match
    }
    scored.push({ product, score, order })
  })

  if (scored.length > 0) {
    return scored.sort((a, b) => b.score - a.score || a.order - b.order).map(({ product }) => product)
  }

  return new Fuse(products as T[], {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'categories', weight: 1 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  })
    .search(tokens.join(' '))
    .map(({ item }) => item)
}

export function searchProducts(products: SearchableProduct[], query: string, limit = 8): SearchableProduct[] {
  // Fuse.js for fuzzy searching
  const fuse = new Fuse(products, {
    keys: [
      { name: 'name', weight: 3 }, // Name is most important
      { name: 'categories', weight: 1.5 },
      { name: 'description', weight: 1 },
    ],
    threshold: 0.4, // 0.0 is perfect match, 1.0 is matches everything. 0.4 is a good fuzzy sweet spot.
    includeScore: true,
    ignoreLocation: true, // Don't penalize if the word is at the end of a string
  })

  return fuse
    .search(rewriteQuery(query))
    .slice(0, limit)
    .map(({ item }) => item)
}
