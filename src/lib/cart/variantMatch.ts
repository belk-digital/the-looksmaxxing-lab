// Variant SKUs for the Glp-3RTA vial and spray products were renamed from RETATRUTIDE-* to GLP3RTA-*.
// Old SKUs can still arrive from persisted browser carts, cached product pages and past orders
// (reorder). Without this alias a stale SKU matches no variant and the line is silently repriced to
// the product's base (10mg) price, so resolve legacy SKUs to their current variant instead.
const LEGACY_SKU_ALIASES: Record<string, string> = {
  'RETATRUTIDE-10': 'GLP3RTA-10',
  'RETATRUTIDE-20': 'GLP3RTA-20',
  'RETATRUTIDE-30': 'GLP3RTA-30',
  'RETATRUTIDE-60': 'GLP3RTA-60',
  'RETATRUTIDE-SPRAY-10MG': 'GLP3RTA-SPRAY-10MG',
  'RETATRUTIDE-SPRAY-20MG': 'GLP3RTA-SPRAY-20MG',
  'RETATRUTIDE-SPRAY-30MG': 'GLP3RTA-SPRAY-30MG',
  'RETATRUTIDE-SPRAY-60MG': 'GLP3RTA-SPRAY-60MG',
}

/** Returns the current SKU for a renamed legacy SKU, or the input unchanged. */
export function resolveLegacySku<T extends string | null | undefined>(sku: T): T | string {
  if (typeof sku !== 'string') return sku
  return LEGACY_SKU_ALIASES[sku.trim().toUpperCase()] ?? sku
}

interface MatchableVariant {
  sku?: string | null
  options?: Array<{ value?: string | null }> | null
}

/**
 * Finds the variant a cart line refers to. A line may reference a variant by its SKU or by the
 * computed option title (e.g. "10mg"); renamed legacy SKUs resolve to the current variant.
 */
export function findCartVariant<V extends MatchableVariant>(variants: V[], lineSku: string | null | undefined): V | undefined {
  const wanted = resolveLegacySku(lineSku)
  return variants.find((v) => {
    const computedTitle = v.options?.map((o) => o.value).join(' ') || `Variant ${v.sku}`
    return (
      computedTitle === lineSku ||
      v.sku === lineSku ||
      (typeof v.sku === 'string' && resolveLegacySku(v.sku) === wanted)
    )
  })
}
