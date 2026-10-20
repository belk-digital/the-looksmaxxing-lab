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
