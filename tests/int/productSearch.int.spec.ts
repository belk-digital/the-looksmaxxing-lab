import { describe, it, expect } from 'vitest'
import { rankProducts, rewriteQuery, searchProducts, type SearchableProduct } from '@/lib/search/products'

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

// The shop grid's search: every match, best first, no weak matches.
describe('rankProducts (shop search)', () => {
  const shop = [
    p(1, 'BPC-157', 'bpc-157', 'Body protection compound studied in tissue research.', 'Recovery & Tissue Repair'),
    p(2, 'BPC-157 — Spray', 'bpc-157-spray', 'Intranasal BPC-157 spray for research.', 'Recovery & Tissue Repair'),
    p(3, 'TB-500', 'tb-500', 'Thymosin beta-4 fragment. Often compared with BPC-157 in recovery research.', 'Recovery & Tissue Repair'),
    p(4, 'Tirzepatide', 'tirzepatide', 'Dual GIP/GLP-1 agonist. Careful interpretation of assay data.', 'Metabolic Research'),
    p(5, 'Glp-3RTA 10mg–60mg', 'glp-3rta', 'Triple receptor agonist research compound.', 'Metabolic Research'),
    p(6, 'Thymosin Alpha-1', 'thymosin-alpha-1', 'Synthetic 28-amino-acid peptide.', 'Immune Regulation'),
    p(7, 'NAD⁺', 'nad', 'Coenzyme research compound.', 'Longevity Research'),
  ]
  const ids = (q: string) => rankProducts(shop, q).map((x) => x.id)

  it('puts name matches before category matches before description matches', () => {
    // 1 and 2 are named BPC-157; 3 only mentions it in its description
    expect(ids('bpc')).toEqual([1, 2, 3])
    expect(ids('recovery')).toEqual([1, 2, 3]) // category match on all three, original order kept
  })

  it('returns only real matches, not a loose fuzzy "maybe" for every long description', () => {
    expect(ids('tirz')).toEqual([4])
    expect(ids('thymosin')).toEqual([6, 3]) // named Thymosin (6) before only mentioning it in the description (3)
    expect(ids('zzz')).toEqual([])
  })

  it('needs every word of the query', () => {
    expect(ids('bpc spray')).toEqual([2])
    expect(ids('bpc nothinghere')).toEqual([])
  })

  it.each(['bpc-157', 'bpc 157', 'BPC/157', 'bpc157', 'BPC  157'])('reads "%s" the same as BPC-157', (q) => {
    expect(ids(q)).toEqual([1, 2, 3])
  })

  it('is not case sensitive', () => {
    expect(ids('TIRZEPATIDE')).toEqual(ids('tirzepatide'))
  })

  it('still understands the old name (reta / retatrutide)', () => {
    expect(ids('reta')).toEqual([5])
    expect(ids('retatrutide')).toEqual([5])
  })

  it('forgives a typo only when nothing matches exactly', () => {
    expect(ids('tirzepatid')).toEqual([4]) // exact match (prefix of the name)
    expect(ids('tirzepetide')).toEqual([4]) // typo: no exact match, so the fuzzy fallback finds it
    expect(ids('semaglutid')).toEqual([])
  })

  it('a blank query leaves the list as it was', () => {
    expect(ids('   ')).toEqual(shop.map((x) => x.id))
  })

  it('does not change the products or the list it was given', () => {
    const copy = shop.map((x) => ({ ...x }))
    rankProducts(shop, 'bpc')
    expect(shop).toEqual(copy)
  })
})
