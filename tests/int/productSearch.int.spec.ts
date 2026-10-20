import { describe, it, expect } from 'vitest'
import { rewriteQuery, searchProducts, type SearchableProduct } from '@/lib/search/products'

const p = (id: number, name: string, slug: string, description = '', categories = ''): SearchableProduct => ({
  id, name, slug, description, categories, price: 100, imageUrl: null, descriptor: '',
})

// Decoys include descriptions with "reta" inside other words (interpretation, secretagogue).
const catalogue = [
  p(1, 'Glp-3RTA 10mg–60mg', 'glp-3rta', 'Triple receptor agonist research compound.', 'Metabolic Research'),
  p(2, 'Glp-3RTA — Spray', 'glp-3rta-spray', 'Triple agonist research compound spray.', 'Metabolic Research'),
  p(3, 'Tirzepatide', 'tirzepatide', 'Dual GIP/GLP-1 agonist. Careful interpretation of assay data.', 'Metabolic Research'),
  p(4, 'Semaglutide', 'semaglutide', 'GLP-1 receptor agonist research peptide.', 'Metabolic Research'),
  p(5, 'GHRP-6 — Spray', 'ghrp-6-spray', 'Growth hormone secretagogue peptide spray.', 'Research'),
  p(6, 'Semax — Spray', 'semax-spray', 'Nootropic peptide spray.', 'Research'),
  p(7, 'Sermorelin', 'sermorelin', 'GHRH analogue research peptide.', 'Research'),
]

const topSlugs = (q: string, n = 2) => searchProducts(catalogue, q).slice(0, n).map((x) => x.slug)

describe('rewriteQuery', () => {
  it.each(['reta', 'Reta', 'RETA', 'retat', 'retatr', 'retatrutide', 'Retatrutide', 'retatritide', 'retatrutid', 'retatrut'])(
    'maps "%s" to the current name',
    (q) => expect(rewriteQuery(q)).toBe('Glp-3RTA'),
  )
  it('rewrites only the matching token in a multi-word query', () => {
    expect(rewriteQuery('reta spray')).toBe('Glp-3RTA spray')
    expect(rewriteQuery('retatritide 20mg')).toBe('Glp-3RTA 20mg')
  })
  it.each(['retain', 'retail', 'creta', 'meta', 'retinol', 'ret', 'rt', 'tirzepatide', 'spray', 'glp-3rta', ''])(
    'leaves "%s" untouched',
    (q) => expect(rewriteQuery(q)).toBe(q),
  )
})

describe('searchProducts', () => {
  it.each(['reta', 'retatritide', 'retatrutide', 'Retatrutide', 'retatrutid'])('"%s" finds both Glp-3RTA products first', (q) => {
    expect(topSlugs(q).sort()).toEqual(['glp-3rta', 'glp-3rta-spray'])
  })
  it('puts the spray product first for spray queries', () => {
    expect(topSlugs('reta spray', 1)).toEqual(['glp-3rta-spray'])
    expect(topSlugs('retatrutide spray', 1)).toEqual(['glp-3rta-spray'])
  })
  it('does not change results for queries without an old-name token', () => {
    const ids = (q: string) => searchProducts(catalogue, q).map((x) => x.id)
    expect(ids('spray')).not.toContain(undefined)
    expect(ids('tirz')[0]).toBe(3)
    expect(ids('semax')[0]).toBe(6)
  })
  it('returns the product fields unchanged (nothing extra added)', () => {
    const [first] = searchProducts(catalogue, 'reta')
    expect(Object.keys(first).sort()).toEqual(['categories', 'description', 'descriptor', 'id', 'imageUrl', 'name', 'price', 'slug'])
  })
  it('caps results at the limit', () => {
    expect(searchProducts(catalogue, 'peptide', 3).length).toBeLessThanOrEqual(3)
  })
})
