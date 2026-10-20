import { describe, it, expect } from 'vitest'
import { findCartVariant, resolveLegacySku } from '@/lib/cart/variantMatch'

const vials = [
  { sku: 'GLP3RTA-10', options: [{ value: '10mg' }] },
  { sku: 'GLP3RTA-20', options: [{ value: '20mg' }] },
  { sku: 'GLP3RTA-30', options: [{ value: '30mg' }] },
  { sku: 'GLP3RTA-60', options: [{ value: '60mg' }] },
]
const sprays = ['10', '20', '30', '60'].map((n) => ({ sku: `GLP3RTA-SPRAY-${n}MG`, options: [{ value: `${n}mg` }] }))

describe('resolveLegacySku', () => {
  it('maps every renamed vial and spray SKU', () => {
    expect(resolveLegacySku('RETATRUTIDE-20')).toBe('GLP3RTA-20')
    expect(resolveLegacySku('RETATRUTIDE-SPRAY-60MG')).toBe('GLP3RTA-SPRAY-60MG')
  })
  it('is case- and whitespace-insensitive on the legacy side', () => {
    expect(resolveLegacySku(' retatrutide-30 ')).toBe('GLP3RTA-30')
  })
  it('leaves non-legacy SKUs, titles and empty values untouched', () => {
    expect(resolveLegacySku('GLP3RTA-20')).toBe('GLP3RTA-20')
    expect(resolveLegacySku('TIRZ-10')).toBe('TIRZ-10')
    expect(resolveLegacySku('10mg')).toBe('10mg')
    expect(resolveLegacySku(null)).toBeNull()
    expect(resolveLegacySku(undefined)).toBeUndefined()
  })
})

describe('findCartVariant', () => {
  it('matches a legacy vial SKU to the renamed variant (correct strength, not the base variant)', () => {
    expect(findCartVariant(vials, 'RETATRUTIDE-60')?.sku).toBe('GLP3RTA-60')
    expect(findCartVariant(vials, 'RETATRUTIDE-20')?.sku).toBe('GLP3RTA-20')
  })
  it('matches a legacy spray SKU to the renamed variant', () => {
    expect(findCartVariant(sprays, 'RETATRUTIDE-SPRAY-30MG')?.sku).toBe('GLP3RTA-SPRAY-30MG')
  })
  it('matches current SKUs and option-title lines exactly as before', () => {
    expect(findCartVariant(vials, 'GLP3RTA-30')?.sku).toBe('GLP3RTA-30')
    expect(findCartVariant(vials, '60mg')?.sku).toBe('GLP3RTA-60')
  })
  it('still works if the database is rolled back to the legacy SKUs', () => {
    const legacy = [{ sku: 'RETATRUTIDE-20', options: [{ value: '20mg' }] }]
    expect(findCartVariant(legacy, 'GLP3RTA-20')?.sku).toBe('RETATRUTIDE-20')
    expect(findCartVariant(legacy, 'RETATRUTIDE-20')?.sku).toBe('RETATRUTIDE-20')
  })
  it('returns undefined for unknown identifiers so callers keep their existing base-price fallback', () => {
    expect(findCartVariant(vials, 'SKU-9750')).toBeUndefined()
    expect(findCartVariant(vials, '189')).toBeUndefined()
    expect(findCartVariant(vials, 'RETATRUTIDE-999')).toBeUndefined()
  })
  it('keeps the "Variant <sku>" computed-title behaviour for variants without options', () => {
    const noOpts = [{ sku: 'ABC-1', options: [] }]
    expect(findCartVariant(noOpts, 'Variant ABC-1')?.sku).toBe('ABC-1')
  })
})
